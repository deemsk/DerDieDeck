import { getCuratedFunctionWordAnalysis } from "../src/cardContent/functionWords.js"
import { validateLexicalClozeSentence } from "../src/cardContent/lexicalClozeValidation.js"
import { buildLexicalClozeExtra, buildLexicalClozeText } from "../src/templates/word/lexicalCloze.js"

describe("lexical cloze templates", () => {
  test("curated function words include three cloze-ready examples", () => {
    const words = [
      "aber",
      "wenn",
      "nichts",
      "weil",
      "dass",
      "ob",
      "als",
      "denn",
      "doch",
      "ja",
      "mal",
      "mit",
      "für",
      "ohne",
      "kein",
      "bitte",
    ]

    for (const word of words) {
      const analysis = getCuratedFunctionWordAnalysis(word)

      expect(analysis).toEqual(expect.objectContaining({
        canonical: expect.any(String),
        recommendedMode: "cloze-form",
        isImageable: false,
      }))
      expect(analysis.exampleSentences).toHaveLength(3)
      expect(analysis.exampleSentences.every((sentence) => sentence.focusForm)).toBe(true)
      expect(analysis.exampleSentences.every((sentence) => validateLexicalClozeSentence(sentence, analysis))).toBe(true)
    }
  })

  test("validateLexicalClozeSentence rejects obvious verb-second subordinate clauses", () => {
    const analysis = getCuratedFunctionWordAnalysis("weil")

    expect(validateLexicalClozeSentence(
      { german: "Ich bleibe zu Hause, weil ich bin krank.", focusForm: "weil" },
      analysis
    )).toBe(false)
  })

  test("validateLexicalClozeSentence accepts prepositions, particles, and determiners in context", () => {
    expect(validateLexicalClozeSentence(
      { german: "Ich fahre mit dem Bus.", focusForm: "mit" },
      getCuratedFunctionWordAnalysis("mit")
    )).toBe(true)
    expect(validateLexicalClozeSentence(
      { german: "Komm doch mit.", focusForm: "doch" },
      getCuratedFunctionWordAnalysis("doch")
    )).toBe(true)
    expect(validateLexicalClozeSentence(
      { german: "Ich habe keine Zeit.", focusForm: "keine" },
      getCuratedFunctionWordAnalysis("kein")
    )).toBe(true)
  })

  test("validateLexicalClozeSentence supports non-curated subjunctions and adverb clozes", () => {
    expect(validateLexicalClozeSentence(
      { german: "Ich lerne, damit ich die Prüfung bestehe.", focusForm: "damit" },
      { canonical: "damit", lemma: "damit", lexicalType: "subjunction" }
    )).toBe(true)
    expect(validateLexicalClozeSentence(
      { german: "Ich trinke nie Kaffee.", focusForm: "nie" },
      { canonical: "nie", lemma: "nie", lexicalType: "adverb" }
    )).toBe(true)
  })

  test("buildLexicalClozeText clozes subordinate connectors case-insensitively", () => {
    const text = buildLexicalClozeText(
      { german: "Wenn ich Zeit habe, komme ich.", focusForm: "Wenn" },
      { canonical: "wenn", lexicalType: "subjunction", clozeHint: "subordinate-clause connector" }
    )

    expect(text).toBe("{{c1::Wenn::subordinate-clause connector}} ich Zeit habe, komme ich.")
  })

  test("buildLexicalClozeExtra keeps the sentence out of the extra field", () => {
    const extra = buildLexicalClozeExtra({
      wordData: { canonical: "dass", lemma: "dass", lexicalType: "subjunction" },
      sentenceData: {
        german: "Ich glaube, dass er kommt.",
        ipa: "[ɪç ˈɡlaʊbə das eːɐ̯ kɔmt]",
        russian: "Я думаю, что он придет.",
      },
      selectedMeaning: { russian: "что" },
    })

    expect(extra).not.toContain("Ich glaube")
    expect(extra).toContain("Я думаю, что он придет.")
    expect(extra).toContain("Pattern:")
    expect(extra).toContain("Contrast:")
    expect(extra).toContain("weil/denn/dass")
    expect(extra).toContain("yt2anki-word")
  })
})
