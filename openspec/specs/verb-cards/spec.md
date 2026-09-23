# Verb Cards and Packages

## Purpose

Connect a verb's meaning, dictionary form, and forms used in sentences.
Evidence: [verbMode.js](../../../src/verbMode.js), [verbEnricher.js](../../../src/verbEnricher.js),
[verbPackage.js](../../../src/cardContent/verbPackage.js), [verbMorphology.js](../../../src/cardContent/verbMorphology.js),
[verbConfirm.js](../../../src/verbConfirm.js).
Main branches and creation are covered by [verbMode.test.js](../../../tests/verbMode.test.js),
morphology by [verbMorphology.test.js](../../../tests/verbMorphology.test.js),
package validation by [verbPackage.test.js](../../../tests/verbPackage.test.js),
and templates by [ankiVerb.test.js](../../../tests/ankiVerb.test.js).
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

During a normal run, the verb workflow SHALL check duplicates for a specific form
when one is requested; otherwise, it checks existing picture, lemma, and sentence
notes for the verb.

#### Scenario: Lemma already being studied

- **GIVEN** a sentence note exists for `bleiben` and no specific form is requested
- **WHEN** the early duplicate check successfully finds it
- **THEN** the new workflow stops before sentence selection.

#### Scenario: New form of a known lemma

- **GIVEN** `sein` already exists but no note is found for the requested `wäre`
- **WHEN** the form is checked
- **THEN** the existing lemma alone does not block a new form card.

#### Scenario: Duplicate check unavailable

- **GIVEN** the early duplicate check fails
- **WHEN** the error is handled
- **THEN** the application reports that the check was skipped and continues;
  subsequent path-specific checks and Anki's duplicate prohibition remain in effect.

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
