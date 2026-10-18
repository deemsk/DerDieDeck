- [x] Cover meaning selection ordering and repair constraints.
- [x] Fix spinner lifetime and scope meaning before validation.
- [x] Run regression tests and validate OpenSpec.

Verification: 46 suites / 473 tests passed. Workflow regression checks
spinner stop before meaning input, single selection before validation, and
selected-only repair context for recht. Strict OpenSpec validation passed.
No live API generation or Anki writes were performed. Semantic adherence
remains model-dependent; uniqueness checking retains the visible meaning hint.
