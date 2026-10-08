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
Cache selection, expiry, and session reuse are covered by
[knowledgeProfileCache.test.js](../../../tests/knowledgeProfileCache.test.js).
Generated example preferences are covered by
[learnerProfileGeneration.test.js](../../../tests/learnerProfileGeneration.test.js)
and word/verb workflow tests. Personalization applies to new lexical examples;
source text and clip transcripts are not rewritten.

## Requirements

### Requirement: CTX-01 — Optional profile

An unavailable learning profile SHALL allow lexical workflows to continue without
progress context.

#### Scenario: Profile disabled

- **GIVEN** `knowledgeProfileEnabled` is `false`
- **WHEN** context is requested
- **THEN** the profile is not used and word preparation can continue.

#### Scenario: Refresh fails with no usable cache

- **GIVEN** the Anki profile cannot be refreshed and no cache within the age limit is available
- **WHEN** lexical workflows receives the result
- **THEN** it continues without personalization context and may display a warning.

### Requirement: CTX-02 — Cache fallback after refresh failure

When profile refresh fails, the application SHALL use a compatible cache no older than
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

Lexical workflows SHALL display a profile warning at most once per session and
disable preliminary Anki synchronization when requesting a profile in dry-run.

#### Scenario: Multiple words with an unavailable profile

- **GIVEN** the warning has already been shown for the first word
- **WHEN** the next word receives the same profile state
- **THEN** the warning is not displayed again.

#### Scenario: Profile during preview

- **GIVEN** dry-run is enabled
- **WHEN** lexical workflows requests a profile
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


### Requirement: CTX-04 — Explicit lexical review evidence

The learner profile SHALL identify targets only through lexical metadata,
lexical tags, or a dedicated Word field. Arbitrary sentence, task, translation,
and IPA text SHALL NOT be interpreted as vocabulary. An encountered verb form
SHALL remain distinct from the infinitive.

#### Scenario: Audio-first sentence with task text
- **GIVEN** a note has only a task instruction on Front and no lexical metadata
- **WHEN** the profile is built
- **THEN** it contributes no vocabulary entry.

#### Scenario: Reviewed form
- **GIVEN** a note has `lemma-gehen` and `form-geh`
- **WHEN** the profile is built
- **THEN** evidence belongs to `geh`, with `gehen` retained only as its lemma.

### Requirement: CTX-05 — Separate familiar, learning, and new targets

Familiar targets SHALL have at least one reviewed active card, and every reviewed
active card for that target SHALL be in the review queue, with at least three
repetitions and an interval of at least 21 days. Other reviewed active targets
SHALL be classified as learning; targets without reviews SHALL be new. Suspended
and buried cards SHALL not provide active evidence. The prompt SHALL describe
this as limited review evidence, not as a proficiency assessment.

#### Scenario: New or suspended cards
- **GIVEN** a target has only zero-repetition or suspended cards
- **WHEN** context is built
- **THEN** it does not appear in familiar or learning vocabulary.

#### Scenario: Mixed review progress
- **GIVEN** one reviewed sibling has a long interval and another is relearning
- **WHEN** their target is classified
- **THEN** it is learning, not familiar.

#### Scenario: Vocabulary context
- **GIVEN** familiar, learning, and new targets exist
- **WHEN** context is built
- **THEN** bounded disjoint familiar and learning lists exclude the current
  target and its lemma; new targets are not presented as known.
- **AND** no CEFR proficiency estimate, automatic next level, or ban on basic
  vocabulary is inferred from note tags.

### Requirement: CTX-06 — Complete and compatible profile cache

Cached profiles SHALL match the current schema, Anki endpoint, and source query,
contain successful card statistics, and satisfy the configured maximum age.
These checks SHALL apply even when refresh is disabled. Failed or timed-out
refreshes SHALL not overwrite usable cached progress. Successful live reads
SHALL remain usable when a cache write fails. Session reuse SHALL expire after
five minutes for usable results and thirty seconds for unavailable results.

#### Scenario: Card statistics fail
- **GIVEN** notes can be read but card statistics cannot
- **WHEN** a profile is requested
- **THEN** a compatible usable cache is used with a warning, or personalization
  is unavailable; the incomplete snapshot is not written as fresh progress.

#### Scenario: Cache-only request
- **GIVEN** a cache is old, uses the previous schema, or belongs to another query
- **WHEN** refresh is disabled
- **THEN** it is not used for personalization.

#### Scenario: Continued CLI session
- **GIVEN** a usable profile was read more than five minutes ago
- **WHEN** the next lexical input requests a profile
- **THEN** progress is refreshed; simultaneous equivalent requests share work.

### Requirement: CTX-07 — Consistent lexical example personalization

Normal mixed lexical routing and direct word/verb workflows SHALL pass available
progress context into new example generation, including verb-form examples.
Supplying a prepared analysis SHALL not silently disable personalization.
Personalization SHALL preserve the requested target and any user-supplied
sentence. It SHALL not require an Anki write or block work without a profile.

#### Scenario: Mixed lexical routing
- **GIVEN** `words` has selected a word or verb analysis
- **WHEN** examples are prepared for that input
- **THEN** the generation or example-review request receives progress context
  without discarding the selected lexical analysis.

#### Scenario: Dry-run or unavailable profile
- **GIVEN** dry-run is enabled or progress is unavailable
- **WHEN** lexical examples are generated
- **THEN** dry-run does not sync or write Anki notes/media, and unavailable
  progress leaves normal generation usable.
