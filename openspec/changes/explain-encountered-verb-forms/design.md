# Design

## Approved contract

The user approved the proposal and delta specification and requested execution,
including updates to existing notes. Implementation happens on `main`, as the
user explicitly requested. Unrelated local files remain untouched.

## Form explanation

Generate the explanation after the final sentence review, using the existing
OpenAI generation and validation roles. The structured result contains `form`,
`infinitive`, `formMeaning`, `grammar`, `usage`, optional `ambiguity` and `contrast`,
and `example` with `german` and `russian`. Learner explanations are Russian;
German grammar names are retained. An independent semantic check verifies the
form, its contextual meaning, ambiguity, and the complete example translation.
Local checks reject missing fields, mismatched forms, and examples without the
target (including separated verb particles). A suitable final sentence is kept.
Repair requests include the rejected explanation and use the validation model for
correction, followed by a fresh semantic check. Semantic review evaluates the new
explanation rather than rejecting it for an immutable, inaccurate legacy gloss.

The dictionary template requires a validated explanation. It renders form meaning,
grammar and usage, example, then labeled infinitive information using existing CSS
classes. A versioned metadata comment identifies completed answers. The optional
card receives its own content preview before either workflow writes notes; the
user can accept, regenerate, or skip. Failed preparation offers retry or skip.

## Migration

`migrate-verb-dictionary` defaults to preview. It selects only tagged dictionary
notes, parses the known legacy template conservatively, and generates the same
validated explanation without downloading or uploading media. Existing infinitive
markup is retained verbatim within the labeled block. Unknown or inconsistent
legacy markup is skipped rather than guessed.

Preview saves a JSON plan and an HTML report containing old and proposed answers.
`--apply <plan>` applies that exact plan, with an exclusive local backup written
before any Anki mutation. Reusable Anki helpers compare fresh fields and identity
against the preview snapshot, update only Back, verify the saved field, and report
each result separately. No create-note, tag, media, deck, or scheduling calls are
used. Already upgraded notes are not regenerated; changed notes are skipped.

Plans, backups, and reports belong in a user-selected local output directory,
defaulting to `~/.derdiedeck/migrations`. They are never committed. Individual
generation/update failures do not prevent other eligible notes from completing.

## Verification

Tests cover the documented grammar cases, local and semantic rejection, escaped
HTML and answer order, final sentence revisions, opt-out/retry/dry-run, migration
selection, media retention, backup failure, concurrent edits, read-back failures,
and reruns. Run the full Jest suite and strict OpenSpec validation. Inspect rendered
answers, then preview and apply the authorized live migration with a backup;
compare note/card IDs and scheduling before and after.
