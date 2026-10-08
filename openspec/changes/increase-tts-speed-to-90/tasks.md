## Implementation

- [x] Set the main TTS default and matching fallbacks to `0.9`.
- [x] Update configuration documentation.
- [x] Run focused TTS tests and verify default configuration behavior.
- [x] Update the baseline specification after verification and validate
  OpenSpec.

## Verification Record

- The active legacy user config has no `ttsSpeed` override. The loaded rate is
  `0.9`, the word-audio plan returns `0.9`, and Neural2-B/C remain selected.
- Focused TTS, word-workflow, and verb-workflow tests: 3 suites, 40 tests passed.
- The existing `0.75` default and fallback literals are absent from `src` and
  `README.md`.
