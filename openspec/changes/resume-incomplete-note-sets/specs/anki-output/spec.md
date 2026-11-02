## ADDED Requirements

### Requirement: Resume an incomplete approved note set

For a sentence-form word card set, before the first Anki note write, the application SHALL durably record the user-approved plan, its target collection identity, stable operation ID, and ordered note steps. Each note SHALL include an operation-and-step-specific searchable tag. The journal SHALL be written atomically and SHALL record confirmed note IDs. Before creating each pending note, required Anki media SHALL be checked; missing media SHALL stop recovery without creating that note. The plan SHALL preserve the exact note model, deck and rendered fields.

After interruption of this word-card set, the application SHALL offer to inspect and resume the original plan. Before executing any pending or uncertain step, it SHALL search Anki for that exact operation and step. Exactly one matching note is treated as confirmed; no match allows the step to proceed; multiple matches, failed lookup, or a different collection identity SHALL stop recovery with an explanation. It SHALL NOT regenerate content or automatically replay an uncertain write without reconciliation.

#### Scenario: Write succeeded but response was lost
- **WHEN** a note was saved but the process lost its response
- **THEN** recovery finds its operation and step tag, records its ID and does not create another note.

#### Scenario: Write did not succeed
- **WHEN** reconciliation establishes that the step tag has no matching note
- **THEN** recovery may create the approved note and proceed to the next missing step.

#### Scenario: Duplicate reconciliation results
- **WHEN** multiple notes have the same operation and step tag
- **THEN** recovery stops and lists the matching IDs for inspection.

#### Scenario: Collection changed
- **WHEN** the current collection cannot be verified as the journal's original target
- **THEN** recovery stops without creating notes.



#### Scenario: Collection copied with media
- **WHEN** a collection is copied along with its profile name and media
- **THEN** the marker cannot distinguish the copy from the original; the user must resume against the intended collection.
