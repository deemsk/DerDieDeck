## ADDED Requirements

### Requirement: Noun examples match the selected meaning

Before a picture-noun preview, the workflow SHALL prepare a short example for
the selected meaning and independently verify the target, sense and Russian
translation. Analysis examples are candidates only, not automatically accepted.
Manual meanings and single-meaning nouns SHALL use the same check. A failed
check SHALL allow one repair using feedback, then fail without saving a note.
Preview and saved card SHALL use the same verified example. Other senses SHALL
not be supplied as possible meanings during preparation.

#### Scenario: Schatz as an affectionate address
- **WHEN** the learner selects the affectionate-address meaning of Schatz
- **THEN** the example uses that meaning rather than a treasure or buried hoard.
- **AND** the same German example and Russian translation appear in preview and saved output.
