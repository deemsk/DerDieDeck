## ADDED Requirements

### Requirement: VERB-24 — Meaning before example selection

Verb preparation SHALL display the shared framed dictionary summary after a
meaning is selected and before any example-selection prompt. It SHALL show the
requested target, lexical type, selected meaning, and available pronunciation.
For a non-infinitive target, lemma-level meaning and pronunciation SHALL be
explicitly labeled as infinitive data. The shared word/verb summary SHALL use
English interface labels while retaining Russian learner content. Missing data
SHALL not create empty rows or invented grammatical claims.

#### Scenario: Infinitive with examples
- **GIVEN** `aufräumen` is accepted with the meaning `прибираться`
- **WHEN** examples are offered
- **THEN** a framed summary first identifies `aufräumen` as a verb and displays
  `прибираться`, plus IPA when available.

#### Scenario: Requested form
- **GIVEN** the learner requested `ging`, normalized to `gehen`
- **WHEN** the summary appears
- **THEN** `ging` is the target and `gehen`, its meaning and IPA are labeled as
  infinitive data, not as the requested form's translation or pronunciation.

#### Scenario: Meaning dismissed
- **WHEN** the learner cancels meaning selection
- **THEN** no summary or example selection follows.
