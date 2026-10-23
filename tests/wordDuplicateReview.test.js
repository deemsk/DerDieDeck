import { jest } from '@jest/globals'
import { reviewWordDuplicates } from '../src/wordDuplicateReview.js'
const match = { noteId: 42, canonical: 'ganz', meaning: 'целый, весь' }
const possible = { exactMatches: [], headwordMatches: [match] }
test('paraphrased gloss never silently creates another main card', async () => {
  const log = jest.fn()
  expect(await reviewWordDuplicates(possible, { sentence: true, ask: async () => '', log })).toBe('example')
  expect(log.mock.calls.flat().join(' ')).toContain('nid:42')
  expect(await reviewWordDuplicates(possible, { ask: async () => '', log })).toBe('skip')
  expect(await reviewWordDuplicates(possible, { ask: async () => 'n', log })).toBe('new')
})
test('exact match blocks a new meaning override but permits a sentence', async () => {
  const ask = jest.fn().mockResolvedValueOnce('n').mockResolvedValueOnce('e')
  const duplicates = { exactMatches: [match], headwordMatches: [] }
  expect(await reviewWordDuplicates(duplicates, { sentence: true, ask, log: () => {} })).toBe('example')
  expect(ask).toHaveBeenCalledTimes(2)
  expect(await reviewWordDuplicates(duplicates, { ask, log: () => {} })).toBe('skip')
  expect(ask).toHaveBeenCalledTimes(2)
})
