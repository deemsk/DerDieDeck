## ADDED Requirements

### Requirement: Preserve requested adjective forms

When an adjective input differs from its lemma, preparation SHALL independently
validate the requested form and preserve it as the card target. The lemma SHALL
be reference information only. The form meaning and concise Russian grammar
SHALL describe degree/inflection rather than substitute the positive lemma gloss.
All offered examples SHALL contain the exact requested token and be checked
for the requested lemma and reading. Manual examples, enriched sentences and
reviewed revisions SHALL retain that target before audio or saving. Invalid
form analyses SHALL fail without falling back to lemma cards.
Pronunciation lookup SHALL use the form, not the lemma. Main form notes SHALL
show the requested form on Front and form meaning, grammar and base form on
Back; automatic reverse cards SHALL be disabled for inflected adjective forms.
Duplicate identity SHALL retain the surface form, so an existing lemma does not
block a different requested form. Existing notes SHALL remain unchanged.

#### Scenario: besten from gut
- **WHEN** the learner requests besten
- **THEN** the summary, examples and saved Front target besten, with gut as base form.
- **AND** examples containing only gut, gute or beste are not offered.

#### Scenario: festen from fest
- **WHEN** the learner requests festen
- **THEN** its validated base form is fest, not gut.

#### Scenario: A revision drops the form
- **WHEN** a manual example or model revision replaces besten with gut
- **THEN** preparation fails before audio and note writes.
