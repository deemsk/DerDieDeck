# Codex Project Guide

Use this file first when working in this repository. It captures the stable project shape so routine requests do not require a full-codebase search before making progress.

## Project Summary

DerDieDeck is a Node.js CLI that creates German Anki cards from YouTube clips, selected text, lexical prompts, and grammar prompts.

Core outputs:
- audio-first sentence comprehension cards
- optional dialogue, production, pattern, and cloze cards
- picture-word cards for nouns, imageable adjectives, and some verbs
- sentence-form cards for less visual adjectives, adverbs, and verbs
- grammar cloze cards for supported grammar families
- strong/irregular verb packages with lemma, form, sentence, and cloze notes

The app talks to Anki through AnkiConnect and uses local tools plus APIs for transcription, audio, IPA, enrichment, images, and Wiktionary-derived pronunciation data.

## Commands

Common commands:
- `npm test` - run all Jest tests
- `npm run check` - check local tools, API key, and AnkiConnect
- `npm run words -- "<item>"` - create one lexical note
- `npm run words` - mixed interactive lexical mode
- `npm run grammar -- <family> <lemma>` - create grammar cloze notes
- `npm run text` - manual phrase input
- `npm run clip` / `npm start` - process clipboard clip data

Useful migrations:
- `npm run styles:dry-run` / `npm run styles`
- `npm run migrate-picture-word-extra-info:dry-run`
- `npm run migrate-picture-word-personal-connections:dry-run`
- `npm run migrate-template-inline-styles:dry-run`
- `npm run migrate-verb-dictionary-audio:dry-run`

When changing behavior, prefer a focused Jest run first, then `npm test` if the change touches shared modules.

## Architecture Map

Entry point:
- `src/index.js` - Commander CLI registration and top-level command handlers

Workflows:
- `src/wordMode.js` - lexical word workflow for nouns, adjectives, adverbs, and function-word style items
- `src/verbMode.js` - verb workflow, sentence cards, picture verbs, dictionary-form cards, strong verb packages
- `src/grammarMode.js` - grammar cloze workflow
- `src/lexicalMode.js` - routes mixed lexical input to word or verb handling
- `src/enricher.js` - sentence enrichment and review
- `src/wordEnricher.js` - lexical analysis prompt/result handling
- `src/verbEnricher.js` - verb analysis and sentence generation

Anki:
- `src/anki.js` - AnkiConnect wrapper, note creation, duplicate checks, migrations
- `src/templates/index.js` - sentence card field construction
- `src/templates/word/*` - picture-word fields and extra info
- `src/templates/verb/*` - verb dictionary, cloze, and key-form card content
- `src/templates/shared/*` - shared HTML/CSS helpers such as IPA, word display, sound tags

Card content/domain helpers:
- `src/cardContent/german.js` - German normalization/tag helpers
- `src/cardContent/html.js` - HTML escaping/stripping
- `src/cardContent/ipa.js` - IPA normalization
- `src/cardContent/wordLexical.js` - lexical display, focus candidates, chosen sentence glosses
- `src/cardContent/verbMorphology.js` - WiktApi-derived verb morphology and tags
- `src/cardContent/verbPackage.js` - strong verb package planning/validation
- `src/cardContent/learningDesign.js` - learning intent and sibling-stage tags
- `src/cardContent/interference.js` - contrast/interference tags and hints

Integrations:
- `src/lib/config.js` - config loading, defaults, legacy config fallback
- `src/lib/tts.js` - Google/local TTS helpers and audio conversion
- `src/lib/wordSources.js` - image search, Wiktionary/Wikimedia pronunciation, remote asset download
- `src/lib/downloader.js`, `src/lib/clipper.js`, `src/lib/transcriber.js` - YouTube/clip/transcription pipeline
- `src/knowledgeProfile/*` - best-effort Anki learning profile cache and prompt context

Tests:
- Workflow tests live in `tests/*Mode.test.js`
- Anki helpers/migrations live in `tests/anki*.test.js`
- Source/integration helper behavior lives in `tests/wordSources.test.js`, `tests/tts.test.js`, etc.

