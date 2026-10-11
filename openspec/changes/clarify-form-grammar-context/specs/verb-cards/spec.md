## MODIFIED Requirements

### Requirement: VERB-08 — Context and ambiguity

The explanation SHALL distinguish what the isolated form establishes from the
interpretation selected by its example, without inventing a unique grammatical
reading where the form is ambiguous. The `grammar` field SHALL describe the
reading in the final example, including its contextual person and number.
Other common readings of the isolated form SHALL be explained in `ambiguity`.
These field responsibilities SHALL be identical in generation, repair, and
semantic review, whether the example was supplied or generated.

#### Scenario: Ambiguous person without original context

- **GIVEN** `wäre` is supplied without an original sentence or subject
- **WHEN** an example using `ich` is generated
- **THEN** the answer identifies first- and third-person singular as possible for
  the isolated form and labels the example's first-person reading as contextual.

#### Scenario: Passive werden in the selected sentence

- **GIVEN** the target is `wurde` and the selected sentence is `Er wurde gefragt.`
- **WHEN** the explanation is prepared
- **THEN** it identifies `wurde` as the past auxiliary in a passive construction
  and translates the sentence as `Его спросили.` or an equivalent natural translation.
- **AND** it does not translate `wurde` as `стал` within that sentence.

#### Scenario: Distinct ambiguous form

- **GIVEN** the isolated target `sind` from `sein` has no original subject
- **WHEN** the answer uses an example with `wir`
- **THEN** it does not claim that `sind` can only mean first-person plural;
  it notes the applicable `wir`, `sie`, and formal `Sie` readings.

#### Scenario: Syncretic past form with an explicit subject

- **GIVEN** the target is `ging` from `gehen` and the example is
  `Der Arzt ging nach Hause.`
- **WHEN** its explanation is generated or reviewed
- **THEN** `grammar` identifies Präteritum Indikativ, third-person singular in
  this example, and `ambiguity` notes the isolated form's first-person reading.
- **AND** the reviewer does not demand listing both persons in `grammar` or
  reject contextual third person as a false claim about the isolated form.
