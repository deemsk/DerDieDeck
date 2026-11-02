## ADDED Requirements

### Requirement: Recover interrupted verb card sets

The application SHALL journal each approved multi-note verb card set before creating its first note. It SHALL preserve exact prepared note payloads and verify collection and media before recovery. After interruption, the existing resume command SHALL reconcile operation-and-step tags and create only missing notes.

#### Scenario: Lost form response
- **WHEN** a form note was saved but its response was lost
- **THEN** resumption identifies that note and creates only the remaining approved notes.

#### Scenario: Interrupted morphology package
- **WHEN** a package is interrupted between any two notes
- **THEN** resumption preserves confirmed notes and completes the remaining approved steps without regenerating them.

#### Scenario: Existing companion card
- **WHEN** Anki explicitly rejects an optional companion lemma or sentence as a duplicate after the form note is confirmed
- **THEN** the journal records that companion as already existing and does not retry it.
