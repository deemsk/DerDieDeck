import { jest } from '@jest/globals'

const create = jest.fn()
jest.unstable_mockModule('openai', () => ({ default: jest.fn(() => ({ chat: { completions: { create } } })) }))
jest.unstable_mockModule('../src/lib/secrets.js', () => ({ resolveSecret: jest.fn(async () => 'test-key') }))
const { explainLexicalCloze } = await import('../src/lexicalRuleEnricher.js')
const answer = (value) => ({ choices: [{ message: { content: JSON.stringify(value) } }] })
const request = {
  canonical: 'je', target: 'Je', lexicalType: 'adverb', meaning: 'чем',
  sentence: 'Je mehr du übst, desto besser wirst du.',
}
const hint = 'je … desto … — чем …, тем …; mehr и besser — сравнительные формы. После je глагол в конце: je mehr du übst; после desto besser — глагол: desto besser wirst du.'
const accepted = answer({ valid: true, reason: '' })

beforeEach(() => create.mockReset())

test('passes the exact final context to generation and independent review', async () => {
  create.mockResolvedValueOnce(answer({ explanation: hint })).mockResolvedValueOnce(accepted)
  expect(await explainLexicalCloze(request)).toBe(hint)
  for (const [call] of create.mock.calls) {
    expect(JSON.parse(call.messages[1].content)).toMatchObject(request)
  }
  expect(create.mock.calls).toHaveLength(2)
})

test('repairs a contextually wrong hint instead of accepting it because it is nonempty', async () => {
  const distributive = { ...request, target: 'je', meaning: 'по', sentence: 'Die Tickets kosten je zehn Euro.', existingHint: hint }
  const corrected = 'Здесь je означает «по»: каждый билет стоит десять евро.'
  create.mockResolvedValueOnce(answer({ valid: false, reason: 'This is distributive je, not a comparison.' }))
    .mockResolvedValueOnce(answer({ explanation: corrected })).mockResolvedValueOnce(accepted)
  expect(await explainLexicalCloze(distributive)).toBe(corrected)
  expect(JSON.parse(create.mock.calls[1][0].messages[1].content).feedback).toContain('distributive')
})

test('retains an existing suitable explanation without rewriting its wording', async () => {
  create.mockResolvedValueOnce(accepted)
  expect(await explainLexicalCloze({ ...request, existingHint: hint })).toBe(hint)
  expect(create.mock.calls).toHaveLength(1)
})

test('allows intentional omission only after semantic review', async () => {
  create.mockResolvedValueOnce(answer({ explanation: null })).mockResolvedValueOnce(accepted)
  expect(await explainLexicalCloze({ ...request, canonical: 'sofort', target: 'sofort', sentence: 'Komm sofort!' })).toBeNull()
  expect(create.mock.calls).toHaveLength(2)
})

test.each([
  'Наречие: его смысл и область действия определяются позицией и контекстом.',
  '<b>Здесь je означает чем.</b>',
  '',
  'An adverb depends on context.',
])('rejects invalid or generic prose: %s', async (explanation) => {
  create.mockResolvedValue(answer({ explanation }))
  await expect(explainLexicalCloze(request)).rejects.toThrow(/explanation/i)
  expect(create.mock.calls).toHaveLength(2)
})

test('failed semantic review cannot silently omit the explanation', async () => {
  create.mockResolvedValueOnce(answer({ explanation: hint }))
    .mockResolvedValueOnce(answer({ valid: false, reason: 'Wrong word order.' }))
    .mockResolvedValueOnce(answer({ explanation: null }))
    .mockResolvedValueOnce(answer({ valid: false, reason: 'This construction needs an explanation.' }))
  await expect(explainLexicalCloze(request)).rejects.toThrow('needs an explanation')
})

test('network failure propagates instead of becoming an intentional null', async () => {
  create.mockRejectedValue(new Error('offline'))
  await expect(explainLexicalCloze(request)).rejects.toThrow('offline')
})
