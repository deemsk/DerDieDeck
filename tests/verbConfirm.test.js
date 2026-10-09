import { jest } from "@jest/globals"

const mockPlayAudio = jest.fn()
jest.unstable_mockModule("../src/confirm.js", () => ({
  askReviewFeedback: jest.fn(),
  playAudio: mockPlayAudio,
}))

const mockReviewExamples = jest.fn(async (_target, examples) => examples)
jest.unstable_mockModule("../src/verbSentenceValidation.js", () => ({ reviewVerbExamples: mockReviewExamples }))

const { chooseVerbSentence, confirmPictureVerbSelection, confirmSentenceVerbSelection, filterVerbExampleSentences, formatExistingInfinitiveNotice, formatVerbPreviewSummary, resolveVerbFocusForm } = await import("../src/verbConfirm.js")

describe("verb preview helpers", () => {
  beforeEach(() => { mockPlayAudio.mockClear(); mockReviewExamples.mockReset().mockImplementation(async (_target, examples) => examples) })
  const fakeChalk = {
    bold: {
      cyan: (value) => `<head>${value}</head>`,
    },
    dim: (value) => `<dim>${value}</dim>`,
  }

  test("formatVerbPreviewSummary matches the compact lexical summary style", () => {
    expect(
      formatVerbPreviewSummary(
        fakeChalk,
        { infinitive: "gehören" },
        "принадлежать",
        "A2"
      )
    ).toBe("<head>gehören</head> <dim>(verb, A2)</dim> <dim>—</dim> принадлежать")
  })

  test("existing infinitive notice emphasizes the German word", () => {
    expect(formatExistingInfinitiveNotice(fakeChalk, "gehen"))
      .toBe("<head>gehen</head> is already in Anki and will not be added again.")
  })

  test("resolveVerbFocusForm prefers chosen sentence focus form and falls back to encountered form", () => {
    expect(
      resolveVerbFocusForm(
        { infinitive: "gehören", displayForm: "gehört" },
        { focusForm: "gehörte" }
      )
    ).toBe("gehörte")

    expect(
      resolveVerbFocusForm({ infinitive: "gehören", displayForm: "gehört" })
    ).toBe("gehört")

    expect(
      resolveVerbFocusForm({ infinitive: "gehören", displayForm: "gehören" })
    ).toBe(null)
  })

  test("requested geh keeps only exact-form examples before limiting suggestions", () => {
    const examples = [
      { german: "Ich gehe zu Fuß zur Arbeit." },
      { german: "Wir gehen heute ins Kino." },
      { german: "Der Gehweg ist breit." },
      { german: "Geh bitte nach Hause." },
      { german: "Geh!" },
    ]
    expect(filterVerbExampleSentences(examples, "geh")).toEqual(examples.slice(3))
    expect(filterVerbExampleSentences(examples, null)).toEqual(examples.slice(0, 3))
  })

  test("the chooser uses geh and corrects an incorrect focus label", async () => {
    const lines = []
    const sentence = await chooseVerbSentence({
      infinitive: "gehen", displayForm: "geh",
      exampleSentences: [
        { german: "Ich gehe zu Fuß zur Arbeit." },
        { german: "Geh bitte nach Hause.", russian: "Иди, пожалуйста, домой.", focusForm: "gehe" },
        { german: "Wir gehen heute ins Kino." },
      ],
    }, null, { write: (line) => lines.push(line), askInput: async () => { throw new Error("No choice needed") } })

    expect(sentence).toEqual({ german: "Geh bitte nach Hause.", russian: "Иди, пожалуйста, домой.", focusForm: "geh" })
    expect(lines.join("\n")).toContain("Using example with geh: Geh bitte nach Hause.")
    expect(lines.join("\n")).not.toContain("gehe zu Fuß")
  })

  test("when no suggestion uses geh, manual entry requires the requested form", async () => {
    const answers = ["Ich gehe nach Hause.", "Geh jetzt!"]
    const lines = []
    const sentence = await chooseVerbSentence({
      infinitive: "gehen", displayForm: "geh",
      exampleSentences: [{ german: "Wir gehen heute ins Kino." }],
    }, null, { askInput: async () => answers.shift(), write: (line) => lines.push(line) })

    expect(sentence).toEqual(expect.objectContaining({ german: "Geh jetzt!", focusForm: "geh" }))
    expect(lines.join("\n")).toContain("No suggested example contains geh")
    expect(lines.join("\n")).toContain("must contain geh")
  })

  test("an explicit sentence without geh is rejected before note preparation", async () => {
    const lines = []
    const sentence = await chooseVerbSentence({
      infinitive: "gehen", displayForm: "geh", exampleSentences: [],
    }, "Ich gehe nach Hause.", { write: (line) => lines.push(line) })

    expect(sentence).toBe(null)
    expect(lines.join("\n")).toContain("does not contain the requested form geh")
  })

  test("a requested form preview leads with its Front and explains the next review step", async () => {
    const lines = []
    const prompts = []
    const result = await confirmPictureVerbSelection({
      verbData: { infinitive: "gehen", displayForm: "geh", ipa: "[ˈɡeːən]" },
      selectedMeaning: { russian: "идти" },
      frequencyInfo: { bandLabel: "Essential", rank: 106 },
      duplicateInfo: { exactMatches: [], headwordMatches: [{ noteId: 1777924962119, canonical: "gehen", meaning: "идти" }] },
      audioSource: "Wiktionary/Wikimedia",
      audioPath: "/tmp/gehen.mp3",
      addDictionaryForm: true,
      requestedForm: "geh",
      existingLemmaNote: { noteId: 1777924962119 },
      autoPlay: true,
      askInput: async (prompt) => { prompts.push(prompt); return "c" },
      write: (line) => lines.push(String(line ?? "")),
    })

    expect(result).toEqual({ confirmed: true, personalConnection: null, addDictionaryForm: true })
    expect(lines.join("\n")).toContain("Front: geh")
    expect(lines.join("\n")).toContain("gehen is already in Anki")
    expect(lines.join("\n")).toContain("reviewed before saving")
    expect(lines.join("\n")).not.toContain("1777924962119")
    expect(lines.join("\n")).not.toContain("Existing notes with the same lemma")
    expect(lines.join("\n")).not.toContain("IPA: [ˈɡeːən]")
    expect(prompts[0]).toContain("[C]ontinue to review geh")
    expect(mockPlayAudio).not.toHaveBeenCalled()
  })

  test("sentence-route preview also names the requested form as the proposed Front", async () => {
    const lines = []
    const prompts = []
    const result = await confirmSentenceVerbSelection({
      verbData: { infinitive: "gehen", displayForm: "geh" },
      selectedMeaning: { russian: "идти" },
      sentenceData: { german: "Geh bitte nach Hause.", russian: "Иди, пожалуйста, домой." },
      chosenSentence: { focusForm: "geh" },
      audioPath: null,
      addDictionaryForm: true,
      requestedForm: "geh",
      autoPlay: false,
      askInput: async (prompt) => { prompts.push(prompt); return "c" },
      write: (line) => lines.push(String(line ?? "")),
    })

    expect(result).toEqual({ confirmed: true, addDictionaryForm: true })
    expect(lines.join("\n")).toContain("Front: geh")
    expect(lines.join("\n")).toContain("reviewed before saving")
    expect(prompts[0]).toContain("[C]ontinue to review geh")
  })
})

