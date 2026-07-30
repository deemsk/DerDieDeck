import OpenAI from 'openai';
import { config, CONFIG_PATH_DISPLAY } from './lib/config.js';
import { normalizeGermanForCompare } from './cardContent/german.js';
import { normalizeWordIpa } from './cardContent/ipa.js';
import { validateAiGeneratedIpa } from './cardContent/ipaValidation.js';
import { refineAiGeneratedMeanings } from './cardContent/meaningValidation.js';
import { resolveSecret } from './lib/secrets.js';

let openai = null;

async function getClient() {
  if (!openai) {
    const apiKey = await resolveSecret(config.openaiApiKey || process.env.OPENAI_API_KEY);
    if (!apiKey) {
      throw new Error(`OpenAI API key not set. Add to ${CONFIG_PATH_DISPLAY} or set OPENAI_API_KEY env var`);
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

function buildVerbSystemPrompt() {
  return `You are a German language expert and Fluent Forever consultant.

Analyze a single German input for verb flashcards.

Rules:
- Accept verbs and verb forms. Reject nouns, adjectives, adverbs, and full unrelated phrases that cannot be normalized to a verb.
- Always normalize the main lemma to the infinitive.
- Preserve the user's encountered form in displayForm when the input is a conjugated or inflected form.
- Accept past participles and participial forms when they clearly map to a German verb. Normalize them to the infinitive and preserve the participle in displayForm.
- Example: for "verbunden", return infinitive="verbinden", displayForm="verbunden", and dictionaryFormNeeded=true.
- Use recommendedMode="picture-word" only for highly imageable, concrete action verbs with a stable one-frame depiction.
- Use recommendedMode="sentence-form" for modal verbs, auxiliary verbs, abstract verbs, reflexive verbs, separable-prefix verbs that depend on context, and other verbs that are better learned through example sentences.
- Russian lexical glosses must preserve distinctions from common German near-synonyms. Add a concise qualifier when a broad direct translation would hide differences in meaning, usage, register, argument structure, state versus action, or source of obligation.
- For picture-word verbs, imageSearchTerms must be in German and should describe visible action scenes, not dictionary labels.
- For sentence-form verbs, provide exactly 3 short natural example sentences in German with Russian translations.
- dictionaryFormNeeded should be true when displayForm differs from infinitive or when the encountered form is likely non-obvious.
- IPA must be in square brackets.
- IPA must use Standard German conventions: use ʁ/ɐ̯ for German r where appropriate, never ɾ; place stress before the stressed syllable.
- If the input is a verb but weak for picture cards, still return the normalized analysis and recommend sentence-form mode instead of rejecting it.

Respond in JSON only:
{
  "shouldCreateVerbCard": true,
  "rejectionReason": null,
  "canonical": "laufen",
  "infinitive": "laufen",
  "displayForm": "läuft",
  "ipa": "[ˈlaʊfn̩]",
  "register": "neutral",
  "isImageable": true,
  "imageabilityReason": "clear body action",
  "recommendedMode": "picture-word",
  "dictionaryFormNeeded": true,
  "meanings": [
    {
      "russian": "бежать",
      "english": "run",
      "imageSearchTerms": ["Mann läuft", "laufen im Park", "joggen"]
    }
  ],
  "exampleSentences": [
    {
      "german": "Er läuft jeden Morgen im Park.",
      "russian": "Он бегает каждое утро в парке.",
      "focusForm": "läuft"
    },
    {
      "german": "Wir laufen zur Haltestelle.",
      "russian": "Мы бежим к остановке.",
      "focusForm": "laufen"
    },
    {
      "german": "Sie läuft schneller als ich.",
      "russian": "Она бежит быстрее меня.",
      "focusForm": "läuft"
    }
  ]
}

recommendedMode must be one of: picture-word, sentence-form.
Register must be one of: neutral, colloquial, formal, specialized.
If rejected, set shouldCreateVerbCard=false and explain why.`;
}

function sanitizeSentence(sentence = {}) {
  return {
    german: String(sentence.german || '').trim(),
    russian: String(sentence.russian || '').trim(),
    focusForm: String(sentence.focusForm || '').trim(),
    formRussian: String(sentence.formRussian || '').trim(),
  };
}

function mergeExampleSentences(existing = [], additions = []) {
  const merged = [];
  const seen = new Set();

  for (const sentence of [...existing, ...additions].map(sanitizeSentence)) {
    if (!sentence.german) continue;
    const key = normalizeGermanForCompare(sentence.german);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(sentence);
    if (merged.length === 3) break;
  }

  return merged;
}

export function shouldOfferDictionaryFormCard(verbData = {}, focusForm = null) {
  const displayForm = normalizeGermanForCompare(focusForm || verbData.displayForm || '');
  const infinitive = normalizeGermanForCompare(verbData.infinitive || '');

  if (!displayForm || !infinitive) {
    return false;
  }

  return Boolean(verbData.dictionaryFormNeeded) || displayForm !== infinitive;
}

function sanitizeVerbAnalysis(result = {}) {
  const sanitized = {
    ...result,
    canonical: String(result.canonical || result.infinitive || '').trim(),
    infinitive: String(result.infinitive || result.canonical || '').trim(),
    displayForm: String(result.displayForm || result.infinitive || result.canonical || '').trim(),
    recommendedMode: result.recommendedMode === 'picture-word' ? 'picture-word' : 'sentence-form',
  };

  if (sanitized.ipa) {
    sanitized.ipa = normalizeWordIpa(sanitized.infinitive, sanitized.ipa);
  }

  sanitized.meanings = Array.isArray(sanitized.meanings)
    ? sanitized.meanings.filter(Boolean).slice(0, 3)
    : [];

  sanitized.exampleSentences = Array.isArray(sanitized.exampleSentences)
    ? sanitized.exampleSentences.map(sanitizeSentence).filter((sentence) => sentence.german).slice(0, 3)
    : [];

  return sanitized;
}

export function hasStructuredVerbAnalysis(result = {}) {
  return Boolean(
    result.infinitive &&
    result.displayForm &&
    Array.isArray(result.meanings) &&
    result.meanings.length > 0
  );
}

export async function enrichVerb(input) {
  const client = await getClient();
  const response = await client.chat.completions.create({
    model: config.openaiModel,
    messages: [
      { role: 'system', content: buildVerbSystemPrompt() },
      { role: 'user', content: input },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const result = sanitizeVerbAnalysis(JSON.parse(response.choices[0].message.content));

  if (
    result.shouldCreateVerbCard !== false &&
    result.recommendedMode === 'sentence-form' &&
    result.exampleSentences.length < 3
  ) {
    const completion = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: 'system',
          content: 'Return JSON only. Generate short natural German example sentences with Russian translations for a German verb flashcard.',
        },
        {
          role: 'user',
          content: `Verb: ${result.infinitive}\nEncountered/display form: ${result.displayForm}\nExisting examples to avoid:\n${result.exampleSentences.map((sentence) => `- ${sentence.german}`).join('\n') || '- none'}\nReturn exactly ${3 - result.exampleSentences.length} additional examples as {"exampleSentences":[{"german":"","russian":"","focusForm":""}]}.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });
    const extra = JSON.parse(completion.choices[0].message.content);
    result.exampleSentences = mergeExampleSentences(result.exampleSentences, extra.exampleSentences);
  }

  result.meanings = await refineAiGeneratedMeanings({
    client,
    germanTerm: result.infinitive,
    lexicalType: 'verb',
    meanings: result.meanings,
    exampleSentences: result.exampleSentences,
  });

  if (result.ipa) {
    const isValid = await validateAiGeneratedIpa({
      client,
      germanText: result.infinitive,
      ipa: result.ipa,
    });
    if (!isValid) {
      result.ipa = '';
    }
  }

  return result;
}

/**
 * Generates one short sentence that uses an exact finite verb form.
 */
export async function generateVerbFormSentence({
  infinitive,
  pronounLabel,
  pronoun,
  pronounRole = '',
  russianPronoun = '',
  form,
  particle = null,
  meaning = '',
  extraGuidance = '',
}) {
  const client = await getClient();
  const particleRule = particle
    ? `\n- This is a separable verb. The sentence must include the separated particle "${particle}" in natural clause-final position.`
    : '';
  const pronounPlacementRule = pronoun === 'sie' && russianPronoun === 'они'
    ? '\n- Put lowercase "sie" after the first word, never at sentence start, so it is unambiguously plural "they" rather than singular "she" or formal "Sie".'
    : '';

  const response = await client.chat.completions.create({
    model: config.openaiModel,
    messages: [
      {
        role: 'system',
        content: `Return JSON only. Generate one A1/A2 German example sentence for a verb-form flashcard.

Rules:
- Use one short main clause only.
- Use common concrete vocabulary.
- Use the exact target pronoun and exact finite verb form.
- Avoid subordinate clauses and extra grammar complexity.
- Russian translation must be natural Russian.
- The "russian" field must translate the whole German sentence, with all time/place/object information.
- Never put only the infinitive meaning in "russian"; for "Wir fangen um acht Uhr an.", use a sentence translation like "Мы начинаем в восемь часов.", not "начинать".
- The "formRussian" field must translate only the target pronoun + finite verb form.
- Preserve the exact grammatical person and number specified for the target pronoun in both Russian fields.${russianPronoun ? `
- Both Russian fields must contain the subject pronoun "${russianPronoun}"; do not replace it with another pronoun.` : ''}${pronounPlacementRule}${particleRule}`,
      },
      {
        role: 'user',
        content: `Infinitive: ${infinitive}
Meaning: ${meaning}
Pronoun label: ${pronounLabel}
Target pronoun to use: ${pronoun}
Target pronoun role: ${pronounRole || 'use the grammatical role implied by the target pronoun'}
Required Russian subject pronoun: ${russianPronoun || 'translate the target pronoun exactly'}
Target finite form: ${form}
${extraGuidance ? `Additional correction: ${extraGuidance}\n` : ''}Return {"german":"","russian":"","focusForm":"${form}","formRussian":""}.
"russian" must translate the whole sentence.
"formRussian" must translate only the target pronoun + finite verb form, not the whole sentence.
Example: for German "Du nimmst das Buch.", russian is "Ты берёшь книгу.", formRussian is "ты берёшь".
Bad: russian="брать".`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  return sanitizeSentence(JSON.parse(response.choices[0].message.content));
}
