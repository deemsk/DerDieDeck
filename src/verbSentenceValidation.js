import { containsVerbForm } from './cardContent/verbFormExplanation.js';
import { normalizeGermanForCompare } from './cardContent/german.js';
import OpenAI from 'openai';
import { config, CONFIG_PATH_DISPLAY } from './lib/config.js';
import { resolveSecret } from './lib/secrets.js';
import { OPENAI_MODEL_ROLES, withOpenAIModel } from './lib/openaiModels.js';
import { jsonSchemaResponse, strictObject } from './lib/openaiSchemas.js';
import { RecoverableWorkflowError } from './workflowRecovery.js';

const responseFormat = jsonSchemaResponse('verb_sentence_identity', strictObject({
  verdicts: { type: 'array', items: strictObject({
    index: { type: 'integer' }, valid: { type: 'boolean' }, reason: { type: 'string' },
  }) },
}));
let client;

// Review identity in context: a surface token can belong to a different separable verb.
export async function reviewVerbExamples(verbData, examples = []) {
  const form = verbData.displayForm;
  if (form && normalizeGermanForCompare(form) !== normalizeGermanForCompare(verbData.infinitive)) {
    examples = examples.filter(sentence => containsVerbForm(sentence.german, form));
  }
  if (!examples.length) return [];
  try {
    if (!client) {
      const apiKey = await resolveSecret(config.openaiApiKey || process.env.OPENAI_API_KEY);
      if (!apiKey) throw new Error(`OpenAI API key not set in ${CONFIG_PATH_DISPLAY}`);
      client = new OpenAI({ apiKey });
    }
    const response = await client.chat.completions.create(withOpenAIModel(OPENAI_MODEL_ROLES.validation, {
      messages: [
        { role: 'system', content: `Independently validate German verb examples. Return one verdict for each index; never rewrite examples.
Check the target infinitive, requested form, and supplied meaning in the actual sentence.
If form differs from infinitive, require that exact form in its intended verbal use, not a homograph or substring.
If form equals infinitive, ordinary conjugated forms of that verb are allowed.
Resolve separable particles in context. A matching verb token alone is insufficient:
for sieh from sehen, "Sieh bitte nach, ob die Tür zu ist." uses nachsehen and is invalid.
But "Sieh nach links." uses sehen with a directional preposition and is valid.
Likewise, "Geh nach Hause." is gehen, not a prefixed verb. Do not blacklist particles or prepositions.
A separable verb is valid when it IS the requested infinitive; do not reject separable verbs as a category.
Reject a different lemma, incompatible sense, wrong grammatical form, or an unusable/unnatural example.
Allow ordinary idiomatic uses and natural meaning paraphrases. When uncertain about identity, mark invalid.
Reasons must be concise Russian explanations; accepted examples may have an empty reason.` },
        { role: 'user', content: JSON.stringify({
          infinitive: verbData.infinitive,
          form: verbData.displayForm || verbData.infinitive,
          meanings: verbData.meanings || [],
          examples: examples.map((sentence, index) => ({ index, german: sentence.german })),
        }) },
      ],
      response_format: responseFormat,
      temperature: 0,
    }));
    const { verdicts } = JSON.parse(response.choices?.[0]?.message?.content || 'null');
    if (!Array.isArray(verdicts) || verdicts.length !== examples.length ||
      new Set(verdicts.map(item => item?.index)).size !== examples.length ||
      verdicts.some(item => !Number.isInteger(item?.index) || item.index < 0 || item.index >= examples.length ||
        typeof item.valid !== 'boolean' || typeof item.reason !== 'string')) {
      throw new Error('Incomplete verb example review');
    }
    const accepted = new Set(verdicts.filter(item => item.valid).map(item => item.index));
    return examples.filter((_sentence, index) => accepted.has(index));
  } catch (error) {
    throw new RecoverableWorkflowError(`Could not verify verb examples: ${error.message}`, {
      code: 'verb-example-review-failed', workflow: 'verb', allowManualSentence: true,
    });
  }
}
