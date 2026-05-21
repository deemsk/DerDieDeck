import { buildLearnerProfilePromptContext } from "../src/knowledgeProfile/promptContext.js"

describe("learner profile prompt context", () => {
  test("builds a compact level-aware prompt instead of dumping the whole profile", () => {
    const context = buildLearnerProfilePromptContext({
      summary: {
        totalNotes: 120,
        cefrCounts: { A1: 8, A2: 20, B1: 54, B2: 38, C1: 0 },
        estimatedLevel: "B1",
        modeCounts: {
          "mode-word": 40,
          "mode-word-sentence": 35,
          "mode-lexical-cloze": 20,
        },
        words: [
          { canonical: "die Abteilung", lexicalType: "noun", maturityScore: 1.2, cefrLevel: "B1", intervalDays: 40, reps: 4 },
          { canonical: "trotzdem", lexicalType: "adverb", maturityScore: 0.2, cefrLevel: "B2", intervalDays: 1, reps: 3, lapses: 1 },
          { canonical: "sicher", lexicalType: "adjective", maturityScore: 0.8, cefrLevel: "B1", intervalDays: 20, reps: 3 },
        ],
      },
    }, {
      target: { rawInput: "sicher" },
      maxKnownWords: 2,
    })

    expect(context).toContain("Estimated comfortable level: B1")
    expect(context).toContain("aim examples around B2")
    expect(context).toContain("die Abteilung")
    expect(context).toContain("trotzdem")
    expect(context).toContain("Avoid defaulting to beginner filler")
    expect(context).not.toContain("learner-profile.json")
    expect(context).not.toContain('"words"')
  })
})
