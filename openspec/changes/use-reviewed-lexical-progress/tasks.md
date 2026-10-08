## Implementation
- [x] Add regression tests for extraction, review states, and clean prompts.
- [x] Replace arbitrary field extraction and note-based CEFR estimation.
- [x] Add compatible-cache, partial-failure, expiry, and session refresh tests.
- [x] Harden snapshot/cache handling and bounded session reuse.
- [x] Carry context into mixed and direct word/verb generation and form examples.
- [x] Verify target/sentence preservation and unavailable-profile behavior.
- [x] Run focused and full tests, inspect a rebuilt read-only Anki profile,
  synchronize baseline specifications, and validate OpenSpec.

## Verification results

- Full Jest suite: 44 suites, 427 tests passed.
- Strict OpenSpec validation: passed.
- Read-only Anki inspection on 2026-10-08, with synchronization disabled:
  1,058 notes, 1,420 cards, 416 explicit lexical targets; 370 familiar,
  33 learning, 13 without active review evidence. No sampled instruction or IPA
  contamination remained. Anki notes and media were not changed.
- The earlier version-1 cache contained 762 entries, including sentence/IPA and
  task text. Its note count differed (1,042), so this is a diagnostic comparison,
  not a same-snapshot quantitative benchmark.
- Profile preferences and target preservation are tested with mocked generation
  responses. No claim of measured learning gains or model-output quality uplift
  is made; that requires subsequent example review and learner feedback.
- Existing notes are not migrated. The next successful normal refresh replaces
  the derived version-1 cache with version 2.
