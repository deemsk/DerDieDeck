## ADDED Requirements

### Requirement: VERB-22 — Compact English review actions

Dictionary review SHALL separate card outcomes, actions, and keyboard input.
Interface labels SHALL be English. Headings SHALL be visually subdued and
shortcut keys emphasized when color is enabled: green for `[Y]`, yellow for other
actions, distinct from the cyan lexical target. Actions SHALL use aligned columns
when space permits and one column in narrower terminals. Existing action meanings
and defaults SHALL be preserved; explanatory card content SHALL remain unchanged.

#### Scenario: Companion card ready
- **GIVEN** both a form card and an audio sentence card are ready for review
- **WHEN** actions are displayed
- **THEN** both cards are listed under `Ready to add`, followed by distinct actions
  for adding both, regenerating, editing the example, audio only, and cancellation.
- **AND** input uses `Choose [Y]: `; Enter accepts both.

#### Scenario: Explanation failed
- **GIVEN** a companion form explanation failed
- **WHEN** recovery actions are displayed
- **THEN** new example, edit example, retry explanation, audio only, and cancel
  are separate actions followed by `Choose: ` with no implied default.

#### Scenario: Narrow terminal
- **GIVEN** two action columns would exceed the terminal width
- **WHEN** the menu is formatted
- **THEN** actions are stacked without relying on color for their meaning.
