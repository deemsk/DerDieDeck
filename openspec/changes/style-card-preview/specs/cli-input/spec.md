## ADDED Requirements

### Requirement: Consistent terminal card previews

All interactive pre-save card previews SHALL use a shared renderer with the
heading `Card preview`, green `┌─`, `│`, `└─` framing, aligned muted English
labels, and consistent padding. Target words SHALL retain cyan emphasis.
Russian learning content and all existing preview fields SHALL be preserved.
This applies to picture and sentence lexical cards, verb forms and packages,
single sentence cards and card sets, and grammar selections. Action prompts
and duplicate warnings SHALL remain outside the frame. Word summary SHALL
remain cyan and distinct from the pre-save preview.

#### Scenario: Preview any supported card route

- **WHEN** a learner reaches an interactive confirmation before adding cards
- **THEN** proposed content uses the shared Card preview frame.
- **AND** available metadata and card enable/disable states remain visible.
- **AND** long content wraps with aligned continuation lines and plain output
  preserves the same hierarchy without relying on color.
