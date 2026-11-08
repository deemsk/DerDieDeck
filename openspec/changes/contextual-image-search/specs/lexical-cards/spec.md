## ADDED Requirements

### Requirement: Image searches reflect the selected sense

The image-search query SHALL prioritize a concrete scene associated with the selected lexical meaning over generic category templates. A picture-word workflow SHALL request one scene query in the context of the chosen sense and available example.

The same preparation SHALL be used for picture verbs and sentence-word image selection. The application SHALL use one model request to generate the query, without a separate model review or automatic regeneration.

Secret lookup and the optional model request SHALL have bounded timeouts, and the request SHALL NOT silently retry before falling back.

For sentence cards, the final example SHALL be optional context: the image MAY depict a different scene or subject to illustrate the selected meaning more memorably. On failure, use sense-specific terms or the final sentence before the bare target. Use the confirmed infinitive example for its optional picture card.

When the learner provides an unmatched or edited meaning, fallback searches SHALL NOT use an English gloss inherited from another meaning. Use its verified example if available, otherwise the target word.

#### Scenario: School class as pupils
- **WHEN** the chosen meaning of Klasse is a group of pupils
- **THEN** searches depict pupils together, and a generic sign for an institution does not take priority.

#### Scenario: A scene query is unavailable
- **WHEN** the contextual generation cannot be completed
- **THEN** the learner can continue using available search terms without inventing a category-specific action or sign.

#### Scenario: Ground is the target
- **WHEN** the selected meaning of Boden is outdoor ground or soil
- **THEN** the query makes the ground visually prominent, for example bare feet standing on visible soil, rather than focusing on unrelated people with the ground as background.
