import { config } from '../lib/config.js';
import { normalizeGermanForCompare } from './german.js';

const IPA_RECONSTRUCTION_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'german_from_ipa',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        german: { type: 'string' },
      },
      required: ['german'],
      additionalProperties: false,
    },
  },
};

/**
 * Validates model-generated IPA without exposing the expected spelling to the verifier.
 */
export async function validateAiGeneratedIpa({ client, germanText, ipa }) {
  const expected = normalizeGermanForCompare(germanText);
  const transcription = String(ipa || '').trim();
  if (!client || !expected || !transcription) {
    return false;
  }

  try {
    const response = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: 'system',
          content: `You reconstruct German spelling from IPA.

Return the single most likely Standard German word, phrase, or sentence represented by the IPA.
Do not return alternatives or explanations. Preserve likely articles and function words.
Return JSON only.`,
        },
        {
          role: 'user',
          content: `German IPA: ${transcription}`,
        },
      ],
      response_format: IPA_RECONSTRUCTION_RESPONSE_FORMAT,
      temperature: 0,
    });
    const reconstructed = JSON.parse(response.choices[0].message.content)?.german;
    return normalizeGermanForCompare(reconstructed) === expected;
  } catch {
    return false;
  }
}