test('rejects another lemma before showing choices and validates manual replacement', async () => {
  const wrong = { german: 'Sieh bitte nach, ob die Tür zu ist.' }
  const right = { german: 'Sieh nach links.' }
  const write = jest.fn()
  mockReviewExamples.mockReset().mockImplementation(async (_target, examples) => examples.filter(e => e.german === right.german))
  const result = await chooseVerbSentence({ infinitive: 'sehen', displayForm: 'sieh', exampleSentences: [wrong, right] }, null, { write, askInput: async () => { throw new Error('Only one valid example') } })
  expect(result.german).toBe(right.german)
  expect(write.mock.calls.flat().join(' ')).not.toContain(wrong.german)
  const answers = [wrong.german, right.german]
  const manual = await chooseVerbSentence({ infinitive: 'sehen', displayForm: 'sieh', exampleSentences: [wrong] }, null, { write, askInput: async () => answers.shift() })
  expect(manual.german).toBe(right.german)
  expect(answers).toHaveLength(0)
})

test('preferred sentence is not exempt from lexical identity review', async () => {
  mockReviewExamples.mockResolvedValueOnce([])
  expect(await chooseVerbSentence({ infinitive: 'sehen', displayForm: 'sieh' }, 'Sieh bitte nach.', { write: () => {} })).toBeNull()
})

test('semantic filtering happens before the three-example display limit', async () => {
  const wrong = { german: 'Sieh bitte nach, ob die Tür zu ist.' }
  const right = { german: 'Sieh nach links.' }
  mockReviewExamples.mockReset().mockImplementation(async (_target, examples) => examples.filter(e => e.german === right.german))
  const result = await chooseVerbSentence({ infinitive: 'sehen', displayForm: 'sieh', exampleSentences: [wrong, wrong, wrong, right] }, null, {
    write: () => {}, askInput: async () => { throw new Error('The fourth candidate is valid') },
  })
  expect(result.german).toBe(right.german)
})
