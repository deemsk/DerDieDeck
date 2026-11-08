import { jest } from "@jest/globals"

const mockPrepareContextualImageSearch = jest.fn(async ({ target }) => ({ query: target }))
jest.unstable_mockModule('../src/contextualImageSearch.js', () => ({ prepareContextualImageSearch: mockPrepareContextualImageSearch, senseSpecificFallback: m => m.imageSearchTerms?.[0] || m.english || '' }))

const mockChooseMeaning = jest.fn(async () => ({
  russian: "большой",
  english: "big",
}))

const mockChooseWordSentence = jest.fn(async () => ({
  german: "Das Haus ist groß.",
  russian: "Дом большой.",
  focusForm: "groß",
}))

const mockChooseGoogleImage = jest.fn(async () => ({
  type: "remote-url",
  source: "Google Images",
  url: "https://example.com/gross.jpg",
}))

const mockConfirmSentenceWordSelection = jest.fn(async () => ({
  confirmed: true,
}))
const mockConfirmChangedClozeExample = jest.fn(async () => true)
const mockShowWordDictionarySummary = jest.fn()

const mockCheckConnection = jest.fn(async () => true)
const mockGetNoteTypes = jest.fn(async () => ["2. Picture Words", "Basic (optional reversed card)"])
const mockEnsureDeck = jest.fn(async () => {})
const mockFindSentenceWordDuplicates = jest.fn(async () => ({ exactMatches: [], headwordMatches: [] }))
const mockFindLexicalClozeDuplicates = jest.fn(async () => ({ exactMatches: [], headwordMatches: [] }))
const mockFindSimilarCards = jest.fn(async () => [])
const mockStoreAudio = jest.fn(async (path = "") =>
  String(path).includes("word_sentence") ? "word-sentence.mp3" : "word-target.mp3"
)
const mockStoreMedia = jest.fn(async () => "word-sentence-image.jpg")
const mockCreateBasicNote = jest.fn(async () => 789)
const mockCreateClozeNote = jest.fn(async () => 456)
const mockCreateNote = jest.fn(async () => 123)
const mockGenerateSimpleSpeech = jest.fn(async () => {})
const mockGenerateSpeech = jest.fn(async () => {})
const mockResolveWordPronunciation = jest.fn(async () => ({
  ipa: "[ɡʁoːs]",
  audioPath: "/tmp/gross-human.mp3",
  source: "Wiktionary/Wikimedia",
}))
const mockResolveImageAsset = jest.fn(async () => "/tmp/gross.jpg")
const mockBuildWordGoogleImagesSearch = jest.fn(() => ({
  query: "großes Haus",
  url: "https://images.google.com/search?tbm=isch&q=gro%C3%9Fes+Haus",
  queryVariants: ["großes Haus"],
}))
const mockReviewEnrichedText = jest.fn()
const mockVerifyLexicalClozeUniqueness = jest.fn()
const mockGenerateUnambiguousLexicalClozeSentence = jest.fn()
const mockExplainLexicalCloze = jest.fn()
const mockEnrich = jest.fn(async () => ({
  german: "Das Haus ist groß.",
  ipa: "[das haʊs ɪst ɡʁoːs]",
  russian: "Дом большой.",
  cefr: { level: "A1" },
}))
const mockSpinnerFactory = jest.fn(() => ({
  start: jest.fn(),
  succeed: jest.fn(),
  stop: jest.fn(),
  warn: jest.fn(),
  fail: jest.fn(),
}))

jest.unstable_mockModule("../src/noteSetService.js", () => ({
  startWordNoteSet: async (steps) => {
    const saved = []
    try {
      for (const step of steps) {
        saved.push(await (step.kind === 'basic' ? mockCreateBasicNote(step.payload) : mockCreateNote(step.payload)))
      }
      return { steps: saved.map(noteId => ({ noteId })) }
    } catch (error) {
      const failure = new Error(`Saved: ${saved.map(id => `nid:${id}`).join(', ')}. ${error.message}`)
      failure.code = 'partial-note-write'
      throw failure
    }
  },
}))

jest.unstable_mockModule("ora", () => ({
  default: mockSpinnerFactory,
}))

jest.unstable_mockModule("../src/wordConfirm.js", () => ({
  chooseGoogleImage: mockChooseGoogleImage,
  chooseMeaning: mockChooseMeaning,
  chooseWordSentence: mockChooseWordSentence,
  confirmSentenceWordSelection: mockConfirmSentenceWordSelection,
  confirmChangedClozeExample: mockConfirmChangedClozeExample,
  confirmWordSelection: jest.fn(),
  showWordDictionarySummary: mockShowWordDictionarySummary,
}))

jest.unstable_mockModule("../src/anki.js", () => ({
  checkConnection: mockCheckConnection,
  createBasicNote: mockCreateBasicNote,
  createClozeNote: mockCreateClozeNote,
  createNote: mockCreateNote,
  createPictureWordNote: jest.fn(),
  ensureDeck: mockEnsureDeck,
  findLexicalClozeDuplicates: mockFindLexicalClozeDuplicates,
  findCardsByQuery: jest.fn(),
  findSimilarCards: mockFindSimilarCards,
  findSentenceWordDuplicates: mockFindSentenceWordDuplicates,
  findNotesByQuery: jest.fn(),
  findWordDuplicates: jest.fn(),
  getCardsInfo: jest.fn(),
  getNotesInfo: jest.fn(),
  getNoteTypes: mockGetNoteTypes,
  storeAudio: mockStoreAudio,
  storeMedia: mockStoreMedia,
  syncCollection: jest.fn(),
}))

jest.unstable_mockModule("../src/lib/tts.js", () => ({
  generateSimpleSpeech: mockGenerateSimpleSpeech,
  generateSpeech: mockGenerateSpeech,
}))

jest.unstable_mockModule("../src/lib/wordSources.js", () => ({
  buildWordGoogleImagesSearch: mockBuildWordGoogleImagesSearch,
  resolveImageAsset: mockResolveImageAsset,
  resolveWordPronunciation: mockResolveWordPronunciation,
}))

jest.unstable_mockModule("../src/wordEnricher.js", () => ({
  canProceedWithWeakWordCard: jest.fn(() => false),
  enrichWord: jest.fn(async (_input, options) => options.analysisResult),
  hasStructuredWordAnalysis: jest.fn(() => true),
}))

jest.unstable_mockModule("../src/enricher.js", () => ({
  enrich: mockEnrich,
  reviewEnrichedText: mockReviewEnrichedText,
}))

jest.unstable_mockModule("../src/lexicalClozeEnricher.js", () => ({
  assessClozeSynonyms: jest.fn(async () => null),
  prepareCompactClozeHint: jest.fn(async (_sentence, word) => word.meanings[0].russian),
  generateUnambiguousLexicalClozeSentence: mockGenerateUnambiguousLexicalClozeSentence,
  verifyLexicalClozeUniqueness: mockVerifyLexicalClozeUniqueness,
}))

