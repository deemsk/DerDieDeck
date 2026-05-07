import { buildStrongVerbPackagePlan, validateVerbFormSentence } from "../src/cardContent/verbPackage.js"
import { buildVerbFormClozeExtra, buildVerbFormClozeText } from "../src/templates/verb/cloze.js"
import { buildVerbKeyFormProductionBack } from "../src/templates/verb/keyForm.js"

const morphology = {
  infinitive: "einsteigen",
  confidence: "high",
  particle: "ein",
  selectedForms: [
    { key: "du", pronoun: "du", label: "du", form: "steigst" },
    { key: "er", pronoun: "er", label: "er/sie/es", form: "steigt" },
  ],
}

describe("strong verb package planning", () => {
  test("validates separated particles in finite clauses", () => {
    expect(validateVerbFormSentence(
      { german: "Du steigst in den Bus ein." },
      morphology.selectedForms[0],
      morphology
    )).toBe(true)

    expect(validateVerbFormSentence(
      { german: "Du steigst in den Bus." },
      morphology.selectedForms[0],
      morphology
    )).toBe(false)
  })

  test("builds package only when every selected form has a valid sentence", () => {
    const plan = buildStrongVerbPackagePlan({
      morphology,
      sentences: [
        { formKey: "du", german: "Du steigst in den Bus ein.", russian: "Ты садишься в автобус." },
        { formKey: "er", german: "Er steigt schnell ein.", russian: "Он быстро садится." },
      ],
    })

    expect(plan.forms).toHaveLength(2)
    expect(plan.sentences.map((sentence) => sentence.focusForm)).toEqual(["steigst", "steigt"])
  })

  test("builds core modal packages from validated generated sentences", () => {
    const modalMorphology = {
      infinitive: "wollen",
      confidence: "high",
      particle: null,
      selectedForms: [
        { key: "ich", pronoun: "ich", label: "ich", form: "will" },
        { key: "du", pronoun: "du", label: "du", form: "willst" },
        { key: "er", pronoun: "er", label: "er/sie/es", form: "will" },
        { key: "wir", pronoun: "wir", label: "wir", form: "wollen" },
        { key: "ihr", pronoun: "ihr", label: "ihr", form: "wollt" },
        { key: "sie", pronoun: "sie", label: "sie/Sie", form: "wollen" },
      ],
    }

    const plan = buildStrongVerbPackagePlan({
      morphology: modalMorphology,
      sentences: [
        { formKey: "ich", german: "Ich will ein Buch.", russian: "Я хочу книгу." },
        { formKey: "du", german: "Du willst ein Eis.", russian: "Ты хочешь мороженое." },
        { formKey: "er", german: "Er will ein Eis.", russian: "Он хочет мороженое." },
        { formKey: "wir", german: "Wir wollen ein Eis.", russian: "Мы хотим мороженое." },
        { formKey: "ihr", german: "Ihr wollt ein Eis.", russian: "Вы хотите мороженое." },
        { formKey: "sie", german: "Sie wollen ein Eis.", russian: "Они хотят мороженое." },
      ],
    })

    expect(plan.forms).toHaveLength(6)
    expect(plan.sentences.map((sentence) => sentence.focusForm)).toEqual([
      "will",
      "willst",
      "will",
      "wollen",
      "wollt",
      "wollen",
    ])
  })

  test("returns null when a required sentence is invalid", () => {
    const plan = buildStrongVerbPackagePlan({
      morphology,
      sentences: [
        { formKey: "du", german: "Du steigst in den Bus ein.", russian: "Ты садишься в автобус." },
        { formKey: "er", german: "Er fährt schnell.", russian: "Он быстро едет." },
      ],
    })

    expect(plan).toBeNull()
  })

  test("key-form cards emphasize the primary translation consistently", () => {
    const back = buildVerbKeyFormProductionBack(
      { label: "du", form: "steigst" },
      { russian: "садиться" }
    )

    expect(back).toContain('class="ddd-answer-translation"')
    expect(back).toContain("font-weight:700")
    expect(back).toContain("садиться")
  })

  test("builds finite-form cloze text and extra context", () => {
    const sentence = {
      german: "Du steigst in den Bus ein.",
      ipa: "[du ʃtaɪkst ɪn deːn bʊs aɪn]",
      russian: "Ты садишься в автобус.",
    }
    const formSpec = { key: "du", label: "du", form: "steigst", displayForm: "steigst ein" }

    expect(buildVerbFormClozeText(sentence, formSpec, "einsteigen")).toBe(
      "Du {{c1::steigst::einsteigen → du}} in den Bus ein."
    )

    const extra = buildVerbFormClozeExtra(sentence, formSpec, "einsteigen")
    expect(extra).not.toContain("Du steigst in den Bus ein.")
    expect(extra).toContain("Ты садишься в автобус.")
    expect(extra).toContain("du steigst ein → einsteigen")
  })
})
