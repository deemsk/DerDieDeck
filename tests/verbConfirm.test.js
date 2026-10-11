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

  test.each([confirmPictureVerbSelection, confirmSentenceVerbSelection])(
    "legacy confirmation cannot show a placeholder for a requested form", async confirm => {
      const write = jest.fn(), askInput = jest.fn()
      await expect(confirm({
        verbData: { infinitive: "gehen", displayForm: "geh" }, requestedForm: "geh", write, askInput,
      })).rejects.toThrow("complete dictionary review")
      expect(write).not.toHaveBeenCalled()
      expect(askInput).not.toHaveBeenCalled()
    }
  )

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

test('optional infinitive defaults to skip, cannot toggle the form, and does not autoplay', async () => {
  const loadAudio = jest.fn()
  const prompts = [], lines = []
  const answers = ['t', '']
  const result = await confirmPictureVerbSelection({
    verbData: { infinitive: 'sehen', displayForm: 'sehen', ipa: '[ˈzeːən]' },
    selectedMeaning: { russian: 'видеть' }, frequencyInfo: { bandLabel: 'Essential' },
    duplicateInfo: { headwordMatches: [] }, showImage: false,
    optionalInfinitive: true, audioPath: '/tmp/sehen.mp3', loadAudio,
    askInput: async prompt => { prompts.push(prompt); return answers.shift() },
    write: line => lines.push(line),
  })
  expect(result.confirmed).toBe(false)
  expect(result.addDictionaryForm).toBe(false)
  expect(prompts).toEqual(['Choose [S]: ', 'Choose [S]: '])
  expect(mockPlayAudio).not.toHaveBeenCalled()
  expect(loadAudio).not.toHaveBeenCalled()
  expect(lines.join(' ')).toContain('Optional infinitive card')
  expect(lines.join(' ')).not.toContain('complete sehen card')
})

test('optional infinitive loads audio only on Listen and requires explicit Add', async () => {
  const loadAudio = jest.fn(async () => '/tmp/sehen.mp3')
  const answers = ['l', 'a']
  const result = await confirmPictureVerbSelection({
    verbData: { infinitive: 'sehen' }, selectedMeaning: { russian: 'видеть' },
    frequencyInfo: { bandLabel: 'Essential' }, duplicateInfo: { headwordMatches: [] },
    showImage: false, optionalInfinitive: true, loadAudio,
    askInput: async () => answers.shift(), write: () => {},
  })
  expect(result.confirmed).toBe(true)
  expect(loadAudio).toHaveBeenCalledTimes(1)
  expect(mockPlayAudio).toHaveBeenCalledWith('/tmp/sehen.mp3')
})

test('optional infinitive shows the example and form context before Add', async () => {
  const lines = []
  const result = await confirmPictureVerbSelection({
    verbData: { infinitive: 'sehen', exampleSentences: [{ german: 'Er sah den Arzt.', russian: 'Он видел врача.' }] },
    selectedMeaning: { russian: 'видеть' }, frequencyInfo: { bandLabel: 'Essential' },
    duplicateInfo: { headwordMatches: [] }, optionalInfinitive: true, showImage: false,
    dictionaryContext: 'sah → sehen', contrast: 'sehen / schauen',
    write: line => lines.push(line), askInput: async () => {
      const preview = lines.join('\n')
      for (const text of ['Er sah den Arzt.', 'Он видел врача.', 'sah → sehen', 'sehen / schauen']) expect(preview).toContain(text)
      return 'a'
    },
  })
  expect(result.confirmed).toBe(true)
})
