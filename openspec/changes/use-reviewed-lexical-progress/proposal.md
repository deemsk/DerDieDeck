# Use reviewed lexical evidence for personalized examples

## Why

The audit found sentence text, IPA, and task instructions in the vocabulary
profile; unreviewed notes could be labeled known; CEFR described deck composition
as learner proficiency. Failed card-statistics reads could overwrite a good
cache. The normal mixed lexical route bypassed the word profile, and verb
generation never received it.

## What Changes

- Extract explicit lexical targets from metadata, lexical tags, or dedicated
  Word fields. Never infer vocabulary from arbitrary Front/Back prose. Preserve
  encountered verb forms separately from their infinitives.
- Classify active review evidence as familiar, learning, or new. Familiar means
  every reviewed active card for that target is in review with at least three
  repetitions and an interval of at least 21 days. New siblings do not count as
  positive review evidence; suspended cards provide no current evidence.
- Include bounded, disjoint familiar and learning lists in prompts; exclude the
  requested target and related lemma. Do not infer CEFR or discourage basic
  vocabulary. These are vocabulary preferences, not guarantees of mastery.
- Version the cache and bind it to the Anki endpoint and query. Reject legacy,
  incomplete, mismatched, and expired caches on every path. Preserve a usable
  cache if card statistics fail; retain usable live data if writing cache fails.
- Recheck successful session results after five minutes and failed results
  after thirty seconds; coalesce simultaneous requests with identical options.
- Pass the profile through normal and forced lexical routes, including verb
  examples and generated form examples. Reuse supplied analyses instead of
  silently bypassing personalization. Preserve supplied sentences and the exact
  learning target. Source text and clip transcription are not rewritten.

## Scope and Approval

The user requested improvements based on the audit. This change implements that
request for future lexical example generation. Existing Anki notes/media are not
migrated; the derived local profile will be rebuilt using the new schema.

## Verification

Regression tests cover contaminated fields, new/suspended/relearning cards,
mixed siblings, cache failures and expiry, and propagation through lexical and
verb generation. Compare old and rebuilt profiles against read-only Anki data.
Run the full Jest suite and strict OpenSpec validation before updating baseline.