jest.unstable_mockModule("../src/lexicalRuleEnricher.js", () => ({
  explainLexicalCloze: mockExplainLexicalCloze,
}))

jest.unstable_mockModule("../src/cardContent/cefr.js", () => ({
  estimateLexicalCEFR: jest.fn(async () => null),
}))

const { enrichWord: mockProfiledWord } = await import("../src/wordEnricher.js")
const mockReviewWordDuplicates = jest.fn(async duplicates => duplicates.exactMatches.length ? 'skip' : 'new')
jest.unstable_mockModule('../src/wordDuplicateReview.js', () => ({ reviewWordDuplicates: mockReviewWordDuplicates }))
const mockReviewClozeAlternatives = jest.fn(async () => ({ action: 'skip' }))
jest.unstable_mockModule('../src/clozeAlternativeReview.js', () => ({ reviewClozeAlternatives: mockReviewClozeAlternatives }))
const mockPrepareAdjectiveForm = jest.fn()
const mockValidateAdjectiveFormSentence = jest.fn(async () => {})
jest.unstable_mockModule('../src/adjectiveFormEnricher.js', () => ({
  prepareAdjectiveForm: mockPrepareAdjectiveForm,
  validateAdjectiveFormSentence: mockValidateAdjectiveFormSentence,
}))
const mockReviewExamplePair = jest.fn(async () => ({ valid: true, reason: '' }))
jest.unstable_mockModule('../src/exampleReview.js', () => ({ reviewExamplePair: mockReviewExamplePair }))
const { runWordWorkflow } = await import("../src/wordMode.js")

