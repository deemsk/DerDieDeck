## Implementation

- [x] Add failing tests for framing, aligned field groups, optional notes, wrapping,
  colored/plain output, regeneration, and complete content returned for saving.
- [x] Format the preview from structured data using the existing console style.
- [x] Update generation and semantic-review guidance to omit filler without losing
  meaningful grammatical ambiguity or form contrasts.
- [x] Run focused tests and the full Jest suite.
- [x] Review real generated previews for `denkst`, `wäre`, and passive `wurde`.
- [x] Complete code review and synchronize the baseline specification.
- [x] Validate OpenSpec and check the final diff.

## Verification Record

- Initial regression run: five preview tests failed against the previous flat output.
- Focused run: 28 tests passed across preview, enrichment, and verb workflow suites.
- Full run: 39 suites / 315 tests passed.
- The formatter preserves the explanation object returned for note creation;
  optional rows are omitted only when the prepared field itself is absent.
- Work remains on `main`, as requested. Existing Anki notes are not modified.
- Live generation: `denkst` returned null ambiguity and contrast, with concise
  contextual usage and the exact supplied example. `wäre` retained contextual
  hypothetical meaning and first-/third-person ambiguity. Passive `wurde` retained
  its passive meaning, full example translation, and the `würde` contrast.
- Live terminal output was inspected at 80 columns. Automated checks also cover
  42-column wrapping, ANSI styling, and equivalent plain output.
- Independent read-only review found no concrete bugs or meaningful gaps and
  independently passed all nine preview tests.
