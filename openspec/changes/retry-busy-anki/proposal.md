# Retry busy Anki collection requests

## Why
Temporary collection lifecycle locks currently discard ready analysis and offer unrelated AI recovery.

## What Changes
Retry only explicit pre-execution collection-busy responses, preserving the request and prepared content. Wait at most ten one-second intervals, with a visible notice. On exhaustion stop the item with Anki-specific guidance. Never replay requests after transport failures or other API errors.
