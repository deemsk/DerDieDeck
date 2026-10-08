# Explain lexical cloze constructions in context

## Why

The reported card for `Je mehr du übst, desto besser wirst du.` displays
`Наречие: его смысл и область действия определяются позицией и контекстом.`
under `Правило:`. This is a hard-coded part-of-speech fallback, not an
explanation of the construction in the sentence. The learner needs to understand
what the target means here and how the surrounding construction works.

Observed code behavior: `buildFunctionWordPatternHint` prefers `wordData.patternHint`
and otherwise selects a generic string by lexical type. It receives no sentence.
The initial lexical analysis may supply a hint before the final example is chosen
or rewritten, so removing the fallback alone does not establish contextual relevance.

## What Changes

- Prepare a concise Russian explanation using the target, selected meaning, and
  final sentence after cloze repairs and sentence enrichment.
- Explain the actual construction and only the word order, case, or meaning
  distinction useful in that example. Include paired elements such as `je … desto …`.
- Validate contextual relevance before rendering. Earlier lexical hints may be
  inputs, but SHALL NOT bypass validation against the final sentence.
- Remove generic part-of-speech fallback prose. If no additional explanation is
  useful, omit the rule block. Generation failure must not masquerade as this case.
- Show the prepared rule in the terminal preview and save the same content.
- Provide a preview-first migration for existing `mode-lexical-cloze` notes,
  using the same explanation preparation rules and preserving the rest of each note.

## Scope and Authorization

The user explicitly requested both new cards and updates to existing cards.
Existing lexical-cloze explanations are reviewed, including nonempty hints that
may be irrelevant to their saved sentence; the migration is not limited to `je`.
Only recognizable application-generated notes are eligible for automated changes.
This change does not alter the cloze target, sentence, translation, IPA, audio,
card styling, or scheduling. Verb dictionary and grammar-family cards are outside
the scope. No new general-purpose grammar catalog is required.

## Capabilities

- `lexical-cards`: contextual explanations and their terminal preview.
- `anki-output`: previewed, backed-up updates of existing lexical-cloze rule blocks.

## Evidence and Verification

Current sources: `src/data/functionWordPatterns.js`,
`src/cardContent/functionWordPatterns.js`, `src/templates/word/lexicalCloze.js`,
`src/wordEnricher.js`, and `src/wordMode.js`.
Reuse the migration conventions in `src/verbDictionaryMigration.js` and note
snapshot/update helpers in `src/anki.js`; the existing Back-only updater cannot
be used unchanged for Cloze `Extra` fields.

Existing tests: `tests/lexicalCloze.test.js`, `tests/wordSentenceMode.test.js`,
and `tests/verbDictionaryMigration.test.js` as a migration reference.
New requirements are proposed and have no implementation coverage yet.

## Review Status

The user approved this written contract. Implemented and verified on `main`;
baseline specifications are synchronized. The reviewed migration updated 40
existing notes and retained one suitable explanation. See `tasks.md` for evidence.
