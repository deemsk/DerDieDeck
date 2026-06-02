import { createBasicNote, createPictureWordNote } from "../src/anki.js"
import { buildVerbDictionaryNote } from "../src/templates/verb/dictionary.js"
import { buildWordExtraInfo } from "../src/templates/word/extraInfo.js"

describe("verb note helpers", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  test("createPictureWordNote tags picture verbs without gender", async () => {
    const requests = []

    global.fetch = async (_url, options) => {
      requests.push(JSON.parse(options.body))
      return {
        async json() {
          return { result: 123, error: null }
        },
      }
    }

    await createPictureWordNote({
      canonical: "laufen",
      coloredWord: "<span>laufen</span>",
      imageFilename: "laufen.jpg",
      pronunciationField: "[sound:laufen.mp3]<br>[ˈlaʊfn̩]",
      extraInfoField: buildWordExtraInfo({
        meaning: "бежать",
        exampleSentence: "Er läuft im Park.",
        exampleSentenceTranslation: "Он бегает в парке.",
        metadata: {
          canonical: "laufen",
          meaning: "бежать",
        },
      }),
      frequencyBand: "core",
      lemma: "laufen",
      imageSource: "Brave Images",
      audioSource: "Google TTS",
      lexicalType: "verb",
      modelName: "2. Picture Words",
    })

    const note = requests[0].params.note
    expect(note.tags).toContain("word-verb")
    expect(note.tags.some((tag) => tag.startsWith("gender-"))).toBe(false)
    expect(note.fields["Gender, Personal Connection, Extra Info (Back side)"]).toContain("yt2anki-extra-example")
    expect(note.fields["Gender, Personal Connection, Extra Info (Back side)"]).toContain("ddd-extra-example")
    expect(note.fields["Gender, Personal Connection, Extra Info (Back side)"]).not.toContain("style=")
    expect(note.fields["Gender, Personal Connection, Extra Info (Back side)"]).toContain("Он бегает в парке.")
  })

  test("createBasicNote writes Front/Back and optional reverse field", async () => {
    const requests = []

    global.fetch = async (_url, options) => {
      requests.push(JSON.parse(options.body))
      return {
        async json() {
          return { result: 456, error: null }
        },
      }
    }

    await createBasicNote({
      front: "läuft",
      back: "laufen<br>[ˈlaʊfn̩]<br>бежать",
      modelName: "Basic (optional reversed card)",
      addReversed: true,
      tags: ["mode-verb-dictionary"],
    })

    expect(requests[0].params.note.fields.Front).toBe("läuft")
    expect(requests[0].params.note.fields.Back).toContain("laufen")
    expect(requests[0].params.note.fields["Add Reverse"]).toBe("1")
    expect(requests[0].params.note.tags).toContain("mode-verb-dictionary")
  })

  test("buildVerbDictionaryNote uses the shared target word display", () => {
    const note = buildVerbDictionaryNote({
      verbData: {
        infinitive: "ankommen",
        displayForm: "kommt an",
        ipa: "[ˈankɔmən]",
      },
      selectedMeaning: { russian: "прибывать" },
      focusForm: "kommt an",
      pronunciationField: "[sound:ankommen.mp3]<br><span class=\"yt2anki-ipa ddd-ipa\">[ˈankɔmən]</span>",
    })

    expect(note.front).toContain("yt2anki-word-display")
    expect(note.front).toContain("ddd-word-display")
    expect(note.front).toContain("kommt an")
    expect(note.back).toContain("yt2anki-word-display")
    expect(note.back).toContain("ankommen")
    expect(note.back).toContain("[sound:ankommen.mp3]")
  })
})
