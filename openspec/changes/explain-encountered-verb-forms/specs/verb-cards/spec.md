## MODIFIED Requirements

### Requirement: VERB-06 — Dictionary-form card

The ordinary verb workflow SHALL honor the user's final choice about creating an
additional card that explains the encountered form and connects it to its infinitive.

#### Scenario: Additional card selected

- **GIVEN** sentence-form is selected and the user leaves the dictionary-form card enabled
- **WHEN** the note is successfully prepared and confirmed for writing
- **THEN** an additional `mode-verb-dictionary` note is created with the encountered
  form on Front and its meaning, grammatical explanation, translated usage example,
  and separately labeled infinitive information on Back.

#### Scenario: Additional card disabled

- **WHEN** the user disables the dictionary-form card in the final preview
- **THEN** the sentence note is created without that additional note.

#### Scenario: Picture-word verb with an encountered form

- **GIVEN** a picture-word verb has an encountered form different from its infinitive
- **WHEN** the user enables and confirms the dictionary-form card
- **THEN** its answer follows the same form-explanation contract as in sentence-form mode.

## ADDED Requirements

### Requirement: VERB-07 — Meaning and grammar of the encountered form

The dictionary-card answer SHALL explain the encountered form in Russian with a
form-level meaning, its applicable tense and/or mood, person and number where
applicable, and a concise usage explanation. The infinitive's lexical translation
alone is insufficient.

#### Scenario: Hypothetical sein

- **GIVEN** the target is `wäre` from `sein`, with the example `Ich wäre gern zu Hause.`
- **WHEN** the answer is revealed
- **THEN** it conveys the hypothetical or desired sense, such as `был бы`, identifies
  Konjunktiv II, and explains its use for an imagined state or wish.
- **AND** it does not describe the form as an ordinary past event merely because
  its morphology derives from the preterite.

#### Scenario: Past lexical werden

- **GIVEN** the target is `wurde` from `werden`, with the example `Er wurde müde.`
- **WHEN** the answer is revealed
- **THEN** it explains the past change of state, identifies Präteritum and Indikativ,
  and translates the example as a complete sentence, such as `Он устал.`
- **AND** a brief contrast distinguishes `wurde` from the Konjunktiv II form `würde`.

#### Scenario: Present-tense form

- **GIVEN** the target is `läuft` from `laufen`, with the example `Er läuft im Park.`
- **WHEN** the answer is revealed
- **THEN** it identifies Präsens, Indikativ, and third-person singular, and gives a
  form meaning consistent with that sentence, rather than only `бежать`.

#### Scenario: Participle is not a complete tense

- **GIVEN** the target is `verbunden` from `verbinden`
- **WHEN** the form is explained
- **THEN** it is identified as Partizip II, with no invented finite person or number.
- **AND** the example explains its actual construction; the isolated participle is
  not labeled as a complete finite past tense by itself.

### Requirement: VERB-08 — Context and ambiguity

The explanation SHALL distinguish what the isolated form establishes from the
interpretation selected by its example, without inventing a unique grammatical
reading where the form is ambiguous.

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

### Requirement: VERB-09 — Usage example tied to the target

Each dictionary-card answer SHALL include a short German example containing the
target form and a natural Russian translation of the complete sentence. A suitable
final selected sentence takes precedence over generating an unrelated example.

#### Scenario: Selected sentence illustrates the form

- **GIVEN** the final selected sentence is `Ich wäre gern zu Hause.` and the target is `wäre`
- **WHEN** the answer is prepared
- **THEN** that sentence and its full Russian translation appear with an explanation
  consistent with its meaning and grammar.

#### Scenario: Example uses the wrong form

- **GIVEN** the target is `wäre` but the proposed example contains `war` instead
- **WHEN** the answer is checked before writing
- **THEN** the example is rejected and the dictionary note is not written with it.

#### Scenario: Separable form

- **GIVEN** the target is `kommt an` and the example is `Er kommt heute an.`
- **WHEN** example validity is checked
- **THEN** the separated verb and particle count as the target form even though
  they are not adjacent.

#### Scenario: Sentence revised during preview

- **GIVEN** the user revises the selected sentence before confirming the note
- **WHEN** the dictionary-card answer is prepared for final confirmation
- **THEN** the example, translation, and form explanation reflect the final sentence
  and target form, with no stale explanation from the previous preview.

### Requirement: VERB-10 — Answer structure and preview

The answer SHALL place form meaning and grammar first, its example next, and a
separately labeled infinitive block with lexical meaning and available pronunciation
last; preview SHALL expose this content before the dictionary note is written.

