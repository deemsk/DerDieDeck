# Meaning selection implementation

**Goal:** Present distinct senses with concise, evidence-aware recommendations and existing-card context.

**Architecture:** Fetch matching Anki note evidence before multi-sense selection. Assess candidate equivalence, existing-note matches and relative commonness with one structured validation-model request; validate all indices and confidence before acting, and fail closed. Keep user-provided glosses authoritative. A shared terminal component displays the assessed options and details. All existing duplicate guards remain in place.

**Review focus:** semantic over-merging; falsely asserting absence when Anki is offline; false sense frequency; unintended Enter selection; verb and cloze workflows losing the selected sense.

1. Add a shared selection assessment module and focused tests for confidence, malformed responses, Anki failure and candidate preservation. Reuse existing metadata extraction and OpenAI configuration.
2. Add an English compact terminal selector and tests for colors disabled, Info, skip, edit and no default when uncertain.
3. Integrate into word and verb choice paths before generation depending on the selected sense; preserve explicit `--meaning` and normal duplicate guards.
4. Validate OpenSpec, run focused and full tests and review the resulting changes.
