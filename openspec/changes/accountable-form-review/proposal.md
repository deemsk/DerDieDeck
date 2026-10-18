# Make form review actionable

## Why
The hör failure shows only the last review reason, hiding whether automatic
repair ignored earlier feedback or encountered a new issue. A binary verdict
also gives optional editorial suggestions the same effect as correctness errors.

## What Changes
Separate blocking issues from suggestions, accumulate repair feedback, and
retain per-attempt answer/review diagnostics on failure. Keep one repair and
fail-closed correctness checks. Existing cards are unaffected.
