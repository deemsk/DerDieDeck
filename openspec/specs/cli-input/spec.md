# CLI and Input

## Purpose

Let users select a material source and supply input for note creation.
Evidence: [index.js](../../../src/index.js), [lexicalMode.js](../../../src/lexicalMode.js),
[config.js](../../../src/lib/config.js), [package.json](../../../package.json).
Normalization and routing are covered by [lexicalMode.test.js](../../../tests/lexicalMode.test.js).
CLI registration, clipboard dispatch, line input, and configuration precedence
were verified through code inspection; the current suite has no direct end-to-end
tests for these scenarios.

## Requirements

### Requirement: CLI-01 — Source selection

The application SHALL provide `clip`, `text`, `words`, `grammar`, `add`, and
`process` commands for their respective material sources.

#### Scenario: Default npm entry point

- **GIVEN** the application is installed
- **WHEN** the user runs `npm start`
- **THEN** the `clip` command is invoked to read clipboard data.

#### Scenario: Single clip by URL

- **WHEN** the user invokes `add <url>` without `--start` or `--end`
- **THEN** the CLI rejects the invocation because a required option is missing.

### Requirement: CLI-02 — Clipboard dispatch

The `clip` command SHALL select the text path for JSON with `type: "text"` and
the video path for JSON with `url` and `clips`.

#### Scenario: Selected text

- **GIVEN** the clipboard contains `{"type":"text","german":"Ich bin hier."}`
- **WHEN** the user runs `clip`
- **THEN** the German text is passed to the text card workflow.

#### Scenario: Unknown structure

- **GIVEN** the clipboard contains `{"foo":"bar"}`
- **WHEN** the user runs `clip`
- **THEN** the CLI reports invalid data and instructs the user to use the bookmarklet.

### Requirement: CLI-03 — Single lexical item

The `words` command SHALL join positional arguments into one lexical item and
allow `--meaning` and `--sentence` for that item.

#### Scenario: Noun with an article

- **WHEN** `words` receives the argument parts `das` and `Wasser`
- **THEN** it analyzes one item, `das Wasser`.

#### Scenario: Overrides without a single item

- **WHEN** the user invokes `words --meaning "важный"` without a word
- **THEN** the application reports that `--meaning` and `--sentence` require a
  single lexical item and exits with an error.

### Requirement: CLI-04 — Batch input

The `text` and `words` commands without a single-item argument SHALL accept one
source unit per line until an empty line is entered.

#### Scenario: Mixed lexical batch

- **GIVEN** the user enters `das Wasser`, `laufen`, and then an empty line
- **WHEN** processing starts
- **THEN** both items are processed sequentially, each with its own routing decision.

#### Scenario: Empty batch

- **WHEN** the first input line is empty
- **THEN** the application reports that no items were entered and creates no notes.

### Requirement: CLI-05 — Deck and preview options

Creation commands SHALL support `--deck` and `--dry-run`.

#### Scenario: Alternative deck

- **WHEN** the user specifies `words "das Wasser" --deck "German::Test"`
- **THEN** notes created by this workflow are directed to `German::Test`.

#### Scenario: Grammar preview

- **WHEN** the user invokes `grammar possessive mein --dry-run`
- **THEN** the selected grammar notes are only previewed, with no Anki writes.

### Requirement: CLI-06 — Configuration

The application SHALL use `~/.derdiedeck.json` when present, otherwise
`~/.yt2anki.json`, filling unspecified values with defaults.

#### Scenario: Both configuration files exist

- **GIVEN** the primary and legacy files exist with different `ankiDeck` values
- **WHEN** configuration loads
- **THEN** the primary file's value is used.

#### Scenario: Invalid primary file

- **GIVEN** the primary file exists but contains invalid JSON
- **WHEN** the application reads configuration
- **THEN** it displays a warning and uses defaults; it does not switch to the legacy file.
