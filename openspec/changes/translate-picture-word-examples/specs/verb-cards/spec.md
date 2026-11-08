## ADDED Requirements

### Requirement: Bilingual verb example lifecycle

Verb picture, sentence, dictionary-form and morphology-package examples SHALL use the shared bilingual example lifecycle. The verb-specific policy SHALL check the selected sense and the identity of the verb, including its requested form and separable particle when relevant. The German example and its full Russian translation SHALL be reviewed together and the confirmed pair SHALL be used in the card. When the German example changes, translations tied to the previous example SHALL NOT be reused without validation.

#### Scenario: Changed morphology-package example
- **WHEN** enrichment changes the German example for a verb form
- **THEN** its previous example-specific Russian wording is not copied to the changed example
- **AND** the new bilingual pair and the form's morphology are checked before preview and saving.

#### Scenario: Verb translation is inconsistent
- **WHEN** the Russian translation does not match the German verb example or selected meaning
- **THEN** the example is not saved without a successful repair or an explicit recovery choice.
