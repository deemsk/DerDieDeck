import { jest } from "@jest/globals"
import { analyzeLexicalCandidates, chooseLexicalRouteFromAnalyses, normalizeLexicalInput } from "../src/lexicalMode.js"

describe("lexical mode router", () => {
  test("normalizeLexicalInput joins variadic command parts into one lexical item", () => {
    expect(normalizeLexicalInput(["das", "Wasser"])).toBe("das Wasser")
    expect(normalizeLexicalInput([])).toBe("")
  })

  test("chooseLexicalRouteFromAnalyses routes noun/adjective inputs automatically", () => {
    const result = chooseLexicalRouteFromAnalyses(
      {
        lexicalType: "noun",
        canonical: "das Wasser",
        shouldCreateWordCard: true,
        meanings: [{ russian: "вода" }],
      },
      {
        infinitive: "",
        shouldCreateVerbCard: false,
        meanings: [],
      }
    )

    expect(result).toEqual(
      expect.objectContaining({
        route: "word",
        reason: "word-only",
      })
    )
  })

  test("chooseLexicalRouteFromAnalyses routes adverb inputs through the word workflow", () => {
    const result = chooseLexicalRouteFromAnalyses(
      {
        lexicalType: "adverb",
        canonical: "sofort",
        lemma: "sofort",
        shouldCreateWordCard: false,
        exampleSentences: [{ german: "Komm sofort.", russian: "Иди немедленно." }],
      },
      {
        infinitive: "",
        shouldCreateVerbCard: false,
        meanings: [],
      }
    )

    expect(result).toEqual(
      expect.objectContaining({
        route: "word",
        reason: "word-only",
      })
    )
  })

  test("chooseLexicalRouteFromAnalyses routes function words through the word workflow", () => {
    const result = chooseLexicalRouteFromAnalyses(
      {
        lexicalType: "conjunction",
        canonical: "aber",
        lemma: "aber",
        shouldCreateWordCard: true,
        recommendedMode: "cloze-form",
        meanings: [{ russian: "но" }],
      },
      {
        infinitive: "",
        shouldCreateVerbCard: false,
        meanings: [],
      }
    )

    expect(result).toEqual(
      expect.objectContaining({
        route: "word",
        reason: "word-only",
      })
    )
  })

  test("chooseLexicalRouteFromAnalyses routes verb inputs automatically", () => {
    const result = chooseLexicalRouteFromAnalyses(
      {
        lexicalType: "noun",
        canonical: "laufen",
        shouldCreateWordCard: false,
        meanings: [],
      },
      {
        infinitive: "laufen",
        displayForm: "laufen",
        shouldCreateVerbCard: true,
        meanings: [{ russian: "бежать" }],
      }
    )

    expect(result).toEqual(
      expect.objectContaining({
        route: "verb",
        reason: "verb-only",
      })
    )
  })

  test("chooseLexicalRouteFromAnalyses marks both plausible analyses as ambiguous", () => {
    const result = chooseLexicalRouteFromAnalyses(
      {
        lexicalType: "adjective",
        canonical: "offen",
        lemma: "offen",
        shouldCreateWordCard: true,
        meanings: [{ russian: "открытый" }],
      },
      {
        infinitive: "offen",
        displayForm: "offen",
        shouldCreateVerbCard: true,
        meanings: [{ russian: "раскрывать" }],
      }
    )

    expect(result).toEqual(
      expect.objectContaining({
        route: null,
        reason: "both-plausible",
      })
    )
  })

  test("chooseLexicalRouteFromAnalyses marks both weak analyses as ambiguous", () => {
    const result = chooseLexicalRouteFromAnalyses(
      {
        lexicalType: "noun",
        canonical: "xyz",
        shouldCreateWordCard: false,
        meanings: [],
      },
      {
        infinitive: "",
        shouldCreateVerbCard: false,
        meanings: [],
      }
    )

    expect(result).toEqual(
      expect.objectContaining({
        route: null,
        reason: "both-weak",
      })
    )
  })

  test("a confident utility route runs only the matching expensive analysis", async () => {
    const analyzeWord = jest.fn(async () => ({
      lexicalType: "preposition",
      canonical: "über",
      shouldCreateWordCard: true,
      meanings: [{ russian: "над" }],
    }))
    const analyzeVerb = jest.fn()

    const result = await analyzeLexicalCandidates("über", {
      route: "word",
      confidence: 0.98,
    }, { analyzeWord, analyzeVerb })

    expect(result.route).toBe("word")
    expect(analyzeWord).toHaveBeenCalledTimes(1)
    expect(analyzeVerb).not.toHaveBeenCalled()
  })

  test("an uncertain route preserves the two-analysis fallback", async () => {
    const analyzeWord = jest.fn(async () => ({ shouldCreateWordCard: false }))
    const analyzeVerb = jest.fn(async () => ({
      infinitive: "laufen",
      displayForm: "laufen",
      shouldCreateVerbCard: true,
      meanings: [{ russian: "бежать" }],
    }))

    const result = await analyzeLexicalCandidates("laufen", {
      route: "verb",
      confidence: 0.6,
    }, { analyzeWord, analyzeVerb })

    expect(result.route).toBe("verb")
    expect(analyzeWord).toHaveBeenCalledTimes(1)
    expect(analyzeVerb).toHaveBeenCalledTimes(1)
  })

  test("a weak confident route checks the other analysis before giving up", async () => {
    const analyzeWord = jest.fn(async () => ({ shouldCreateWordCard: false }))
    const analyzeVerb = jest.fn(async () => ({
      infinitive: "gehen",
      displayForm: "geht",
      shouldCreateVerbCard: true,
      meanings: [{ russian: "идти" }],
    }))

    const result = await analyzeLexicalCandidates("geht", {
      route: "word",
      confidence: 0.95,
    }, { analyzeWord, analyzeVerb })

    expect(result.route).toBe("verb")
    expect(analyzeWord).toHaveBeenCalledTimes(1)
    expect(analyzeVerb).toHaveBeenCalledTimes(1)
  })
})
