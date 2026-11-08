import { jest } from '@jest/globals'
const create = jest.fn()
jest.unstable_mockModule('openai', () => ({ default: jest.fn(() => ({ chat: { completions: { create } } })) }))
jest.unstable_mockModule('../src/lib/secrets.js', () => ({ resolveSecret: async () => 'test' }))
const { reviewExamplePair } = await import('../src/exampleReview.js')
test('sends the chosen target, sense and complete bilingual pair to independent review', async () => {
  create.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ valid: true, reason: '' }) } }] })
  const example = { german: 'Das Wasser ist recht kalt.', russian: 'Вода довольно холодная.', focusForm: 'recht' }
  const context = { target: 'recht', meaning: 'довольно', lexicalType: 'adverb' }
  expect(await reviewExamplePair(example, context)).toEqual({ valid: true, reason: '' })
  expect(JSON.parse(create.mock.calls[0][0].messages[1].content)).toEqual({ example, context })
})
