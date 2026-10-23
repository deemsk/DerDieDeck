# Prevent cross-route lexical duplicates

## Why
Different workflow searches and exact gloss comparison let ganz create a new
main card despite an existing picture card for the same meaning.

## What Changes
Search lexical notes across routes, surface all headword matches, and require
explicit new-meaning selection. Sentence-only continuation skips the main card.
Existing notes are read only. No semantic equivalence is inferred from spelling.
