## ADDED Requirements

### Requirement: Preserve meaning during lexical cloze repair

The workflow SHALL stop its progress spinner before asking for a cloze meaning.
The intended meaning SHALL be selected once before uniqueness checking and added
to the learner-visible hint. Repair SHALL receive only that selected meaning
and SHALL preserve it rather than switching to another sense or construction.
A blank meaning selection SHALL skip the item. Repaired examples SHALL be
displayed before saving.

#### Scenario: Degree adverb recht
- **WHEN** the learner selects the degree meaning of recht
- **THEN** uniqueness checking and repair use that meaning as a binding constraint.
- **AND** repair is not offered recht haben as an alternative sense.
- **AND** no progress spinner runs while meaning input is awaited.
