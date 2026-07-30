import { config } from '../lib/config.js';

const MEANING_REVIEW_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'contrastive_lexical_meanings',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        meanings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              russian: { type: 'string' },
              english: { type: 'string' },
            },
            required: ['russian', 'english'],
            additionalProperties: false,
          },
        },
      },
      required: ['meanings'],
      additionalProperties: false,
    },
  },
};

function normalizeMeaning(meaning = {}) {
  return {
    ...meaning,
    russian: String(meaning.russian || '').trim(),
    english: String(meaning.english || '').trim(),
  };
}

/**
 * Reviews AI-generated glosses for distinctions that a direct translation may hide.
 */
export async function refineAiGeneratedMeanings({
  client,
  germanTerm,
  lexicalType,
  meanings,
  exampleSentences = [],
}) {
  const original = Array.isArray(meanings) ? meanings.map(normalizeMeaning) : [];
  const target = String(germanTerm || '').trim();
  if (!client || !target || original.length === 0) {
    return original;
  }

  try {
    const response = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: 'system',
          content: `You review German-to-Russian lexical glosses for flashcards.

Russian translations often collapse distinct German words into the same broad word. For each proposed meaning, consider the closest commonly confused German words and determine whether the Russian gloss would obscure an important semantic, pragmatic, register, argument-structure, or usage distinction.

When a distinction matters, rewrite the Russian gloss concisely so it contains the discriminating feature. Use a short qualifier such as the source of obligation, kind of knowledge, direction, state versus action, register, or typical construction. Keep genuinely interchangeable synonyms aligned; do not invent a distinction merely to make wording unique.

Keep one reviewed item for each input item, in the same order. Return Russian and English lexical glosses, not sentence translations, alternatives, explanations, or the names of confusable words. Return JSON only.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            germanTerm: target,
            lexicalType: String(lexicalType || '').trim() || null,
            proposedMeanings: original.map(({ russian, english }) => ({ russian, english })),
            examples: (Array.isArray(exampleSentences) ? exampleSentences : [])
              .map((sentence) => String(sentence?.german || '').trim())
              .filter(Boolean)
              .slice(0, 3),
          }),
        },
      ],
      response_format: MEANING_REVIEW_RESPONSE_FORMAT,
      temperature: 0,
    });

    const reviewed = JSON.parse(response.choices[0].message.content)?.meanings;
    if (!Array.isArray(reviewed) || reviewed.length !== original.length) {
      return original;
    }

    return original.map((meaning, index) => {
      const candidate = normalizeMeaning(reviewed[index]);
      if (!candidate.russian && !candidate.english) {
        return meaning;
      }
      return {
        ...meaning,
        russian: candidate.russian || meaning.russian,
        english: candidate.english || meaning.english,
      };
    });
  } catch {
    return original;
  }
}
