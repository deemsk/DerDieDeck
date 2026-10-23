## ADDED Requirements

### Requirement: Cross-route lexical duplicate decisions

Lexical duplicate lookup SHALL search picture words, main word notes, sentence
notes and lexical cloze notes together. The same headword SHALL remain visible
even if its part of speech or Russian gloss differs. Literal translation
differences SHALL NOT authorize automatic creation of another word card.
Known exact meanings SHALL not permit another main word card; sentence routes
MAY add an example only. Other headword matches SHALL require explicit selection
of a new meaning, with Skip as the safe default except sentence routes where
Example only is the default. Existing notes SHALL be listed with their meanings
and searchable nid references. Legacy metadata-free picture notes and tagged
sentence notes SHALL be considered. Existing Anki notes SHALL not be modified.

#### Scenario: ganz moves from picture to sentence workflow
- **GIVEN** a picture word ganz already exists with a paraphrase of the new gloss
- **WHEN** the sentence workflow checks duplicates
- **THEN** it shows that existing note and defaults to adding only the example.
- **AND** no main word audio or main word note is created in example-only mode.