describe("word mode sentence flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockExplainLexicalCloze.mockReset().mockResolvedValue("В этом примере союз связывает две части; после него сохраняется прямой порядок слов.")
    mockChooseMeaning.mockResolvedValue({
      russian: "большой",
      english: "big",
    })
    mockFindLexicalClozeDuplicates.mockResolvedValue({ exactMatches: [], headwordMatches: [] })
    mockCreateClozeNote.mockResolvedValue(456)
    mockResolveWordPronunciation.mockResolvedValue({
      ipa: "[ɡʁoːs]",
      audioPath: "/tmp/gross-human.mp3",
      source: "Wiktionary/Wikimedia",
    })
    mockChooseWordSentence.mockResolvedValue({
      german: "Das Haus ist groß.",
      russian: "Дом большой.",
      focusForm: "groß",
    })
    mockChooseGoogleImage.mockResolvedValue({
      type: "remote-url",
      source: "Google Images",
      url: "https://example.com/gross.jpg",
    })
    mockConfirmSentenceWordSelection.mockResolvedValue({
      confirmed: true,
    })
    mockShowWordDictionarySummary.mockReset()
    mockBuildWordGoogleImagesSearch.mockReturnValue({
      query: "großes Haus",
      url: "https://images.google.com/search?tbm=isch&q=gro%C3%9Fes+Haus",
      queryVariants: ["großes Haus"],
    })
    mockReviewEnrichedText.mockReset()
    mockVerifyLexicalClozeUniqueness.mockResolvedValue({ valid: true, unique: true, answer: "test" })
    mockGenerateUnambiguousLexicalClozeSentence.mockReset()
    mockEnrich.mockResolvedValue({
      german: "Das Haus ist groß.",
      ipa: "[das haʊs ɪst ɡʁoːs]",
      russian: "Дом большой.",
      cefr: { level: "A1" },
    })
  })

  function prepareJe() {
    const sentence = { german: "Je mehr du übst, desto besser wirst du.", russian: "Чем больше ты тренируешься, тем лучше становишься.", focusForm: "Je" }
    mockChooseMeaning.mockResolvedValue({ russian: "чем" })
    mockChooseWordSentence.mockResolvedValue(sentence)
    mockEnrich.mockResolvedValue({ ...sentence, ipa: "[jeː]" })
    return { analysisResult: { canonical: "je", lemma: "je", lexicalType: "adverb", recommendedMode: "cloze-form",
      shouldCreateWordCard: true, isImageable: false, meanings: [{ russian: "чем" }], exampleSentences: [sentence] }, skipHeader: true }
  }

  test('asks before saving a cloze whose selected German example changed during enrichment', async () => {
    const options = prepareJe()
    mockEnrich.mockResolvedValue({ german: 'Je mehr du liest, desto besser verstehst du.', russian: 'Чем больше ты читаешь, тем лучше понимаешь.', ipa: '[jeː]' })
    mockConfirmChangedClozeExample.mockResolvedValueOnce(false)
    expect(await runWordWorkflow('je', options)).toBe(false)
    expect(mockConfirmChangedClozeExample).toHaveBeenCalledTimes(1)
    expect(mockVerifyLexicalClozeUniqueness).toHaveBeenCalledTimes(2)
    expect(mockCreateClozeNote).not.toHaveBeenCalled()
    expect(mockStoreAudio).not.toHaveBeenCalled()
  })

  test("previews the exact contextual rule during dry-run without Anki writes", async () => {
    const options = prepareJe()
    const hint = "je … desto … — чем …, тем …; в je mehr du übst глагол стоит в конце."
    mockExplainLexicalCloze.mockResolvedValue(hint)
    const log = jest.spyOn(console, "log").mockImplementation(() => {})
    try {
      expect(await runWordWorkflow("je", { ...options, dryRun: true })).toBe(true)
      expect(log.mock.calls.flat().join("\n")).toContain(hint)
      expect(mockStoreAudio).not.toHaveBeenCalled()
      expect(mockCreateClozeNote).not.toHaveBeenCalled()
    } finally { log.mockRestore() }
  })

  test("intentional null omits the saved rule without a fallback", async () => {
    const options = prepareJe()
    mockExplainLexicalCloze.mockResolvedValue(null)
    await runWordWorkflow("je", options)
    expect(mockCreateClozeNote.mock.calls[0][0].extra).not.toContain("Правило:")
  })

  test("explanation failure is recoverable and writes neither notes nor media", async () => {
    const options = prepareJe()
    mockExplainLexicalCloze.mockRejectedValue(new Error("offline"))
    await expect(runWordWorkflow("je", options)).rejects.toMatchObject({ code: "cloze-explanation-failed" })
    expect(mockCreateClozeNote).not.toHaveBeenCalled()
    expect(mockStoreAudio).not.toHaveBeenCalled()
  })

  test("prepared mixed-route analysis receives progress context", async () => {
    const options = prepareJe()
    mockChooseWordSentence.mockResolvedValue(null)
    await runWordWorkflow("je", { ...options, learnerProfileContext: "Familiar vocabulary: Buch." })
    expect(mockProfiledWord).toHaveBeenCalledWith("je", expect.objectContaining({
      learnerProfileContext: "Familiar vocabulary: Buch.", analysisResult: options.analysisResult,
    }))
  })

  test("dismissed sentence does not prepare explanations or write a note", async () => {
    const options = prepareJe()
    mockChooseWordSentence.mockResolvedValue(null)
    expect(await runWordWorkflow("je", options)).toBe(false)
    expect(mockExplainLexicalCloze).not.toHaveBeenCalled()
    expect(mockCreateClozeNote).not.toHaveBeenCalled()
  })

  test("runWordWorkflow renders adjective contrast separately instead of auto context text", async () => {
    const added = await runWordWorkflow("groß", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        recommendedMode: "sentence-form",
        lexicalType: "adjective",
        canonical: "groß",
        lemma: "groß",
        opposite: "klein",
        meanings: [{ russian: "большой", english: "big" }],
        exampleSentences: [{ german: "Das Haus ist groß.", russian: "Дом большой." }],
      },
      meaning: "большой",
      sentence: "Das Haus ist groß.",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)
    expect(mockConfirmSentenceWordSelection).toHaveBeenCalledWith(expect.objectContaining({
      imageChoice: null,
      showImage: false,
    }))
    expect(mockConfirmSentenceWordSelection.mock.invocationCallOrder[0]).toBeLessThan(
      mockChooseGoogleImage.mock.invocationCallOrder[0]
    )
    expect(mockCreateNote).toHaveBeenCalledWith(expect.objectContaining({
      german: "Das Haus ist groß.",
      imageFilename: "word-sentence-image.jpg",
      addReversed: false,
      deck: "German::Test",
    }))
    expect(mockCreateBasicNote).toHaveBeenCalledWith(expect.objectContaining({
      front: expect.stringContaining("[sound:word-target.mp3]"),
      back: expect.stringContaining("большой"),
      addReversed: true,
      deck: "German::Test",
      tags: expect.arrayContaining([
        "mode-word-main",
        "word-adjective",
        "lemma-gross",
        "canonical-gross",
        "intent-word-main",
        "trains-meaning-recall",
        "trains-active-production",
      ]),
    }))
    expect(mockCreateBasicNote.mock.calls[0][0].front).toContain("groß")
    expect(mockResolveWordPronunciation).toHaveBeenCalledWith(expect.objectContaining({
      canonical: "groß",
      lexicalType: "adjective",
    }), expect.any(Object))
    expect(mockGenerateSimpleSpeech).not.toHaveBeenCalled()

    const payload = mockCreateNote.mock.calls[0][0]
    expect(payload.context).toBeUndefined()
    expect(payload.frontFooterHtml).toContain("Различие")
    expect(payload.frontFooterHtml).toContain("klein")
    expect(mockShowWordDictionarySummary).toHaveBeenCalledWith(expect.objectContaining({ canonical: "groß" }))
  })

  test("runWordWorkflow creates sentence-form adverb notes with a main word card", async () => {
    mockChooseMeaning.mockResolvedValue({
      russian: "сразу",
      english: "immediately",
    })
    mockChooseWordSentence.mockResolvedValue({
      german: "Komm sofort.",
      russian: "Иди немедленно.",
      focusForm: "sofort",
    })
    mockEnrich.mockResolvedValue({
      german: "Komm sofort.",
      ipa: "[kɔm zɔˈfɔʁt]",
      russian: "Иди немедленно.",
      cefr: { level: "A1" },
    })

    const added = await runWordWorkflow("sofort", {
      analysisResult: {
        shouldCreateWordCard: false,
        isImageable: false,
        recommendedMode: "sentence-form",
        lexicalType: "adverb",
        canonical: "sofort",
        lemma: "sofort",
        meanings: [{ russian: "сразу", english: "immediately" }],
        exampleSentences: [{ german: "Komm sofort.", russian: "Иди немедленно." }],
      },
      meaning: "сразу",
      sentence: "Komm sofort.",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)

    const payload = mockCreateNote.mock.calls.at(-1)[0]
    expect(payload.german).toBe("Komm sofort.")
    expect(payload.metadata.lexicalType).toBe("adverb")
    expect(payload.tags).toContain("word-adverb")
    expect(payload.frontFooterHtml).toBe(null)
    expect(mockCreateBasicNote).toHaveBeenCalledWith(expect.objectContaining({
      front: expect.stringContaining("[sound:word-target.mp3]"),
      back: expect.stringContaining("сразу"),
      addReversed: true,
      deck: "German::Test",
      tags: expect.arrayContaining([
        "mode-word-main",
        "word-adverb",
        "lemma-sofort",
        "canonical-sofort",
        "intent-word-main",
      ]),
    }))
  })

  test("runWordWorkflow creates cloze notes for lexical function words", async () => {
    mockChooseMeaning.mockResolvedValue({
      russian: "но",
      english: "but",
    })
    mockChooseWordSentence.mockResolvedValue({
      german: "Ich bin müde, aber ich komme.",
      russian: "Я устал, но я приду.",
      focusForm: "aber",
    })
    mockEnrich.mockResolvedValue({
      german: "Ich bin müde, aber ich komme.",
      ipa: "[ɪç bɪn ˈmyːdə ˈaːbɐ ɪç ˈkɔmə]",
      russian: "Я устал, но я приду.",
      cefr: { level: "A1" },
    })

    const added = await runWordWorkflow("aber", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        imageabilityReason: "function word; learned through sentence context",
        recommendedMode: "cloze-form",
        lexicalType: "conjunction",
        canonical: "aber",
        lemma: "aber",
        clozeHint: "contrast connector",
        meanings: [{ russian: "но", english: "but" }],
        exampleSentences: [{ german: "Ich bin müde, aber ich komme.", russian: "Я устал, но я приду.", focusForm: "aber" }],
      },
      meaning: "но",
      sentence: "Ich bin müde, aber ich komme.",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)
    expect(mockCreateNote).not.toHaveBeenCalled()
    expect(mockBuildWordGoogleImagesSearch).not.toHaveBeenCalled()
    expect(mockCreateBasicNote).not.toHaveBeenCalled()
    expect(mockCreateClozeNote).toHaveBeenCalledWith(expect.objectContaining({
      text: "[sound:word-sentence.mp3]<br>Ich bin müde, {{c1::aber::но}} ich komme.",
      deck: "German::Test",
      tags: expect.arrayContaining([
        "mode-lexical-cloze",
        "word-conjunction",
        "lemma-aber",
        "canonical-aber",
        "intent-lexical-cloze",
        "trains-function-word-recall",
        "trains-grammar-pattern",
        "trains-sound-map",
      ]),
    }))
    expect(mockCreateClozeNote.mock.calls[0][0].extra).toContain("yt2anki-word")
    expect(mockCreateClozeNote.mock.calls[0][0].extra).toContain("Правило:")
    expect(mockCreateClozeNote.mock.calls[0][0].extra).toContain("В этом примере союз связывает две части")
    expect(mockCreateClozeNote.mock.calls[0][0].extra).toContain("Я устал, но я приду.")
  })

  test("selects the cloze meaning with spinner stopped before checking uniqueness", async () => {
    const selected = { russian: "довольно", english: "rather" }
    mockChooseMeaning.mockImplementationOnce(async () => {
      const spinner = mockSpinnerFactory.mock.results.at(-1).value
      expect(spinner.stop).toHaveBeenCalled()
      expect(mockVerifyLexicalClozeUniqueness).not.toHaveBeenCalled()
      return selected
    })
    mockChooseWordSentence.mockResolvedValue({ german: "Das ist recht teuer.", russian: "Это довольно дорого.", focusForm: "recht" })
    mockEnrich.mockResolvedValue({ german: "Das ist recht teuer.", russian: "Это довольно дорого.", ipa: "[ipa]" })
    mockVerifyLexicalClozeUniqueness.mockResolvedValueOnce({ valid: false, reason: "More context needed" }).mockResolvedValue({ valid: true })
    mockGenerateUnambiguousLexicalClozeSentence.mockResolvedValue({ german: "Das ist recht teuer.", russian: "Это довольно дорого.", focusForm: "recht" })
    await runWordWorkflow("recht", { dryRun: true, analysisResult: {
      shouldCreateWordCard: true, isImageable: false, recommendedMode: "cloze-form",
      canonical: "recht", lemma: "recht", lexicalType: "adverb", clozeHint: "наречие степени",
      meanings: [selected, { russian: "быть правым" }],
    } })
    expect(mockChooseMeaning).toHaveBeenCalledTimes(1)
    expect(mockGenerateUnambiguousLexicalClozeSentence).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ meanings: [selected] }), expect.anything())
    expect(mockVerifyLexicalClozeUniqueness).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      meanings: [selected], clozeHint: "довольно",
    }))
  })

  test("rewrites an AI cloze when more than one answer fits the learner-visible front", async () => {
    mockChooseMeaning.mockResolvedValue({ russian: "ему", english: "him, to him" })
    mockChooseWordSentence.mockResolvedValue({
      german: "Sie glaubt ihm nicht.",
      russian: "Она ему не верит.",
      focusForm: "ihm",
    })
    mockVerifyLexicalClozeUniqueness
      .mockResolvedValueOnce({ valid: false, unique: false, answer: "" })

      .mockResolvedValueOnce({ valid: true, unique: true, answer: "ihm" })
    mockGenerateUnambiguousLexicalClozeSentence.mockResolvedValue({
      german: "Der Mann sagt die Wahrheit, aber sie glaubt ihm nicht.",
      russian: "Мужчина говорит правду, но она ему не верит.",
      focusForm: "ihm",
    })
    mockEnrich.mockResolvedValue({
      german: "Der Mann sagt die Wahrheit, aber sie glaubt ihm nicht.",
      ipa: "[deːɐ̯ man zaːkt diː ˈvaːɐ̯haɪ̯t ˈaːbɐ ziː ɡlaʊ̯pt iːm nɪçt]",
      russian: "Мужчина говорит правду, но она ему не верит.",
      cefr: { level: "A2" },
    })

    const added = await runWordWorkflow("ihm", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        recommendedMode: "cloze-form",
        lexicalType: "pronoun",
        canonical: "ihm",
        lemma: "ihm",
        clozeHint: "dative pronoun",
        meanings: [{ russian: "ему", english: "him, to him" }],
        exampleSentences: [{ german: "Sie glaubt ihm nicht.", russian: "Она ему не верит.", focusForm: "ihm" }],
      },
      meaning: "ему",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)
    expect(mockVerifyLexicalClozeUniqueness).toHaveBeenCalledTimes(2)
    expect(mockGenerateUnambiguousLexicalClozeSentence).toHaveBeenCalledTimes(1)
    expect(mockExplainLexicalCloze).toHaveBeenCalledWith(expect.objectContaining({
      sentence: "Der Mann sagt die Wahrheit, aber sie glaubt ihm nicht.",
      target: "ihm",
    }))
    expect(mockCreateClozeNote).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Der Mann sagt die Wahrheit, aber sie glaubt {{c1::ihm::ему}} nicht."),
    }))
  })

  test("keeps repairing an ambiguous cloze until an independent check accepts it", async () => {
    mockChooseMeaning.mockResolvedValue({ russian: "на это", english: "on it" })
    mockChooseWordSentence.mockResolvedValue({
      german: "Ich denke darauf.",
      russian: "Я думаю об этом.",
      focusForm: "darauf",
    })
    mockVerifyLexicalClozeUniqueness
      .mockResolvedValueOnce({
        valid: false,
        unique: false,
        answer: "",
        alternatives: ["daran", "darüber"],
        reason: "Several pronominal adverbs fit.",
      })

      .mockResolvedValueOnce({
        valid: false,
        unique: false,
        answer: "",
        alternatives: ["daran"],
        reason: "The governing construction is still unclear.",
      })
      .mockResolvedValueOnce({
        valid: true,
        unique: true,
        answer: "darauf",
        alternatives: [],
        reason: "warten auf selects darauf.",
      })
    mockGenerateUnambiguousLexicalClozeSentence
      .mockResolvedValueOnce({
        german: "Ich freue mich darauf, dass du kommst.",
        russian: "Я рад, что ты придёшь.",
        focusForm: "darauf",
        clozeHint: "на это; местоименное наречие",
      })
      .mockResolvedValueOnce({
        german: "Wir warten darauf, dass der Zug endlich kommt.",
        russian: "Мы ждём, когда наконец придёт поезд.",
        focusForm: "darauf",
        clozeHint: "ждать этого; местоименное наречие",
      })
    mockEnrich.mockResolvedValue({
      german: "Wir warten darauf, dass der Zug endlich kommt.",
      ipa: "[viːɐ̯ ˈvaʁtn̩ daˈʁaʊ̯f das deːɐ̯ tsuːk ˈɛntlɪç kɔmt]",
      russian: "Мы ждём, когда наконец придёт поезд.",
      cefr: { level: "B1" },
    })

    const added = await runWordWorkflow("darauf", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        recommendedMode: "cloze-form",
        lexicalType: "adverb",
        canonical: "darauf",
        lemma: "darauf",
        clozeHint: "местоименное наречие",
        meanings: [{ russian: "на это", english: "on it" }],
        exampleSentences: [{ german: "Ich denke darauf.", russian: "Я думаю об этом.", focusForm: "darauf" }],
      },
      meaning: "на это",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)
    expect(mockGenerateUnambiguousLexicalClozeSentence).toHaveBeenCalledTimes(2)
    expect(mockGenerateUnambiguousLexicalClozeSentence.mock.calls[1][2]).toEqual({
      diagnosis: expect.objectContaining({
        alternatives: ["daran"],
        reason: "The governing construction is still unclear.",
      }),
      attempt: 2,
    })
    expect(mockCreateClozeNote).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Wir warten {{c1::darauf::на это}}, dass der Zug endlich kommt."),
    }))
  })

  test("repairs an initial cloze sentence that does not contain the target", async () => {
    mockChooseMeaning.mockResolvedValue({ russian: "на это", english: "on it" })
    mockChooseWordSentence.mockResolvedValue({
      german: "Ich denke daran.",
      russian: "Я думаю об этом.",
      focusForm: "daran",
    })
    mockGenerateUnambiguousLexicalClozeSentence.mockResolvedValue({
      german: "Wir warten darauf, dass der Zug kommt.",
      russian: "Мы ждём, когда придёт поезд.",
      focusForm: "darauf",
      clozeHint: "ждать этого",
    })
    mockVerifyLexicalClozeUniqueness.mockResolvedValue({
      valid: true,
      unique: true,
      answer: "darauf",
      alternatives: [],
      reason: "warten auf selects darauf.",
    })
    mockEnrich.mockResolvedValue({
      german: "Wir warten darauf, dass der Zug kommt.",
      ipa: "[viːɐ̯ ˈvaʁtn̩ daˈʁaʊ̯f das deːɐ̯ tsuːk kɔmt]",
      russian: "Мы ждём, когда придёт поезд.",
      cefr: { level: "A2" },
    })

    const added = await runWordWorkflow("darauf", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        recommendedMode: "cloze-form",
        lexicalType: "adverb",
        canonical: "darauf",
        lemma: "darauf",
        clozeHint: "местоименное наречие",
        meanings: [{ russian: "на это", english: "on it" }],
        exampleSentences: [],
      },
      meaning: "на это",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)
    expect(mockGenerateUnambiguousLexicalClozeSentence).toHaveBeenCalledTimes(1)
    expect(mockVerifyLexicalClozeUniqueness).toHaveBeenCalledTimes(1)
    expect(mockCreateClozeNote).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Wir warten {{c1::darauf"),
    }))
  })

  test("reports a recoverable error after three failed cloze repairs without creating an ambiguous note", async () => {
    mockChooseWordSentence.mockResolvedValue({
      german: "Ich denke darauf.",
      russian: "Я думаю об этом.",
      focusForm: "darauf",
    })
    mockVerifyLexicalClozeUniqueness.mockResolvedValue({
      valid: false,
      unique: false,
      answer: "",
      alternatives: ["daran", "darüber"],
      reason: "Several pronominal adverbs still fit.",
    })
    mockGenerateUnambiguousLexicalClozeSentence.mockResolvedValue({
      german: "Ich denke darauf.",
      russian: "Я думаю об этом.",
      focusForm: "darauf",
      clozeHint: "местоименное наречие",
    })

    const result = runWordWorkflow("darauf", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        recommendedMode: "cloze-form",
        lexicalType: "adverb",
        canonical: "darauf",
        lemma: "darauf",
        clozeHint: "местоименное наречие",
        meanings: [{ russian: "на это", english: "on it" }],
        exampleSentences: [{ german: "Ich denke darauf.", russian: "Я думаю об этом.", focusForm: "darauf" }],
      },
      meaning: "на это",
      deck: "German::Test",
      skipHeader: true,
    })

    await expect(result).rejects.toThrow('Could not build an unambiguous cloze for "darauf"')
    expect(mockGenerateUnambiguousLexicalClozeSentence).toHaveBeenCalledTimes(3)
    expect(mockVerifyLexicalClozeUniqueness).toHaveBeenCalledTimes(4)
    expect(mockCreateClozeNote).not.toHaveBeenCalled()
  })

  test("uses an invalid rewrite as feedback for the next cloze repair", async () => {
    mockChooseMeaning.mockResolvedValue({ russian: "над", english: "above" })
    mockChooseWordSentence.mockResolvedValue({
      german: "Das Bild hängt über dem Sofa.",
      russian: "Картина висит над диваном.",
      focusForm: "über",
    })
    mockVerifyLexicalClozeUniqueness
      .mockResolvedValueOnce({
        valid: false,
        unique: false,
        answer: "",
        alternatives: ["hinter", "neben"],
        reason: "Several spatial prepositions fit.",
      })

      .mockResolvedValueOnce({
        valid: true,
        unique: true,
        answer: "über",
        alternatives: [],
        reason: "The construction selects über.",
      })
    mockGenerateUnambiguousLexicalClozeSentence
      .mockResolvedValueOnce({
        german: "Das Bild hängt oberhalb des Sofas.",
        russian: "Картина висит над диваном.",
        focusForm: "über",
        clozeHint: "над чем-либо, Dativ",
      })
      .mockResolvedValueOnce({
        german: "Wir sprechen über das Wetter.",
        russian: "Мы говорим о погоде.",
        focusForm: "über",
        clozeHint: "говорить о чём-либо, Akkusativ",
      })
    mockEnrich.mockResolvedValue({
      german: "Wir sprechen über das Wetter.",
      ipa: "[viːɐ̯ ˈʃpʁɛçn̩ ˈyːbɐ das ˈvɛtɐ]",
      russian: "Мы говорим о погоде.",
      cefr: { level: "A2" },
    })

    const added = await runWordWorkflow("über", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        recommendedMode: "cloze-form",
        lexicalType: "preposition",
        canonical: "über",
        lemma: "über",
        clozeHint: "предлог с Akkusativ или Dativ",
        meanings: [{ russian: "над; о; через", english: "above; about; across" }],
        exampleSentences: [{ german: "Das Bild hängt über dem Sofa.", russian: "Картина висит над диваном.", focusForm: "über" }],
      },
      meaning: "над",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)
    expect(mockGenerateUnambiguousLexicalClozeSentence).toHaveBeenCalledTimes(2)
    expect(mockGenerateUnambiguousLexicalClozeSentence.mock.calls[1][0]).toEqual(
      expect.objectContaining({ german: "Das Bild hängt oberhalb des Sofas." })
    )
    expect(mockCreateClozeNote).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Wir sprechen {{c1::über::над}} das Wetter."),
    }))
  })

  test("runWordWorkflow creates cloze notes for non-curated LLM-classified connectors", async () => {
    mockChooseMeaning.mockResolvedValue({
      russian: "чтобы",
      english: "so that",
    })
    mockChooseWordSentence.mockResolvedValue({
      german: "Ich lerne, damit ich die Prüfung bestehe.",
      russian: "Я учусь, чтобы сдать экзамен.",
      focusForm: "damit",
    })
    mockEnrich.mockResolvedValue({
      german: "Ich lerne, damit ich die Prüfung bestehe.",
      ipa: "[ɪç ˈlɛʁnə daˈmɪt ɪç diː ˈpʁyːfʊŋ bəˈʃteːə]",
      russian: "Я учусь, чтобы сдать экзамен.",
      cefr: { level: "A2" },
    })

    const added = await runWordWorkflow("damit", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        imageabilityReason: "connector learned through sentence context",
        recommendedMode: "cloze-form",
        lexicalType: "subjunction",
        canonical: "damit",
        lemma: "damit",
        clozeHint: "so that + subordinate clause",
        meanings: [{ russian: "чтобы", english: "so that" }],
        exampleSentences: [{ german: "Ich lerne, damit ich die Prüfung bestehe.", russian: "Я учусь, чтобы сдать экзамен.", focusForm: "damit" }],
      },
      meaning: "чтобы",
      sentence: "Ich lerne, damit ich die Prüfung bestehe.",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)
    expect(mockCreateClozeNote).toHaveBeenCalledWith(expect.objectContaining({
      text: "[sound:word-sentence.mp3]<br>Ich lerne, {{c1::damit::чтобы}} ich die Prüfung bestehe.",
      tags: expect.arrayContaining([
        "mode-lexical-cloze",
        "word-subjunction",
        "lemma-damit",
      ]),
    }))
  })

  test("runWordWorkflow honors cloze-form for non-curated adverbs", async () => {
    mockChooseMeaning.mockResolvedValue({
      russian: "никогда",
      english: "never",
    })
    mockChooseWordSentence.mockResolvedValue({
      german: "Ich trinke nie Kaffee.",
      russian: "Я никогда не пью кофе.",
      focusForm: "nie",
    })
    mockEnrich.mockResolvedValue({
      german: "Ich trinke nie Kaffee.",
      ipa: "[ɪç ˈtʁɪŋkə niː ˈkafeː]",
      russian: "Я никогда не пью кофе.",
      cefr: { level: "A1" },
    })

    const added = await runWordWorkflow("nie", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        imageabilityReason: "frequency adverb learned through sentence context",
        recommendedMode: "cloze-form",
        lexicalType: "adverb",
        canonical: "nie",
        lemma: "nie",
        clozeHint: "frequency adverb",
        meanings: [{ russian: "никогда", english: "never" }],
        exampleSentences: [{ german: "Ich trinke nie Kaffee.", russian: "Я никогда не пью кофе.", focusForm: "nie" }],
      },
      meaning: "никогда",
      sentence: "Ich trinke nie Kaffee.",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)
    expect(mockCreateClozeNote).toHaveBeenCalledWith(expect.objectContaining({
      text: "[sound:word-sentence.mp3]<br>Ich trinke {{c1::nie::никогда}} Kaffee.",
      tags: expect.arrayContaining([
        "mode-lexical-cloze",
        "word-adverb",
        "lemma-nie",
      ]),
    }))
  })

  test("runWordWorkflow skips lexical cloze duplicates before enriching the sentence", async () => {
    mockChooseMeaning.mockResolvedValue({
      russian: "ничего",
      english: "nothing",
    })
    mockChooseWordSentence.mockResolvedValue({
      german: "Ich sehe nichts.",
      russian: "Я ничего не вижу.",
      focusForm: "nichts",
    })
    mockFindLexicalClozeDuplicates.mockResolvedValue({
      exactMatches: [{ noteId: 99, canonical: "nichts", meaning: "ничего" }],
      headwordMatches: [],
    })

    const added = await runWordWorkflow("nichts", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        recommendedMode: "cloze-form",
        lexicalType: "pronoun",
        canonical: "nichts",
        lemma: "nichts",
        meanings: [{ russian: "ничего", english: "nothing" }],
        exampleSentences: [{ german: "Ich sehe nichts.", russian: "Я ничего не вижу.", focusForm: "nichts" }],
      },
      meaning: "ничего",
      sentence: "Ich sehe nichts.",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(false)
    expect(mockEnrich).not.toHaveBeenCalled()
    expect(mockCreateClozeNote).not.toHaveBeenCalled()
  })

  test("sentence review waits to search images until final approval", async () => {
    mockConfirmSentenceWordSelection
      .mockResolvedValueOnce({ reviewFeedback: "Use coffee instead." })
      .mockResolvedValueOnce({ confirmed: true })
    mockReviewEnrichedText.mockResolvedValue({
      german: "Der Kaffee ist groß.",
      ipa: "[deːɐ̯ ˈkafeː ɪst ɡʁoːs]",
      russian: "Кофе большой.",
      cefr: { level: "A1" },
    })

    const added = await runWordWorkflow("groß", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        recommendedMode: "sentence-form",
        lexicalType: "adjective",
        canonical: "groß",
        lemma: "groß",
        opposite: "klein",
        meanings: [{ russian: "большой", english: "big" }],
        exampleSentences: [{ german: "Das Haus ist groß.", russian: "Дом большой." }],
      },
      meaning: "большой",
      sentence: "Das Haus ist groß.",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)
    expect(mockReviewEnrichedText).toHaveBeenCalledWith(
      expect.objectContaining({ german: "Das Haus ist groß." }),
      "Use coffee instead.",
      expect.not.objectContaining({ includeImageBrief: true })
    )
    expect(mockPrepareContextualImageSearch).toHaveBeenCalledTimes(1)
    expect(mockPrepareContextualImageSearch).toHaveBeenCalledWith(expect.objectContaining({
      example: expect.objectContaining({ german: 'Der Kaffee ist groß.' }), fallbackQuery: 'Der Kaffee ist groß.',
    }))
    expect(mockChooseGoogleImage).toHaveBeenCalledTimes(1)
    expect(mockConfirmSentenceWordSelection.mock.invocationCallOrder[1]).toBeLessThan(
      mockChooseGoogleImage.mock.invocationCallOrder[0]
    )

    const payload = mockCreateNote.mock.calls.at(-1)[0]
    expect(payload.german).toBe("Der Kaffee ist groß.")
    expect(payload.imageFilename).toBe("word-sentence-image.jpg")
  })

  test("translation-only sentence review still searches images after final approval", async () => {
    mockConfirmSentenceWordSelection
      .mockResolvedValueOnce({ reviewFeedback: "Improve the Russian only." })
      .mockResolvedValueOnce({ confirmed: true })
    mockReviewEnrichedText.mockResolvedValue({
      german: "Das Haus ist groß.",
      ipa: "[das haʊs ɪst ɡʁoːs]",
      russian: "Этот дом большой.",
      cefr: { level: "A1" },
    })

    const added = await runWordWorkflow("groß", {
      analysisResult: {
        shouldCreateWordCard: true,
        isImageable: false,
        recommendedMode: "sentence-form",
        lexicalType: "adjective",
        canonical: "groß",
        lemma: "groß",
        opposite: "klein",
        meanings: [{ russian: "большой", english: "big" }],
        exampleSentences: [{ german: "Das Haus ist groß.", russian: "Дом большой." }],
      },
      meaning: "большой",
      sentence: "Das Haus ist groß.",
      deck: "German::Test",
      skipHeader: true,
    })

    expect(added).toBe(true)
    expect(mockPrepareContextualImageSearch).toHaveBeenCalledTimes(1)
    expect(mockChooseGoogleImage).toHaveBeenCalledTimes(1)
    expect(mockConfirmSentenceWordSelection.mock.invocationCallOrder[1]).toBeLessThan(
      mockChooseGoogleImage.mock.invocationCallOrder[0]
    )

    const payload = mockCreateNote.mock.calls.at(-1)[0]
    expect(payload.german).toBe("Das Haus ist groß.")
    expect(payload.russian).toBe("Этот дом большой.")
    expect(payload.imageFilename).toBe("word-sentence-image.jpg")
  })
})

