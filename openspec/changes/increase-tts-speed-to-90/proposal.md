# Increase default German TTS speed to 90%

## Why

The user compared real German sentence samples at the current 75% speed,
Neural2 at 90%, and Chirp 3 HD at 90%. They chose to keep the current Google
Neural2 voice and audio processing but make newly generated speech faster at
90% of normal speed.

## What Changes

- Change the default `ttsSpeed` from `0.75` to `0.9` for generated word, verb,
  form, and sentence audio that uses the main speech rate.
- Keep Google Neural2, voice rotation, pitch, lead-in, volume, human-audio
  preference, and the separate `ttsNormalRate` setting unchanged.
- Keep an explicit user-configured `ttsSpeed` authoritative.
- Update fallback rates and configuration documentation so every entry point
  agrees with the new default.

## Scope

Only future TTS generation is affected. Existing Anki media and notes are not
rewritten. Human pronunciation recordings remain at their original speed.

## Evidence and Verification

`src/lib/config.js` defines the main default. `src/lib/tts.js`, `src/wordMode.js`,
and `src/verbMode.js` contain matching fallbacks. `tests/tts.test.js` verifies
the requested SSML prosody rate; run it after the change. The user-approved
comparison samples are outside the repository in
`/private/tmp/derdiedeck-audio-comparison-2026-10-08/compare.html`.

## Review Status

The user chose Neural2 at 90% after listening to the comparison samples.
The change is implemented and the baseline specification is synchronized.
