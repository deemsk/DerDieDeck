- [x] Add regression tests and fix generation/storage behavior.
- [x] Repair affected notes and media references in place.
- [x] Verify tests, OpenSpec and saved Anki fields.

Verification: 51 suites / 514 tests passed, including the pending adjective-form
change. Strict OpenSpec validation and diff checks passed.

Live repair: updated seven notes (four gefallen siblings, Zukunft image reference,
sehen infinitive example, ging lexical gloss). Generated replacement er gefällt
audio and verified the PNG exists. Confirmed all changed fields/tags by readback
and unchanged scheduling fields for eight cards. Anki sync completed successfully.
Backup: /tmp/card-issues-before.json; scheduling backup:
/tmp/card-issues-scheduling-before.json; verified output: /tmp/card-issues-after.json.
