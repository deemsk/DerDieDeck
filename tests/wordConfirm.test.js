import { jest } from "@jest/globals"
import { chooseMeaning, chooseWordSentence, formatWordDictionarySummary, showWordDictionarySummary } from "../src/wordConfirm.js"

describe("word confirmation helpers", () => {
  test("formats a short dictionary summary before sentence selection", () => {
    expect(formatWordDictionarySummary({
      canonical: "über",
      lemma: "über",
      lexicalType: "preposition",
      ipa: "[ˈyːbɐ]",
      meanings: [{ russian: "над; через; о", english: "above; across; about" }],
      patternHint: "Предлог с Akkusativ или Dativ в зависимости от значения.",
    })).toBe([
      "über · предлог",
      "Значение: над; через; о",
      "IPA: [ˈyːbɐ]",
      "Грамматика: Предлог с Akkusativ или Dativ в зависимости от значения.",
    ].join("\n"))
  })

  test("includes noun plural information in the dictionary summary", () => {
    expect(formatWordDictionarySummary({
      canonical: "das Wasser",
      lemma: "Wasser",
      lexicalType: "noun",
      meanings: [{ russian: "вода" }],
      noPlural: true,
    })).toContain("Множественное число: обычно без множественного числа")
  })

  test("renders the dictionary summary as a compact framed block", () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {})

    showWordDictionarySummary({
      canonical: "über",
      lexicalType: "preposition",
      meanings: [{ russian: "над; через; о" }],
      ipa: "[ˈyːbɐ]",
    })

    const output = log.mock.calls.map(([line = ""]) => line).join("\n")
    log.mockRestore()

    expect(output).toContain("┌─ Кратко о слове")
    expect(output).toContain("│  über · предлог")
    expect(output).toContain("└─")
  })

  test("chooseMeaning accepts a preferred gloss even when analysis has no meaning list", async () => {
    const meaning = await chooseMeaning(
      {
        canonical: "gut",
        lemma: "gut",
        lexicalType: "adjective",
        meanings: [],
      },
      "хороший"
    )

    expect(meaning).toEqual(
      expect.objectContaining({
        russian: "хороший",
        english: "gut",
      })
    )
  })

  test("chooseWordSentence auto-builds a fallback sentence for adjectives without examples", async () => {
    const sentence = await chooseWordSentence({
      canonical: "gut",
      lexicalType: "adjective",
      meanings: [{ russian: "хороший", english: "good" }],
      exampleSentences: [],
    })

    expect(sentence).toEqual(
      expect.objectContaining({
        german: "Das ist gut.",
        focusForm: "gut",
      })
    )
  })

  test("chooseWordSentence infers the surface focus form for preferred determiner examples", async () => {
    const sentence = await chooseWordSentence(
      {
        canonical: "kein",
        lemma: "kein",
        lexicalType: "determiner",
        meanings: [{ russian: "никакой", english: "no" }],
        exampleSentences: [],
      },
      "Ich habe keine Zeit."
    )

    expect(sentence).toEqual(
      expect.objectContaining({
        german: "Ich habe keine Zeit.",
        focusForm: "keine",
      })
    )
  })

  test("chooseMeaning can return a blank gloss for sentence-form fallback without prompting", async () => {
    const meaning = await chooseMeaning(
      {
        canonical: "voll",
        lemma: "voll",
        lexicalType: "adjective",
        meanings: [],
      },
      null,
      { allowBlank: true }
    )

    expect(meaning).toEqual(
      expect.objectContaining({
        russian: "",
        english: "voll",
      })
    )
  })
})
