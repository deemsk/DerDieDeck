import { buildMeaningGuidance } from '../src/meaningSelection.js'
const meanings = [{ russian: 'сокровище', english: 'treasure' }, { russian: 'клад', english: 'treasure' }, { russian: 'дорогой', english: 'darling' }]
test('merges confident paraphrases and recommends another sense when common meaning is already saved', async () => {
  const result = await buildMeaningGuidance({ word: { canonical: 'der Schatz', meanings },
    lookup: async () => [{ noteId: 123, meaning: 'клад' }],
    assess: async () => ({ groups: [[0, 1], [2]], existing: [{ group: 0, noteId: 123, confidence: 'high' }], commonGroup: 0, recommendedGroup: 1, reason: 'The common sense is already in Anki.' }),
  })
  expect(result.options).toHaveLength(2)
  expect(result.options[0].meaning.duplicateMeanings).toEqual(['сокровище', 'клад'])
  expect(result.options[0].status).toBe('existing')
  expect(result.recommendedIndex).toBe(1)
  expect(result.options[0].noteIds).toEqual([123])
  expect(result.options[0].evidence).toEqual([{ noteId: 123, meaning: 'клад' }])
})
test('does not infer absence or recommendation when Anki lookup fails', async () => {
  const result = await buildMeaningGuidance({ word: { canonical: 'Schatz', meanings }, lookup: async () => { throw new Error('offline') }, assess: async () => { throw new Error('bad') } })
  expect(result.options).toHaveLength(3)
  expect(result.recommendedIndex).toBeNull()
  expect(result.collectionAvailable).toBe(false)
  expect(result.options.every(option => option.status === 'unknown')).toBe(true)
})
test('rejects assessment that drops or repeats candidates', async () => {
  const result = await buildMeaningGuidance({ word: { canonical: 'Schatz', meanings }, lookup: async () => [], assess: async () => ({ groups: [[0, 1], [1]], existing: [], recommendedGroup: 0 }) })
  expect(result.options).toHaveLength(3)
  expect(result.recommendedIndex).toBeNull()
})

test('does not recommend an uncertain match or an unjustified alternative', async () => {
  const word = { canonical: 'Schatz', meanings }
  const result = await buildMeaningGuidance({ word, lookup: async () => [{ noteId: 123, meaning: 'клад' }], assess: async () => ({ groups: [[0], [1], [2]], existing: [{ group: 0, noteId: 123, confidence: 'possible' }], commonGroup: 0, recommendedGroup: 2, reason: '...' }) })
  expect(result.options[0].status).toBe('possible')
  expect(result.recommendedIndex).toBeNull()
})
test('does not call remote assessment when Anki lookup fails', async () => {
  let assessed = false
  const result = await buildMeaningGuidance({ word: { canonical: 'Schatz', meanings }, lookup: async () => { throw new Error('offline') }, assess: async () => { assessed = true } })
  expect(assessed).toBe(false)
  expect(result.options).toHaveLength(3)
})
test('does not silently select a merged model-generated option by default', async () => {
  const result = await buildMeaningGuidance({ word: { canonical: 'Schatz', meanings }, lookup: async () => [], assess: async () => ({ groups: [[0, 1], [2]], existing: [], commonGroup: 0, recommendedGroup: 0, reason: 'Likely common.' }) })
  expect(result.options).toHaveLength(2)
  expect(result.recommendedIndex).toBeNull()
  expect(result.originals).toEqual(meanings)
})
test('falls back to selectable meanings when assessment does not respond', async () => {
  const result = await buildMeaningGuidance({ word: { canonical: 'Schatz', meanings }, lookup: async () => [], assess: async () => new Promise(() => {}), timeoutMs: 20 })
  expect(result.options).toHaveLength(3)
  expect(result.recommendedIndex).toBeNull()
  expect(result.assessmentAvailable).toBe(false)
})
test('aborts the active assessment on timeout', async () => {
  let aborted = false
  await buildMeaningGuidance({ word: { canonical: 'Schatz', meanings }, lookup: async () => [], timeoutMs: 20,
    assess: async (_word, _existing, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')) })) })
  expect(aborted).toBe(true)
})
test('aborts a stalled Anki lookup and never starts assessment', async () => {
  let aborted = false, assessed = false
  await buildMeaningGuidance({ word: { canonical: 'Schatz', meanings }, timeoutMs: 20,
    lookup: async (_word, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')) })),
    assess: async () => { assessed = true } })
  expect(aborted).toBe(true)
  expect(assessed).toBe(false)
})
test('cancels outstanding sibling work when a lookup fails early', async () => {
  let siblingAborted = false
  const result = await buildMeaningGuidance({ word: { canonical: 'gehen', meanings }, timeoutMs: 1000,
    lookup: async (_word, { signal }) => {
      signal.addEventListener('abort', () => { siblingAborted = true })
      throw new Error('one Anki query failed')
    }, assess: async () => { throw new Error('must not run') } })
  expect(result.collectionAvailable).toBe(false)
  expect(siblingAborted).toBe(true)
})
