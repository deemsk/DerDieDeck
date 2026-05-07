import { generateCards, generateClozeCard, generateDialogueCard, generateProductionCard, generateSoundCard, normalizeRussianHint } from "../src/cardTypes.js"
import { validateCardIntent } from "../src/cardContent/learningDesign.js"
import { formatCardForAnki } from "../src/templates/index.js"

describe("card type helpers", () => {
  test("normalizeRussianHint keeps Russian learner hints", () => {
    expect(normalizeRussianHint("в кафе")).toBe("в кафе")
  })

  test("normalizeRussianHint drops English learner hints", () => {
    expect(normalizeRussianHint("ordering coffee")).toBeNull()
  })

  test("production cards keep only Russian front hints", () => {
    const withEnglish = generateProductionCard(
      {
        german: "Ich möchte einen Kaffee.",
        ipa: "[ɪç ˈmœçtə ˈaɪ̯nən ˈkafeː]",
        russian: "Я хочу кофе.",
      },
      "ordering coffee",
      "test-1"
    )

    const withRussian = generateProductionCard(
      {
        german: "Ich möchte einen Kaffee.",
        ipa: "[ɪç ˈmœçtə ˈaɪ̯nən ˈkafeː]",
        russian: "Я хочу кофе.",
      },
      "в кафе",
      "test-2"
    )

    expect(withEnglish.front.situation).toBeNull()
    expect(formatCardForAnki(withEnglish, "clip.mp3").Front).toContain("Say in German")
    expect(formatCardForAnki(withEnglish, "clip.mp3").Front).toContain("Я хочу кофе.")
    expect(formatCardForAnki(withEnglish, "clip.mp3").Front).toContain("text-align:center")
    expect(formatCardForAnki(withEnglish, "clip.mp3").Front).not.toContain("ordering coffee")
    expect(withRussian.front.situation).toBe("в кафе")
    expect(formatCardForAnki(withRussian, "clip.mp3").Front).toContain('class="yt2anki-production-hint"')
    expect(formatCardForAnki(withRussian, "clip.mp3").Front).toContain(">в кафе<")
  })

  test("formatCardForAnki wraps IPA with the neutral IPA class", () => {
    const fields = formatCardForAnki(
      generateProductionCard(
        {
          german: "Ich möchte einen Kaffee.",
          ipa: "[ɪç ˈmœçtə ˈaɪ̯nən ˈkafeː]",
          russian: "Я хочу кофе.",
        },
        "в кафе",
        "test-3"
      ),
      "clip.mp3"
    )

    expect(fields.Back).toContain('class="yt2anki-ipa"')
    expect(fields.Back).toContain("color:var(--yt2anki-ipa, #475569)")
  })

  test("dialogue cards render an explicit reply task block", () => {
    const fields = formatCardForAnki(
      generateDialogueCard(
        {
          german: "Wie geht's?",
          ipa: "[viː ɡeːts]",
          russian: "Как дела?",
        },
        {
          german: "Ganz gut.",
          russian: "Нормально.",
        },
        "test-4"
      ),
      "reply.mp3"
    )

    expect(fields.Front).toContain("[sound:reply.mp3]")
    expect(fields.Front).toContain("💬")
    expect(fields.Front).toContain("Answer aloud in German")
    expect(fields.Front).toContain("Your reply: ______")
    expect(fields.Back).toContain("Ganz gut.")
  })

  test("generated cards carry explicit learning intent and sibling staging", () => {
    const cards = generateCards(
      {
        german: "Ich möchte einen Kaffee.",
        ipa: "[ɪç ˈmœçtə ˈaɪ̯nən ˈkafeː]",
        russian: "Я хочу кофе.",
      },
      [
        { type: "comprehension", reason: "default" },
        { type: "production", reason: "в кафе" },
      ],
      "source-1"
    )

    expect(cards).toHaveLength(2)
    expect(cards[0].intent.id).toBe("sound-meaning")
    expect(cards[1].intent.id).toBe("meaning-to-german")
    expect(cards[1].siblingStage).toEqual({ index: 1, total: 2, dayOffset: 1 })
    expect(cards.every((card) => validateCardIntent(card).valid)).toBe(true)
  })

  test("sound cards are first-class audio-before-text cards", () => {
    const fields = formatCardForAnki(
      generateSoundCard(
        {
          german: "ich",
          ipa: "[ɪç]",
          russian: "я",
        },
        "ich-Laut",
        "sound-1"
      ),
      "ich.mp3"
    )

    expect(fields.Front).toContain("[sound:ich.mp3]")
    expect(fields.Front).toContain("Hear the sound")
    expect(fields.Back).toContain("ich-Laut")
    expect(fields.Back).toContain("[ɪç]")
  })

  test("grammar cloze cards keep direct translation off the front", () => {
    const fields = formatCardForAnki(
      generateClozeCard(
        {
          german: "Ich habe keine Zeit.",
          russian: "У меня нет времени.",
        },
        { word: "keine", category: "negative determiner" },
        "negative determiner contrast",
        "cloze-1"
      ),
      "unused.mp3"
    )

    expect(fields.Front).toContain("Ich habe [...] Zeit.")
    expect(fields.Front).not.toContain("У меня нет времени.")
    expect(fields.Back).toContain("У меня нет времени.")
  })
})
