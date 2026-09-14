# Lexical Cards

## Purpose

Support vocabulary learning through images, context, or filling a blank.
Evidence: [lexicalMode.js](../../../src/lexicalMode.js), [wordMode.js](../../../src/wordMode.js),
[wordConfirm.js](../../../src/wordConfirm.js), [wordEnricher.js](../../../src/wordEnricher.js).
Routing is covered by [lexicalMode.test.js](../../../tests/lexicalMode.test.js),
picture cards by [wordPictureMode.test.js](../../../tests/wordPictureMode.test.js),
sentences, cloze, and revisions by [wordSentenceMode.test.js](../../../tests/wordSentenceMode.test.js),
target-form validation by [lexicalCloze.test.js](../../../tests/lexicalCloze.test.js),
and duplicates by [ankiWord.test.js](../../../tests/ankiWord.test.js).
Some interactive routing and input-correction branches were verified only through code inspection.

## Requirements

### Requirement: LEX-01 — Word or verb routing

Lexical input SHALL be routed to the word or verb workflow based on usable analysis,
with manual selection when both interpretations are usable or both are weak.

#### Scenario: Unambiguous verb

- **GIVEN** only the verb analysis contains a usable structure
- **WHEN** the workflow is selected
- **THEN** the verb workflow is used.

#### Scenario: Ambiguous input

- **GIVEN** both interpretations are usable
- **WHEN** automatic selection is inconclusive
- **THEN** the user may select word, verb, or skip; an empty response means skip.

#### Scenario: Preliminary routing fails

- **GIVEN** preliminary classification is unavailable
- **WHEN** input is processed
- **THEN** the application attempts both word and verb analysis instead of immediately rejecting it.

### Requirement: LEX-02 — Input correction

When corrections are suggested, the application SHALL let the user accept a
correction, keep the original input, edit it manually, or skip the item.

#### Scenario: Correction is declined

- **GIVEN** one correction is suggested for the original input
- **WHEN** the user selects No
- **THEN** analysis continues with the original input.

### Requirement: LEX-03 — Word learning format

The word workflow SHALL select a format using lexical type and analysis recommendation
in this order: noun → picture-word; recommended cloze-form or a function-word type →
cloze-form; other adverbs → sentence-form; remaining words → sentence-form when
recommended, otherwise picture-word.

#### Scenario: Adverb learned in context

- **GIVEN** `sofort` is classified as an adverb without a cloze-form recommendation
- **WHEN** the format is selected
- **THEN** sentence-form is used.

#### Scenario: Adverb with explicit cloze recommendation

- **GIVEN** `nie` is classified as an adverb with a cloze-form recommendation
- **WHEN** the format is selected
- **THEN** cloze-form is used.

#### Scenario: Adjective without a suitable image

- **GIVEN** the adjective analysis is structured and recommends sentence-form
- **WHEN** analysis also reports low imageability
- **THEN** the application continues with a sentence rather than rejecting the word
  solely for low imageability.

### Requirement: LEX-04 — Meaning and example selection

The word workflow SHALL use the user's selected meaning and, for contextual
formats, the selected or supplied sentence.

#### Scenario: Explicit sentence

- **GIVEN** sentence-form is selected and `--sentence "Das ist wichtig."` is supplied
- **WHEN** an example is selected
- **THEN** the supplied sentence is used.

#### Scenario: No picture-word meaning selected

- **GIVEN** picture-word is selected
- **WHEN** the user does not select a meaning
- **THEN** the item is skipped before note creation.

### Requirement: LEX-05 — Lexical duplicates

The word workflow SHALL stop creation when an exact match for the word and
meaning is found in the corresponding note category.

#### Scenario: Existing cloze

- **GIVEN** lexical-cloze lookup returns an exact match
- **WHEN** the item is prepared
- **THEN** the application reports the duplicate and does not proceed to sentence
  enrichment or writing.

#### Scenario: Different picture-word meaning

- **GIVEN** lookup returns a headword match but not a match for the selected meaning
- **WHEN** duplicates are checked
- **THEN** that match alone does not stop picture-word preparation; it is passed to
  the preview, and the final write also depends on Anki.

### Requirement: LEX-06 — Sentence-form output

For an adjective or adverb in sentence-form, the application SHALL create a
sentence note and, when the selected Russian meaning is nonempty, an additional
main word note with the reverse direction enabled in a supporting note type.

#### Scenario: Adverb with a meaning

- **GIVEN** `sofort`, the meaning `сразу`, and an example are confirmed
- **WHEN** notes are written
- **THEN** a main word note with `mode-word-main` and an audio-first sentence note
  with `mode-word-sentence` are created; the sentence note has no reverse card.

#### Scenario: Meaning left empty

- **GIVEN** sentence-form is confirmed but the selected meaning is empty
- **WHEN** notes are written
- **THEN** a sentence note is created without an additional main word note.

### Requirement: LEX-07 — Cloze uniqueness validation

Lexical cloze SHALL undergo target-form validation and an independent AI uniqueness
check, with at most three repair attempts within one preparation attempt.

#### Scenario: Multiple answers fit

- **GIVEN** validation does not accept the initial cloze
- **WHEN** the card is prepared
- **THEN** the application offers meaning clarification, rewrites the sentence when
  needed, and repeats validation before writing.

#### Scenario: Three failed repairs

- **GIVEN** the initial cloze and three repair attempts are not accepted
- **WHEN** preparation exhausts its attempts
- **THEN** a recoverable error is raised without creating that note.

### Requirement: LEX-08 — Lexical-cloze output

A successfully prepared lexical cloze SHALL be written as a native Anki Cloze
note with the target form blanked, sentence audio, and lexical tags.

#### Scenario: Function word

- **GIVEN** the sentence for `aber` passes validation, no duplicate is found, and dry-run is off
- **WHEN** preparation finishes
- **THEN** a note with `{{c1::...}}`, `mode-lexical-cloze`, and a lemma tag is created;
  this path currently has no separate final confirmation.

### Requirement: LEX-09 — Contextual card revisions

The sentence-form preview SHALL support AI revisions with the target form retained
as a request constraint and the result shown in a new preview.

#### Scenario: Only the translation changes

- **GIVEN** the user requests a translation correction and the German sentence remains unchanged
- **WHEN** the updated preview is shown
- **THEN** the previous audio is reused, and image selection begins after final
  card confirmation.

### Requirement: LEX-10 — Picture-word content

A picture-word note SHALL contain the canonical word, prepared pronunciation,
selected meaning, and available additional information; nouns use gender styling
and plural information when available.

#### Scenario: Noun with additional information

- **GIVEN** a noun with known gender, plural, and an example is confirmed
- **WHEN** the note fields are built
- **THEN** the word receives gender styling, the extra field contains its meaning,
  plural, and example, and the note has a `gender-*` tag.

#### Scenario: Personal connection

- **GIVEN** the user enters a personal connection in the picture-word preview
- **WHEN** the note fields are built
- **THEN** the connection cue is added to the word and picture fields;
  spelling tests are not enabled automatically.
