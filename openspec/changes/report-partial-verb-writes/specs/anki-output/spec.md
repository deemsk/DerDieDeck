## ADDED Requirements

### Requirement: Report partial verb note creation

When verb note creation fails after one or more confirmed notes, the workflow SHALL list their searchable IDs, explain that an unsuccessful request may have succeeded, and stop without automatically retrying. It SHALL leave saved notes intact.

#### Scenario: Form is saved before sentence fails
- **WHEN** a form note is confirmed and its sentence note fails
- **THEN** the form note ID is reported and the user can inspect Anki before retrying.

#### Scenario: Morphology package fails midway
- **WHEN** some package notes are confirmed before a later failure
- **THEN** each confirmed note ID is reported, including a production note saved before recognition fails.
