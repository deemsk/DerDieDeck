# Clarify the lexical interpretation choice

## Why

The reported dialog asks the learner to choose between `word` and `verb` for
`lass`. A verb is also a word, so these internal workflow names do not communicate
distinct linguistic interpretations. The verb row also puts the infinitive first
and shows the encountered form in unexplained parentheses.

Observed behavior is in `askLexicalRoute` in `src/lexicalMode.js`: workflow names
label the rows and determine the displayed shortcuts. The user explicitly reports
that the distinction is confusing. The intended outcome is a question the learner
can understand without knowing the application's routing architecture.

## What Changes

- Ask which interpretation of the input the learner intends.
- Present numbered candidate interpretations, labeled by their actual part of
  speech. For an inflected verb, show the encountered form followed by its infinitive.
- Describe candidates as uncertain proposals, not established facts. Distinguish
  conflicting plausible candidates from two unreliable analyses.
- Include a short existing Russian meaning when available; attach a verb's
  lexical translation to its infinitive, not to the encountered inflected form.
- Display a numeric choice and Skip, with Enter explicitly meaning Skip.
- Retain the old `w`/`word` and `v`/`verb` inputs as compatibility aliases without
  using them as the displayed categories.
- Use consistent row indentation and existing terminal styling. Keep the console
  interface in English and the available learner meanings in Russian.

Illustrative output for the reported candidates, when no meanings are available:

```text
Which interpretation did you intend for "lass"?
The analyses disagree. These are possible interpretations:

  1. Particle: lass
  2. Verb form: lass → lassen

Choose [1/2], or [S]kip (Enter = skip):
```

The `particle` candidate illustrates the existing analysis result; this proposal
does not endorse it as a linguistically correct classification of `lass`.

## Scope

This is a bounded presentation and input-selection change to the existing
ambiguity dialog. Internal route identifiers, classifier thresholds, analysis
generation, card creation, and duplicate handling stay as implemented. No new API
calls or migration of Anki notes are needed. Missing type information must not be
silently displayed as `noun`.

## Capabilities and Verification

- Modified capability: `lexical-cards`, requirement LEX-01.
- Code evidence: `src/lexicalMode.js`; current route selection tests:
  `tests/lexicalMode.test.js`.
- Add dialog tests for candidate labels, target/infinitive order, absent analyses,
  numeric selection, compatibility aliases, invalid input, and skip behavior.
- Update the baseline only after implementation and verification.

## Review Status

Approved by the user and implemented on `main`. Baseline LEX-01 is synchronized;
focused and full test suites passed. Independent review found no actionable
issues, and strict OpenSpec validation passed.