test('ganz existing picture meaning can add only a sentence without a second main card', async () => {
  jest.clearAllMocks()
  mockReviewWordDuplicates.mockResolvedValueOnce('example')
  mockFindSentenceWordDuplicates.mockResolvedValueOnce({ exactMatches: [], headwordMatches: [{ noteId: 42, canonical: 'ganz', meaning: 'целый, весь; взятый полностью' }] })
  mockChooseMeaning.mockResolvedValue({ russian: 'целый, весь (полностью взятый)' })
  mockChooseWordSentence.mockResolvedValue({ german: 'Ich esse den ganzen Kuchen.', russian: 'Я съедаю весь торт.', focusForm: 'ganzen' })
  mockEnrich.mockResolvedValue({ german: 'Ich esse den ganzen Kuchen.', russian: 'Я съедаю весь торт.', ipa: '[ipa]' })
  await runWordWorkflow('ganz', { learnerProfileContext: false, analysisResult: {
    shouldCreateWordCard: true, isImageable: false, recommendedMode: 'sentence-form',
    canonical: 'ganz', lemma: 'ganz', lexicalType: 'adjective', meanings: [{ russian: 'целый, весь' }],
  }, deck: 'German::Test' })
  expect(mockReviewWordDuplicates).toHaveBeenCalledWith(expect.objectContaining({ headwordMatches: [expect.objectContaining({ noteId: 42 })] }), { sentence: true })
  expect(mockCreateBasicNote).not.toHaveBeenCalled()
  expect(mockResolveWordPronunciation).not.toHaveBeenCalled()
  expect(mockCreateNote).toHaveBeenCalledTimes(1)
})

