import OpenAI from 'openai';
import { config, CONFIG_PATH_DISPLAY } from './lib/config.js';
import { OPENAI_MODEL_ROLES, withOpenAIModel } from './lib/openaiModels.js';
import { jsonSchemaResponse, strictObject } from './lib/openaiSchemas.js';
import { resolveSecret } from './lib/secrets.js';

let openai = null;

const ROUTE_RESPONSE_FORMAT = jsonSchemaResponse('lexical_route', strictObject({
  route: { type: 'string', enum: ['word', 'verb', 'ambiguous'] },
  confidence: { type: 'number', minimum: 0, maximum: 1 },
  reason: { type: 'string' },
}));

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

export async function classifyLexicalRoute(input) {
  const raw = String(input || '').trim();
  if (!raw) {
    return { route: 'ambiguous', confidence: 0, reason: 'empty input' };
  }

  const client = await getClient();
  const response = await client.chat.completions.create(withOpenAIModel(OPENAI_MODEL_ROLES.utility, {
    messages: [
      {
        role: 'system',
        content: `Classify one German lexical input for a flashcard workflow.

Use route="verb" for German verbs and recognizable inflected or participial verb forms.
Use route="word" for nouns, adjectives, adverbs, prepositions, conjunctions, pronouns, determiners, particles, numerals, and interjections.
Use route="ambiguous" when the same surface form has credible word and verb analyses or the input is unclear.
Treat the input as German, never as an English lookalike. Return JSON only.`,
      },
      { role: 'user', content: raw },
    ],
    response_format: ROUTE_RESPONSE_FORMAT,
    temperature: 0,
  }));

  const result = JSON.parse(response.choices[0].message.content);
  return {
    route: ['word', 'verb'].includes(result.route) ? result.route : 'ambiguous',
    confidence: Number.isFinite(result.confidence) ? result.confidence : 0,
    reason: String(result.reason || '').trim(),
  };
}
