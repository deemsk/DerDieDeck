# Verb Cards and Packages

## Purpose

Connect a verb's meaning, dictionary form, and forms used in sentences.
Evidence: [verbMode.js](../../../src/verbMode.js), [verbEnricher.js](../../../src/verbEnricher.js),
[verbPackage.js](../../../src/cardContent/verbPackage.js), [verbMorphology.js](../../../src/cardContent/verbMorphology.js),
[verbConfirm.js](../../../src/verbConfirm.js).
Main branches and creation are covered by [verbMode.test.js](../../../tests/verbMode.test.js),
example selection and requested-form previews by [verbConfirm.test.js](../../../tests/verbConfirm.test.js),
dedicated form duplicate lookup by [anki.test.js](../../../tests/anki.test.js),
morphology by [verbMorphology.test.js](../../../tests/verbMorphology.test.js),
package validation by [verbPackage.test.js](../../../tests/verbPackage.test.js),
and templates by [ankiVerb.test.js](../../../tests/ankiVerb.test.js).
Early semantic example review is implemented by
[verbSentenceValidation.js](../../../src/verbSentenceValidation.js) and covered by
[verbSentenceValidation.test.js](../../../tests/verbSentenceValidation.test.js),
chooser tests, and workflow boundary tests.
Human pronunciation audio availability for a particular lemma depends on the external source.

Dictionary-form explanations are generated and semantically reviewed by
[verbFormEnricher.js](../../../src/verbFormEnricher.js), checked locally by
[verbFormExplanation.js](../../../src/cardContent/verbFormExplanation.js), and
confirmed through [verbDictionaryPreview.js](../../../src/verbDictionaryPreview.js).
Existing-note migration is implemented in
[verbDictionaryMigration.js](../../../src/verbDictionaryMigration.js) and
[anki.js](../../../src/anki.js), with coverage in
[verbDictionaryMigration.test.js](../../../tests/verbDictionaryMigration.test.js).

## Requirements

### Requirement: VERB-01 — Specific sentence or form takes precedence

The verb workflow SHALL use the ordinary card path instead of a morphology package
when the user supplies a sentence or analysis identifies a target form that differs
from the infinitive.

#### Scenario: Explicit example

- **GIVEN** trusted forms are available for `sprechen`
- **WHEN** the user supplies `--sentence "Ich spreche Deutsch."`
- **THEN** the selected sentence is processed and a package is not created automatically.

#### Scenario: Studying a specific form

- **GIVEN** input is recognized as `wäre` from `sein`
- **WHEN** the verb path is determined
- **THEN** an infinitive package does not replace work on the requested form.

### Requirement: VERB-02 — Lemma and form duplicates

During a normal run, the verb workflow SHALL distinguish an existing lemma,
sentence, and dedicated form explanation. A requested non-infinitive form SHALL
be checked against the equivalent form-explanation note using lemma and actual
target, including existing `mode-verb-dictionary` / `form-*` notes. A lemma match
or sentence containing the form SHALL NOT block a missing form explanation.
Infinitive-only requests SHALL retain their existing early duplicate checks.

#### Scenario: Lemma already being studied

- **GIVEN** a sentence note exists for `bleiben` and no specific form is requested
- **WHEN** the early duplicate check successfully finds it
- **THEN** the new workflow stops before sentence selection.

#### Scenario: New form of a known lemma

- **GIVEN** `sein` already exists but no dedicated explanation note exists for `wäre`
- **WHEN** the requested form is checked
- **THEN** the existing lemma alone does not block a confirmed new form card.

#### Scenario: Same picture headword with a different Russian gloss

- **GIVEN** a picture note for `gehen` has meaning `идти`, the request is `geh`,
  and the new analysis proposes `идти, направляться (обычно пешком)`
- **WHEN** the outputs are prepared
- **THEN** the lemma picture note is marked already existing and is not recreated;
  the missing form explanation remains eligible.
- **AND** image selection, image download, and image upload for that skipped note
  are omitted.

