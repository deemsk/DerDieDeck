# Keep lexical grammar hints in Russian

## Why

The word-summary preview for `ihrer` displayed a German grammar explanation
under the Russian label `Грамматика`. The analysis prompt already asks for
Russian `patternHint` and `clozeHint`, but the current sanitizer accepts any
string containing one Cyrillic character. German prose with the quoted Russian
glosses `её` and `их` therefore passes into the preview and may reach a card.

## What Changes

- Recognize learner-facing hints that are predominantly German or English even
  when they contain a short Russian gloss. Allow German lexical items and
  grammatical terms such as `Dativ` inside otherwise Russian prose.
- Repair invalid `patternHint` and `clozeHint` in one targeted model request
  before the word analysis is shown or used for a card. Preserve the original
  grammatical facts, but request a short Russian explanation.
- Validate the repair. If the request fails or still returns foreign-language
  prose, omit the invalid optional hint instead of showing it under a Russian
  label or saving it in a new card.

## Scope

This affects newly generated lexical analyses, terminal previews, and new
lexical cards. It does not migrate existing Anki notes. Curated Russian hints
and valid mixed Russian/grammar terminology remain unchanged.

## Evidence and Verification

- `src/wordEnricher.js`: prompt, `normalizeRussianLearnerText`, and analysis
  sanitization.
- `src/wordConfirm.js`: preview reads `patternHint` or `clozeHint` directly.
- `src/templates/word/lexicalCloze.js`: saved cloze card can use `patternHint`.
- Regression input: `„ihrer“ kann je nach Kontext Dativ Singular feminin,
  Genitiv Singular feminin oder Genitiv Plural sein; die Bedeutung ist meist
  „её“ oder „их“.`, which contains 109 Latin letters and four Cyrillic letters.

## Review Status

The user reported this as a bug. The change implements the existing Russian
learner-facing language contract, and the baseline specification is synchronized.
