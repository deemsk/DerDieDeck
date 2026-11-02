## MODIFIED Requirements

### Requirement: CTX-03 — Warning and synchronization limits

Lexical workflows SHALL display a profile warning at most once per session and
disable preliminary Anki synchronization when requesting a profile during card generation, including dry-run. Profile reads SHALL use the local collection so a timed-out progress check cannot leave a background sync blocking card creation.

#### Scenario: Multiple words with an unavailable profile

- **GIVEN** the warning has already been shown for the first word
- **WHEN** the next word receives the same profile state
- **THEN** the warning is not displayed again.

#### Scenario: Profile during preview

- **GIVEN** dry-run is enabled
- **WHEN** lexical workflows requests a profile
- **THEN** it disables synchronization; Anki reads and local cache writes may
  still occur after a successful refresh.