#### Scenario: The dedicated form note already exists

- **GIVEN** a `mode-verb-dictionary` note has lemma `gehen`, Front `geh`, and
  the existing `form-geh` tag convention
- **WHEN** the learner requests `geh` again
- **THEN** the application identifies the existing form note and its ID instead
  of generating another explanation or attempting a duplicate write.

#### Scenario: Only a sentence contains the requested form

- **GIVEN** a `mode-verb-sentence` note is tagged `lemma-gehen` and `verb-form-geh`,
  but no dedicated explanation of `geh` exists
- **WHEN** the learner requests and confirms a form explanation
- **THEN** the existing sentence alone does not count as that form explanation.

#### Scenario: Duplicate check unavailable

- **GIVEN** the early duplicate check fails
- **WHEN** the error is handled
- **THEN** the application reports that the check was skipped and continues;
  subsequent path-specific checks and Anki's duplicate prohibition remain in effect.
- **AND** a final duplicate rejection is handled per output, without silently
  declaring a missing requested form successfully added.

### Requirement: VERB-03 — Morphology package eligibility

A form package SHALL be offered only with high-confidence morphology, a nonempty
list of selected forms, and successful validation of the package sentences.

#### Scenario: Morphology unavailable

- **GIVEN** no high-confidence morphology with selected forms is available
- **WHEN** the verb is processed
- **THEN** the ordinary picture-word or sentence-form path is used according to analysis.

#### Scenario: Invalid package sentences

- **GIVEN** morphology is usable but the final plan fails sentence validation
- **WHEN** the package is prepared
- **THEN** the application reports that the package was skipped and returns to the ordinary path.

### Requirement: VERB-04 — Sentence agreement with the target form

The package SHALL use short sentences that pass checks for the target pronoun,
verb form, separable particle position, and Russian person/number agreement.

#### Scenario: Wrong person in the translation

- **GIVEN** the target form requires the Russian subject `мы`, but the generated
  sentence fails the agreement check
- **WHEN** a second generation attempt is still available
- **THEN** the sentence is regenerated with guidance about the required person.

#### Scenario: Example is too long

- **GIVEN** an example contains more than nine words
- **WHEN** the form sentence is validated
- **THEN** it is not accepted into the package.

### Requirement: VERB-05 — Package composition and confirmation

A confirmed package SHALL create one lemma note, two notes per key form, and two
notes per form sentence: an audio-first note and a cloze note.

#### Scenario: Two forms with two sentences

- **GIVEN** a valid package contains two forms and two sentences, with no duplicates or write errors
- **WHEN** the user confirms the package
- **THEN** nine notes are created: one lemma, four key-form notes, two sentence
  notes, and two cloze notes.

#### Scenario: Package dismissed

- **WHEN** the user dismisses the package preview
- **THEN** no package notes are written.

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
  pronunciation of `geh`; the learner may explicitly listen to `gehen`.

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

The answer SHALL lead with the requested form's meaning, pronunciation when
available, and concise grammar/usage, followed by a translated example. It
SHALL identify the source infinitive in a compact text row near the grammar,
without an additional infinitive pronunciation recording, IPA, translation, or
separate visual block. The complete terminal preview SHALL reflect the same
answer structure before the note is written. Front SHALL contain only the
requested form.

#### Scenario: Known infinitive on a form card

- **GIVEN** the learner requests `geh` and already knows `gehen`
- **WHEN** the form-card Back and terminal preview are shown
- **THEN** both emphasize `иди`, the form's pronunciation and grammar, and
  `Geh bitte nach Hause.` with its translation.
- **AND** `gehen` is identified briefly as the infinitive without a second
  audio player, infinitive IPA, or repeated lexical translation.

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

The application SHALL support upgrading existing `mode-verb-dictionary` notes
to the compact answer contract in place, preserving their note and card IDs,
Front, note type, deck assignment, existing tags, and review history. The
migration SHALL select only answers whose existing structure it can identify
reliably; unmatched notes SHALL be left unchanged for manual review.

