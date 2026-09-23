## ADDED Requirements

### Requirement: VERB-15 — Structured dictionary-card terminal preview

The dictionary-card terminal preview SHALL visually distinguish Front from Back
and organize the complete proposed answer into labeled, consistently indented
sections. Meaning and grammar, usage, optional ambiguity and contrast notes,
the German example with its Russian translation, and the infinitive with its
available pronunciation and lexical meaning SHALL remain identifiable without
relying on terminal colors. The action prompt SHALL appear separately after the
complete preview.

The presentation SHALL follow the existing word dictionary summary's visual
conventions: `┌─`, `│`, and `└─` framing, emphasized heading and target, muted
aligned labels, consistent padding, and cyan accents when terminal color is enabled.

#### Scenario: Full explanation for denkst

- **GIVEN** an explanation of `denkst` with a form meaning, grammar, usage,
  ambiguity, contrast, translated example, and infinitive information
- **WHEN** its terminal preview is displayed
- **THEN** Front and Back have explicit boundaries, each explanation section has
  a descriptive label, and blank lines separate the sections.
- **AND** the German example and its Russian translation are grouped together,
  followed by the grouped infinitive information.
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

### Requirement: VERB-16 — Relevant and concise form explanations

Generated form explanations SHALL contain only information that helps interpret
the encountered form and its example. Grammar and contextual usage SHALL be
concise; optional ambiguity and contrast SHALL be absent when they add no useful
distinction. There SHALL be no minimum word count encouraging filler. The same
prepared explanation SHALL feed preview and the saved answer.

#### Scenario: Straightforward denkst example

- **GIVEN** the target is `denkst` in `Woran denkst du gerade?`
- **WHEN** the explanation is generated and reviewed
- **THEN** it conveys `думаешь`, Präsens Indikativ, second-person singular, and
  briefly explains the usage in that sentence.
- **AND** it includes the complete German example and Russian translation.
- **AND** it omits filler such as `других распространённых нормативных чтений нет`
  and unrelated lists of constructions such as `denken an / denken, dass`.
- **AND** empty optional notes produce no headings in the terminal preview.

#### Scenario: Necessary ambiguity and contrast

- **GIVEN** a form has meaningful alternative readings, such as `wäre` or `sind`,
  or a useful confusion contrast, such as `wurde` versus `würde`
- **WHEN** the explanation is shortened
- **THEN** those distinctions remain concise and explicit, and contextual passive
  or hypothetical meanings remain accurate.

#### Scenario: Preview matches the saved explanation

- **GIVEN** a concise explanation is accepted in preview
- **WHEN** the optional dictionary note is written
- **THEN** it uses that explanation without restoring discarded filler or
  silently adding explanatory text that the learner did not preview.
