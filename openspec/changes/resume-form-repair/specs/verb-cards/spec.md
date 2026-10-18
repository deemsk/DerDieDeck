## ADDED Requirements

### Requirement: Resume failed form repairs

After a failed form explanation, the R action SHALL be labeled Repair and resume
from the last proposed answer and accumulated blocking issues. Diagnostic attempt
numbers SHALL continue across manual repairs. Each invocation retains the bounded
one automatic repair budget and independently validates every proposed answer.
A successful preview's Regenerate action SHALL start fresh. A transient request
failure SHALL retain available diagnostic history for the next repair.

#### Scenario: Manual repair after two rejected answers
- **WHEN** the learner selects Repair after an explanation failure
- **THEN** the next model request contains the latest answer and prior blocking issues.
- **AND** a further failure preserves the complete history for another Repair.

#### Scenario: Regenerate an accepted preview
- **WHEN** the learner regenerates a successfully reviewed explanation
- **THEN** stale rejection history is not supplied to the new generation.
