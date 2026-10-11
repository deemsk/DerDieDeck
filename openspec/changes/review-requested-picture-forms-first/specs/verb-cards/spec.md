## ADDED Requirements

### Requirement: VERB-23 — Requested picture forms precede optional infinitives

A requested non-infinitive form in the picture workflow SHALL go directly to its
complete dictionary review, regardless of existing lemma notes. It SHALL NOT
show a placeholder continuation dialog. Existing picture, Basic verb lemma, and
verb sentence notes SHALL be considered before offering an optional infinitive.
The requested form SHALL remain independently saveable when the optional
infinitive is skipped. A failed lookup SHALL NOT be treated as confirmed absence.

#### Scenario: No existing lemma
- **GIVEN** `sah` resolves to `sehen` with picture mode and no matching note
- **WHEN** the learner proceeds
- **THEN** the complete `sah` form preview appears first.
- **AND** after accepting it, a separate `sehen` preview offers explicit addition,
  defaults to Skip, and does not autoplay infinitive audio or toggle the form.
- **AND** the optional preview includes its meaning, available IPA, example and
  translation, form context, and any contrast that will be saved.

#### Scenario: Existing Basic or sentence note
- **GIVEN** a Basic lemma or verb sentence note already represents `sehen`
- **WHEN** `sah` is prepared
- **THEN** only the form is reviewed and saved, with no image selection or
  infinitive audio preparation.

#### Scenario: Skip form or optional infinitive
- **WHEN** the form is skipped
- **THEN** neither note is created and no optional infinitive is offered.
- **WHEN** the form is accepted and the optional infinitive is skipped
- **THEN** only the form is created.

#### Scenario: Preview without writes
- **GIVEN** dry-run is active
- **WHEN** the form and optional infinitive are reviewed
- **THEN** no Anki note or media writes occur.

#### Scenario: No legacy placeholder remains
- **GIVEN** either ordinary picture or sentence confirmation is called for a
  requested form
- **WHEN** the route is checked
- **THEN** it requires the complete dictionary review instead of rendering an
  old continuation screen. Legacy placeholder renderers SHALL be removed.

## MODIFIED Requirements

### Requirement: VERB-06 — Dictionary-form card

The ordinary verb workflow SHALL honor the user's final choice about creating
a card that explains the encountered form and connects it to its infinitive.
For a requested non-infinitive form, this card SHALL be enabled by default and
independently creatable when a companion lemma or sentence note already exists.
Preview SHALL identify the requested form and which outputs will be created or
skipped as existing. For a requested form, the first confirmation SHALL show
the complete dictionary-card answer before any write, including when an audio
sentence card is also prepared. The learner SHALL see that accepting the form
also adds the already selected sentence card and may instead skip only the
form or dismiss both outputs. An already represented infinitive SHALL be
described as an existing card without repeating its duplicate list or showing a
bare note ID. Its German word SHALL be visually emphasized when terminal color
is available.
The complete form-card preview SHALL replace the preliminary plan and offer
direct accept, regenerate, or skip choices regardless of companion outputs.
Lemma-only IPA, audio, and frequency SHALL not be presented as if they belonged
to the requested form. A reported note ID SHALL be accompanied by a usable
Anki Browse query. The accepted form SHALL remain the target through writing.

#### Scenario: Additional card selected

- **GIVEN** sentence-form is selected and the user leaves the dictionary-form card enabled
- **WHEN** the note is successfully prepared and confirmed for writing
- **THEN** a `mode-verb-dictionary` note is created with the encountered
  form on Front and its meaning, grammatical explanation, translated usage example,
  and separately labeled infinitive information on Back.

#### Scenario: Additional card disabled

- **WHEN** the user disables the dictionary-form card in the final preview
- **THEN** an eligible sentence note may be created without that additional note;
  the application does not claim that a dedicated form card was added.

#### Scenario: Picture-word verb with an encountered form

- **GIVEN** a picture-word verb has an encountered form different from its infinitive
- **WHEN** the user enables and confirms the dictionary-form card
- **THEN** its answer follows the same form-explanation contract as in sentence-form mode.
- **AND** an existing picture note does not prevent the form card from being written.

#### Scenario: Learn the imperative of a known verb

- **GIVEN** `gehen` is already represented by a picture note and `geh` is missing
- **WHEN** the learner requests `geh` and accepts its explanation preview
- **THEN** the application creates a note whose Front is `geh`, whose Back
  explains `иди` and Imperativ, second-person singular, and whose example
  contains the requested imperative, such as `Geh bitte nach Hause.`
- **AND** the existing `gehen` note remains intact, and the result names `geh`
  and the newly created note ID.

#### Scenario: Clear first preview for a known imperative

- **GIVEN** the learner entered `geh`, a picture card for `gehen` exists, and no
  dedicated `geh` explanation exists
- **WHEN** the picture-route confirmation appears
- **THEN** it is the complete dictionary-card preview, showing Front `geh`,
  the proposed meaning, grammar, usage, translated example, and infinitive
  information on Back before the learner chooses accept, regenerate, or skip.
- **AND** no preliminary screen shows a placeholder Back or asks the learner
  to continue merely to see that answer; `gehen` is not added again.
- **AND** it does not automatically play the infinitive's audio as if it were
  pronunciation of `geh`.

#### Scenario: Requested form with an audio sentence

- **GIVEN** the learner requests `hab` and selects `Hab bitte Geduld.`
- **WHEN** the sentence and form explanation are ready for confirmation
- **THEN** the first confirmation shows the complete `hab` dictionary card and
  identifies the selected audio sentence as an additional output.
- **AND** it does not require `Continue` through a provisional preview.
- **WHEN** the learner accepts, both notes are saved; skipping the form saves
  only the sentence, while dismissing saves neither.

#### Scenario: Revise the chosen sentence from the complete preview

- **GIVEN** the complete form preview uses the selected audio sentence
- **WHEN** the learner chooses to edit that sentence
- **THEN** the sentence is rebuilt and the dictionary explanation is generated
  again from the final sentence before either note is written.

#### Scenario: The only form preview is skipped

- **GIVEN** the learner requests `geh` and the `gehen` picture note exists
- **WHEN** the learner skips the complete dictionary-card preview
- **THEN** neither a `geh` note nor another `gehen` note is written, and the
  workflow reports that the requested form was skipped.

#### Scenario: Existing infinitive notice emphasizes the lemma

- **GIVEN** a form card for `geh` is being prepared and `gehen` already exists
- **WHEN** the notice is displayed in a color-capable terminal
- **THEN** `gehen` is visually emphasized in the sentence explaining that it
  will not be added again, before the complete `geh` answer preview.

#### Scenario: Search for an existing or newly created note

- **GIVEN** the workflow reports a note ID for an existing or created form
- **WHEN** it prints the result
- **THEN** it includes the search syntax `nid:<ID>` that can be pasted into
  Anki Browse, rather than expecting a plain number to find the note.

#### Scenario: Search for the created sentence note

- **GIVEN** the learner accepted both the `hab` form and audio sentence
- **WHEN** AnkiConnect returns the sentence note ID
- **THEN** the result prints `nid:<ID>` for that sentence, never
  `nid:undefined`.

#### Scenario: Explicit skip or dry-run

- **GIVEN** the form is missing
- **WHEN** the learner skips its explanation or dismisses the workflow
- **THEN** no form note is written and its outcome is explicitly skipped.
- **WHEN** dry-run is enabled
- **THEN** the planned form and companion outputs are previewed without note or
  media writes to Anki; the result does not claim actual creation.
