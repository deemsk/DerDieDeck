- [x] Inspect the reported dialog and current routing requirement.
- [x] Draft the proposal and LEX-01 delta in English.
- [x] Review the proposed dialog with the user.
- [x] Add focused dialog tests and observe the regressions before implementation.
- [x] Render numbered interpretations with accurate labels and available meanings.
- [x] Accept numeric choices while preserving compatibility aliases and skip behavior.
- [x] Run focused routing/dialog tests and inspect representative terminal output.
- [x] Synchronize the baseline specification and record verification evidence.
- [x] Validate OpenSpec and review the final diff.

## Verification Record

- Work stays on `main`, as requested. No existing Anki notes are modified.
- The dialog is exposed with injectable terminal I/O, following the existing
  module's dependency-injection pattern. The original rendering and selection
  logic failed 13 of 17 dialog checks before the behavior was changed.
- Focused routing/dialog tests: 3 suites / 28 tests passed.
- Full suite: 42 suites / 365 tests passed.
- A real terminal session displayed `Particle: lass` and
  `Verb form: lass → lassen — позволять, оставлять`; typing `2` returned `verb`.
- After selection the confirmation identifies the selected interpretation number,
  keeping internal workflow names out of this dialog.
- Independent read-only review found no actionable bugs or specification gaps;
  its focused run passed 27 tests across the dialog and lexical-mode suites.
- Strict OpenSpec validation passed all 11 specifications/changes; final diff
  whitespace validation passed.
