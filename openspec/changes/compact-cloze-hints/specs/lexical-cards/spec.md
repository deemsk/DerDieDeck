## ADDED Requirements

### Requirement: Compact learner-visible cloze hints

Lexical cloze hints SHALL be prepared separately from full meaning definitions
and grammatical explanations. Prefer one short Russian gloss; include a brief
grammatical qualifier only when needed. Hints SHALL contain at most eight words
and 80 characters, no repeated glosses, etymology, German target or cloze markup.
The workflow SHALL NOT concatenate selected meanings and generated hints.
Initial and repaired examples SHALL receive a compact hint before uniqueness
verification; preview and saved cloze SHALL use that exact verified hint.
Invalid hints SHALL be regenerated once, then fail without saving. Existing
notes SHALL remain unchanged.

#### Scenario: Deshalb with a verbose definition
- **WHEN** the selected gloss includes therefore, synonyms and an explanation
- **THEN** the hint is a concise Russian gloss such as поэтому.
- **AND** duplicate definitions and invented word-component explanations are omitted.
- **AND** uniqueness is checked using the compact hint, not the original definition.
