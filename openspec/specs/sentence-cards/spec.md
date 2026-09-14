# Sentence Cards

## Purpose

Turn German sentences into a limited set of comprehension and production tasks.
Evidence: [index.js](../../../src/index.js), [analyzer.js](../../../src/analyzer.js),
[cardTypes.js](../../../src/cardTypes.js), [confirm.js](../../../src/confirm.js),
[templates](../../../src/templates/index.js).
Formats and learning intents are covered by [cardTypes.test.js](../../../tests/cardTypes.test.js),
text revisions by [enricherReview.test.js](../../../tests/enricherReview.test.js),
and note writes by [anki.test.js](../../../tests/anki.test.js).
Selection thresholds and the complete CLI flow were verified through code inspection,
without a direct test of `selectCards`.
Preview requirements apply to `text` and clipboard text; `add` and `process` use
separate direct-write paths. The video limitation is recorded as GAP-01 in the overview.

## Requirements

### Requirement: SENT-01 — Rejection and split suggestions

The application SHALL stop creating a sentence's card set if analysis rejects it
or suggests a nonempty list of parts to split into.

#### Scenario: Analysis rejects a sentence

- **GIVEN** analysis returns `shouldGenerateAnyCard: false` and a reason
- **WHEN** the application selects cards
- **THEN** it displays the reason and does not create a set.

#### Scenario: Analysis suggests splitting

- **GIVEN** analysis allows generation but returns `shouldSplit: true` with two parts
- **WHEN** the original sentence is processed
- **THEN** the parts are shown to the user but are not processed automatically.

### Requirement: SENT-02 — Proposed set size and composition

The system SHALL include comprehension in every accepted set and select at most
two additional cards by descending value score, including at most one of pattern
and cloze.

#### Scenario: Multiple additional candidates

- **GIVEN** production with score 9, cloze with score 8, and pattern with score 7 are eligible
- **WHEN** the proposed set is assembled
- **THEN** it contains comprehension, production, and cloze.

#### Scenario: Comprehension only

- **GIVEN** analysis permits generation but no additional type is eligible
- **WHEN** the set is assembled
- **THEN** one comprehension card is proposed.

### Requirement: SENT-03 — Eligibility of additional types

The application SHALL admit additional card types only when their selection
conditions are satisfied.

#### Scenario: Dialogue value is too low

- **GIVEN** analysis finds a conversational question and a short response, but `dialogueValue` is 6
- **WHEN** candidates are selected
- **THEN** dialogue is not proposed; its minimum score is 7.

#### Scenario: Useful active phrase

- **GIVEN** analysis marks the phrase as useful for active use and speakable by the learner
- **WHEN** candidates are selected
- **THEN** production participates in the overall selection by value.

#### Scenario: Guessable cloze

- **GIVEN** a cloze candidate exists but analysis marks it as `isGuessable: true`
- **WHEN** candidates are selected
- **THEN** cloze is not proposed.

### Requirement: SENT-04 — Pattern throttling

Within one CLI invocation, the application SHALL admit pattern only when its
strength is `strong`, it has at least three examples, at least six units have been
accepted since the last pattern, and its family is absent from the recent-family list.

#### Scenario: Start of a session

- **GIVEN** no units have been accepted in the current invocation
- **WHEN** analysis proposes a strong pattern with three examples
- **THEN** pattern is not included among the candidates.

#### Scenario: Repeated family

- **GIVEN** six units have been accepted since the last pattern, but the family is
  already in the recent-family list
- **WHEN** analysis proposes that family again
- **THEN** pattern is not proposed.

### Requirement: SENT-05 — Text preview and revision

The text workflow SHALL let users select cards within a set, dismiss the set,
and request an AI revision before writing notes.

#### Scenario: User dismisses the set

- **GIVEN** a set has been displayed and audio prepared
- **WHEN** the user selects dismiss
- **THEN** the set's notes are not written.

#### Scenario: Revised text passes analysis

- **GIVEN** the user provides feedback on the sentence
- **WHEN** the revised text passes analysis again
- **THEN** the set and voice-over are regenerated, similar-card results are refreshed,
  and the user sees a new preview.

#### Scenario: Revised text fails analysis

- **WHEN** the new analysis rejects the revised text or suggests splitting it
- **THEN** the application reports this and retains the previous set for further selection.

### Requirement: SENT-06 — Learning content on each card side

The generator SHALL place prompts and answers according to the card's learning type.

#### Scenario: Listening comprehension

- **WHEN** a comprehension card is created
- **THEN** Front contains audio and optional context, while Back contains German text,
  IPA, and a Russian translation.

#### Scenario: Production

- **WHEN** a production card is created
- **THEN** Front contains a Russian prompt and an appropriate Russian situation hint;
  the German answer, IPA, and audio are on Back.

#### Scenario: Conversational response

- **WHEN** a dialogue card is created
- **THEN** Front contains the original utterance's audio and a task to respond aloud,
  while Back contains the German response and its Russian translation when available.

#### Scenario: Pattern generalization

- **GIVEN** a pattern with five examples is selected
- **WHEN** the card fields are built
- **THEN** Front contains the pattern name and base example, while Back contains
  the first four examples and the base phrase's Russian translation.

#### Scenario: Cloze within a sentence set

- **WHEN** the general card generator creates a cloze card
- **THEN** Front contains a sentence with a blank and an optional hint, while Back
  contains the answer, full sentence, and translation when available;
  the note uses ordinary Front/Back fields rather than the Anki Cloze type.
