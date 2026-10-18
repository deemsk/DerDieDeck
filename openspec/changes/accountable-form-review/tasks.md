- [x] Cover review severity, repair history, malformed review and bounded failure.
- [x] Implement structured review and diagnostic errors.
- [x] Run focused/full tests and validate OpenSpec.

Verification: 46 suites / 472 tests passed, including mocked hör repair,
non-blocking suggestions, successive rejection diagnostics and malformed review.
Strict OpenSpec change validation and diff whitespace checks passed.
No live model call or Anki write was made; semantic classification still depends
on the reviewer model.
