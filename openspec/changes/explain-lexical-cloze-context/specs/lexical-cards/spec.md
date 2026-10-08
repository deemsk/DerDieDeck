## ADDED Requirements

### Requirement: LEX-11 — Concise explanations of the final cloze context

Lexical cloze preparation SHALL derive and validate its Russian explanation from
the target, selected meaning, and final German sentence. It SHALL explain the
target's contextual meaning or construction using only relevant details. Generic
part-of-speech fallback prose, repeated translations, and unrelated readings
SHALL NOT be shown. When no useful explanation is needed, the rule block SHALL
be absent. Preparation failure SHALL remain distinguishable from intentional omission.

#### Scenario: Correlative comparison

- **GIVEN** the target is `je` in `Je mehr du übst, desto besser wirst du.`
- **WHEN** the explanation is prepared
- **THEN** it explains `je … desto …` as `чем …, тем …`, identifies the comparative
  forms `mehr` and `besser`, and illustrates the word order using `je mehr du übst`
  and `desto besser wirst du`.
- **AND** it does not use the generic adverb fallback or explain unrelated uses of `je`.

#### Scenario: The same target has a different use

- **GIVEN** the target is `je` in `Die Tickets kosten je zehn Euro.`
- **WHEN** the explanation is prepared
- **THEN** it explains the distributive meaning `по десять евро за каждый билет`
  without adding the `je … desto …` construction.

#### Scenario: A sentence is changed during preparation

- **GIVEN** an initial lexical hint or earlier sentence has already been prepared
- **WHEN** cloze repair or enrichment changes the sentence
- **THEN** the saved explanation is validated against the final sentence, not
  accepted solely because the earlier hint is nonempty.

#### Scenario: No additional learning information

- **GIVEN** contextual review finds no useful rule beyond the existing answer
- **WHEN** the answer is rendered
- **THEN** it contains no rule heading, placeholder, or generic fallback sentence.

#### Scenario: Invalid or unavailable explanation

- **GIVEN** explanation preparation fails or returns an irrelevant explanation
- **WHEN** the workflow cannot produce a validated result
- **THEN** it reports a recoverable failure and does not create that note with
  unvalidated content or silently substitute generic prose.

### Requirement: LEX-12 — Visible and consistent cloze explanations

The lexical-cloze terminal preview SHALL show the complete prepared explanation
as a distinct labeled section when present. Preview and saved answer SHALL use
the same prepared content. Existing dismissal, duplicate, and dry-run guarantees
SHALL remain in effect.

#### Scenario: Preview and save

- **GIVEN** a validated contextual explanation is available
- **WHEN** the note is previewed and created
- **THEN** the displayed explanation and saved rule block agree, with readable
  separation from the sentence and translation.

#### Scenario: Dry-run

- **GIVEN** dry-run mode is enabled
- **WHEN** preparation succeeds
- **THEN** the explanation is included in the preview and no Anki notes or media
  are written.

#### Scenario: Duplicate or dismissed input

- **GIVEN** the workflow detects an exact duplicate or the user dismisses the item
- **WHEN** creation stops
- **THEN** no new note is created and the existing note is not implicitly migrated.
