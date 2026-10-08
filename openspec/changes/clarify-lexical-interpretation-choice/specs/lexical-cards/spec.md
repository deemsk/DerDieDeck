## MODIFIED Requirements

### Requirement: LEX-01 — Word or verb routing

Lexical input SHALL be routed to the word or verb workflow based on usable
analysis, with manual selection when both interpretations are usable or both
are weak. The manual dialog SHALL present numbered linguistic interpretations
rather than a `word` versus `verb` choice. It SHALL identify uncertainty and
display the available part of speech, encountered form, and infinitive where
applicable, without inventing missing linguistic information.

#### Scenario: Unambiguous verb

- **GIVEN** only the verb analysis contains a usable structure
- **WHEN** the workflow is selected
- **THEN** the verb workflow is used without the ambiguity dialog.

#### Scenario: Ambiguous input

- **GIVEN** both analyses are usable, with `lass` proposed as a particle and as
  a form of `lassen`
- **WHEN** automatic selection is inconclusive
- **THEN** the dialog asks which interpretation the learner intends and identifies
  the rows as uncertain candidates: `1. Particle: lass` and
  `2. Verb form: lass → lassen`.
- **AND** the prompt displays numeric choices and Skip, without opposing `Word`
  to `Verb` as linguistic categories.

#### Scenario: Existing meanings help distinguish candidates

- **GIVEN** a candidate analysis contains a nonempty Russian meaning
- **WHEN** the dialog is rendered
- **THEN** it shows the first available meaning alongside the corresponding
  lexical item without making an additional generation request.
- **AND** a verb's lexical meaning is visibly associated with its infinitive;
  it is not presented as the translation of an inflected form.

#### Scenario: An infinitive is the input

- **GIVEN** the encountered verb form equals the infinitive
- **WHEN** its candidate row is rendered
- **THEN** it is labeled `Verb` and the infinitive appears once, without a
  redundant form-to-infinitive arrow.

#### Scenario: Both analyses are weak or information is missing

- **GIVEN** neither analysis is reliable
- **WHEN** the dialog is rendered
- **THEN** it states that neither analysis is reliable and marks any missing
  candidate type or lexical item as unavailable.
- **AND** missing type information is not inferred as `noun`; missing meanings
  produce no placeholder glosses.

#### Scenario: Numeric choice and compatibility inputs

- **GIVEN** the manual dialog is active
- **WHEN** the user enters `1`, `w`, or `word`, case-insensitively
- **THEN** the existing word workflow receives the word analysis.
- **WHEN** the user enters `2`, `v`, or `verb`, case-insensitively
- **THEN** the existing verb workflow receives the verb analysis.
- **AND** leading and trailing whitespace is ignored.

#### Scenario: Dismissal and invalid input

- **GIVEN** the manual dialog is active
- **WHEN** the user enters an empty response, `s`, or `skip`, case-insensitively
- **THEN** the item is skipped; the prompt explicitly states that Enter means Skip.
- **WHEN** the response is not a supported choice
- **THEN** the dialog asks again without selecting or creating anything.

#### Scenario: Preliminary routing fails

- **GIVEN** preliminary classification is unavailable
- **WHEN** input is processed
- **THEN** the application attempts both word and verb analysis instead of immediately rejecting it.
