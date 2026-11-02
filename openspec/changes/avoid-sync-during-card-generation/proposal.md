# Avoid sync during card generation

## Why
A progress refresh can start a long-running sync. Its caller times out without cancelling sync, leaving collection access blocked.

## What Changes
Read local progress without starting sync in all lexical workflows. Keep explicit sync support separate.
