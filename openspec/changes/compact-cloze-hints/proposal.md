# Compact lexical cloze hints

## Why
Concatenating the selected definition and model hint duplicates text and can
expose unsupported linguistic explanations inside the blank.

## What Changes
Generate a compact contextual hint independently, constrain its length and
syntax, and validate uniqueness using the exact hint saved on the card.
Apply this to initial and repaired sentences; do not migrate existing cards.
