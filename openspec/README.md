# DerDieDeck Product Specification

## Status and purpose

Initial specification of current behavior, reconstructed from code and tests on
September 14, 2026. Baseline commit: `3ebeb6cfeaeee423be8e4514b16643c1ea255c31`.
This is the starting point for future changes through OpenSpec. It does not establish
learning effectiveness or replace verification of live integrations.

DerDieDeck turns German material into Anki notes: the user supplies a video clip,
text, a word, or a grammatical form; the application prepares learning content and
writes it to the selected deck. Anki handles reviews and scheduling. Translations
and many learning hints target Russian-speaking learners; the terminal interface
uses a mixture of languages.

The code supports these use cases but does not establish measured retention,
time savings, or memorization quality. A broader audience definition and these
metrics require separate product decisions.

## Capability map

| Specification | Scope |
| --- | --- |
| [CLI and input](specs/cli-input/spec.md) | Commands, single and batch input, options, configuration |
| [Sentence cards](specs/sentence-cards/spec.md) | Type selection, set limits, previews, revisions, card sides |
| [Lexical cards](specs/lexical-cards/spec.md) | Routing, meanings, pictures, sentences, function words, cloze |
| [Verb cards](specs/verb-cards/spec.md) | Forms, duplicates, dictionary cards, morphology packages |
| [Grammar cards](specs/grammar-cards/spec.md) | Possessive determiners, slot selection, native Cloze notes |
| [Anki output and media](specs/anki-output/spec.md) | Note types, audio, images, tags, partial writes, dry-run |
| [Learning context and recovery](specs/learning-context/spec.md) | Optional Anki context and recovery from generation errors |

## Core concepts

- **Source unit**: one word, sentence, clip, or grammar-set request.
- **Lemma**: the base dictionary form. **Target form**: the specific form being studied.
- **Anki note**: a record with fields, a note type, and tags. Anki may generate
  multiple cards from one note, such as forward and reverse cards.
- **Card**: a review task with a front and a back. Code and CLI messages sometimes
  also use “card” to refer to the note being created.
- **Set / package**: multiple related notes generated from one source unit.
- **Grammar slot**: a combination of case, gender, and number, such as `dat-masc-sg`.
- **Preview (dry-run)**: generation without writing notes or media to Anki.
  It may still use APIs, local files, audio, and Anki reads.

## Reading the requirements

A `Requirement` using `SHALL` describes confirmed behavior under its stated conditions.
A `Scenario` provides a concrete, verifiable example. Conditions such as “analysis
selected sentence-form” matter: generative analysis does not guarantee the same
result on every run for a given word.

Each specification's `Purpose` lists implementation and test evidence. Test links
indicate coverage of the listed parts, not automatic proof of every scenario in
that file. Behavior verified only through code inspection is identified explicitly.
Defects and unconfirmed intent are listed separately from normative requirements below.

All specifications and supporting OpenSpec documents must always be written in
English, including titles, explanations, requirements, and scenarios. Preserve
German examples, Russian learner translations, and exact product strings in their
original languages when they are part of the behavior being specified.

## Known baseline limitations

| ID | Observation | Evidence and practical consequence |
| --- | --- | --- |
| GAP-01 | Video processing has an unresolved subtitle import | `processMarkers` and `processVideoMode` in [index.js](../src/index.js) import `./subtitles.js`; the file is at [src/lib/subtitles.js](../src/lib/subtitles.js). Processing stops when it reaches the import. The clip pipeline is described below as inferred intent, not a verified working contract. |
| GAP-02 | Not every creation path has final confirmation | [finalizeLexicalCloze](../src/wordMode.js) writes a note after content selection and validation without a separate final confirmation; `add` and `process` also bypass card-set previews. A requirement that every write follows final confirmation would be inaccurate. |
| GAP-03 | Dry-run is not an offline mode | Words and verbs prepare audio; text invokes generation and TTS; some branches read Anki. Grammar dry-run skips duplicate checks. See [Anki output and media](specs/anki-output/spec.md). |
| GAP-04 | Packages have no shared transaction | [anki.js](../src/anki.js), [verbMode.js](../src/verbMode.js), and [grammarMode.js](../src/grammarMode.js) write notes sequentially. Errors may leave partial packages and uploaded media. Automatic completion of a partial package is not guaranteed; an early lemma check may stop a retry. |
| GAP-05 | The lexical batch summary counts successful source units | [processLexicalCommand](../src/lexicalMode.js) increments its counter once per successful workflow, even when that workflow creates multiple notes. The “lexical notes” label does not represent the actual note or card count. |
| GAP-06 | Sibling-stage tags do not schedule cards | [learningDesign.js](../src/cardContent/learningDesign.js) generates stage tags. Adding a package does not itself postpone cards or distribute them across days. |
| GAP-07 | Image selection in the current user workflow is manual | [chooseGoogleImage](../src/wordConfirm.js) opens Google Images and accepts a URL or local path. Brave/Openverse/Wikimedia helpers in [wordSources.js](../src/lib/wordSources.js) do not mean that the primary CLI automatically displays their results. |

These observations are not implementation tasks within the initial specification.
Changing any of them requires a separate change.

## Clip workflow: inferred intent

The code outlines this sequence: URL and clip boundaries → audio download →
subtitles as optional context → clipping → transcription → German text, IPA,
and Russian translation → card selection → preview → writing to Anki.
The clipboard variant selects a card set, while `add` and `process` write notes
directly. GAP-01 blocks this path for video `clip` and `process`.
External downloaders, transcription, and writes to live Anki were not run while
preparing this specification.

## Working with future changes

The current contract lives in `specs/<capability>/spec.md`. Each future change gets
its own directory at `changes/<change-name>/`, containing a proposal (`proposal.md`),
design (`design.md`), tasks (`tasks.md`), and deltas for the affected specifications.
Use `ADDED Requirements`, `MODIFIED Requirements`, and `REMOVED Requirements`;
include the complete new version of a modified requirement.

The practical workflow for this repository is:

1. Read the affected specification and inspect its referenced code.
2. Describe the behavior change, acceptance criteria, and impact on existing notes.
3. Implement the agreed change and run the relevant checks.
4. Verify the result against the scenarios, update the current contract, and archive the change.

The initial baseline was placed directly in `specs/`; it does not present all
existing functionality as a new change. The `changes/` directory is reserved for
future work. Installing OpenSpec editor integrations and generating assistant
commands are outside the scope of this documentation set.

Validate the structure with OpenSpec 1.13.0 from the repository root:

```sh
npx --yes @fission-ai/openspec@1.13.0 validate --specs --strict --no-interactive
```

The first invocation may download the CLI. No global installation or application
dependency is required. OpenSpec validates structure; code conformance is checked
separately. The format follows the official [OpenSpec concepts](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md),
[specification writing guidance](https://github.com/Fission-AI/OpenSpec/blob/main/docs/writing-specs.md),
and [project configuration](https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md).

## Baseline verification

OpenSpec 1.13.0: `validate --specs --strict --no-interactive` passed for all seven
specifications. Local links and the presence of scenarios for each requirement
were checked separately.

`npm test -- --runInBand`: 35 suites and 267 tests passed on September 14, 2026.
Two test paths skipped CEFR estimation because the 1Password integration was
unavailable; the tests passed. This does not verify external API availability.
The full CLI was not run with real media and Anki.
