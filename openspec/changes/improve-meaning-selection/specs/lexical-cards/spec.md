## ADDED Requirements

### Requirement: Select distinct meanings using collection context

When a lexical item has multiple candidate meanings, the application SHALL conservatively merge confidently equivalent senses while retaining genuinely distinct or uncertain candidates. It SHALL check relevant existing notes before presenting guidance, and distinguish confirmed existing, possibly existing, and unconfirmed senses. It SHALL indicate whether commonness is based on evidence or an estimate, and SHALL NOT fabricate sense-frequency statistics. It SHALL suggest an unrepresented alternative only when justified, while allowing the learner to select any candidate, edit, or skip. If no recommendation is justified it SHALL require an explicit selection. Failure of collection lookup or semantic assessment SHALL retain the candidates and display that guidance is unavailable, not assert absence. Explicitly supplied meanings SHALL remain authoritative. Normal duplicate protection SHALL remain in effect.

#### Scenario: Equivalent options
- **WHEN** two glosses express the same sense with high confidence
- **THEN** one concise option is shown; semantically distinct or uncertain candidates remain separate.

#### Scenario: Common meaning already exists
- **WHEN** the likely common sense is confidently matched to an existing note and a distinct unrepresented alternative exists
- **THEN** the existing sense is identified and the alternative can be recommended without misrepresenting its frequency.

#### Scenario: Collection unavailable
- **WHEN** Anki cannot be checked
- **THEN** all candidates remain selectable and no candidate is represented as absent from the collection.

#### Scenario: Compact, accessible status display
- **WHEN** the choice is shown
- **THEN** it uses a framed English-language interface, short text status labels that remain understandable without color, and action shortcuts visually distinct from the lexical target. Existing-note details are available on request.

#### Scenario: Guidance is uncertain
- **WHEN** a match is uncertain or collection lookup fails
- **THEN** the interface indicates uncertainty or unavailability without using an unmarked row as proof of absence.

#### Scenario: Uncertain semantic merge
- **WHEN** an assessment merges candidate senses
- **THEN** the original meanings remain individually selectable and the merged option is never selected by an implicit default.

#### Scenario: Merged gloss matches an existing card
- **WHEN** a selected merged option contains a gloss matching an existing card
- **THEN** the duplicate check treats that original gloss as an exact match.

#### Scenario: Legacy note without meaning metadata
- **WHEN** a matching legacy sentence or cloze note lacks embedded meaning metadata
- **THEN** available card content is included as contextual evidence, without treating a sentence translation alone as a verified lexical gloss.

#### Scenario: An existing merged card is checked against an original gloss
- **WHEN** a selected gloss matches a component preserved in an existing merged note
- **THEN** duplicate detection treats it as an exact match. Previously stored notes without component metadata are checked using top-level semicolon-separated glosses, without splitting qualifiers inside brackets.

#### Scenario: Requested form has a different lemma
- **WHEN** the requested lexical form differs from its lemma
- **THEN** meaning guidance checks both forms, identifies lemma-derived evidence as such, and does not claim the requested form itself already has a card.