test('Deshalb verifies and saves the same compact hint without the full definition', async () => {
  jest.clearAllMocks()
  const { prepareCompactClozeHint } = await import('../src/lexicalClozeEnricher.js')
  prepareCompactClozeHint.mockResolvedValueOnce('поэтому')
  const sentence = { german: 'Der Zug fiel aus. Deshalb nahm Anna den Bus.', russian: 'Поезд отменили. Поэтому Анна поехала на автобусе.', focusForm: 'Deshalb' }
  const meaning = 'поэтому, по этой причине (следствие ранее названной причины)'
  mockChooseMeaning.mockResolvedValue({ russian: meaning })
  mockChooseWordSentence.mockResolvedValue(sentence)
  mockEnrich.mockResolvedValue({ ...sentence, ipa: '[ipa]' })
  mockVerifyLexicalClozeUniqueness.mockReset().mockResolvedValue({ valid: true })
  mockFindLexicalClozeDuplicates.mockResolvedValue({ exactMatches: [], headwordMatches: [] })
  await runWordWorkflow('deshalb', { learnerProfileContext: false, analysisResult: {
    shouldCreateWordCard: true, isImageable: false, recommendedMode: 'cloze-form',
    canonical: 'deshalb', lemma: 'deshalb', lexicalType: 'adverb', meanings: [{ russian: meaning }],
    clozeHint: 'Поэтому, по этой причине; нейтральное наречие следствия с компонентом половина.',
  }, deck: 'German::Test' })
  expect(mockVerifyLexicalClozeUniqueness.mock.calls[0][1].clozeHint).toBe('поэтому')
  const saved = mockCreateClozeNote.mock.calls[0][0].text
  expect(saved).toContain('{{c1::Deshalb::поэтому}}')
  expect(saved).not.toContain('половина')
  expect(saved).not.toContain('следствие ранее')
})