#### Scenario: Existing wäre note

- **GIVEN** an existing `mode-verb-dictionary` note shows `wäre` on Front and only
  `sein`, its pronunciation, and `быть` on Back
- **WHEN** its prepared migration is applied
- **THEN** Back contains the form explanation, translated example, and a compact
  infinitive reference without retaining infinitive audio or IPA.
- **AND** the note and its review cards retain their IDs, history, and scheduling;
  no replacement note or card is created.

#### Scenario: Existing two-audio geh note

- **GIVEN** a signed `geh` form answer contains both `geh` and `gehen` audio
- **WHEN** its prepared Back-only migration is applied
- **THEN** the `geh` audio, IPA, explanation, and translated example remain,
  while the `gehen` block becomes a compact text reference without its audio,
  IPA, or repeated translation.
- **AND** note and card identities, tags, fields other than Back, and review
  scheduling remain unchanged.

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

### Requirement: VERB-15 — Structured dictionary-card terminal preview

The dictionary-card terminal preview SHALL visually distinguish Front from Back
and organize the complete proposed answer into labeled, consistently indented
sections. Meaning and grammar, usage, optional ambiguity and contrast notes,
the German example with its Russian translation, and the infinitive with its
available pronunciation and lexical meaning SHALL remain identifiable without
relying on terminal colors. The action prompt SHALL appear separately after the
complete preview.

The presentation SHALL follow the existing word dictionary summary's visual
conventions: `┌─`, `│`, and `└─` framing, emphasized heading and target, muted
aligned labels, consistent padding, and cyan accents when terminal color is enabled.

#### Scenario: Full explanation for denkst

- **GIVEN** an explanation of `denkst` with a form meaning, grammar, usage,
  ambiguity, contrast, translated example, and infinitive information
- **WHEN** its terminal preview is displayed
- **THEN** Front and Back have explicit boundaries, each explanation section has
  a descriptive label, and blank lines separate the sections.
- **AND** the German example and its Russian translation are grouped together,
  followed by the grouped infinitive information.
- **AND** all proposed answer content is shown before accept/regenerate/skip.
- **AND** the preview uses the same framing and emphasis conventions as the
  existing word dictionary summary.

#### Scenario: Optional notes are absent

- **GIVEN** ambiguity or contrast is absent
- **WHEN** the preview is formatted
- **THEN** absent fields produce no empty headings or placeholder text.

#### Scenario: Long explanation in a narrow terminal

- **GIVEN** an explanation contains lines longer than the available terminal width
- **WHEN** the preview is formatted
- **THEN** prose wraps at word boundaries where possible and continuation lines
  retain the indentation of their section.

#### Scenario: Plain output

- **GIVEN** terminal colors are unavailable or output is redirected
- **WHEN** the preview is displayed
- **THEN** labels, indentation, and blank lines preserve the same content hierarchy.

#### Scenario: User regenerates, dismisses, or uses dry-run

- **WHEN** the user regenerates or dismisses the optional card, or runs in dry-run
- **THEN** the existing confirmation and no-write guarantees remain in effect;
  regeneration displays the newly prepared explanation with the same structure.

### Requirement: VERB-16 — Relevant and concise form explanations

Generated form explanations SHALL contain only information that helps interpret
the encountered form and its example. Grammar and contextual usage SHALL be
concise; optional ambiguity and contrast SHALL be absent when they add no useful
distinction. There SHALL be no minimum word count encouraging filler. The same
prepared explanation SHALL feed preview and the saved answer.

#### Scenario: Straightforward denkst example

- **GIVEN** the target is `denkst` in `Woran denkst du gerade?`
- **WHEN** the explanation is generated and reviewed
- **THEN** it conveys `думаешь`, Präsens Indikativ, second-person singular, and
  briefly explains the usage in that sentence.
- **AND** it includes the complete German example and Russian translation.
- **AND** it omits filler such as `других распространённых нормативных чтений нет`
  and unrelated lists of constructions such as `denken an / denken, dass`.
