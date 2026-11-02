## ADDED Requirements

### Requirement: Diagnose pronunciation fallback

The application SHALL distinguish a missing human recording from source or audio retrieval failure in optional diagnostics. Normal interactive output SHALL remain concise. Diagnostics SHALL NOT reveal response bodies, URLs, or error messages that may contain secrets.

#### Scenario: Source unavailable
- **WHEN** Wiktionary lookup fails
- **THEN** diagnostics identify a lookup failure and TTS remains available.

#### Scenario: Recording absent
- **WHEN** lookup succeeds but no recording exists
- **THEN** diagnostics identify a missing recording.
