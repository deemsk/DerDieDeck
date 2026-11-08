import { buildMeaningGuidance } from '../src/meaningSelection.js'
const originalFetch = global.fetch
afterEach(() => { global.fetch = originalFetch })
test('timeout aborts the real AnkiConnect lookup and leaves meanings selectable', async () => {
  let aborted = false
  global.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => { aborted = true; reject(signal.reason) }, { once: true })
  })
  const meanings = [{ russian: 'клад' }, { russian: 'дорогой' }]
  const result = await buildMeaningGuidance({ word: { canonical: 'der Schatz', lexicalType: 'noun', meanings }, timeoutMs: 20 })
  expect(result.collectionAvailable).toBe(false)
  expect(result.options).toHaveLength(2)
  expect(aborted).toBe(true)
})
