import { buildPossessiveUnits, possessiveFamily } from "../src/grammar/families/possessive.js"

function bySlot(units) {
  return new Map(units.map((unit) => [unit.slotId, unit]))
}

describe("possessive grammar family", () => {
  test("normalizes inflected forms back to the base possessive lemma", () => {
    expect(possessiveFamily.normalizeLemma("meinen")).toBe("mein")
    expect(possessiveFamily.normalizeLemma("euren")).toBe("euer")
  })

  test("builds the full possessive paradigm for mein", () => {
    const units = bySlot(buildPossessiveUnits("mein"))

    expect(units.size).toBe(16)
    expect(units.get("nom-masc-sg").surfaceForm).toBe("mein")
    expect(units.get("acc-masc-sg").surfaceForm).toBe("meinen")
    expect(units.get("dat-fem-sg").surfaceForm).toBe("meiner")
    expect(units.get("dat-pl").surfaceForm).toBe("meinen")
    expect(units.get("acc-masc-sg").clozeText).toContain("{{c1::meinen::ACC.M.SG}}")
    expect(units.get("acc-masc-sg").slotLabel).toBe("винительный падеж, мужской род, единственное число")
    expect(units.get("acc-masc-sg").explanation).toContain("Притяжательный определитель «mein»")
  })

  test("handles euer with the shortened stem in inflected forms", () => {
    const units = bySlot(buildPossessiveUnits("euer"))

    expect(units.get("nom-masc-sg").surfaceForm).toBe("euer")
    expect(units.get("nom-fem-sg").surfaceForm).toBe("eure")
    expect(units.get("dat-pl").surfaceForm).toBe("euren")
    expect(units.get("gen-pl").surfaceForm).toBe("eurer")
  })
})
