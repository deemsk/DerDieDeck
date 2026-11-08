import { jest } from '@jest/globals'
const findWordDuplicates = jest.fn(), findVerbLemmaDuplicates = jest.fn(), findVerbSentenceDuplicates = jest.fn(), findNotesByQuery = jest.fn(), getNotesInfo = jest.fn()
jest.unstable_mockModule('../src/anki.js', () => ({ findWordDuplicates, findVerbLemmaDuplicates, findVerbSentenceDuplicates, findNotesByQuery, getNotesInfo }))
const { lookupExisting } = await import('../src/meaningSelection.js')
test('includes verb dictionary notes and excludes a different part of speech', async () => {
  findWordDuplicates.mockResolvedValue({ exactMatches: [], headwordMatches: [{ noteId: 1, lexicalType: 'noun', meaning: 'существительное' }, { noteId: 2, lexicalType: 'verb', meaning: 'идти' }] })
  findVerbLemmaDuplicates.mockResolvedValue({ exactMatches: [] })
  findVerbSentenceDuplicates.mockResolvedValue({ exactMatches: [] })
  findNotesByQuery.mockImplementation(async query => query.startsWith('tag:') ? [3] : [4])
  getNotesInfo.mockImplementation(async ids => [{ noteId: 3, tags: ['mode-verb-dictionary'], fields: { Front: { value: 'geh' }, Back: { value: '<b>иди</b>' } } }, { noteId: 4, tags: [], fields: { Front: { value: '<b>gehen</b>' }, Back: { value: 'ходить' } } }].filter(note => ids.includes(note.noteId)))
  expect(await lookupExisting({ canonical: 'gehen', lemma: 'gehen', lexicalType: 'verb' })).toEqual([{ noteId: 2, meaning: 'идти' }, { noteId: 3, meaning: 'иди' }, { noteId: 4, meaning: 'ходить' }])
  expect(findNotesByQuery).toHaveBeenCalledWith('tag:mode-verb-dictionary tag:lemma-gehen')
})

test('uses legacy sentence and cloze content when stored meaning is missing', async () => {
  findWordDuplicates.mockResolvedValue({ exactMatches: [], headwordMatches: [{ noteId: 42, lexicalType: 'adverb', meaning: null }, { noteId: 43, lexicalType: 'adverb', meaning: null }] })
  getNotesInfo.mockResolvedValue([{ noteId: 42, tags: ['mode-word-sentence'], fields: { Back: { value: '<div>Das ist sehr gut.</div><div>Это очень хорошо.</div>' } } }, { noteId: 43, tags: ['mode-lexical-cloze'], fields: { Text: { value: 'Das ist {{c1::sehr::очень}} gut.' }, 'Back Extra': { value: 'очень' } } }])
  expect(await lookupExisting({ canonical: 'sehr', lexicalType: 'adverb' })).toEqual([
    { noteId: 42, meaning: expect.stringContaining('Это очень хорошо.') },
    { noteId: 43, meaning: expect.stringContaining('очень') },
  ])
})

test('checks both the requested adjective form and its lemma and deduplicates notes', async () => {
  findWordDuplicates.mockReset().mockImplementation(async ({ canonical }) => ({
    exactMatches: [], headwordMatches: canonical === 'gut'
      ? [{ noteId: 91, lexicalType: 'adjective', meaning: 'хороший' }, { noteId: 93, lexicalType: 'adjective', meaning: 'добрый' }]
      : [{ noteId: 92, lexicalType: 'adjective', meaning: 'лучший' }, { noteId: 91, lexicalType: 'adjective', meaning: 'хороший' }],
  }))
  getNotesInfo.mockReset()
  expect(await lookupExisting({ canonical: 'besten', lemma: 'gut', lexicalType: 'adjective' })).toEqual([
    { noteId: 92, meaning: 'лучший' }, { noteId: 91, meaning: 'хороший' }, { noteId: 93, meaning: 'добрый', sourceForm: 'gut' },
  ])
  expect(findWordDuplicates.mock.calls.map(([arg]) => arg.canonical)).toEqual(['besten', 'gut'])
})

test('does not repeat the same lookup if the form equals its lemma', async () => {
  findWordDuplicates.mockReset().mockResolvedValue({ exactMatches: [], headwordMatches: [] })
  await lookupExisting({ canonical: 'gut', lemma: 'gut', lexicalType: 'adjective' })
  expect(findWordDuplicates).toHaveBeenCalledTimes(1)
})

test('does not make collection-based recommendations when lemma lookup fails', async () => {
  findWordDuplicates.mockReset().mockImplementation(async ({ canonical }) => {
    if (canonical === 'gut') throw new Error('Anki unavailable')
    return { exactMatches: [], headwordMatches: [] }
  })
  const { buildMeaningGuidance } = await import('../src/meaningSelection.js')
  const assess = jest.fn()
  const result = await buildMeaningGuidance({ word: { canonical: 'besten', lemma: 'gut', lexicalType: 'adjective', meanings: [{ russian: 'лучший' }, { russian: 'наилучший' }] }, assess })
  expect(result.collectionAvailable).toBe(false)
  expect(result.recommendedIndex).toBeNull()
  expect(assess).not.toHaveBeenCalled()
})
