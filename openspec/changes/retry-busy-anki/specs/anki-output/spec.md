## ADDED Requirements

### Requirement: Retry temporary collection locks safely

The application SHALL retry the identical AnkiConnect request only when explicitly rejected before execution with `Collection lifecycle operation is active.` or `A collection operation is active.`. It SHALL wait one second between attempts, for at most ten retries, show a waiting notice, and preserve prepared content during these retries. Network failures, invalid responses, and other API errors SHALL NOT trigger automatic request replay.

#### Scenario: Collection becomes available
- **WHEN** Anki rejects a request because a collection operation is active and subsequently becomes available
- **THEN** the same request succeeds without rerunning AI analysis or previous successful writes.

#### Scenario: Collection remains busy
- **WHEN** all ten retries are rejected as busy
- **THEN** processing of the item stops with guidance to finish the pending Anki operation and retry later, without offering AI regeneration or claiming nothing was saved.

#### Scenario: Uncertain write outcome
- **WHEN** a write encounters a transport or response-parsing error
- **THEN** it is not automatically resent.
