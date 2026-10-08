import { jest } from "@jest/globals"

const mockSyncCollection = jest.fn()
const mockFindNotesByQuery = jest.fn()
const mockGetNotesInfo = jest.fn()
const mockFindCardsByQuery = jest.fn()
const mockGetCardsInfo = jest.fn()

jest.unstable_mockModule("../src/anki.js", () => ({
  syncCollection: mockSyncCollection,
  findNotesByQuery: mockFindNotesByQuery,
  getNotesInfo: mockGetNotesInfo,
  findCardsByQuery: mockFindCardsByQuery,
  getCardsInfo: mockGetCardsInfo,
}))

const { refreshProfileFromAnki } = await import("../src/knowledgeProfile/ankiSnapshot.js")

describe("learner profile Anki snapshot", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("keeps building a local profile when remote sync fails", async () => {
    mockSyncCollection.mockRejectedValue(new Error("sync unavailable"))
    mockFindNotesByQuery.mockResolvedValue([101])
    mockGetNotesInfo.mockResolvedValue([
      {
        noteId: 101,
        modelName: "Basic (optional reversed card)",
        fields: {
          Front: { value: "[sound:sicher.mp3]<br>sicher" },
          Back: {
            value: 'уверенный<!-- yt2anki-word:%7B%22canonical%22%3A%22sicher%22%2C%22meaning%22%3A%22%D1%83%D0%B2%D0%B5%D1%80%D0%B5%D0%BD%D0%BD%D1%8B%D0%B9%22%2C%22lemma%22%3A%22sicher%22%2C%22lexicalType%22%3A%22adjective%22%7D -->',
          },
        },
        tags: ["yt2anki", "mode-word-main", "word-adjective", "cefr-b1"],
      },
    ])
    mockFindCardsByQuery.mockResolvedValue([9001])
    mockGetCardsInfo.mockResolvedValue([
      {
        cardId: 9001,
        note: 101,
        interval: 32,
        reps: 5,
        lapses: 0,
        queue: 2,
      },
    ])

    const profile = await refreshProfileFromAnki({
      query: "tag:yt2anki",
      syncBeforeRefresh: true,
    })

    expect(profile.syncStatus).toBe("failed")
    expect(profile.summary.totalNotes).toBe(1)
    expect(profile.summary.estimatedLevel).toBeUndefined()
    expect(profile.summary.words[0]).toEqual(expect.objectContaining({
      canonical: "sicher",
      state: "familiar",
      meaning: "уверенный",
      lexicalType: "adjective",
      intervalDays: 32,
      reps: 5,
    }))
    expect(profile.fingerprint).toMatch(/^[a-f0-9]{64}$/)
  })
})

async function snapshot(notes, cards) {
  mockFindNotesByQuery.mockResolvedValue(notes.map(n => n.noteId))
  mockGetNotesInfo.mockResolvedValue(notes)
  mockFindCardsByQuery.mockResolvedValue(cards.map(c => c.cardId))
  mockGetCardsInfo.mockResolvedValue(cards)
  return refreshProfileFromAnki({ query: 'tag:yt2anki', syncBeforeRefresh: false })
}
const note = (id, tags, fields = {}) => ({ noteId: id, tags, fields })
const card = (id, noteId, overrides = {}) => ({ cardId: id, note: noteId, queue: 2, interval: 30, reps: 4, ...overrides })

test('ignores arbitrary prose and preserves explicit verb forms', async () => {
  const profile = await snapshot([
    note(1, ['yt2anki'], { Front: { value: 'Listen and understand' }, Back: { value: 'Ich gehe [ɪç]' } }),
    note(2, ['mode-verb-dictionary', 'lemma-gehen', 'form-geh']),
    note(3, ['mode-verb-lemma', 'lemma-gehen']),
    note(4, ['mode-grammar', 'grammar-lemma-mein']),
  ], [card(1, 1), card(2, 2), card(3, 3), card(4, 4)])
  expect(profile.summary.words.map(w => w.canonical)).toEqual(['geh', 'gehen'])
  expect(profile.summary.words[0].lemma).toBe('gehen')
})

test.each([
  ['new', [{ reps: 0, queue: 0 }]],
  ['new', [{ queue: -1 }]],
  ['new', [{ queue: -2 }]],
  ['learning', [{ queue: 1, interval: -600 }]],
  ['learning', [{ reps: 2 }]],
  ['learning', [{ interval: 20 }]],
  ['learning', [{}, { queue: 3, interval: 1 }]],
  ['familiar', [{}, { queue: 0, reps: 0 }]],
  ['familiar', [{}, { queue: -1, interval: 1 }]],
])('classifies %s using individual active reviewed cards: %j', async (state, overrides) => {
  const profile = await snapshot([note(1, ['canonical-Buch', 'word-noun'])], overrides.map((o, i) => card(i + 1, 1, o)))
  expect(profile.summary.words[0].state).toBe(state)
})

test('merging notes does not hide a weak sibling', async () => {
  const profile = await snapshot([note(1, ['canonical-Buch']), note(2, ['canonical-Buch'])], [card(1, 1), card(2, 2, { interval: 1 })])
  expect(profile.summary.words).toHaveLength(1)
  expect(profile.summary.words[0].state).toBe('learning')
})

test('card read failure rejects instead of manufacturing a fresh profile', async () => {
  mockFindNotesByQuery.mockResolvedValue([])
  mockGetNotesInfo.mockResolvedValue([])
  mockFindCardsByQuery.mockRejectedValueOnce(new Error('offline'))
  await expect(refreshProfileFromAnki({ query: 'tag:yt2anki', syncBeforeRefresh: false })).rejects.toThrow('offline')
})

test('recovers umlauts only when Front corroborates an explicit lexical tag', async () => {
  const profile = await snapshot([
    note(1, ['mode-verb-dictionary', 'lemma-anfangen', 'form-anfaengt'], { Front: { value: '[sound:a.mp3]<b>anfängt</b>' } }),
    note(2, ['mode-verb-dictionary', 'lemma-gehen', 'form-geh'], { Front: { value: 'Listen and understand' } }),
  ], [card(1, 1), card(2, 2)])
  expect(profile.summary.words.map(w => w.canonical)).toEqual(['anfängt', 'geh'])
})

test('missing card details reject the entire snapshot', async () => {
  mockFindNotesByQuery.mockResolvedValue([])
  mockFindCardsByQuery.mockResolvedValue([1])
  mockGetCardsInfo.mockResolvedValue([])
  await expect(refreshProfileFromAnki({ query: 'tag:yt2anki', syncBeforeRefresh: false })).rejects.toThrow('Incomplete')
})
