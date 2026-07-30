import OpenAI from 'openai';
import { config, CONFIG_PATH_DISPLAY } from './lib/config.js';
import { normalizeGermanForCompare } from './cardContent/german.js';
import { resolveSentenceFocusForm } from './cardContent/wordLexical.js';
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

const UNIQUENESS_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'lexical_cloze_uniqueness',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        unique: { type: 'boolean' },
        answer: { type: 'string' },
      },
      required: ['unique', 'answer'],
      additionalProperties: false,
    },
  },
};

const REWRITE_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'unambiguous_lexical_cloze',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        german: { type: 'string' },
        russian: { type: 'string' },
        focusForm: { type: 'string' },
      },
      required: ['german', 'russian', 'focusForm'],
      additionalProperties: false,
    },
  },
};

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildMaskedLexicalCloze(sentence = {}, wordData = {}) {
  const german = String(sentence.german || '').trim();
  const target = resolveSentenceFocusForm(sentence, wordData);
  if (!german || !target) return '';

  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(target)}(?=[^\\p{L}\\p{N}]|$)`, 'iu');
  return german.replace(pattern, (_match, prefix) => `${prefix}___`);
}

/**
 * Verifies the cloze from the learner's view, without exposing the expected answer.
 */
export async function verifyLexicalClozeUniqueness(sentence = {}, wordData = {}) {
  const front = buildMaskedLexicalCloze(sentence, wordData);
  const expected = resolveSentenceFocusForm(sentence, wordData);
  if (!front || !expected) {
    return { valid: false, unique: false, answer: '' };
  }

  try {
    const client = await getClient();
    const response = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: 'system',
          content: `You validate German cloze flashcards from the learner's perspective.

You see exactly the German front text with one blank and its hint. Consider every natural German word or inflected form that could fill the blank while matching the hint and producing a grammatical, semantically plausible sentence.

Set unique=true only when exactly one lexical answer is reasonably recoverable from the visible context. If multiple answers could work because a referent, gender, meaning, connector, preposition, particle, or other distinction is missing, set unique=false and answer="". Do not choose merely the most likely answer when alternatives remain valid.

When unique=true, return that one answer. Return JSON only.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            front,
            hint: String(wordData.clozeHint || wordData.lexicalType || 'word').trim(),
          }),
        },
      ],
      response_format: UNIQUENESS_RESPONSE_FORMAT,
      temperature: 0,
    });
    const result = JSON.parse(response.choices[0].message.content);
    const answer = String(result.answer || '').trim();
    return {
      valid: result.unique === true && normalizeGermanForCompare(answer) === normalizeGermanForCompare(expected),
      unique: result.unique === true,
      answer,
    };
  } catch (err) {
    return { valid: false, unique: false, answer: '', error: err.message };
  }
}

export async function generateUnambiguousLexicalClozeSentence(sentence = {}, wordData = {}) {
  const client = await getClient();
  const target = resolveSentenceFocusForm(sentence, wordData) || wordData.canonical;
  const response = await client.chat.completions.create({
    model: config.openaiModel,
    messages: [
      {
        role: 'system',
        content: `Rewrite one German lexical cloze example so the target is the only reasonable answer from the German sentence and hint alone.

Add concise context that rules out grammatical or semantic alternatives. For pronouns, include an explicit antecedent that fixes person, number, and gender. For case forms, make the governing verb or preposition clear. For connectors, particles, determiners, prepositions, and adverbs, make the intended relation or meaning uniquely recoverable.

Keep the sentence natural and concise. Include the exact target once. Return a natural Russian translation and JSON only.`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          target,
          lexicalType: wordData.lexicalType || null,
          hint: wordData.clozeHint || null,
          previousGerman: sentence.german || '',
          previousRussian: sentence.russian || '',
        }),
      },
    ],
    response_format: REWRITE_RESPONSE_FORMAT,
    temperature: 0,
  });
  const result = JSON.parse(response.choices[0].message.content);
  return {
    german: String(result.german || '').trim(),
    russian: String(result.russian || '').trim(),
    focusForm: String(result.focusForm || target).trim(),
  };
}
