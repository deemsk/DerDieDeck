- [x] Add requested-form-first and optional-infinitive regressions.
- [x] Expand existing-verb lookup and make unknown lookup safe.
- [x] Move full form review first and separate optional infinitive confirmation.
- [x] Run focused/full verification and synchronize OpenSpec.

## Verification
- 45 Jest suites, 454 tests passed.
- Strict OpenSpec change and baseline validation passed.
- Audited all source call sites of both legacy confirmation helpers. Removed
  their requested-form placeholder renderers; guarded entry points prevent a
  future route from accidentally showing an incomplete form preview.
- Source search found no old continuation/placeholder text remaining.
- Regression coverage includes missing/existing picture/Basic/sentence lemmas,
  failed lookup, skipped form, skipped/accepted optional infinitive, lazy audio,
  dry-run, independent writes, and companion duplicate/failure outcomes.
- Independent read-only review found no routing or write blockers. Its optional
  preview finding was resolved by showing saved example/translation/context and
  contrast before Add, with a regression test.
- No Anki notes or media were modified during verification.
