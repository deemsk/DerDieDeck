import { jest } from '@jest/globals'
import { validateAiGeneratedIpa } from '../src/cardContent/ipaValidation.js'

function buildClient(reconstructed) {
  return {
    chat: {
      completions: {
        create: jest.fn(async () => ({
          choices: [{ message: { content: JSON.stringify({ german: reconstructed }) } }],
        })),
      },
    },
  }
}

describe('AI-generated IPA validation', () => {
  test('accepts a normalized exact reconstruction and does not expose the original', async () => {
    const client = buildClient('Wie heißt du?')

    await expect(validateAiGeneratedIpa({
      client,
      germanText: 'Wie heißt du?',
      ipa: '[viː haɪ̯st duː]',
    })).resolves.toBe(true)

    const request = client.chat.completions.create.mock.calls[0][0]
    expect(request.messages).toHaveLength(2)
    expect(request.messages[1].content).toBe('German IPA: [viː haɪ̯st duː]')
    expect(request.messages.map(({ content }) => content).join('\n')).not.toContain('Wie heißt du?')
    expect(request.messages[0].content).toContain('single most likely')
    expect(request.messages[0].content).toContain('Do not return alternatives')
    expect(request.response_format.json_schema.schema.properties).toEqual({
      german: { type: 'string' },
    })
  })

  test('rejects a different reconstruction', async () => {
    const client = buildClient('Wir gehen nach Hause.')

    await expect(validateAiGeneratedIpa({
      client,
      germanText: 'Ich gehe nach Hause.',
      ipa: '[ɪç ˈɡeːə nax ˈhaʊzə]',
    })).resolves.toBe(false)
  })

  test('rejects IPA when verification fails', async () => {
    const client = buildClient('ignored')
    client.chat.completions.create.mockRejectedValueOnce(new Error('API unavailable'))

    await expect(validateAiGeneratedIpa({
      client,
      germanText: 'Haus',
      ipa: '[haʊ̯s]',
    })).resolves.toBe(false)
  })
})
