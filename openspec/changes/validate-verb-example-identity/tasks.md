## Implementation
- [x] Add failing regressions for lexical identity review, early filtering, and recovery.
- [x] Implement shared semantic review and use it at candidate/manual/revision boundaries.
- [x] Strengthen prompts and add late new-example/edit recovery.
- [x] Run focused and full tests, update baseline, validate OpenSpec.

## Verification evidence
- Regression tests failed before the implementation: missing semantic review,
  another lemma passing the chooser, absent new-example recovery, and limiting
  suggestions before semantic filtering.
- Full Jest suite: 45 suites, 442 tests passed.
- Strict OpenSpec validation: change and baseline passed.
- Live configured validation-model smoke test on 2026-10-09 accepted
  `Sieh, der Arzt kommt vorbei.`, `Sieh mal, wie hübsch das Zimmer ist.`, and
  `Sieh nach links.`; rejected `Sieh bitte nach, ob die Tür zu ist.`.
  This requested no Anki writes or audio generation.
- Independent code review found no blocking issues within this bounded scope.
- Isolated the existing picture-word test from the local learner-profile cache;
  its success must not depend on the user's cached Anki progress.
- Each candidate batch adds one semantic validation request. Manual replacements
  and changed AI revisions are checked separately. Semantic review remains a
  model judgment; deterministic checks also guard surface form and response shape.
