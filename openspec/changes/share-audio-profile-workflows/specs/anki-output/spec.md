## ADDED Requirements

### Requirement: Shared lexical audio preparation

Word, verb, and requested form workflows SHALL use common pronunciation preparation while retaining their existing error handling. The exact requested form SHALL be used for pronunciation lookup; human audio SHALL be preferred, with TTS fallback. Sentence audio preparation SHALL use shared synthesis logic. Preview-only pronunciation SHALL NOT download audio.

#### Scenario: Requested form
- **WHEN** a form differs from its infinitive
- **THEN** its audio uses the form rather than the infinitive.

#### Scenario: Human audio unavailable
- **WHEN** retrieval fails or no recording exists
- **THEN** TTS generates the spoken text for the target.
