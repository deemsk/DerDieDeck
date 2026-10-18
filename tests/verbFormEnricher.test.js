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
  create.mockResolvedValueOnce(answer(explanation)).mockResolvedValueOnce(answer({ blockingIssues: [], suggestions: [] }))
  expect(await explainVerbForm(request)).toEqual(explanation)
  expect(create).toHaveBeenCalledTimes(2)
  expect(create.mock.calls[0][0].response_format.json_schema.strict).toBe(true)
  expect(JSON.parse(create.mock.calls[0][0].messages[1].content).selectedSentence.german).toBe('Er wurde gefragt.')
  expect(create.mock.calls[1][0].messages[0].content).toMatch(/passive/i)
  expect(JSON.parse(create.mock.calls[1][0].messages[1].content)).not.toHaveProperty('meaning')
})

test('repairs a semantically wrong form meaning using the review reason', async () => {
  create.mockResolvedValueOnce(answer({ ...explanation, formMeaning: 'стал' }))
    .mockResolvedValueOnce(answer({ blockingIssues: [{ field: 'formMeaning', reason: 'Passive auxiliary must not mean стал here.' }], suggestions: [] }))
    .mockResolvedValueOnce(answer(explanation))
    .mockResolvedValueOnce(answer({ blockingIssues: [], suggestions: [] }))
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
  create.mockResolvedValueOnce(answer(explanation)).mockResolvedValueOnce(answer({ blockingIssues: [], suggestions: [] }))
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
  create.mockResolvedValueOnce(answer(ging)).mockResolvedValueOnce(answer({ blockingIssues: [], suggestions: [] }))
  expect(await explainVerbForm({ form: 'ging', infinitive: 'gehen', meaning: 'идти', selectedSentence: ging.example })).toEqual(ging)
  for (const [call] of create.mock.calls) {
    const rules = call.messages[0].content
    expect(rules).toContain('grammar: describe ONLY the reading in the final example')
    expect(rules).toContain('Der Arzt ging nach Hause.')
    expect(rules).toContain('Do not demand other possible persons in grammar')
  }
})

const issue = (field, reason) => ({ field, reason })
test('accepts optional translation preferences without repairing correct content', async () => {
  create.mockResolvedValueOnce(answer(explanation)).mockResolvedValueOnce(answer({
    blockingIssues: [], suggestions: [issue('example.russian', 'An equivalent wording is possible.')],
  }))
  expect(await explainVerbForm(request)).toEqual(explanation)
  expect(create).toHaveBeenCalledTimes(2)
})

test('keeps both answers and review reasons when repair encounters a new rejection', async () => {
  const first = { ...explanation, formMeaning: 'стал' }
  const reviews = [
    { blockingIssues: [issue('formMeaning', 'Incorrect passive meaning')], suggestions: [] },
    { blockingIssues: [issue('ambiguity', 'Missing common reading')], suggestions: [] },
  ]
  create.mockResolvedValueOnce(answer(first)).mockResolvedValueOnce(answer(reviews[0]))
    .mockResolvedValueOnce(answer(explanation)).mockResolvedValueOnce(answer(reviews[1]))
  const error = await explainVerbForm(request).catch(error => error)
  expect(error.message).toContain('Attempt 1: formMeaning: Incorrect passive meaning')
  expect(error.message).toContain('Attempt 2: ambiguity: Missing common reading')
  expect(error.attempts.map(a => a.explanation)).toEqual([first, explanation])
  expect(error.attempts.map(a => a.review)).toEqual(reviews)
  const repair = JSON.parse(create.mock.calls[2][0].messages[1].content)
  expect(repair.blockingFeedback).toEqual(reviews[0].blockingIssues)
  expect(repair.previousExplanation).toEqual(first)
  expect(create).toHaveBeenCalledTimes(4)
})

test.each([null, {}, { blockingIssues: [], suggestions: null }, { blockingIssues: [{}], suggestions: [] }])('fails closed for malformed review %j', async review => {
  create.mockResolvedValueOnce(answer(explanation)).mockResolvedValueOnce(answer(review))
  await expect(explainVerbForm(request)).rejects.toThrow('Invalid verb form review')
  expect(create).toHaveBeenCalledTimes(2)
})

test('repairs hör ambiguity and translation without blocking on a later wording preference', async () => {
  const initial = {
    form: 'hör', infinitive: 'hören', formMeaning: 'послушай',
    grammar: 'Imperativ, 2-е лицо, единственное число.', usage: 'Привлекает внимание собеседника.',
    ambiguity: null, contrast: null,
    example: { german: 'Hör mal, jemand kommt vorbei.', russian: 'Послушай, кто-то идёт в гости.' },
  }
  const repaired = { ...initial, ambiguity: 'Также разговорное ich hör — я слышу/слушаю.',
    example: { ...initial.example, russian: 'Слушай, кто-то заходит.' } }
  const blockers = [issue('ambiguity', 'Mention colloquial ich hör.'), issue('example.russian', 'Correct the meaning of vorbeikommen.')]
  create.mockResolvedValueOnce(answer(initial))
    .mockResolvedValueOnce(answer({ blockingIssues: blockers, suggestions: [] }))
    .mockResolvedValueOnce(answer(repaired))
    .mockResolvedValueOnce(answer({ blockingIssues: [], suggestions: [issue('example.russian', 'An alternative phrasing is possible.')] }))
  expect(await explainVerbForm({ form: 'hör', infinitive: 'hören', selectedSentence: initial.example })).toEqual(repaired)
  const repairInput = JSON.parse(create.mock.calls[2][0].messages[1].content)
  expect(repairInput.blockingFeedback).toEqual(blockers)
  expect(repairInput.selectedSentence).toEqual(initial.example)
  const reviewInput = JSON.parse(create.mock.calls[3][0].messages[1].content)
  expect(reviewInput.explanation.example).toEqual(repaired.example)
  expect(create).toHaveBeenCalledTimes(4)
})
