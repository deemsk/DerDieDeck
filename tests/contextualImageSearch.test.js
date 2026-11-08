import { jest } from '@jest/globals'
const generate = jest.fn()
jest.unstable_mockModule('../src/imageSearchEnricher.js', () => ({ generateImageSearchQuery: generate }))
const { prepareContextualImageSearch, senseSpecificFallback } = await import('../src/contextualImageSearch.js')
const spinner = { start: jest.fn(), stop: jest.fn() }

test('opens the reviewed model query exactly', async () => {
  generate.mockResolvedValueOnce('children working together')
  const result = await prepareContextualImageSearch({ target: 'Klasse', meaning: 'группа учеников', spinner })
  expect(result.query).toBe('children working together')
  expect(new URL(result.url).searchParams.get('q')).toBe(result.query)
  expect(result).not.toHaveProperty('queryVariants')
})

test('falls back if the model fails', async () => {
  generate.mockRejectedValueOnce(new Error('unavailable'))
  const log = jest.spyOn(console, 'log').mockImplementation(() => {})
  try { expect((await prepareContextualImageSearch({ target: 'Klasse', spinner })).query).toBe('Klasse') }
  finally { log.mockRestore() }
})

test('keeps the sense-specific fallback when image generation fails', async () => {
  generate.mockRejectedValueOnce(new Error('unavailable'))
  const log = jest.spyOn(console, 'log').mockImplementation(() => {})
  try {
    const fallbackQuery = senseSpecificFallback({ english: 'school class', imageSearchTerms: ['children studying together'] })
    const result = await prepareContextualImageSearch({ target: 'Klasse', fallbackQuery, spinner })
    expect(result.query).toBe('children studying together')
    expect(new URL(result.url).searchParams.get('q')).toBe(result.query)
  } finally { log.mockRestore() }
})

test('prefers a sense gloss when the only search term repeats the target', () => {
  expect(senseSpecificFallback({ english: 'school class', imageSearchTerms: ['Klasse'] }, 'die Klasse')).toBe('school class')
})

test('uses the verified example instead of an inherited gloss for a user-defined meaning', () => {
  const meaning = { russian: 'дорогой', english: 'treasure', imageSearchTerms: ['Schatz'], userProvided: true }
  expect(senseSpecificFallback(meaning, 'Schatz', { german: 'Schatz, komm bitte!' })).toBe('Schatz, komm bitte!')
  expect(senseSpecificFallback(meaning, 'Schatz')).toBe('')
})

test('falls back to the verified example when no sense-specific query or gloss exists', () => {
  expect(senseSpecificFallback({ imageSearchTerms: ['die Bank'] }, 'die Bank', { german: 'Er sitzt auf der Bank.' })).toBe('Er sitzt auf der Bank.')
})

test('skips article-prefixed target before a useful scene or gloss', () => {
  expect(senseSpecificFallback({ imageSearchTerms: ['die Bank', 'Person sitzt auf Parkbank'], english: 'bench' }, 'die Bank')).toBe('Person sitzt auf Parkbank')
  expect(senseSpecificFallback({ imageSearchTerms: ['die Bank'], english: 'bench' }, 'Bank')).toBe('bench')
})
