import { buildContrastHint, buildContrastTags, findContrastFamily } from "../src/cardContent/interference.js"

describe("interference detector", () => {
  test("detects high-confusion lexical families", () => {
    expect(findContrastFamily("liegen")).toEqual(expect.objectContaining({
      id: "position-vs-placement",
    }))
    expect(findContrastFamily("dass")).toEqual(expect.objectContaining({
      id: "because-that-connectors",
    }))
  })

  test("builds learner-facing contrast hints and tags", () => {
    expect(buildContrastHint("nichts")).toContain("nicht/nichts/kein")
    expect(buildContrastTags("für")).toEqual(["contrast-family-common-prepositions"])
  })
})
