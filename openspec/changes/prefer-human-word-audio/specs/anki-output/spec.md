## MODIFIED Requirements

### Requirement: ANKI-03 — Word pronunciation

Preparation of an individual word or infinitive SHALL use available
Wiktionary/Wikimedia IPA and human audio for all lexical types and requested forms, with TTS only as a fallback when a usable human recording cannot be retrieved. Noun recordings without an article SHALL be accepted; the written article SHALL remain on the card.

#### Scenario: Noun with an article

- **GIVEN** the canonical form is `der Arzt` and human audio without the article is found
- **WHEN** picture-word audio is prepared
- **THEN** the human recording of `Arzt` is used without generating TTS, while `der Arzt` remains the written form.

#### Scenario: No usable human recording

- **WHEN** no human recording is available or retrieval fails
- **THEN** TTS supplies pronunciation; for nouns its spoken text may include the article.

#### Scenario: Human verb audio

- **GIVEN** a usable human audio file is found for the infinitive
- **WHEN** infinitive pronunciation is prepared
- **THEN** the retrieved file is used instead of TTS.

