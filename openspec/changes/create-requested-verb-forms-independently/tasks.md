- [x] Trace the supplied `geh` failure through picture-note and form-note writes.
- [x] Reproduce the synonym-gloss headword match and inspect form-tag lookup.
- [x] Draft the proposal and verb-card delta in English.
- [x] Validate the draft with OpenSpec 1.13.0 (`--strict --no-interactive`).
- [x] Review the proposed behavior with the user before implementation.
- [x] Add failing workflow tests for a known `gehen` picture note and missing `geh`,
  including both identical and differently worded Russian meanings.
- [x] Make dedicated form lookup recognize existing notes without treating a
  lemma or sentence alone as the requested explanation.
- [x] Preview requested-form and companion actions; skip image preparation for
  an already represented lemma note.
- [x] Write confirmed missing form notes independently before companions and
  report per-output results and note IDs.
- [x] Handle late duplicate, nonduplicate failure, partial retry, dismissal,
  dry-run, and asynchronous spinner cleanup with regression coverage.
- [x] Run focused verb/Anki tests and the full Jest suite; inspect the `geh` preview.
- [x] Synchronize baseline requirements, record evidence, and validate OpenSpec.
- [x] Clarify the first requested-form preview after the learner's `geh` feedback:
  show the exact Front, explain the next review and existing infinitive, omit a
  bare ID and automatic infinitive audio, and print searchable `nid:` results.
- [x] Re-run focused and full verification for the preview follow-up.
- [x] Filter sentence suggestions by the requested form before the display limit.
- [x] Reject a manual or explicit sentence that lacks the requested form;
  preserve infinitive-only selection behavior.
- [x] Cover `geh`/`gehe`/`gehen`, later matching suggestions, manual fallback,
  and explicit sentence rejection; synchronize and validate OpenSpec.
- [x] Show the complete form preview directly when the infinitive card exists;
  visually emphasize the existing infinitive and use a form-matching example.
- [x] Resolve and display the requested form's IPA separately from the
  infinitive; add available form audio/IPA to the saved answer.
- [x] Cover direct accept/skip, form pronunciation and unavailable-source
  fallback; run focused and full tests and validate OpenSpec.

Verification: focused `tests/verbMode.test.js` and `tests/anki.test.js` passed
(32 tests); the full Jest suite passed (42 suites, 373 tests). Strict OpenSpec
validation passed. No image selection occurs for an already represented lemma.

Follow-up evidence: AnkiConnect `findNotes` returned note `1777924962119` for
`nid:1777924962119`; `notesInfo` identified its Front as `gehen`. The Anki manual's
Object IDs section documents `nid:<ID>` for Browse searches. The first preview
no longer displays that raw ID or the redundant existing-lemma list.
Follow-up verification: focused verb preview, workflow, and Anki helper tests
passed (36 tests); full Jest suite passed (42 suites, 375 tests); strict
OpenSpec validation and `git diff --check` passed.

Sentence-example follow-up verification: `tests/verbConfirm.test.js` and
`tests/verbMode.test.js` passed (31 tests); full Jest suite passed (42 suites,
379 tests); strict OpenSpec validation and `git diff --check` passed.

Complete-preview and pronunciation verification: the project resolver returned
`[ɡeː]` and a human audio URL for `geh` from German Wiktionary in a read-only
metadata lookup. Focused verb workflow, preview, and template tests passed;
the full Jest suite passed (42 suites, 382 tests). Strict OpenSpec validation
and `git diff --check` passed at that stage.

- [x] Replace the two-audio form answer with one form recording and a compact
  infinitive reference in the Anki template and terminal preview.
- [x] Avoid uploading infinitive audio solely for a form card.
- [x] Extend the read-only migration to recognize signed two-audio answers,
  preserve the form content, and skip unrecognized note layouts.
- [x] Preview and apply the Back-only update for existing `geh`, with backup;
  verify its card identity and single remaining form recording.
- [x] Run the full Jest suite, strict OpenSpec validation, and diff checks.

Compact-answer verification: the full Jest suite passed (42 suites, 383 tests),
strict OpenSpec validation passed, and `git diff --check` passed. Anki note
`1791481689407` (`geh`) was updated after a saved preview and backup. Read-back
confirmed card ID `1791481689409`, one form-audio tag, the translated example,
and a compact `gehen` reference; the infinitive audio was removed from Back.

- [x] Trace the `hab` sentence-route preconfirmation and the missing sentence
  note ID to their respective workflow and Anki helper boundaries.
- [x] Make the complete dictionary preview the first requested-form confirmation
  when a sentence card is also prepared; retain sentence editing and explicit
  accept, skip-form, and dismiss-both outcomes.
- [x] Return AnkiConnect's `addNote` ID from `createNote` so the sentence result
  prints a usable Anki Browse query.
- [x] Add regressions for `hab`, sentence revision, dismissal, preview choices,
  and the Anki note ID; run focused and full tests and strict OpenSpec validation.

`hab` follow-up verification: focused Anki, verb workflow, and dictionary
preview tests passed (47 tests); the full Jest suite passed (42 suites,
387 tests). Strict OpenSpec validation and `git diff --check` passed.
