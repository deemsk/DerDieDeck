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
      "über · prep",
      "Meaning: над; через; о",
      "IPA: [ˈyːbɐ]",
      "Grammar: Предлог с Akkusativ или Dativ в зависимости от значения.",
    ].join("\n"))
  })

  test("includes noun plural information in the dictionary summary", () => {
    expect(formatWordDictionarySummary({
      canonical: "das Wasser",
      lemma: "Wasser",
      lexicalType: "noun",
      meanings: [{ russian: "вода" }],
      noPlural: true,
    })).toContain("Plural: usually no plural")
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

    expect(output).toContain("┌─ Word summary")
    expect(output).toContain("│  über · prep")
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


test('verb form summary labels lemma meaning and pronunciation explicitly', () => {
  expect(formatWordDictionarySummary({
    canonical: 'ging', lemma: 'gehen', lexicalType: 'verb', ipa: '[ˈɡeːən]',
    meanings: [{ russian: 'идти' }],
  })).toBe(['ging · verb', 'Infinitive: gehen', 'Infinitive meaning: идти', 'Infinitive IPA: [ˈɡeːən]'].join('\n'))
})

test('meaning selector shows compact statuses and explains recommendation on request', async () => {
  const ask = jest.fn().mockResolvedValueOnce('i').mockResolvedValueOnce('')
  const log = jest.fn()
  const meanings = [{ russian: 'клад' }, { russian: 'дорогой' }]
  const guidance = { options: [{ meaning: meanings[0], status: 'existing', noteIds: [123] }, { meaning: meanings[1], status: 'unknown', noteIds: [] }], recommendedIndex: 1, collectionAvailable: true, reason: 'The first meaning is already in Anki.', assessmentAvailable: true }
  expect(await chooseMeaning({ canonical: 'der Schatz', meanings }, null, { ask, log, guidance })).toEqual(meanings[1])
  const output = log.mock.calls.flat().join('\n')
  expect(output).toContain('✓ In Anki')
  expect(output).toContain('★ Recommended')
  expect(output).toContain('nid:123')
  expect(output).toContain('The first meaning is already in Anki.')
})
test('no confident recommendation requires an explicit choice and supports skip', async () => {
  const ask = jest.fn().mockResolvedValueOnce('').mockResolvedValueOnce('s')
  const meanings = [{ russian: 'клад' }, { russian: 'дорогой' }]
  const guidance = { options: meanings.map(meaning => ({ meaning, status: 'unknown', noteIds: [] })), recommendedIndex: null, collectionAvailable: false, reason: null }
  expect(await chooseMeaning({ canonical: 'Schatz', meanings }, null, { ask, log: jest.fn(), guidance })).toBeNull()
  expect(ask).toHaveBeenCalledTimes(2)
})
test('a merged choice can be expanded to select an original meaning unchanged', async () => {
  const originals = [{ russian: 'клад', english: 'treasure' }, { russian: 'сокровище', english: 'valuable object' }, { russian: 'дорогой', english: 'darling' }]
  const guidance = { options: [{ meaning: { russian: 'клад; сокровище' }, status: 'unknown', noteIds: [] }, { meaning: originals[2], status: 'unknown', noteIds: [] }], originals, recommendedIndex: null, collectionAvailable: true, assessmentAvailable: true }
  const ask = jest.fn().mockResolvedValueOnce('v').mockResolvedValueOnce('2')
  expect(await chooseMeaning({ canonical: 'Schatz', meanings: originals }, null, { guidance, ask, log: jest.fn() })).toEqual(originals[1])
})
test('distinguishes a skipped Anki check during dry run from an unavailable service', async () => {
  const meanings = [{ russian: 'клад' }, { russian: 'дорогой' }]
  const log = jest.fn()
  const guidance = { options: meanings.map(meaning => ({ meaning, status: 'unknown', noteIds: [] })), recommendedIndex: null, collectionAvailable: false, assessmentAvailable: false }
  await chooseMeaning({ canonical: 'Schatz', meanings }, null, { ask: jest.fn().mockResolvedValue('1'), log, guidance, skipAnki: true })
  expect(log.mock.calls.flat().join('\n')).toContain('Anki check skipped (dry run)')
})
test('labels evidence from the lemma without claiming the requested form exists', async () => {
  const meanings = [{ russian: 'хороший' }, { russian: 'лучший' }]
  const guidance = { options: [{ meaning: meanings[0], status: 'existing', noteIds: [91], evidence: [{ noteId: 91, meaning: 'хороший', sourceForm: 'gut' }] }, { meaning: meanings[1], status: 'unknown', noteIds: [] }], recommendedIndex: null, collectionAvailable: true, assessmentAvailable: true }
  const log = jest.fn()
  await chooseMeaning({ canonical: 'besten', meanings }, null, { guidance, ask: jest.fn().mockResolvedValue('1'), log })
  expect(log.mock.calls.flat().join('\n')).toContain('✓ Lemma in Anki')
})
