- [x] Cover sense mismatch, repair failure and preview/save consistency.
- [x] Prepare verified noun examples after meaning selection.
- [x] Run tests and validate OpenSpec.

Verification: 47 suites / 481 tests passed. Schatz integration verifies the
same selected-sense example in preview and saved HTML, and no preview/audio/note
on preparation failure. Model tests cover sense repair and bounded rejection.
Strict OpenSpec validation and whitespace checks passed. No live model calls
or Anki writes were made. This adds generation and independent review before
picture-noun preview; semantic correctness remains model-dependent.
