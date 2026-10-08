## ADDED Requirements

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
