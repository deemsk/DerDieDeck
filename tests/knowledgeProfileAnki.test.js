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
    expect(profile.summary.estimatedLevel).toBe("B1")
    expect(profile.summary.words[0]).toEqual(expect.objectContaining({
      canonical: "sicher",
      meaning: "уверенный",
      lexicalType: "adjective",
      intervalDays: 32,
      reps: 5,
    }))
    expect(profile.fingerprint).toMatch(/^[a-f0-9]{64}$/)
  })
})
