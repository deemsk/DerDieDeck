import { jest } from '@jest/globals'

const create = jest.fn()
jest.unstable_mockModule('openai', () => ({ default: jest.fn(() => ({ chat: { completions: { create } } })) }))
jest.unstable_mockModule('../src/lib/secrets.js', () => ({ resolveSecret: jest.fn(async () => 'test-key') }))
const { explainVerbForm } = await import('../src/verbFormEnricher.js')
const { getOpenAIModel, OPENAI_MODEL_ROLES } = await import('../src/lib/openaiModels.js')
const explanation = {
  form: 'wurde', infinitive: 'werden', formMeaning: 'показатель прошедшего пассива',
  grammar: 'Präteritum, Indikativ, 1-е или 3-е лицо ед. числа',
  usage: 'В примере — вспомогательный глагол пассива в прошлом.',
  ambiguity: 'Без контекста ich / er / sie / es; здесь er.', contrast: 'wurde ≠ würde (Konjunktiv II)',
  example: { german: 'Er wurde gefragt.', russian: 'Его спросили.' },
}
const answer = (value) => ({ choices: [{ message: { content: JSON.stringify(value) } }] })
const request = { form: 'wurde', infinitive: 'werden', meaning: 'становиться', selectedSentence: explanation.example }

beforeEach(() => create.mockReset())

test('generates then independently checks grammar, context, ambiguity and translation', async () => {
  create.mockResolvedValueOnce(answer(explanation)).mockResolvedValueOnce(answer({ valid: true, reason: '' }))
  expect(await explainVerbForm(request)).toEqual(explanation)
  expect(create).toHaveBeenCalledTimes(2)
  expect(create.mock.calls[0][0].response_format.json_schema.strict).toBe(true)
  expect(JSON.parse(create.mock.calls[0][0].messages[1].content).selectedSentence.german).toBe('Er wurde gefragt.')
  expect(create.mock.calls[1][0].messages[0].content).toMatch(/passive/i)
  expect(JSON.parse(create.mock.calls[1][0].messages[1].content)).not.toHaveProperty('meaning')
})

test('repairs a semantically wrong form meaning using the review reason', async () => {
  create.mockResolvedValueOnce(answer({ ...explanation, formMeaning: 'стал' }))
    .mockResolvedValueOnce(answer({ valid: false, reason: 'Passive auxiliary must not mean стал here.' }))
    .mockResolvedValueOnce(answer(explanation))
    .mockResolvedValueOnce(answer({ valid: true, reason: '' }))
  expect(await explainVerbForm(request)).toEqual(explanation)
  expect(create.mock.calls[2][0].messages[1].content).toContain('Passive auxiliary')
  expect(JSON.parse(create.mock.calls[2][0].messages[1].content).previousExplanation.formMeaning).toBe('стал')
  expect(create.mock.calls[2][0].model).toBe(getOpenAIModel(OPENAI_MODEL_ROLES.validation))
})

test('fails closed after invalid target examples; never returns lemma-only fallback', async () => {
  create.mockResolvedValue(answer({ ...explanation, example: { german: 'Er wird gefragt.', russian: 'Его спрашивают.' } }))
  await expect(explainVerbForm(request)).rejects.toThrow(/target form/i)
  expect(create).toHaveBeenCalledTimes(2)
})

test('propagates unavailable generation for retry/skip', async () => {
  create.mockRejectedValue(new Error('offline'))
  await expect(explainVerbForm(request)).rejects.toThrow('offline')
})
