# Grammar Cloze Notes

## Purpose

Teach grammatical slots through short sentences built from predefined templates.
Evidence: [grammarMode.js](../../../src/grammarMode.js), [registry.js](../../../src/grammar/registry.js),
[possessive.js](../../../src/grammar/families/possessive.js), [grammarConfirm.js](../../../src/grammarConfirm.js).
The paradigm is covered by [possessiveFamily.test.js](../../../tests/possessiveFamily.test.js),
and fields and duplicate lookup by [ankiGrammar.test.js](../../../tests/ankiGrammar.test.js).
The complete interactive workflow and partial-write handling were verified through code inspection.

## Requirements

### Requirement: GRAM-01 — Supported family

The `grammar` command SHALL support the `possessive` family with the bases
`mein`, `dein`, `sein`, `ihr`, `unser`, and `euer`, normalizing known inflected
forms to their corresponding base.

#### Scenario: Inflected form

- **WHEN** the user supplies `grammar possessive meinem`
- **THEN** a set is built for the base `mein`.

#### Scenario: Unknown family

- **WHEN** a family absent from the registry is supplied
- **THEN** the application reports an error and lists the available families.

### Requirement: GRAM-02 — Complete paradigm

The possessive generator SHALL build 16 units: four cases for masculine, neuter,
and feminine singular, and for plural.

#### Scenario: Complete mein set

- **WHEN** units are built for `mein`
- **THEN** the result contains 16 distinct slots with `{{c1::...}}`, a Russian
  translation, and an explanation of the corresponding form.

#### Scenario: Special euer stem

- **WHEN** the masculine dative form of `euer` is built
- **THEN** the target form is `eurem`.

### Requirement: GRAM-03 — Excluding existing slots

During a normal run, the grammar workflow SHALL exclude existing slots for the
same family and lemma before the user selects a set.

#### Scenario: Partial paradigm already exists

- **GIVEN** one of the 16 `possessive mein` slots is found in Anki
- **WHEN** the preview is prepared
- **THEN** the user selects from the remaining 15, with the existing slot shown separately.

#### Scenario: Entire set already exists

- **GIVEN** all 16 slots are found
- **WHEN** the check runs
- **THEN** the application reports that all slots already exist and does not offer to write them.

### Requirement: GRAM-04 — Subset selection

The grammar preview SHALL let users enable and disable individual slots, confirm
a nonempty set, or dismiss the set.

#### Scenario: One slot remains enabled

- **GIVEN** the user disables every slot except one
- **WHEN** the user selects Add
- **THEN** only the selected Cloze note is written.

#### Scenario: All slots disabled

- **WHEN** the user tries to add a set with no enabled slots
- **THEN** the application asks the user to enable at least one slot and stays in the preview.

### Requirement: GRAM-05 — Preview without Anki

Grammar dry-run SHALL build and preview the selected set without connecting to
Anki or checking existing slots.

#### Scenario: Anki is closed

- **WHEN** the user invokes `grammar possessive mein --dry-run`
- **THEN** all 16 slots can be generated and selected without writing;
  their absence from Anki is not verified.
