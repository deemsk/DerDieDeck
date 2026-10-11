import { jest } from '@jest/globals'

const create = jest.fn()
jest.unstable_mockModule('openai', () => ({ default: jest.fn(() => ({ chat: { completions: { create } } })) }))
jest.unstable_mockModule('../src/lib/secrets.js', () => ({ resolveSecret: jest.fn(async () => 'test-key') }))
const { explainVerbForm } = await import('../src/verbFormEnricher.js')
const { getOpenAIModel, OPENAI_MODEL_ROLES } = await import('../src/lib/openaiModels.js')
const explanation = {
  form: 'wurde', infinitive: 'werden', formMeaning: 'показатель прошедшего пассива',
  grammar: 'Präteritum, Indikativ, 3-е лицо, единственное число',
  usage: 'В примере — вспомогательный глагол пассива в прошлом.',
  ambiguity: 'Без контекста также ich wurde — 1-е лицо, единственное число.', contrast: 'wurde ≠ würde (Konjunktiv II)',
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

test('uses progress preferences without replacing a selected sentence', async () => {
  create.mockResolvedValueOnce(answer(explanation)).mockResolvedValueOnce(answer({ valid: true, reason: '' }))
  await explainVerbForm({ ...request, learnerProfileContext: 'Familiar vocabulary: Buch.' })
  const context = JSON.parse(create.mock.calls[0][0].messages[1].content)
  expect(context.learnerProfileContext).toContain('Buch')
  expect(context.selectedSentence).toEqual(explanation.example)
})

test('ging uses contextual grammar and separate isolated-form ambiguity in generation and review', async () => {
  const ging = {
    form: 'ging', infinitive: 'gehen', formMeaning: 'шёл',
    grammar: 'Präteritum Indikativ, 3-е лицо, единственное число.',
    usage: 'В примере врач шёл домой в прошлом.',
    ambiguity: 'Без контекста также ich ging — я шёл/шла.', contrast: null,
    example: { german: 'Der Arzt ging nach Hause.', russian: 'Врач шёл домой.' },
  }
  create.mockResolvedValueOnce(answer(ging)).mockResolvedValueOnce(answer({ valid: true, reason: '' }))
  expect(await explainVerbForm({ form: 'ging', infinitive: 'gehen', meaning: 'идти', selectedSentence: ging.example })).toEqual(ging)
  for (const [call] of create.mock.calls) {
    const rules = call.messages[0].content
    expect(rules).toContain('grammar: describe ONLY the reading in the final example')
    expect(rules).toContain('Der Arzt ging nach Hause.')
    expect(rules).toContain('Do not demand other possible persons in grammar')
  }
})
