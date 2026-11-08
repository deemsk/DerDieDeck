## ADDED Requirements

### Requirement: Explicit preview dismissal

Word and verb card preview dialogs SHALL dismiss a card only for an explicitly offered dismissal action or a documented default. Unrecognized input SHALL prompt again without discarding the prepared card.

#### Scenario: Wrong keyboard layout
- **WHEN** the learner enters `ф` in a card preview
- **THEN** the application reports an unrecognized choice and shows the available actions again.
