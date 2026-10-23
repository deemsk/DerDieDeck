import { jest } from "@jest/globals"

const mockChooseMeaning = jest.fn(async () => ({
  russian: "довольно",
  english: "quite",
}))

const mockChooseGoogleImage = jest.fn(async () => null)
const mockBuildWordGoogleImagesSearch = jest.fn(() => ({
  query: "ziemlich",
  url: "https://images.google.com/search?tbm=isch&q=ziemlich",
}))

const mockConfirmWordSelection = jest.fn(async () => ({
  confirmed: true,
  personalConnection: null,
}))

const mockCheckConnection = jest.fn(async () => true)
const mockGetNoteTypes = jest.fn(async () => ["2. Picture Words", "Basic (optional reversed card)"])
const mockEnsureDeck = jest.fn(async () => {})
const mockFindWordDuplicates = jest.fn(async () => ({ exactMatches: [], headwordMatches: [] }))
const mockStoreAudio = jest.fn(async () => "ziemlich.mp3")
const mockStoreMedia = jest.fn(async () => "unused.jpg")
const mockCreatePictureWordNote = jest.fn(async () => 123)
const mockGenerateSimpleSpeech = jest.fn(async () => {})
const mockResolveWordPronunciation = jest.fn(async () => ({
  ipa: "[ˈtsiːmlɪç]",
  audioPath: null,
  source: "Wiktionary",
}))
const mockSpinnerFactory = jest.fn(() => ({
  start: jest.fn(),
  succeed: jest.fn(),
  stop: jest.fn(),
  warn: jest.fn(),
  fail: jest.fn(),
}))

jest.unstable_mockModule("ora", () => ({
  default: mockSpinnerFactory,
}))

jest.unstable_mockModule("../src/wordConfirm.js", () => ({
  chooseGoogleImage: mockChooseGoogleImage,
  chooseMeaning: mockChooseMeaning,
  chooseWordSentence: jest.fn(),
  confirmSentenceWordSelection: jest.fn(),
  confirmWordSelection: mockConfirmWordSelection,
  showWordDictionarySummary: jest.fn(),
}))

jest.unstable_mockModule("../src/anki.js", () => ({
  checkConnection: mockCheckConnection,
  createBasicNote: jest.fn(),
  createClozeNote: jest.fn(),
  createNote: jest.fn(),
  createPictureWordNote: mockCreatePictureWordNote,
  ensureDeck: mockEnsureDeck,
  findLexicalClozeDuplicates: jest.fn(),
  findSimilarCards: jest.fn(),
  findSentenceWordDuplicates: jest.fn(),
  findWordDuplicates: mockFindWordDuplicates,
  findCardsByQuery: jest.fn(),
  findNotesByQuery: jest.fn(),
  getCardsInfo: jest.fn(),
  getNotesInfo: jest.fn(),
  getNoteTypes: mockGetNoteTypes,
  storeAudio: mockStoreAudio,
  storeMedia: mockStoreMedia,
  syncCollection: jest.fn(),
}))

jest.unstable_mockModule("../src/lib/tts.js", () => ({
  generateSimpleSpeech: mockGenerateSimpleSpeech,
  generateSpeech: jest.fn(),
}))

jest.unstable_mockModule("../src/lib/wordSources.js", () => ({
  buildWordGoogleImagesSearch: mockBuildWordGoogleImagesSearch,
  resolveImageAsset: jest.fn(),
  resolveWordPronunciation: mockResolveWordPronunciation,
}))

jest.unstable_mockModule("../src/wordEnricher.js", () => ({
  canProceedWithWeakWordCard: jest.fn(() => false),
  enrichWord: jest.fn(),
  hasStructuredWordAnalysis: jest.fn(() => true),
}))

jest.unstable_mockModule("../src/enricher.js", () => ({
  enrich: jest.fn(),
  reviewEnrichedText: jest.fn(),
}))

jest.unstable_mockModule("../src/lexicalClozeEnricher.js", () => ({
  prepareCompactClozeHint: jest.fn(async (_sentence, word) => word.meanings[0].russian),
  generateUnambiguousLexicalClozeSentence: jest.fn(),
  verifyLexicalClozeUniqueness: jest.fn(async () => ({ valid: true, unique: true, answer: "" })),
}))

