# Report partial card writes

## Why
Multi-note operations may fail after some notes are saved, and the failed write may have an unknown outcome.

## What Changes
For sentence-form word cards, report the confirmed main note ID after a subsequent failure, explain uncertain write outcomes, and avoid restarting the workflow automatically. Do not assume failed network requests had no effect.
