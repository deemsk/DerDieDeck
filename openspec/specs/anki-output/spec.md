# Anki Output and Media

## Purpose

Define note output, media handling, and the boundaries of side effects.
Evidence: [anki.js](../../../src/anki.js), [config.js](../../../src/lib/config.js),
[wordMode.js](../../../src/wordMode.js), [verbMode.js](../../../src/verbMode.js),
[wordConfirm.js](../../../src/wordConfirm.js), [learningDesign.js](../../../src/cardContent/learningDesign.js).
Writes, tags, and CSS are covered by [anki.test.js](../../../tests/anki.test.js),
word notes by [ankiWord.test.js](../../../tests/ankiWord.test.js),
noun audio planning by [wordMode.test.js](../../../tests/wordMode.test.js),
and image selection after confirmation by [wordPictureMode.test.js](../../../tests/wordPictureMode.test.js)
and [verbMode.test.js](../../../tests/verbMode.test.js).
Dry-run boundaries and the lack of a shared transaction were additionally verified
through code inspection; there are no end-to-end tests of every mode with live Anki.

## Requirements

### Requirement: ANKI-01 — Default note types

The application SHALL use `Basic (optional reversed card)` for ordinary Front/Back
notes, `2. Picture Words` for picture-word notes, and `Cloze` for native cloze notes,
unless the user overrides the corresponding setting.

#### Scenario: Default grammar note

- **WHEN** a grammar slot is written with default settings
- **THEN** the `Cloze` type is used and the cloze text is placed in its text field.

#### Scenario: Incompatible Cloze fields

- **GIVEN** the selected type has no supported text field
- **WHEN** the grammar workflow checks its schema
- **THEN** it reports an error instead of writing to an arbitrary field.

### Requirement: ANKI-02 — Media writes

The application SHALL use the filename returned by AnkiConnect when building
references to uploaded audio and images in note fields.

#### Scenario: Storing audio

- **GIVEN** a local audio file has been prepared
- **WHEN** it is stored in Anki through `storeAudio`
- **THEN** the note's sound tag references the final filename in Anki media.

### Requirement: ANKI-03 — Word pronunciation

Preparation of an individual word or infinitive SHALL use available
Wiktionary/Wikimedia IPA and human audio, with TTS as a fallback; noun audio is
generated through TTS with the article.

#### Scenario: Noun with an article

- **GIVEN** the canonical form is `der Arzt` and human audio without the article is found
- **WHEN** picture-word audio is prepared
- **THEN** `der Arzt` is spoken through TTS, and the retrieved IPA may be used.

#### Scenario: Human verb audio

- **GIVEN** a usable human audio file is found for the infinitive
- **WHEN** infinitive pronunciation is prepared
- **THEN** the retrieved file is used instead of TTS.

### Requirement: ANKI-04 — Image selection

The current picture-word workflow SHALL begin image selection after content
confirmation and allow a URL, an existing local file, or proceeding without an image.

#### Scenario: Skipping an image

- **GIVEN** picture-word content is confirmed
- **WHEN** the user selects Skip during image selection
- **THEN** the workflow can create a note without an image.

#### Scenario: Browser cannot be opened

- **GIVEN** automatically opening Google Images fails
- **WHEN** image selection starts
- **THEN** the application displays the link and keeps manual URL/path entry available.

### Requirement: ANKI-05 — Origin and learning tags

Note creation SHALL add origin and workflow tags; generated sentence sets and
form packages also receive learning-intent and sibling-stage tags.

#### Scenario: Sentence set

- **GIVEN** two related notes are created with a shared `sourceId`
- **WHEN** they are written
- **THEN** both have `yt2anki`, their own `card-*`, `source-*`, `intent-*`, and sibling tags.

#### Scenario: Stage tag

- **WHEN** a note receives `sibling-stage-day-1`
- **THEN** it is a searchable tag; the write process itself does not change when
  reviews for that note begin.

### Requirement: ANKI-06 — Sentence-set write errors

Writing a set through `createNotes` SHALL prohibit duplicates in Anki, skip
duplicate errors reported by Anki, and return the IDs of successfully created notes.

#### Scenario: One duplicate in a set

- **GIVEN** Anki returns an error containing `duplicate` for one note
- **WHEN** a three-note set is written
- **THEN** the error is reported as a skip and the remaining notes continue to be written.

#### Scenario: Other error on the second note

- **GIVEN** the first note is written successfully and the second fails with another error
- **WHEN** the error is handled
- **THEN** it is propagated to the calling workflow; the first note is not rolled back automatically.

