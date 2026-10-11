# Clarify contextual grammar and isolated-form ambiguity

## Why
A `ging` explanation failed review because grammar listed first and third person
while the example had `Der Arzt` as subject. The shared rules required explicit
person labels using a multi-person example, but also prohibited repetition with
ambiguity. They did not assign contextual versus isolated readings to fields.

## What Changes
Define grammar as the reading in the final example; ambiguity explains other
common readings of the isolated form. Apply this same contract to generation,
repair, and semantic review. Add a ging example and align the existing test
fixture with its actual subject. Preserve validation of wrong tense, mood,
meaning, and missing genuine ambiguity. No changes to existing Anki notes or the
uncommitted compact-menu work.
