## Implementation

- [x] Add a failing regression for German prose with only quoted Russian
  glosses, while retaining Russian hints with German grammar terms.
- [x] Add a targeted repair step before analysis sanitization and discard an
  invalid result if repair fails.
- [x] Verify the preview and saved rule consume only the validated hint.
- [x] Run focused word tests, the full suite, and strict OpenSpec validation.
- [x] Synchronize the lexical-cards baseline after verification.

## Verification Record

- The regression test failed on the reported `ihrer` sentence before the
  sanitizer change and passed after it.
- Targeted repair tests cover a valid Russian result, a repeated German result,
  and an API failure. Valid Russian prose with German grammatical terms remains
  accepted.
- A read-only live `enrichWord("ihrer")` run produced a Russian grammar hint
  in `formatWordDictionarySummary`; no Anki write was made.
- Focused word tests passed: 3 suites, 44 tests. Full suite passed: 42 suites,
  390 tests. Strict OpenSpec validation passed.
