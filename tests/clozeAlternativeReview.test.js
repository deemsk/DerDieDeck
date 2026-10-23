import { jest } from '@jest/globals'
import { reviewClozeAlternatives } from '../src/clozeAlternativeReview.js'
test.each([['', 'skip'], ['s', 'sentence'], ['d', 'skip']])('choice %s selects %s', async (answer, action) => {
  const log = jest.fn()
  expect(await reviewClozeAlternatives('niemals', ['nie'], { ask: async () => answer, log })).toEqual({ action })
  expect(log.mock.calls.flat().join(' ')).toContain('Other valid answers: nie')
})
test('edit collects an example without another lexical analysis', async () => {
  const ask = jest.fn().mockResolvedValueOnce('e').mockResolvedValueOnce('Das mache ich niemals.')
  expect(await reviewClozeAlternatives('niemals', ['nie'], { ask, log: () => {} })).toEqual({ action: 'edit', german: 'Das mache ich niemals.' })
})
