import { jest } from '@jest/globals'

const mockCreate = jest.fn(async () => ({
  choices: [{ message: { content: JSON.stringify({
    route: 'word',
    confidence: 0.98,
    reason: 'German preposition',
  }) } }],
}))

jest.unstable_mockModule('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}))

jest.unstable_mockModule('../src/lib/secrets.js', () => ({
  resolveSecret: jest.fn(async (value) => value || 'test-key'),
}))

const { classifyLexicalRoute } = await import('../src/lexicalRouter.js')

describe('lexical route classifier', () => {
  test('uses Luna and a strict route schema before expensive analysis', async () => {
    await expect(classifyLexicalRoute('über')).resolves.toEqual({
      route: 'word',
      confidence: 0.98,
      reason: 'German preposition',
    })

    expect(mockCreate.mock.calls[0][0]).toEqual(expect.objectContaining({
      model: 'gpt-5.6-luna',
      reasoning_effort: 'none',
      response_format: expect.objectContaining({
        type: 'json_schema',
        json_schema: expect.objectContaining({ name: 'lexical_route', strict: true }),
      }),
    }))
  })
})
