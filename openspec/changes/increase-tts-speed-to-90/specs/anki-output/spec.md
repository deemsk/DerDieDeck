## ADDED Requirements

### Requirement: ANKI-11 — Default generated German speech rate

New German audio synthesized through the application's main TTS rate SHALL
use a speaking rate of `0.9` unless the user explicitly configures another
`ttsSpeed`. The change SHALL preserve the existing Neural2 voices and other
audio-processing settings. Existing Anki media SHALL remain unchanged.

#### Scenario: New sentence audio with no user speed override

- **GIVEN** the user has not configured `ttsSpeed`
- **WHEN** a new German sentence is synthesized
- **THEN** its synthesis request uses a 90% speaking rate and the existing
  Neural2 voice selection.

#### Scenario: New fallback word or verb audio

- **GIVEN** no human pronunciation audio is available and the user has not
  configured `ttsSpeed`
- **WHEN** a word, verb, or requested form is synthesized
- **THEN** its synthesis request uses a 90% speaking rate.

#### Scenario: Explicit rate and existing audio

- **GIVEN** the user explicitly configured a different `ttsSpeed`, or an Anki
  note already contains audio
- **WHEN** the new default is introduced
- **THEN** the explicit setting remains effective and existing audio is not
  regenerated or replaced.

#### Scenario: Human pronunciation audio

- **GIVEN** human pronunciation audio is available for a lexical item
- **WHEN** the application prepares its audio
- **THEN** that recording remains preferred and is not time-stretched to 90%.
