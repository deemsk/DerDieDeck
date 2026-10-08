## ADDED Requirements

### Requirement: LEX-13 — Russian learner-facing grammar hints

Generated lexical `patternHint` and `clozeHint` SHALL be short Russian
explanations. German lexical forms and grammatical labels MAY appear inside a
Russian explanation. Predominantly German or English prose SHALL NOT be
displayed in the word-summary preview or saved as a learner-facing rule.

#### Scenario: German prose with quoted Russian glosses

- **GIVEN** an analysis of `ihrer` returns a German sentence in `patternHint`
  containing the Russian glosses `её` and `их`
- **WHEN** the analysis is prepared for preview
- **THEN** the hint is requested again in Russian before the preview appears.
- **AND** the German sentence is not displayed under `Грамматика` or saved in a
  new card.

#### Scenario: Russian prose with grammatical terminology

- **GIVEN** a hint reads `Предлог с Akkusativ или Dativ в зависимости от значения`
- **WHEN** the analysis is prepared
- **THEN** the hint is retained without an extra repair request.

#### Scenario: Repair fails or remains in German

- **GIVEN** a targeted repair request fails or returns predominantly German
  prose again
- **WHEN** the word summary or card is built
- **THEN** the invalid optional hint is omitted, while the remaining usable
  analysis continues through the existing review workflow.

#### Scenario: Dry run or dismissal

- **GIVEN** a lexical analysis required a hint repair
- **WHEN** the user previews in dry-run or dismisses the item
- **THEN** the existing no-write and dismissal behavior remains unchanged.
