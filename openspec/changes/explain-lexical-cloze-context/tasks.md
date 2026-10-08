## Contract Review

- [x] Trace the reported generic rule to the part-of-speech fallback.
- [x] Confirm that both new and existing cards are in scope.
- [x] Draft the proposal and delta specifications in English.
- [x] Validate the draft with OpenSpec 1.13.0 in strict mode.
- [x] Review the proposed contract with the user before implementation.

## Execution Notes

- Implement inline on `main`, following the user's existing branch instruction.
- Shared interface: contextual preparation returns a validated plain-text rule or
  intentional `null`; both new-note rendering and migration consume that result.
- Migration writes must validate that the proposed `Extra` differs only in its
  recognized rule block before using the Anki update helper.

## Implementation

- [x] Add focused regression tests for `je … desto …`, distributive `je`,
  final-sentence changes, absent useful explanations, and generation failures.
- [x] Prepare and validate concise contextual explanations after the final
  sentence is selected; remove generic fallback output.
- [x] Include the exact prepared explanation in the lexical-cloze terminal preview.
- [x] Add migration parsing and preview for recognizable existing lexical-cloze
  notes, reusing the new-card explanation preparation path.
- [x] Implement backed-up, stale-checked, idempotent rule-block updates through
  Anki helpers, preserving unrelated note content and review state.
- [x] Test unknown markup, partial failures, backups, stale plans, readback,
  duplicate handling, dismissal, dry-run, and repeat application.

## Verification and Existing Notes

- [x] Run focused Jest suites, then the full suite for shared-module changes.
- [x] Inspect generated explanations and terminal output for the supplied example
  and contrasting uses; verify that useful details remain concise.
- [x] Prepare and review the old/new migration comparison for existing notes.
- [x] Apply the reviewed migration and verify note content and review-state preservation.
- [x] Synchronize baseline specifications and add final code/test evidence.
- [x] Validate OpenSpec and review the final diff.

## Verification Record

- Initial regression: the template inserted the generic adverb rule when no
  contextual explanation was supplied; the regression failed before the fix.
- Contextual preparation and workflow tests cover final-sentence input, independent
  semantic review, regeneration after rejection, intentional omission, dry-run,
  recoverable failure, and dismissal.
- Migration tests cover legacy English labels, Back Extra/Extra fields, null
  legacy meanings, conservative parsing, byte preservation, backups, stale plans,
  partial failure, readback, repeated application, and tampered plans.
- Full suite: 41 suites / 348 tests passed. Three existing workflow tests mocked
  the obsolete CEFR module path and attempted external secret access; their mocks
  now use the production import path.
- Independent read-only code review reported no actionable findings and passed
  73 focused tests.
- Live preview: 41 existing lexical-cloze notes; 40 proposed rule updates and one
  unchanged suitable explanation. Four draft explanations were refined after
  content review to remove mixed-language prose, irrelevant contrasts, or
  unsupported implications. Final candidates undergo the same semantic review.
- Live contrasting input `Die Tickets kosten je zehn Euro.` produced the
  distributive meaning instead of the correlative comparison.
- OpenSpec 1.13.0 strict validation: all 10 specifications/changes passed.
- Applied the reviewed migration on 2026-10-08 at 16:46 UTC: 40 updated, one
  unchanged, no skipped or failed entries. Backup under the default migrations
  directory: `lexical-backup-2026-10-08T16-46-03-541Z-b09887da.json`.
- Readback matched the exact proposed rule-only edits for all 40 updated notes.
  All other field bytes, note/card identities, tags, and decks were preserved.
- Full scheduling/review state matched for 38 of 41 cards. Three cards acquired
  additional review state while the task was running. Their review logs record
  answers at 13:36–13:46 UTC, before the migration; shared sync sequence 465 and
  matching card modification times indicate incoming sync of earlier reviews.
  No review-state reset or scheduling API was called. These legitimate review
  changes were retained rather than overwritten with the older snapshot.
