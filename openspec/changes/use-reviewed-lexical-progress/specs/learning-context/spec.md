## ADDED Requirements

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