test.each(['sentence', 'skip', 'edit'])('niemals synonym ambiguity supports %s without reanalysis', async action => {
  jest.clearAllMocks()
  const { assessClozeSynonyms } = await import('../src/lexicalClozeEnricher.js')
  assessClozeSynonyms.mockResolvedValueOnce(['nie'])
  mockReviewClozeAlternatives.mockResolvedValueOnce({ action, german: 'Das mache ich niemals.' })
  const sentence = { german: 'Er kommt niemals zu spät.', russian: 'Он никогда не опаздывает.', focusForm: 'niemals' }
  mockChooseMeaning.mockResolvedValue({ russian: 'никогда' })
  mockChooseWordSentence.mockReset().mockResolvedValueOnce(sentence).mockResolvedValue({ ...sentence, german: 'Das mache ich niemals.' })
  mockEnrich.mockResolvedValue({ ...sentence, ipa: '[ipa]' })
  mockVerifyLexicalClozeUniqueness.mockReset().mockResolvedValueOnce({ valid: false, unique: false, alternatives: ['nie', 'niemals'] }).mockResolvedValue({ valid: true })
  mockFindSentenceWordDuplicates.mockResolvedValue({ exactMatches: [], headwordMatches: [] })
  mockFindLexicalClozeDuplicates.mockResolvedValue({ exactMatches: [], headwordMatches: [] })
  await runWordWorkflow('niemals', { learnerProfileContext: false, analysisResult: {
    shouldCreateWordCard: true, isImageable: false, recommendedMode: 'cloze-form',
    canonical: 'niemals', lemma: 'niemals', lexicalType: 'adverb', meanings: [{ russian: 'никогда' }],
  }, deck: 'German::Test' })
  expect(mockProfiledWord).not.toHaveBeenCalled()
  expect(mockGenerateUnambiguousLexicalClozeSentence).not.toHaveBeenCalled()
  expect(mockCreateBasicNote).not.toHaveBeenCalled()
  if (action === 'sentence') {
    expect(mockCreateClozeNote).not.toHaveBeenCalled()
    expect(mockCreateNote).toHaveBeenCalledTimes(1)
    expect(mockConfirmSentenceWordSelection.mock.calls[0][0].chosenSentence).toEqual(sentence)
  } else if (action === 'skip') {
    expect(mockCreateClozeNote).not.toHaveBeenCalled()
    expect(mockCreateNote).not.toHaveBeenCalled()
    expect(mockGenerateSimpleSpeech).not.toHaveBeenCalled()
  } else {
    expect(mockChooseWordSentence.mock.calls[1][1]).toBe('Das mache ich niemals.')
    expect(mockVerifyLexicalClozeUniqueness).toHaveBeenCalledTimes(3)
  }
})