### Requirement: ANKI-07 — Dry-run boundary

Dry-run for creation commands SHALL prevent media uploads and note writes to Anki
while retaining the preparation and preview operations needed by the selected path.

#### Scenario: Lexical card

- **GIVEN** `--dry-run` is enabled
- **WHEN** a word is prepared and previewed
- **THEN** generation, pronunciation retrieval, duplicate reads, and image selection
  may occur, but the selected image is not uploaded to Anki and the note is not written.

#### Scenario: Text batch

- **GIVEN** `text --dry-run` receives a usable sentence
- **WHEN** generation finishes
- **THEN** the set is displayed, the application attempts to play TTS and removes
  the prepared preview file, and no Anki notes are created.

### Requirement: ANKI-08 — Shared styling

The `styles` command SHALL update shared CSS for configured existing note types
and report each type's status; `styles --dry-run` only previews required changes.

#### Scenario: Style update preview

- **GIVEN** Anki is available and a note type's CSS needs updating
- **WHEN** the user invokes `styles --dry-run`
- **THEN** the type receives the `would-update` status and its CSS is not changed.

#### Scenario: Missing note type

- **GIVEN** a configured note type is absent from Anki
- **WHEN** styling is checked
- **THEN** it is reported as `missing` without automatically creating the type.

Lexical migration evidence: [lexicalRuleMigration.js](../../../src/lexicalRuleMigration.js),
[parser](../../../src/cardContent/lexicalRuleMigration.js), [anki.js](../../../src/anki.js),
and [lexicalRuleMigration.test.js](../../../tests/lexicalRuleMigration.test.js).

### Requirement: ANKI-09 — Preview existing lexical-cloze explanations

The application SHALL support a read-only migration preview for existing
`mode-lexical-cloze` notes, optionally limited to specified note IDs. It SHALL
use the saved sentence and target with the same contextual explanation rules as
new notes. It SHALL save a reviewable plan and old/new comparison, distinguishing
ready, unchanged, skipped, and failed entries. Preparation SHALL NOT write to Anki.

#### Scenario: Recognized legacy rule

- **GIVEN** a recognizable application-generated lexical-cloze note contains a
  generic rule, a missing rule, or a contextual hint that needs review
- **WHEN** a migration preview is prepared
- **THEN** the plan records the original fields and tags plus the proposed rule
  change, and shows the old and proposed explanation for review.

#### Scenario: Existing explanation is suitable

- **GIVEN** the saved explanation already satisfies the contextual requirements
- **WHEN** it is reviewed for migration
- **THEN** it is retained and the entry is reported as unchanged.

#### Scenario: Unrecognized or ambiguous note

- **GIVEN** the sentence, cloze target, required lexical context, or rule-block
  boundary cannot be identified reliably, or custom markup prevents a narrow edit
- **WHEN** a migration preview is prepared
- **THEN** the entry is skipped with a reason instead of guessing or rebuilding
  the whole answer.

#### Scenario: Preparation fails for one note

- **GIVEN** contextual explanation preparation fails for one note
- **WHEN** remaining notes are processed
- **THEN** the failed entry records the reason and has no applicable update;
  independent entries can still be prepared.

### Requirement: ANKI-10 — Apply reviewed rule changes in place

Applying a reviewed migration plan SHALL back up original notes before writing,
reject stale entries, and update only the recognized rule block in the Cloze extra field (`Back Extra` or `Extra`).
All other field content, tags, note/card IDs, decks, media references, and review
history SHALL be preserved. Each applied change SHALL be read back and checked.
Application SHALL report per-note outcomes and support rerunning without duplicate
rule blocks or note recreation.

#### Scenario: Apply a reviewed explanation

- **GIVEN** a ready entry still matches its original snapshot and backup succeeds
- **WHEN** the saved plan is applied
- **THEN** only its rule block is replaced, inserted, or removed as reviewed;
  sentence, cloze markup, translation, IPA, audio, metadata, and unrelated content
  remain intact.

#### Scenario: Backup cannot be saved

- **GIVEN** the backup cannot be written
- **WHEN** application is attempted
- **THEN** no Anki note is changed.

#### Scenario: Note changed after preview

- **GIVEN** a note's fields or tags differ from the preview snapshot
- **WHEN** the plan is applied
- **THEN** that entry is skipped as stale without overwriting the intervening edit.

#### Scenario: Repeat application or partial failure

- **GIVEN** a plan contains already-applied entries or an individual write fails
- **WHEN** the plan is applied again
- **THEN** already-applied content is left intact, failures are reported per note,
  and only eligible outstanding entries are updated.