#### Scenario: Infinitive pronunciation remains identifiable

- **GIVEN** a `wäre` card has audio and IPA for `sein`
- **WHEN** the answer is shown
- **THEN** the pronunciation appears inside the infinitive block and is not
  presented as the pronunciation of `wäre`.

#### Scenario: Front preserves recall

- **WHEN** the new dictionary-form card is shown before revealing its answer
- **THEN** Front contains the target form without its grammatical explanation,
  translation, or answered example.

#### Scenario: Dry-run

- **GIVEN** the dictionary-form card is enabled and dry-run is active
- **WHEN** preparation succeeds
- **THEN** the user can review its form meaning, grammar, example, and infinitive
  information without writing the note or uploading media to Anki.

#### Scenario: User dismisses the explained card

- **GIVEN** the complete proposed dictionary-card answer is visible in preview
- **WHEN** the user opts out of creating that card
- **THEN** no dictionary-form note is written.

### Requirement: VERB-11 — Incomplete explanation handling

If a complete explanation or valid target example cannot be prepared, the workflow
SHALL report the failure and leave that dictionary note unwritten rather than
silently creating a lemma-only answer. The user may retry or continue without the
optional dictionary card.

#### Scenario: Missing form explanation

- **GIVEN** preparation returns only an infinitive and its translation
- **WHEN** the dictionary-card content is checked
- **THEN** the application reports the missing explanation and offers retry or
  continuing without that card, without writing a deficient dictionary note.

#### Scenario: User continues with the main note

- **GIVEN** dictionary explanation failed but the main sentence or picture note is ready
- **WHEN** the user chooses to continue without the optional dictionary card
- **THEN** the main note may be created under its existing confirmation and duplicate
  rules, without creating the dictionary note.

### Requirement: VERB-12 — Migration of existing dictionary-form notes

The application SHALL support upgrading existing `mode-verb-dictionary` notes to
the new answer contract in place, preserving their note and card IDs, Front, note
type, deck assignment, existing tags, and review history.

#### Scenario: Existing wäre note

- **GIVEN** an existing `mode-verb-dictionary` note shows `wäre` on Front and only
  `sein`, its pronunciation, and `быть` on Back
- **WHEN** its prepared migration is applied
- **THEN** Back contains the form explanation, translated example, and infinitive
  block, with the existing infinitive audio/IPA retained when available.
- **AND** the note and its review cards retain their IDs, history, and scheduling;
  no replacement note or card is created.

#### Scenario: Unrelated note

- **GIVEN** a sentence or key-form note contains `wäre` but lacks `mode-verb-dictionary`
- **WHEN** migration candidates are selected
- **THEN** that note is excluded.

#### Scenario: Legacy data cannot be interpreted safely

- **GIVEN** an existing dictionary-form note's target or lemma cannot be established
  from its fields and metadata without guessing
- **WHEN** its migration is prepared
- **THEN** it is reported as skipped for manual review, with its fields unchanged.

### Requirement: VERB-13 — Migration preview and write protection

Migration SHALL default to a read-only Anki preview showing each candidate's ID,
target form, old answer, proposed answer, and status; applying prepared updates
requires an explicit apply action and a local backup of original note fields.

#### Scenario: Preview without applying

- **WHEN** the migration runs in preview mode
- **THEN** the user sees the proposed updates and any skipped notes, but no Anki
  fields, media, tags, or scheduling are changed.

#### Scenario: Backup failure

- **GIVEN** updates have been prepared but the local backup cannot be saved
- **WHEN** an apply action is requested
- **THEN** no note fields are updated and the failure is reported.

#### Scenario: Note edited after preview

- **GIVEN** a candidate's fields changed in Anki after its migration preview was prepared
- **WHEN** the prepared update is applied
- **THEN** the note is skipped and reported as changed, rather than overwriting
  edits with the stale prepared answer.

### Requirement: VERB-14 — Migration reruns and partial failures

Migration SHALL recognize notes already upgraded by this change and report
updated, already-current, skipped, and failed notes separately, allowing unfinished
work to be retried without duplicating notes or overwriting completed upgrades.

#### Scenario: Rerun after successful migration

- **GIVEN** a note already has a completed upgrade from this change
- **WHEN** migration is run again
- **THEN** it is reported as already current without regenerating or rewriting its answer.

#### Scenario: One update fails

- **GIVEN** one prepared note update succeeds and another fails
- **WHEN** the migration reports its result
- **THEN** each outcome is identified by note ID and the failure is not reported
  as success; a later run can retry the unfinished note without recreating the
  successfully updated note.
