import { jest } from '@jest/globals'
const create = jest.fn()
jest.unstable_mockModule('openai', () => ({ default: jest.fn(() => ({ chat: { completions: { create } } })) }))
jest.unstable_mockModule('../src/lib/secrets.js', () => ({ resolveSecret: jest.fn(async () => 'test') }))
const { enrichVerb, generateVerbFormSentence } = await import('../src/verbEnricher.js')
const { enrichWord } = await import('../src/wordEnricher.js')
const answer = value => ({ choices: [{ message: { content: JSON.stringify(value) } }] })
const context = 'Familiar vocabulary: Buch.'
const verb = { infinitive: 'gehen', displayForm: 'geh', shouldCreateVerbCard: true, recommendedMode: 'sentence-form', meanings: [{ russian: 'идти' }], exampleSentences: [{ german: 'Geh nach Hause.', russian: 'Иди домой.', focusForm: 'geh' }] }
beforeEach(() => create.mockReset())
test('reuses supplied verb analysis, personalizes examples and rejects wrong forms', async () => {
  create.mockResolvedValue(answer({ exampleSentences: [
    { german: 'Ich gehe.', russian: 'Я иду.', focusForm: 'gehe' },
    { german: 'Geh zum Buch.', russian: 'Иди к книге.', focusForm: 'geh' },
  ] }))
  const result = await enrichVerb('geh', { analysisResult: verb, learnerProfileContext: context })
  expect(create).toHaveBeenCalledTimes(1)
  expect(create.mock.calls[0][0].messages[1].content).toContain(context)
  expect(result.exampleSentences[0].german).toBe('Geh zum Buch.')
  expect(result.exampleSentences.some(e => e.german === 'Ich gehe.')).toBe(false)
  expect(result.infinitive).toBe('gehen')
  expect(verb.exampleSentences).toHaveLength(1)
})
test('optional tuning failure preserves supplied analysis', async () => {
  create.mockRejectedValue(new Error('offline'))
  expect(await enrichVerb('geh', { analysisResult: verb, learnerProfileContext: context })).toEqual(verb)
})
test('no context does not regenerate supplied analysis', async () => {
  expect(await enrichVerb('geh', { analysisResult: verb })).toBe(verb)
  expect(create).not.toHaveBeenCalled()
})
test('supplied word analysis is personalized without repeating lexical analysis', async () => {
  const word = { canonical: 'sofort', lexicalType: 'adverb', recommendedMode: 'sentence-form', meanings: [{ russian: 'сразу' }], exampleSentences: [{ german: 'Ich komme sofort.', russian: 'Я сейчас приду.', focusForm: 'sofort' }] }
  create.mockResolvedValue(answer({ exampleSentences: [{ german: 'Das Buch ist hier.', russian: 'Книга здесь.', focusForm: 'sofort' }, { german: 'Lies das Buch sofort.', russian: 'Прочитай книгу сразу.', focusForm: 'sofort' }] }))
  const result = await enrichWord('sofort', { analysisResult: word, learnerProfileContext: context })
  expect(create).toHaveBeenCalledTimes(1)
  expect(create.mock.calls[0][0].messages[1].content).toContain(context)
  expect(result.exampleSentences[0].german).toBe('Lies das Buch sofort.')
  expect(result.exampleSentences.some(e => e.german === 'Das Buch ist hier.')).toBe(false)
})
test('finite-form generator receives review preferences alongside exact-form requirements', async () => {
  create.mockResolvedValue(answer({ german: 'Du liest das Buch.', russian: 'Ты читаешь книгу.', focusForm: 'liest', formRussian: 'ты читаешь' }))
  await generateVerbFormSentence({ infinitive: 'lesen', form: 'liest', pronoun: 'du', learnerProfileContext: context })
  expect(create.mock.calls[0][0].messages[1].content).toContain(context)
  expect(create.mock.calls[0][0].messages[1].content).toContain('Target finite form: liest')
})