test.each([['besten', 'gut', 'лучший'], ['festen', 'fest', 'твёрдый']])('requested adjective %s stays on Front and uses form pronunciation', async (form, lemma, meaning) => {
  jest.clearAllMocks()
  const example = { german: form === 'besten' ? 'Ich nehme den besten Kuchen.' : 'Ich brauche einen festen Plan.', russian: 'Проверенный перевод.', focusForm: form }
  const formData = { canonical: form, lemma, requestedForm: form, lexicalType: 'adjective',
    recommendedMode: 'sentence-form', shouldCreateWordCard: true, isImageable: false,
    meanings: [{ russian: 'другое значение' }, { russian: meaning }], patternHint: 'Проверенная грамматика формы.', ipa: '', exampleSentences: [example] }
  mockPrepareAdjectiveForm.mockResolvedValue(formData)
  mockChooseMeaning.mockResolvedValue({ russian: meaning })
  mockChooseWordSentence.mockResolvedValue(example)
  mockEnrich.mockResolvedValue({ ...example, ipa: '[ipa]' })
  mockFindSentenceWordDuplicates.mockResolvedValue({ exactMatches: [], headwordMatches: [] })
  await runWordWorkflow(form, { learnerProfileContext: false, analysisResult: {
    canonical: lemma, lemma, lexicalType: 'adjective', recommendedMode: 'sentence-form',
    shouldCreateWordCard: true, isImageable: false, meanings: [{ russian: 'значение леммы' }],
  }, deck: 'German::Test' })
  expect(mockShowWordDictionarySummary).toHaveBeenCalledWith(expect.objectContaining({ canonical: form, lemma, requestedForm: form }))
  expect(mockChooseWordSentence.mock.calls[0][0].exampleSentences).toEqual([example])
  expect(mockValidateAdjectiveFormSentence).toHaveBeenCalledWith(expect.objectContaining({ german: example.german }), expect.objectContaining({ meanings: [{ russian: meaning }] }))
  expect(mockFindSentenceWordDuplicates.mock.calls[0][0].canonical).toBe(form)
  expect(mockResolveWordPronunciation).toHaveBeenCalledWith(expect.objectContaining({ canonical: form, lemma: form }), expect.any(Object))
  const saved = mockCreateBasicNote.mock.calls[0][0]
  expect(saved.front).toContain(`>${form}<`)
  expect(saved.back).toContain(meaning)
  expect(saved.back).toContain(formData.patternHint)
  expect(saved.back).toContain(lemma)
  expect(saved.addReversed).toBe(false)
})
test('manual adjective example using the lemma is blocked before enrichment/audio/saving', async () => {
  jest.clearAllMocks()
  mockPrepareAdjectiveForm.mockResolvedValue({ canonical: 'besten', lemma: 'gut', requestedForm: 'besten', lexicalType: 'adjective',
    shouldCreateWordCard: true, recommendedMode: 'sentence-form', meanings: [{ russian: 'лучший' }] })
  mockChooseWordSentence.mockResolvedValue({ german: 'Das ist gut.', russian: 'Это хорошо.' })
  mockFindSentenceWordDuplicates.mockResolvedValue({ exactMatches: [], headwordMatches: [] })
  await expect(runWordWorkflow('besten', { learnerProfileContext: false, analysisResult: { canonical: 'gut', lemma: 'gut', lexicalType: 'adjective' } })).rejects.toThrow('besten')
  expect(mockEnrich).not.toHaveBeenCalled()
  expect(mockGenerateSimpleSpeech).not.toHaveBeenCalled()
  expect(mockCreateBasicNote).not.toHaveBeenCalled()
})

