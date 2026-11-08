## ADDED Requirements

### Requirement: Consistent bilingual lexical examples

Every learner-facing lexical example SHALL be represented as an associated German text and Russian translation with target and selected-sense context. The workflow SHALL use a shared example lifecycle to verify the pair, apply route-specific target and grammar checks, show the final pair for review, and construct saved cards from the same reviewed data. Phrase and sentence policies SHALL remain appropriate to the card. A changed German text SHALL NOT reuse the old translation without validation. Failed checks SHALL use bounded, feedback-aware repair or explicit recovery; an unavailable translation SHALL NOT silently result in an untranslated example or a generic gloss substituted for a sentence translation.

#### Scenario: Adjective picture phrase
- **WHEN** the selected sense of `fest` is represented by `feste Schraube`
- **THEN** both preview and saved card include the phrase and its corresponding Russian translation.

#### Scenario: Verb and separable particle
- **WHEN** a verb example is reviewed
- **THEN** its German lemma, requested form, particle and selected sense are checked along with the complete Russian translation.

#### Scenario: Sentence changes after review
- **WHEN** enrichment or user review changes the German example
- **THEN** the translation is updated and the pair is revalidated before final preview and saving.

#### Scenario: Adverb or function-word cloze
- **WHEN** a lexical-cloze example is created or repaired
- **THEN** its selected meaning, bilingual pair and route-specific target and uniqueness checks remain aligned.

#### Scenario: Translation cannot be verified
- **WHEN** translation or validation fails after bounded repair
- **THEN** the user can explicitly retry, edit or skip without saving an unverified example.
