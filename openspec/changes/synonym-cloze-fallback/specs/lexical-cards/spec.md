## ADDED Requirements

### Requirement: Offer a sentence card for synonym-ambiguous cloze

When uniqueness fails with plausible alternatives, an independent check SHALL
distinguish a correct target/example with interchangeable synonyms from invalid
grammar, wrong sense, missing context or service failure. Only confirmed synonym
ambiguity SHALL offer Sentence card, Edit example or Skip, with Skip as the
default. This SHALL happen before automatic rewriting or fresh lexical analysis.
Sentence fallback SHALL preserve the selected meaning and example, reuse normal
sentence preview and duplicate checks, and create no cloze or main word note.
Edits SHALL repeat structural, hint and uniqueness validation. Incorrect examples
and failed checks SHALL retain the existing bounded repair/error behavior.

#### Scenario: niemals and nie
- **WHEN** the example is correct and the review confirms nie as an interchangeable answer
- **THEN** the learner can choose an audio sentence card without reanalysis or cloze repairs.
- **AND** dismissing creates no notes or audio.
