import { jest } from '@jest/globals'
const create = jest.fn()
jest.unstable_mockModule('openai', () => ({ default: jest.fn(() => ({ chat: { completions: { create } } })) }))
jest.unstable_mockModule('../src/lib/secrets.js', () => ({ resolveSecret: jest.fn(async () => 'test') }))
const { reviewVerbExamples } = await import('../src/verbSentenceValidation.js')
const target = { infinitive: 'sehen', displayForm: 'sieh', meanings: [{ russian: 'видеть, смотреть' }] }
const examples = [{ german: 'Sieh bitte nach, ob die Tür zu ist.' }, { german: 'Sieh nach links.' }]
const answer = verdicts => ({ choices: [{ message: { content: JSON.stringify({ verdicts }) } }] })
beforeEach(() => create.mockReset())
test('filters another lemma while retaining a directional preposition and original wording', async () => {
  create.mockResolvedValue(answer([{ index: 0, valid: false, reason: 'nachsehen' }, { index: 1, valid: true, reason: '' }]))
  expect(await reviewVerbExamples(target, examples)).toEqual([examples[1]])
  const request = create.mock.calls[0][0]
  expect(request.messages[0].content).toMatch(/separable/i)
  expect(request.messages[0].content).toContain('Sieh nach links')
  expect(JSON.parse(request.messages[1].content)).toMatchObject({ infinitive: 'sehen', form: 'sieh' })
})
test.each([[], [{ index: 0, valid: true, reason: '' }], [{ index: 0, valid: true }, { index: 0, valid: true }], [{ index: 0, valid: 'true' }, { index: 1, valid: true }]].map(verdicts => [verdicts]))('does not trust incomplete or malformed verdicts: %j', async verdicts => {
  create.mockResolvedValue(answer(verdicts))
  await expect(reviewVerbExamples(target, examples)).rejects.toMatchObject({ code: 'verb-example-review-failed', allowManualSentence: true })
})
test('does not admit unverified examples on API failure', async () => {
  create.mockRejectedValue(new Error('offline'))
  await expect(reviewVerbExamples(target, examples)).rejects.toMatchObject({ code: 'verb-example-review-failed' })
})
test('empty candidate list does not request a model', async () => {
  expect(await reviewVerbExamples(target, [])).toEqual([])
  expect(create).not.toHaveBeenCalled()
})

test('a missing requested surface form is rejected without model approval', async () => {
  expect(await reviewVerbExamples(target, [{ german: 'Ich sehe die Tür.' }])).toEqual([])
  expect(create).not.toHaveBeenCalled()
})
