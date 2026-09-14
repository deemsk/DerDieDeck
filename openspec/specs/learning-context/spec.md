# Learning Context and Error Recovery

## Purpose

Use available learning progress as additional context and let users continue
working after unusable generation results.
Evidence: [knowledgeProfile/index.js](../../../src/knowledgeProfile/index.js),
[promptContext.js](../../../src/knowledgeProfile/promptContext.js),
[wordMode.js](../../../src/wordMode.js), [workflowRecovery.js](../../../src/workflowRecovery.js),
[lexicalMode.js](../../../src/lexicalMode.js).
Compact context is covered by [knowledgeProfile.test.js](../../../tests/knowledgeProfile.test.js),
Anki snapshots by [knowledgeProfileAnki.test.js](../../../tests/knowledgeProfileAnki.test.js),
and recovery by [workflowRecovery.test.js](../../../tests/workflowRecovery.test.js).
Live/cache selection and one-time warnings were verified through code inspection.
The word workflow requests context; a supplied analysis may not use that context
for initial generation. This specification does not promise uniform adaptation
across all modes.

## Requirements

### Requirement: CTX-01 — Optional profile

An unavailable learning profile SHALL allow the word workflow to continue without
progress context.

#### Scenario: Profile disabled

- **GIVEN** `knowledgeProfileEnabled` is `false`
- **WHEN** context is requested
- **THEN** the profile is not used and word preparation can continue.

#### Scenario: Refresh fails with no usable cache

- **GIVEN** the Anki profile cannot be refreshed and no cache within the age limit is available
- **WHEN** the word workflow receives the result
- **THEN** it continues without personalization context and may display a warning.

### Requirement: CTX-02 — Cache fallback after refresh failure

When profile refresh fails, the application SHALL use a cache no older than
`knowledgeProfileMaxCacheAgeDays` (21 days by default), marking it as stale.

#### Scenario: Usable cache

- **GIVEN** refresh fails, the cache is 10 days old, and the limit is 21 days
- **WHEN** context is selected
- **THEN** compact cached context is used with a warning.

#### Scenario: Cache is too old

- **GIVEN** refresh fails, the cache is 30 days old, and the limit is 21 days
- **WHEN** context is selected
- **THEN** the cache is not included in the prompt as current learner knowledge.

### Requirement: CTX-03 — Warning and synchronization limits

The word workflow SHALL display a profile warning at most once per session and
disable preliminary Anki synchronization when requesting a profile in dry-run.

#### Scenario: Multiple words with an unavailable profile

- **GIVEN** the warning has already been shown for the first word
- **WHEN** the next word receives the same profile state
- **THEN** the warning is not displayed again.

#### Scenario: Profile during preview

- **GIVEN** dry-run is enabled
- **WHEN** the word workflow requests a profile
- **THEN** it disables synchronization; Anki reads and local cache writes may
  still occur after a successful refresh.

### Requirement: REC-01 — One automatic retry

The shared lexical workflow SHALL automatically retry the first error marked as
recoverable with a fresh analysis attempt.

#### Scenario: Repeated generation failure

- **GIVEN** the first preparation attempt returns a recoverable error
- **WHEN** the automatic retry also fails
- **THEN** the application presents recovery choices instead of continuing automatic retries.

### Requirement: REC-02 — Manual recovery

After a lexical workflow error, the application SHALL offer retry, input editing,
forced word/verb routing, and skip; manual sentence entry is available when the
error permits that recovery method.

#### Scenario: Ordinary integration error

- **GIVEN** an error occurs without being marked as recoverable generation failure
- **WHEN** the shared workflow receives it
- **THEN** the user sees the reason and a recovery menu without an automatic retry.

#### Scenario: Manual sentence

- **GIVEN** the error permits manual sentence entry
- **WHEN** the user selects that option and enters a German example
- **THEN** the next attempt receives the example as the `sentence` option.

#### Scenario: Skipping the failed item

- **WHEN** the user selects Skip
- **THEN** the current item finishes as skipped and batch processing can continue
  with subsequent items.
