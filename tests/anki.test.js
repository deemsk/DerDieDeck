import { createNote, createNotes, ensureDerDieDeckStyling, findSimilarCards, findVerbFormDuplicates, findVerbSentenceDuplicates } from "../src/anki.js"

describe("anki helpers", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  test("createNote honors deck override", async () => {
    const requests = []

    global.fetch = async (_url, options) => {
      requests.push(JSON.parse(options.body))
      return {
        async json() {
          return { result: 123, error: null }
        },
      }
    }

    await createNote({
      german: "Ich gehe nach Hause.",
      ipa: "[ɪç ˈɡeːə nax ˈhaʊ̯zə]",
      russian: "Я иду домой.",
      audioFilename: "clip.m4a",
      deck: "Custom::Deck",
    })

    expect(requests).toHaveLength(1)
    expect(requests[0].action).toBe("addNote")
    expect(requests[0].params.note.deckName).toBe("Custom::Deck")
  })

  test("createNote can embed image and hidden lexical metadata", async () => {
    const requests = []

    global.fetch = async (_url, options) => {
      requests.push(JSON.parse(options.body))
      return {
        async json() {
          return { result: 124, error: null }
        },
      }
    }

    await createNote({
      german: "Das ist gut.",
      ipa: "[das ɪst ɡuːt]",
      russian: "Это хорошо.",
      audioFilename: "gut.mp3",
      imageFilename: "gut.jpg",
      metadata: {
        canonical: "gut",
        meaning: "хороший",
        lexicalType: "adjective",
      },
    })

    const note = requests[0].params.note
    expect(note.fields.Front).toContain("gut.jpg")
    expect(note.fields.Back).toContain("yt2anki-ipa")
    expect(note.fields.Back).toContain('class="ddd-answer-translation"')
    expect(note.fields.Back).not.toContain("style=")
    expect(note.fields.Back).toContain("yt2anki-word:")
  })

  test("createNote can append a styled front footer without adding a context label", async () => {
    const requests = []

    global.fetch = async (_url, options) => {
      requests.push(JSON.parse(options.body))
      return {
        async json() {
          return { result: 125, error: null }
        },
      }
    }

    await createNote({
      german: "Das Haus ist groß.",
      ipa: "[das haʊs ɪst ɡʁoːs]",
      russian: "Дом большой.",
      audioFilename: "gross.mp3",
      imageFilename: "gross.jpg",
      frontFooterHtml: '<div class="yt2anki-word-contrast">Contrast: klein</div>',
    })

    const note = requests[0].params.note
    expect(note.fields.Front).toContain('<img src="gross.jpg" />')
    expect(note.fields.Front).toContain("gross.jpg")
    expect(note.fields.Front).toContain("yt2anki-word-contrast")
    expect(note.fields.Front).not.toContain("Context:")
  })

  test("createNotes tags learning intent and sibling staging", async () => {
    const requests = []

    global.fetch = async (_url, options) => {
      requests.push(JSON.parse(options.body))
      return {
        async json() {
          return { result: requests.length, error: null }
        },
      }
    }

    await createNotes([
      {
        type: "comprehension",
        intent: {
          id: "sound-meaning",
          trains: ["sound-map"],
        },
        siblingStage: { index: 0, total: 2 },
        front: { audio: true },
        back: { german: "Hallo.", ipa: "[haˈloː]", russian: "Привет." },
      },
      {
        type: "production",
        intent: {
          id: "meaning-to-german",
          trains: ["active-production"],
        },
        siblingStage: { index: 1, total: 2 },
        front: { russian: "Привет." },
        back: { german: "Hallo.", ipa: "[haˈloː]", audio: true },
      },
    ], "hallo.mp3", { sourceId: "src-1" })

    expect(requests).toHaveLength(2)
    expect(requests[0].params.note.tags).toEqual(expect.arrayContaining([
      "intent-sound-meaning",
      "trains-sound-map",
      "sibling-stage-day-0",
    ]))
    expect(requests[1].params.note.tags).toEqual(expect.arrayContaining([
      "intent-meaning-to-german",
      "trains-active-production",
      "sibling-stage-day-1",
    ]))
  })

  test("ensureDerDieDeckStyling installs shared CSS on configured note types", async () => {
    const requests = []

    global.fetch = async (_url, options) => {
      const body = JSON.parse(options.body)
      requests.push(body)

      if (body.action === "modelNames") {
        return {
          async json() {
            return { result: ["Basic (optional reversed card)"], error: null }
          },
        }
      }

      if (body.action === "modelStyling") {
        return {
          async json() {
            return { result: { css: ".card { font-size: 20px; }" }, error: null }
          },
        }
      }

      if (body.action === "updateModelStyling") {
        return {
          async json() {
            return { result: null, error: null }
          },
        }
      }

      throw new Error(`Unexpected action: ${body.action}`)
    }

    const result = await ensureDerDieDeckStyling({
      modelNames: ["Basic (optional reversed card)", "Missing Model"],
    })

    expect(result).toEqual([
      { modelName: "Basic (optional reversed card)", status: "updated" },
      { modelName: "Missing Model", status: "missing" },
    ])

    const update = requests.find((entry) => entry.action === "updateModelStyling")
    expect(update.params.model.name).toBe("Basic (optional reversed card)")
    expect(update.params.model.css).toContain("DerDieDeck shared styles start")
    expect(update.params.model.css).toContain(".card { font-size: 20px; }")
  })

  test("ensureDerDieDeckStyling dry run previews updates without writing", async () => {
    const requests = []

    global.fetch = async (_url, options) => {
      const body = JSON.parse(options.body)
      requests.push(body)

      if (body.action === "modelNames") {
        return {
          async json() {
            return { result: ["Basic"], error: null }
          },
        }
      }

      if (body.action === "modelStyling") {
        return {
          async json() {
            return { result: { css: "" }, error: null }
          },
        }
      }

      throw new Error(`Unexpected action: ${body.action}`)
    }

    const result = await ensureDerDieDeckStyling({
      modelNames: ["Basic"],
      dryRun: true,
    })

    expect(result).toEqual([
      { modelName: "Basic", status: "would-update" },
    ])
    expect(requests.some((entry) => entry.action === "updateModelStyling")).toBe(false)
  })

  test("findSimilarCards matches current audio-first cards using back-side German text", async () => {
    global.fetch = async (_url, options) => {
      const body = JSON.parse(options.body)

      if (body.action === "findNotes") {
        return {
          async json() {
            return { result: [1, 2], error: null }
          },
        }
      }

      if (body.action === "notesInfo") {
        return {
          async json() {
            return {
              result: [
                {
                  fields: {
                    Front: { value: "[sound:clip.m4a]" },
                    Back: { value: "Ich gehe nach Hause.<br>[ɪç ˈɡeːə nax ˈhaʊ̯zə]<br>Я иду домой." },
                  },
                },
                {
                  fields: {
                    Front: {
                      value: '[sound:reply.m4a]<div class="yt2anki-task">💬 ТВОЙ ОТВЕТ</div><div>Ответь по-немецки вслух</div><div>Это ответ собеседнику, не перевод</div><div>💬 Твой ответ: ______</div>',
                    },
                    Back: { value: "Ganz gut.<br><small>Нормально</small>" },
                  },
                },
              ],
              error: null,
            }
          },
        }
      }

      throw new Error(`Unexpected action: ${body.action}`)
    }

    const similar = await findSimilarCards("Ich gehe nach Hause.")

    expect(similar).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          german: "Ich gehe nach Hause.",
          similarity: 100,
        }),
      ])
    )
  })

  test("findVerbSentenceDuplicates checks existing sentence-mode verbs by lemma tag", async () => {
    global.fetch = async (_url, options) => {
      const body = JSON.parse(options.body)

      if (body.action === "findNotes") {
        expect(body.params.query).toBe("tag:mode-verb-sentence tag:lemma-bleiben")
        return {
          async json() {
            return { result: [91, 92], error: null }
          },
        }
      }

      throw new Error(`Unexpected action: ${body.action}`)
    }

    await expect(findVerbSentenceDuplicates({ infinitive: "bleiben" })).resolves.toEqual({
      exactMatches: [
        { noteId: 91, infinitive: "bleiben" },
        { noteId: 92, infinitive: "bleiben" },
      ],
    })
  })

  test("findVerbFormDuplicates checks exact trained verb forms by lemma and form tags", async () => {
    global.fetch = async (_url, options) => {
      const body = JSON.parse(options.body)

      if (body.action === "findNotes") {
        expect(body.params.query).toBe("tag:lemma-sein tag:verb-form-waere")
        return {
          async json() {
            return { result: [101], error: null }
          },
        }
      }

      throw new Error(`Unexpected action: ${body.action}`)
    }

    await expect(findVerbFormDuplicates({ infinitive: "sein", form: "wäre" })).resolves.toEqual({
      exactMatches: [
        { noteId: 101, infinitive: "sein", form: "wäre" },
      ],
    })
  })
})