test('reports a saved word note when the following sentence write has an uncertain outcome', async () => {
  jest.clearAllMocks()
  mockChooseMeaning.mockResolvedValue({ russian: 'сразу', english: 'immediately' })
  mockChooseWordSentence.mockResolvedValue({ german: 'Komm sofort.', russian: 'Иди немедленно.', focusForm: 'sofort' })
  mockEnrich.mockResolvedValue({ german: 'Komm sofort.', ipa: '[kɔm]', russian: 'Иди немедленно.' })
  mockCreateNote.mockRejectedValueOnce(new Error('connection lost'))
  await expect(runWordWorkflow('sofort', {
    learnerProfileContext: false, meaning: 'сразу', sentence: 'Komm sofort.', skipHeader: true,
    analysisResult: { shouldCreateWordCard: false, isImageable: false, recommendedMode: 'sentence-form', lexicalType: 'adverb', canonical: 'sofort', lemma: 'sofort', meanings: [{ russian: 'сразу' }], exampleSentences: [{ german: 'Komm sofort.', russian: 'Иди немедленно.' }] },
  })).rejects.toMatchObject({ code: 'partial-note-write', message: expect.stringContaining('nid:789') })
  expect(mockCreateBasicNote).toHaveBeenCalledTimes(1)
  expect(mockCreateNote).toHaveBeenCalledTimes(1)
  expect(mockSpinnerFactory.mock.results[0].value.fail).toHaveBeenCalledWith(expect.stringContaining('nid:789'))
})

test('rejects a sentence whose Russian translation fails bilingual review', async () => {
  mockReviewExamplePair.mockResolvedValueOnce({ valid: false, reason: 'Wrong translation' })
  await expect(runWordWorkflow('groß', { learnerProfileContext: false, meaning: 'большой', sentence: 'Das Haus ist groß.', skipHeader: true, analysisResult: {
    shouldCreateWordCard: true, isImageable: false, recommendedMode: 'sentence-form', lexicalType: 'adjective', canonical: 'groß', lemma: 'groß', meanings: [{ russian: 'большой' }], exampleSentences: [{ german: 'Das Haus ist groß.', russian: 'Дом большой.', focusForm: 'groß' }],
  } })).rejects.toThrow('Wrong translation')
})
test('does not reuse the old Russian translation after a changed review omits it', async () => {
  jest.clearAllMocks()
  mockChooseMeaning.mockResolvedValueOnce({ russian: 'большой' })
  mockChooseWordSentence.mockResolvedValueOnce({ german: 'Das Haus ist groß.', russian: 'Дом большой.', focusForm: 'groß' })
  mockEnrich.mockResolvedValueOnce({ german: 'Das Haus ist groß.', russian: 'Дом большой.', ipa: '[ipa]' })
  mockConfirmSentenceWordSelection.mockResolvedValueOnce({ reviewFeedback: 'Change the subject' })
  mockReviewEnrichedText.mockResolvedValueOnce({ german: 'Der Kaffee ist groß.', russian: '', ipa: '[ipa]' })
  await expect(runWordWorkflow('groß', { learnerProfileContext: false, meaning: 'большой', skipHeader: true,
    analysisResult: { shouldCreateWordCard: true, isImageable: false, recommendedMode: 'sentence-form', lexicalType: 'adjective', canonical: 'groß', lemma: 'groß', meanings: [{ russian: 'большой' }], exampleSentences: [] },
  })).rejects.toThrow(/translation/i)
  expect(mockCreateNote).not.toHaveBeenCalled()
})
