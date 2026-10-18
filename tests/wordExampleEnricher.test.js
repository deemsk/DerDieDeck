import { jest } from '@jest/globals'
const create = jest.fn()
jest.unstable_mockModule('openai', () => ({ default: jest.fn(() => ({ chat: { completions: { create } } })) }))
jest.unstable_mockModule('../src/lib/secrets.js', () => ({ resolveSecret: async () => 'test' }))
const { prepareNounExample } = await import('../src/wordExampleEnricher.js')
const good = { german: 'Schatz, komm bitte her.', russian: 'Дорогой, подойди, пожалуйста.', focusForm: 'Schatz' }
const bad = { german: 'Die Kinder finden einen Schatz.', russian: 'Дети находят клад.', focusForm: 'Schatz' }
const input = { wordData: { canonical: 'der Schatz', lemma: 'Schatz', exampleSentences: [bad] }, selectedMeaning: { russian: 'дорогой / дорогая (ласковое обращение)' } }
const answer = value => ({ choices: [{ message: { content: JSON.stringify(value) } }] })
beforeEach(() => create.mockReset())
test('repairs an example from the wrong sense using independent feedback', async () => {
  create.mockResolvedValueOnce(answer(bad)).mockResolvedValueOnce(answer({ valid: false, reason: 'Treasure is the wrong sense' }))
    .mockResolvedValueOnce(answer(good)).mockResolvedValueOnce(answer({ valid: true, reason: '' }))
  expect(await prepareNounExample(input)).toEqual(good)
  const repair = JSON.parse(create.mock.calls[2][0].messages[1].content)
  expect(repair.meaning).toEqual(input.selectedMeaning)
  expect(repair.feedback).toContain('wrong sense')
  expect(repair.previousExample).toEqual(bad)
})
test('does not return an unverified fallback after two rejected examples', async () => {
  create.mockResolvedValueOnce(answer(bad)).mockResolvedValueOnce(answer({ valid: false, reason: 'Wrong sense' }))
    .mockResolvedValueOnce(answer(bad)).mockResolvedValueOnce(answer({ valid: false, reason: 'Wrong sense' }))
  await expect(prepareNounExample(input)).rejects.toThrow('Wrong sense')
  expect(create).toHaveBeenCalledTimes(4)
})
test('rejects examples without the target before semantic review', async () => {
  create.mockResolvedValue(answer({ ...good, german: 'Komm bitte her.' }))
  await expect(prepareNounExample(input)).rejects.toThrow('target')
  expect(create).toHaveBeenCalledTimes(2)
})