- **AND** empty optional notes produce no headings in the terminal preview.

#### Scenario: Necessary ambiguity and contrast

- **GIVEN** a form has meaningful alternative readings, such as `wäre` or `sind`,
  or a useful confusion contrast, such as `wurde` versus `würde`
- **WHEN** the explanation is shortened
- **THEN** those distinctions remain concise and explicit, and contextual passive
  or hypothetical meanings remain accurate.

#### Scenario: Preview matches the saved explanation

- **GIVEN** a concise explanation is accepted in preview
- **WHEN** the optional dictionary note is written
- **THEN** it uses that explanation without restoring discarded filler or
  silently adding explanatory text that the learner did not preview.

### Requirement: VERB-17 — Independent form writes and truthful outcomes

A confirmed missing form explanation SHALL be saved before companion-note writes.
The workflow SHALL report created, existing, skipped, or failed outcomes for the
requested form and any attempted companion. Duplicate rejection of a companion
SHALL NOT cancel a valid form write. Other failures SHALL remain visible, and
active spinners SHALL stop before error recovery. Anki duplicate protection SHALL
remain enabled; no force-duplicate option is used to satisfy a form request.

#### Scenario: Companion becomes a duplicate after preflight

- **GIVEN** a form explanation and companion have been confirmed but the companion
  is rejected as a duplicate at write time
- **WHEN** the results are reported
- **THEN** the form is still created and reported with its note ID, and the
  companion is reported as already existing rather than failing the whole item.

#### Scenario: Nonduplicate companion failure

- **GIVEN** the form note was saved and a companion write fails for another reason
- **WHEN** the workflow reports the error
- **THEN** the successful form ID remains visible alongside the companion failure;
  the spinner is stopped and the failure is not disguised as a duplicate.

#### Scenario: Requested form write fails

- **GIVEN** the learner accepted a form explanation but its write fails
- **WHEN** the workflow reports the result
- **THEN** it states that the form was not added and stops the spinner before
  offering recovery; it does not report overall form-request success.

#### Scenario: Retry after a partial run

- **GIVEN** a form note was saved before a companion failed
- **WHEN** the same form is requested again
- **THEN** the existing equivalent form is recognized and identified by note ID,
  without attempting to recreate it.

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

### Requirement: VERB-19 — Pronunciation of the requested form

For a non-infinitive dictionary-form card, the workflow SHALL resolve the
requested form's pronunciation independently of the infinitive. When a
trustworthy form IPA is available, the complete terminal preview SHALL label
and show it alongside the form meaning, grammar, usage, and translated example.
The saved answer SHALL include available form pronunciation audio and IPA in a
separately labeled form-pronunciation row, with no infinitive audio or IPA on
the same Back. The Front SHALL remain the form alone. External
pronunciation failure SHALL not replace form IPA with infinitive IPA or prevent
an otherwise valid card from being created. Dry-run SHALL not write media to Anki.

#### Scenario: Imperative pronunciation from Wiktionary

- **GIVEN** the learner requests `geh`, whose Wiktionary entry provides `[ɡeː]`
- **WHEN** the full dictionary-card preview appears
- **THEN** it shows `geh` on Front, `иди` and relevant grammar/usage/example on
  Back, and a labeled form pronunciation `[ɡeː]` before acceptance.
- **AND** a compact `gehen` reference identifies the infinitive without
  presenting `[ˈɡeːən]` as the pronunciation of `geh`.

#### Scenario: Saved form audio

- **GIVEN** a pronunciation recording for the accepted form is available
- **WHEN** the `geh` note is written
- **THEN** its Back contains the form recording in the form-pronunciation row
  and no second recording for the infinitive.

#### Scenario: Pronunciation source unavailable

- **GIVEN** the requested form's IPA or audio cannot be retrieved
- **WHEN** the explanation is previewed and accepted
- **THEN** no infinitive pronunciation is mislabeled as the form's IPA; missing
  optional pronunciation does not stop the card, and dry-run makes no Anki
  media write.


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
