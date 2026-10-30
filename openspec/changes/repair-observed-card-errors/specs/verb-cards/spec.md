## ADDED Requirements

### Requirement: Keep finite verb targets and lexical glosses accurate

Morphology normalization SHALL strip complete grouped pronoun prefixes before
splitting alternative verb forms. Pronoun-only targets SHALL be rejected before
package planning, audio or note creation. The example must contain a verb token
distinct from its subject. Optional infinitive cards SHALL use a separately
verified example containing the infinitive itself and SHALL NOT inherit a form
example or a form-to-lemma caption. Failure to prepare this optional example
SHALL leave the accepted requested-form card available for creation.

Form meanings SHALL not present an idiomatic translation of a whole construction
as the lexical meaning of one token. The natural construction translation belongs
in the example and its usage explanation.

#### Scenario: Grouped pronouns in morphology
- **WHEN** a source returns er/sie/es gefällt
- **THEN** the finite target is gefällt, not er.
- **AND** a pronoun-only target cannot produce a cloze on the sentence subject.

#### Scenario: Infinitive companion to sah
- **WHEN** an optional sehen card is prepared after sah
- **THEN** its own preview and saved example contain sehen, with no sah → sehen caption.

#### Scenario: ging ins Bett
- **WHEN** ging is explained in a sentence with ins Bett
- **THEN** the lexical gloss is шёл / пошёл rather than standalone лёг.
- **AND** the complete example can naturally translate the construction as лёг спать.
