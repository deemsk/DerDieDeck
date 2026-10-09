# Validate verb identity before choosing examples

## Why
The requested `sieh` from `sehen` accepted `Sieh bitte nach, ob die Tür zu ist.`
because token checks could not distinguish `sehen` from separable `nachsehen`.
The semantic explanation review caught the mismatch only after sentence audio
was prepared. Retrying the explanation retained the incompatible sentence.

## What Changes
- Independently review candidate sentences for the requested lemma, form, and
  selected meaning before showing choices. Retain original text and ordering.
- Apply the same review to manual/preferred sentences and changed AI revisions
  before preparing audio. Picture-verb examples use the same validator.
- Treat separable particles in context; do not blacklist words such as `nach`.
- Reject malformed or unavailable validation results instead of admitting
  unverified examples. Existing workflow recovery remains available.
- Offer a new example or sentence editing when a companion form explanation
  fails, carrying the failure reason into revision.
- Strengthen generation instructions to preserve the lemma as well as spelling.

## Scope
This is the bounded fix proposed in chat and approved by the user. It affects new
ordinary sentence/picture verb preparation only; existing Anki notes are not
migrated. Strong-verb morphology packages retain their existing dedicated
validation and are outside this bounded fix.
