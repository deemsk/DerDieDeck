## MODIFIED Requirements

### Requirement: VERB-15 — Structured dictionary-card terminal preview

The dictionary-card terminal preview SHALL visually distinguish Front from Back
and organize the complete proposed answer into labeled, consistently indented
sections. Meaning and grammar, usage, optional ambiguity and contrast notes,
the German example with its Russian translation, form pronunciation when
available, and a compact infinitive reference SHALL remain identifiable without
relying on terminal colors. The action prompt SHALL appear separately after the
complete preview.

The presentation SHALL follow the existing word dictionary summary's visual
conventions: `┌─`, `│`, and `└─` framing, emphasized heading and target, muted
aligned English labels and consistent padding. The heading SHALL be `Card preview`.
When terminal color is enabled, the frame SHALL be green while the target
remains cyan; the informational `Word summary` frame SHALL remain cyan.
Translations and learning explanations SHALL remain in Russian.

#### Scenario: Full explanation for denkst

- **GIVEN** an explanation of `denkst` with a form meaning, grammar, usage,
  ambiguity, contrast, translated example, and infinitive information
- **WHEN** its terminal preview is displayed
- **THEN** Front and Back have explicit boundaries, each explanation section has
  a descriptive label, and blank lines separate the sections.
- **AND** the German example and its Russian translation are grouped together,
  with the compact infinitive reference in the Back section.
- **AND** all proposed answer content is shown before accept/regenerate/skip.
- **AND** the preview uses the same framing and emphasis conventions as the
  existing word dictionary summary.

#### Scenario: Optional notes are absent

- **GIVEN** ambiguity or contrast is absent
- **WHEN** the preview is formatted
- **THEN** absent fields produce no empty headings or placeholder text.

#### Scenario: Long explanation in a narrow terminal

- **GIVEN** an explanation contains lines longer than the available terminal width
- **WHEN** the preview is formatted
- **THEN** prose wraps at word boundaries where possible and continuation lines
  retain the indentation of their section.

#### Scenario: Plain output

- **GIVEN** terminal colors are unavailable or output is redirected
- **WHEN** the preview is displayed
- **THEN** labels, indentation, and blank lines preserve the same content hierarchy.

#### Scenario: User regenerates, dismisses, or uses dry-run

- **WHEN** the user regenerates or dismisses the optional card, or runs in dry-run
- **THEN** the existing confirmation and no-write guarantees remain in effect;
  regeneration displays the newly prepared explanation with the same structure.