jest.unstable_mockModule("../src/cardContent/cefr.js", () => ({
  estimateLexicalCEFR: jest.fn(async () => null),
}))

const mockPrepareNounExample = jest.fn()
jest.unstable_mockModule("../src/wordExampleEnricher.js", () => ({ prepareNounExample: mockPrepareNounExample }))

const { runWordWorkflow } = await import("../src/wordMode.js")

describe("word mode picture flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("runWordWorkflow can create a picture-word note without an image", async () => {
    const added = await runWordWorkflow("ziemlich", {
      learnerProfileContext: false,
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: true,
        recommendedMode: "picture-word",
        lexicalType: "adjective",
        canonical: "ziemlich",
        lemma: "ziemlich",
        meanings: [{ russian: "довольно", english: "quite" }],
        exampleSentences: [],
      },
      meaning: "довольно",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)
    expect(mockConfirmWordSelection).toHaveBeenCalledWith(expect.objectContaining({
      imageChoice: null,
      showImage: false,
    }))
    expect(mockConfirmWordSelection.mock.invocationCallOrder[0]).toBeLessThan(
      mockChooseGoogleImage.mock.invocationCallOrder[0]
    )
    expect(mockBuildWordGoogleImagesSearch).toHaveBeenCalledWith(
      expect.objectContaining({ canonical: "ziemlich" }),
      expect.objectContaining({ russian: "довольно" })
    )
    expect(mockChooseGoogleImage).toHaveBeenCalled()
    expect(mockStoreMedia).not.toHaveBeenCalled()
    expect(mockStoreAudio).toHaveBeenCalled()
    expect(mockCreatePictureWordNote).toHaveBeenCalledWith(expect.objectContaining({
      canonical: "ziemlich",
      imageFilename: null,
      imageSource: "none",
      deck: "German::Test",
    }))
  })
})

const schatzAnalysis = () => ({
  shouldCreateWordCard: true, isImageable: true, recommendedMode: 'picture-word',
  lexicalType: 'noun', canonical: 'der Schatz', lemma: 'Schatz', gender: 'm', plural: 'Schätze',
  meanings: [{ russian: 'клад' }, { russian: 'дорогой / дорогая' }],
  exampleSentences: [{ german: 'Die Kinder finden einen Schatz.', russian: 'Дети находят клад.' }],
})
test('Schatz preview and saved card use the same example for the chosen affectionate sense', async () => {
  jest.clearAllMocks()
  const selected = { russian: 'дорогой / дорогая' }
  const example = { german: 'Schatz, komm bitte her.', russian: 'Дорогой, подойди, пожалуйста.', focusForm: 'Schatz' }
  mockChooseMeaning.mockResolvedValue(selected)
  mockPrepareNounExample.mockResolvedValue(example)
  await runWordWorkflow('Schatz', { learnerProfileContext: false, analysisResult: schatzAnalysis(), deck: 'German::Test' })
  expect(mockPrepareNounExample).toHaveBeenCalledWith(expect.objectContaining({ selectedMeaning: selected }))
  expect(mockConfirmWordSelection.mock.calls[0][0].wordData.exampleSentences).toEqual([example])
  const extra = mockCreatePictureWordNote.mock.calls[0][0].extraInfoField
  expect(extra).toContain(example.german)
  expect(extra).toContain(example.russian)
  expect(extra).not.toContain('Die Kinder finden')
})
test('failed noun example validation prevents preview, audio and note creation', async () => {
  jest.clearAllMocks()
  mockPrepareNounExample.mockRejectedValue(new Error('Wrong sense'))
  await expect(runWordWorkflow('Schatz', { learnerProfileContext: false, analysisResult: schatzAnalysis() })).rejects.toThrow('Wrong sense')
  expect(mockConfirmWordSelection).not.toHaveBeenCalled()
  expect(mockGenerateSimpleSpeech).not.toHaveBeenCalled()
  expect(mockCreatePictureWordNote).not.toHaveBeenCalled()
})
