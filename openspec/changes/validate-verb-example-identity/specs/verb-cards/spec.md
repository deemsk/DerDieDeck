## ADDED Requirements

### Requirement: VERB-20 — Validate example lexical identity early

In ordinary sentence and picture verb workflows, before presenting examples,
the application SHALL review whether the
requested form belongs to the intended infinitive and meaning in each sentence.
Token presence alone SHALL NOT establish lexical identity. Rejected candidates
SHALL NOT appear as choices. Manual and preferred sentences SHALL pass the same
check; changed AI revisions SHALL be checked before new audio is generated.
Picture-verb candidate examples SHALL use the same review. Validation failures
SHALL stop preparation with recoverable feedback, not silently admit candidates.

#### Scenario: Separable verb changes the lemma
- **GIVEN** the target is `sieh` from `sehen`
- **WHEN** suggestions include `Sieh bitte nach, ob die Tür zu ist.`
- **THEN** this `nachsehen` example is excluded before selection and audio.

#### Scenario: Ordinary directional preposition
- **GIVEN** the target is `sieh` from `sehen`
- **WHEN** `Sieh nach links.` is reviewed
- **THEN** `nach` is assessed in context and is not rejected merely for occurring.

#### Scenario: All candidates are invalid
- **GIVEN** semantic review rejects every suggestion
- **WHEN** the chooser continues
- **THEN** it offers manual entry or skipping; manual entry is also validated.

#### Scenario: Incomplete or unavailable review
- **WHEN** semantic review fails or omits a candidate verdict
- **THEN** unverified examples are not offered and no sentence audio is prepared.

### Requirement: VERB-21 — Replace examples after explanation failure

When a companion dictionary-form explanation fails, the review dialog SHALL
allow requesting a new example or editing the sentence. New-example revision
SHALL receive the failure reason and preserve the requested infinitive and form.
The replacement SHALL pass lexical-identity review before audio and saving.

#### Scenario: Late lemma mismatch
- **GIVEN** explanation review rejects an example as belonging to another lemma
- **WHEN** the user requests a new example
- **THEN** sentence revision is requested with that reason instead of retrying
  the explanation against the same unchanged sentence.

## MODIFIED Requirements

### Requirement: VERB-18 — Examples match the requested form

When a non-infinitive form is requested in the sentence route, the example
chooser SHALL offer only sentences whose German text contains that form as a
separate word or exact multiword sequence, ignoring case and surrounding
punctuation. It SHALL inspect all generated suggestions before taking the
first three relevant ones. A lemma or another inflection SHALL NOT count as
the requested form. The chosen sentence's focus SHALL remain the requested
form even if analysis supplied a different focus label. Infinitive-only
requests SHALL allow ordinary inflections of the same lemma; all candidates
SHALL pass lexical-identity review before the three-example display limit.

#### Scenario: Imperative among infinitive examples

- **GIVEN** the learner requests `geh` and receives `Geh bitte nach Hause.`,
  `Ich gehe zu Fuß zur Arbeit.`, and `Wir gehen heute ins Kino.`
- **WHEN** example suggestions are prepared
- **THEN** only `Geh bitte nach Hause.` remains eligible for selection, with
  `geh` as its focus; the two other sentences are not shown as choices.

#### Scenario: Match a later suggestion

- **GIVEN** three suggestions use `gehe` or `gehen` and a fourth uses `Geh!`
- **WHEN** suggestions are filtered
- **THEN** the fourth is available because filtering happens before the
  display limit and punctuation does not change the word match.

#### Scenario: No matching suggestion

- **GIVEN** every suggested sentence lacks the requested `geh`
- **WHEN** the chooser opens
- **THEN** it says that no suggestion uses `geh` and invites the learner to
  enter a sentence with `geh` or skip; it does not offer the other forms.

#### Scenario: Picture-route form explanation uses a relevant example

- **GIVEN** a `geh` picture-route analysis puts `Ich gehe zu Fuß zur Arbeit.`
  before `Geh bitte nach Hause.`
- **WHEN** the dictionary-form explanation is prepared
- **THEN** `Geh bitte nach Hause.` is passed as the example context; the
  `gehe` sentence is not used as context for the `geh` answer.

#### Scenario: Manual or explicit sentence lacks the form

- **GIVEN** the requested form is `geh`
- **WHEN** the learner enters a manual sentence with only `gehe`, or supplies
  that sentence explicitly to the workflow
- **THEN** the chooser explains that the sentence must contain `geh`; manual
  entry may be retried or skipped, while an invalid explicit sentence stops
  before note creation.

#### Scenario: Infinitive-only example selection

- **GIVEN** the learner requests `gehen` rather than `geh`
- **WHEN** the sentence chooser opens
- **THEN** up to three examples that pass lexical-identity review are offered;
  conjugated forms of `gehen` remain eligible.
