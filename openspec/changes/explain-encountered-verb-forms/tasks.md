# Implementation tasks

Spec: `specs/verb-cards/spec.md` in this change.

## 1. Form content and validation

- [x] Add failing tests for structured explanations, target examples, context,
  semantic checks, answer structure, escaping, and missing explanations.
- [x] Implement local validation, generated explanations with independent review,
  and the dictionary answer template; run the focused tests.

## 2. New-card workflows

- [x] Add failing tests for final-sentence context, full preview, retry/skip,
  opt-out, both verb paths, and dry-run without Anki writes.
- [x] Prepare and confirm dictionary content before writes in both workflows;
  run verb workflow and template tests.

## 3. Existing-note migration

- [x] Add failing tests for legacy parsing, read-only previews, backup failure,
  changed notes, partial failures, identity preservation, and safe reruns.
- [x] Implement conservative parsing, reusable Anki update helpers, saved preview,
  backup, explicit apply, and per-note reporting; run migration tests.

## 4. Verification and rollout

- [x] Run the full suite and code review; address important findings and record review limitations.
- [x] Inspect rendered answers and prepare the live migration preview.
- [x] Apply the authorized updates and verify fields, note/card IDs, and scheduling.
- [x] Update the baseline specification, document the command, and validate OpenSpec.

## Execution record

- Baseline: 35 suites / 267 tests passed before implementation.
- Pre-flight: the explanation object is shared by generator, preview, template,
  and migration; the saved migration plan is shared by preview and apply.
- Workspace: the user explicitly requested work directly on `main`.
- Tasks 1–3: focused RED→GREEN runs completed; full suite 39 suites / 309 tests passed.
- Strict OpenSpec validation passed for the approved change.
- Live inventory: 52 tagged notes / 52 cards. 51 use a safely recognized legacy
  format. One `zieht um` note has a conflicting `form-zieht` tag and is skipped.
- Review follow-up: a matching upgraded Back must not hide a changed Front or
  profile. Added a regression test, observed failure, fixed full-snapshot comparison.
- Live generation follow-up: repair requests now include the rejected explanation
  and use the validation model for correction, with a fresh semantic check afterward.
  Regression tests passed; full suite reached 39 suites / 310 tests.
- A fresh reviewer read the change and found no confirmed must-fix issue before
  its usage limit interrupted the review. The author completed the remaining review;
  no second agent was started.
- Browser inspection is blocked by the browser URL policy for local `file://`
  pages, including the Chrome tab opened by the user. No workaround was attempted.
- Visual inspection used the user's Chrome screenshot. Reduced repetitive wording
  for `wäre` and `wurde`; HTML reports display an audio label instead of raw Anki
  sound tags. Stored note media markup remains unchanged.
- Rollout: 46 explanations passed automatic preparation; five failures were
  rewritten during manual review. The remaining `zieht um` note was manually
  resolved from its unambiguous Front and infinitive; its original tag was retained.
- All 52 updates succeeded after a durable local backup under
  `~/.derdiedeck/migrations`. Read-back checks verified every answer, preserved
  Front and other fields, tags, models, original media/IPA, note and card IDs,
  decks, due dates, intervals, ease factors, queues, and review counters.
- Read-only rerun: 52 already-current, no generation or note updates.
- Final tests: 39 suites / 310 tests passed. Strict OpenSpec validation:
  8 items passed; `git diff --check` passed.
