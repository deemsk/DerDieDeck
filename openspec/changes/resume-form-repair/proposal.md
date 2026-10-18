# Resume failed form repairs

## Why
Manual Retry discards the answer and feedback collected by automatic repair.

## What Changes
Carry diagnostic attempts into manual Repair, preserve them on request errors,
and keep successful-preview Regenerate fresh. No existing cards are changed.
