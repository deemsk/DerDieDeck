## ADDED Requirements

### Requirement: Preserve the stored media filename

Media storage SHALL use the nonempty filename returned by AnkiConnect, including
any normalized extension or renamed basename. An invalid return SHALL fail
instead of constructing a note with an assumed filename.

#### Scenario: PNG extension normalization
- **WHEN** a local .PNG upload returns an Anki filename ending in .png
- **THEN** generated image references use the returned .png filename exactly.
