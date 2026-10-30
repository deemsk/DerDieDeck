import { jest } from '@jest/globals'
const create = jest.fn()
jest.unstable_mockModule('openai', () => ({ default: jest.fn(() => ({ chat: { completions: { create } } })) }))
jest.unstable_mockModule('../src/lib/secrets.js', () => ({ resolveSecret: async () => 'test' }))
const { prepareAdjectiveForm, validateAdjectiveFormSentence } = await import('../src/adjectiveFormEnricher.js')
const result = { form: 'besten', lemma: 'gut', meaning: 'лучший', grammar: 'Superlativ с окончанием -en.', examples: [{ german: 'Ich nehme den besten Kuchen.', russian: 'Я возьму лучший торт.' }] }
const answer = value => ({ choices: [{ message: { content: JSON.stringify(value) } }] })
beforeEach(() => create.mockReset())
test('preserves besten, its meaning and lemma separately', async () => {
  create.mockResolvedValueOnce(answer(result)).mockResolvedValueOnce(answer({ valid: true, reason: '' }))
  const data = await prepareAdjectiveForm('besten', { canonical: 'gut', lemma: 'gut', ipa: '[ɡuːt]', opposite: 'schlecht' })
  expect(data).toMatchObject({ canonical: 'besten', lemma: 'gut', requestedForm: 'besten', ipa: '', meanings: [{ russian: 'лучший' }] })
  expect(data.exampleSentences[0].focusForm).toBe('besten')
})
test('does not accept beste as an example for besten', async () => {
  create.mockResolvedValue(answer({ ...result, examples: [{ german: 'Das ist der beste Kuchen.', russian: 'Это лучший торт.' }] }))
  await expect(prepareAdjectiveForm('besten', { lemma: 'gut' })).rejects.toThrow('exact requested form')
})
test('rejects a wrong lemma instead of silently changing the request', async () => {
  create.mockResolvedValueOnce(answer({ ...result, form: 'festen', examples: [{ german: 'Auf festen Boden.', russian: 'На твёрдую почву.' }] }))
    .mockResolvedValueOnce(answer({ valid: false, reason: 'festen belongs to fest, not gut' }))
  await expect(prepareAdjectiveForm('festen', { lemma: 'gut' })).rejects.toThrow('fest')
})
test('blocks manual or revised sentences that lose the requested form', async () => {
  await expect(validateAdjectiveFormSentence({ german: 'Der Kuchen ist gut.' }, { requestedForm: 'besten' })).rejects.toThrow('besten')
  expect(create).not.toHaveBeenCalled()
})
