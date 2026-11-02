## ADDED Requirements

### Requirement: Report partial note creation

When a sentence-form word workflow fails after its main note is confirmed, it SHALL report the confirmed notes and their searchable Anki IDs. It SHALL explain that the failed request may also have succeeded and stop without automatically regenerating or replaying the workflow. It SHALL not delete already-created notes.

#### Scenario: Second card fails
- **WHEN** the main word note succeeds and the sentence note fails
- **THEN** the user sees the confirmed main note and is asked to inspect Anki before retrying.