## Stable Conventions

Language/runtime:
- ESM JavaScript (`"type": "module"`)
- Jest uses `node --experimental-vm-modules`
- Keep code plain JavaScript; no TypeScript conversion unless explicitly requested

Formatting/style:
- Existing code uses semicolons in `src`, many tests omit semicolons. Follow the local file style.
- Prefer small helpers in the relevant module over new global abstractions.
- Preserve existing HTML class-driven card styling; avoid inline styles in generated fields.
- Use shared helpers for common card markup:
  - `formatPlainWord`
  - `formatPronunciationField`
  - `formatIpaHtml`
  - `soundTag`
  - `escapeHtml`

Anki/card behavior:
- Sentence cards are usually audio-first: Front has sound plus optional task/context; Back has German, IPA, Russian.
- Picture-word cards use the configured `2. Picture Words` note type by default.
- Basic verb cards use `Basic (optional reversed card)` by default.
- Verb dictionary-form cards are tagged `mode-verb-dictionary`; their Back should include the infinitive, pronunciation/audio when available, and translation.
- New cards should carry searchable tags such as `yt2anki`, `mode-*`, `lemma-*`, `form-*`, and learning-intent tags where relevant.
- Duplicate checks are part of normal workflows; do not bypass them unless the user explicitly asks.

Audio/pronunciation:
- Word and verb pronunciation should prefer Wiktionary/Wikimedia human audio and IPA through `resolveWordPronunciation`.
- If human audio is unavailable, word/verb flows may fall back to generated TTS.
- `storeAudio`/`storeMedia` in `src/anki.js` store files via AnkiConnect and return the final Anki media filename.
- Dry-run code should not write to Anki and should avoid downloading media where practical.

Images:
- Imageable lexical cards use `resolveImageAsset` after user confirmation.
- Brave image search is preferred when configured, with Openverse/Wikimedia fallbacks in `wordSources`.

Config:
- Preferred config is `~/.derdiedeck.json`; legacy `~/.yt2anki.json` may still be read.
- Key defaults include `ankiDeck`, `ankiNoteType`, `wordNoteType`, `grammarNoteType`, `dataDir`, `ttsSpeed`, and knowledge profile settings.

## Change Strategy

Before editing:
- Check `git status --short`; unrelated untracked or modified files may exist and should be left alone.
- Search narrowly for the relevant module/test instead of scanning everything by default.
- For OpenAI/API behavior, prefer the existing SDK/config patterns and prompt structures.

When adding behavior:
- Put workflow-specific logic in the workflow module.
- Put reusable Anki note/migration behavior in `src/anki.js`.
- Put card HTML construction in `src/templates/*` or `src/cardContent/*`, not inline in workflows.
- Put external-source retrieval in `src/lib/wordSources.js`.
- Add or update focused tests near the behavior.

When adding migrations:
- Provide a dry-run flag.
- Return `{ matched, updated, skipped, notes }` where possible.
- Skip notes that already have the target state.
- Keep existing note fields/tags intact except for the intended field update.

When committing:
- Stage only files related to the task.
- Leave unrelated local files untouched.
- A good commit message is short and behavior-oriented, for example `Add verb dictionary audio migration`.

## High-Value Test Targets

Use these for focused checks:
- Verb workflow/dictionary cards: `npm test -- --runTestsByPath tests/verbMode.test.js tests/ankiVerb.test.js`
- Word workflow/cards: `npm test -- --runTestsByPath tests/wordMode.test.js tests/ankiWord.test.js tests/wordSources.test.js`
- Grammar cards: `npm test -- --runTestsByPath tests/ankiGrammar.test.js tests/possessiveFamily.test.js`
- Templates/migrations broadly: `npm test -- --runTestsByPath tests/anki.test.js tests/ankiVerb.test.js tests/ankiWord.test.js`

Run `npm test` before finalizing changes with broad impact.
