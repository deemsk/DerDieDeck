import { jest } from '@jest/globals'
const create = jest.fn()
const makeClient = jest.fn(() => ({ chat: { completions: { create } } }))
const resolveSecret = jest.fn(async () => 'test')
jest.unstable_mockModule('openai', () => ({ default: makeClient }))
jest.unstable_mockModule('../src/lib/secrets.js', () => ({ resolveSecret }))
const { generateImageSearchQuery } = await import('../src/imageSearchEnricher.js')
const reply = value => ({ choices: [{ message: { content: JSON.stringify(value) } }] })

test('uses one model call for a search based on the selected meaning', async () => {
  create.mockReset().mockResolvedValueOnce(reply({ query: 'Schüler lernen zusammen' }))
  const context = { target: 'die Klasse', meaning: 'группа учеников', example: { german: 'Die Klasse lernt.', russian: 'Класс учится.' } }
  expect(await generateImageSearchQuery(context)).toBe('Schüler lernen zusammen')
  expect(create).toHaveBeenCalledTimes(1)
  expect(makeClient).toHaveBeenCalledWith(expect.objectContaining({ timeout: 12000, maxRetries: 0 }))
  expect(resolveSecret.mock.calls[0][1]).toEqual({ timeoutMs: 5000 })
  expect(JSON.parse(create.mock.calls[0][0].messages[1].content)).toEqual(context)
})

test('provides the sentence as context while permitting a more memorable scene', async () => {
  create.mockReset().mockResolvedValueOnce(reply({ query: 'large elephant standing' }))
  await generateImageSearchQuery({ target: 'groß', meaning: 'большой', example: { german: 'Der Elefant ist groß.' } })
  expect(create).toHaveBeenCalledTimes(1)
  expect(create.mock.calls[0][0].messages[0].content).toMatch(/example is optional context/)
  expect(JSON.parse(create.mock.calls[0][0].messages[1].content)).toMatchObject({ example: { german: 'Der Elefant ist groß.' } })
})

test('rejects an empty result without further model calls', async () => {
  create.mockReset().mockResolvedValueOnce(reply({ query: '  ' }))
  await expect(generateImageSearchQuery({ target: 'Boden', meaning: 'почва' })).rejects.toThrow('empty')
  expect(create).toHaveBeenCalledTimes(1)
})
