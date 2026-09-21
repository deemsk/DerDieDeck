import { jest } from '@jest/globals'
import { prepareVerbDictionaryExplanation } from '../src/verbDictionaryPreview.js'

const explanation = {
  form: 'wäre', infinitive: 'sein', formMeaning: 'был бы', grammar: 'Konjunktiv II',
  usage: 'Желание в настоящем.', ambiguity: 'ich / er / sie / es', contrast: null,
  example: { german: 'Ich wäre gern zu Hause.', russian: 'Я хотел бы быть дома.' },
}
const input = { verbData: { infinitive: 'sein', displayForm: 'wäre', ipa: '[zaɪn]' }, selectedMeaning: { russian: 'быть' } }

test('shows the complete answer before accepting the optional card', async () => {
  const log = jest.fn()
  const ask = jest.fn(async () => {
    const preview = log.mock.calls.flat().join('\n')
    for (const text of ['был бы', 'Konjunktiv II', 'Ich wäre gern zu Hause.', 'Я хотел бы быть дома.', 'Инфинитив', '[zaɪn]', 'быть']) {
      expect(preview).toContain(text)
    }
    return 'y'
  })
  expect(await prepareVerbDictionaryExplanation(input, { generate: async () => explanation, ask, log })).toEqual(explanation)
})

test('lets the learner dismiss the fully previewed card', async () => {
  expect(await prepareVerbDictionaryExplanation(input, {
    generate: async () => explanation, ask: async () => 's', log: () => {},
  })).toBeNull()
})

test('failed explanation offers retry; invalid content is never accepted', async () => {
  const generate = jest.fn().mockResolvedValueOnce({}).mockResolvedValueOnce(explanation)
  const ask = jest.fn().mockResolvedValueOnce('r').mockResolvedValueOnce('y')
  expect(await prepareVerbDictionaryExplanation(input, { generate, ask, log: () => {} })).toEqual(explanation)
  expect(ask.mock.calls[0][0]).toContain('[R]etry')
  expect(generate).toHaveBeenCalledTimes(2)
})

test('failed explanation can be skipped without failing the main note', async () => {
  const log = jest.fn()
  expect(await prepareVerbDictionaryExplanation(input, {
    generate: async () => { throw new Error('unavailable') }, ask: async () => 's', log,
  })).toBeNull()
  expect(log.mock.calls.flat().join(' ')).toContain('unavailable')
})
