# Verb Cards and Packages

## Purpose

Connect a verb's meaning, dictionary form, and forms used in sentences.
Evidence: [verbMode.js](../../../src/verbMode.js), [verbEnricher.js](../../../src/verbEnricher.js),
[verbPackage.js](../../../src/cardContent/verbPackage.js), [verbMorphology.js](../../../src/cardContent/verbMorphology.js),
[verbConfirm.js](../../../src/verbConfirm.js).
Main branches and creation are covered by [verbMode.test.js](../../../tests/verbMode.test.js),
morphology by [verbMorphology.test.js](../../../tests/verbMorphology.test.js),
package validation by [verbPackage.test.js](../../../tests/verbPackage.test.js),
and templates by [ankiVerb.test.js](../../../tests/ankiVerb.test.js).
Human pronunciation audio availability for a particular lemma depends on the external source.

## Requirements

### Requirement: VERB-01 — Specific sentence or form takes precedence

The verb workflow SHALL use the ordinary card path instead of a morphology package
when the user supplies a sentence or analysis identifies a target form that differs
from the infinitive.

#### Scenario: Explicit example

- **GIVEN** trusted forms are available for `sprechen`
- **WHEN** the user supplies `--sentence "Ich spreche Deutsch."`
- **THEN** the selected sentence is processed and a package is not created automatically.

#### Scenario: Studying a specific form

- **GIVEN** input is recognized as `wäre` from `sein`
- **WHEN** the verb path is determined
- **THEN** an infinitive package does not replace work on the requested form.

### Requirement: VERB-02 — Lemma and form duplicates

During a normal run, the verb workflow SHALL check duplicates for a specific form
when one is requested; otherwise, it checks existing picture, lemma, and sentence
notes for the verb.

#### Scenario: Lemma already being studied

- **GIVEN** a sentence note exists for `bleiben` and no specific form is requested
- **WHEN** the early duplicate check successfully finds it
- **THEN** the new workflow stops before sentence selection.

#### Scenario: New form of a known lemma

- **GIVEN** `sein` already exists but no note is found for the requested `wäre`
- **WHEN** the form is checked
- **THEN** the existing lemma alone does not block a new form card.

#### Scenario: Duplicate check unavailable

- **GIVEN** the early duplicate check fails
- **WHEN** the error is handled
- **THEN** the application reports that the check was skipped and continues;
  subsequent path-specific checks and Anki's duplicate prohibition remain in effect.

### Requirement: VERB-03 — Morphology package eligibility

A form package SHALL be offered only with high-confidence morphology, a nonempty
list of selected forms, and successful validation of the package sentences.

#### Scenario: Morphology unavailable

- **GIVEN** no high-confidence morphology with selected forms is available
- **WHEN** the verb is processed
- **THEN** the ordinary picture-word or sentence-form path is used according to analysis.

#### Scenario: Invalid package sentences

- **GIVEN** morphology is usable but the final plan fails sentence validation
- **WHEN** the package is prepared
- **THEN** the application reports that the package was skipped and returns to the ordinary path.

### Requirement: VERB-04 — Sentence agreement with the target form

The package SHALL use short sentences that pass checks for the target pronoun,
verb form, separable particle position, and Russian person/number agreement.

#### Scenario: Wrong person in the translation

- **GIVEN** the target form requires the Russian subject `мы`, but the generated
  sentence fails the agreement check
- **WHEN** a second generation attempt is still available
- **THEN** the sentence is regenerated with guidance about the required person.

#### Scenario: Example is too long

- **GIVEN** an example contains more than nine words
- **WHEN** the form sentence is validated
- **THEN** it is not accepted into the package.

### Requirement: VERB-05 — Package composition and confirmation

A confirmed package SHALL create one lemma note, two notes per key form, and two
notes per form sentence: an audio-first note and a cloze note.

#### Scenario: Two forms with two sentences

- **GIVEN** a valid package contains two forms and two sentences, with no duplicates or write errors
- **WHEN** the user confirms the package
- **THEN** nine notes are created: one lemma, four key-form notes, two sentence
  notes, and two cloze notes.

#### Scenario: Package dismissed

- **WHEN** the user dismisses the package preview
- **THEN** no package notes are written.

### Requirement: VERB-06 — Dictionary-form card

The ordinary verb workflow SHALL honor the user's final choice about creating an
additional card that connects the encountered form to its infinitive.

#### Scenario: Additional card selected

- **GIVEN** sentence-form is selected and the user leaves the dictionary-form card enabled
- **WHEN** notes are written
- **THEN** an additional `mode-verb-dictionary` note is created with the form on
  Front and the infinitive, translation, and prepared pronunciation on Back.

#### Scenario: Additional card disabled

- **WHEN** the user disables the dictionary-form card in the final preview
- **THEN** the sentence note is created without that additional note.
