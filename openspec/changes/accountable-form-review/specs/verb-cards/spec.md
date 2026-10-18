## ADDED Requirements

### Requirement: Accountable form explanation review

Form explanation review SHALL return separate blocking issues and optional
suggestions, each naming the field and a concrete reason. Only blocking issues
SHALL trigger repair. Wrong lexical identity, grammar, misleading meaning,
material mistranslation and missing common competing readings remain blocking.
Equivalent natural translations, optional contrasts and stylistic preferences
SHALL NOT block a card. Review SHALL evaluate the proposed explanation, not
reject it for an error already corrected from the supplied sentence translation.

Generation SHALL have at most one automatic repair. Repair SHALL receive the
previous answer and accumulated blocking feedback; correct content and the
selected German sentence SHALL be preserved. Persistent failure SHALL expose
numbered attempt reasons and attach structured attempt diagnostics containing
proposed answers and review outcomes. No unreviewed answer SHALL be returned.
Malformed review results SHALL fail closed. Diagnostics SHALL remain local to
the error, without automatic persistent storage of learner data.

#### Scenario: Optional suggestion only
- **WHEN** review suggests a stylistic alternative with no blocking issue
- **THEN** the original verified explanation is returned without repair.

#### Scenario: Repair fails for a new reason
- **WHEN** the first review rejects a meaning and the second rejects ambiguity
- **THEN** the failure reports both attempts and retains both proposed answers
  and review outcomes for diagnosis, without adding a card.
