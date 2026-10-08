# Create requested verb forms independently

## Why

The learner already has `gehen` and explicitly requests `geh` to learn the
imperative. The supplied terminal transcript shows a correct, accepted explanation
(`geh` → `иди`, Imperativ, with `Geh bitte nach Hause.`), followed by an Anki
duplicate error while creating a picture note for `gehen`. The requested form
note is never written.

Observed causes:

- Picture-note preflight distinguishes exact Russian meaning text from a headword
  match. Existing `идти` and generated `идти, направляться (обычно пешком)` become
  a headword match, although both attempts use `gehen` in the same first field.
  A local read-only fixture reproduced zero exact matches and one headword match.
- `finalizePictureVerb` writes the lemma picture note before the accepted form
  note, so a duplicate rejection prevents the latter from being attempted.
- `findVerbFormDuplicates` searches `verb-form-*`, while the dedicated form
  explanation notes use `mode-verb-dictionary` with `form-*`. A sentence containing
  the form and a dedicated form explanation are also different learning notes.
- Finalizers are returned without awaiting inside `runVerbWorkflow`'s try block,
  so asynchronous failures bypass its spinner cleanup, matching the reported log.

## Intended Outcome

Requesting a specific form must result in either a confirmed card for that form,
a clear identification of the existing equivalent card, or an explicit report
that the form was skipped or could not be saved. A known lemma is not evidence
that the learner already has the requested form card.

## What Changes

- Treat the accepted form explanation as an independent output. An existing
  picture or sentence note must not prevent its creation.
- Check duplicates by note purpose and target. Recognize existing dedicated
  form explanations using their lemma, actual Front, and existing tag conventions;
  do not require retagging old notes or count a sentence alone as the explanation.
- For a requested form, skip an already represented lemma picture note even when
  its Russian meaning wording differs. Do not ask for an image or upload image
  media for a note that is known to be skipped.
- Present a specific-form request in learner terms. Before any write, show the
  exact Front (`geh`) and complete answer when the form is the only output.
  Explain that an existing `gehen` card will not be added again, emphasizing
  `gehen` in a color-capable terminal. Keep lemma pronunciation and frequency
  explicitly labeled as lemma data or omit them. Do not present a raw Anki note
  ID as part of the learning decision.
- When another output still needs a preliminary plan, say "continue to review
  geh" rather than implying an immediate write. After creation or on an
  existing form, provide the usable
  Browse query `nid:<note ID>` instead of an unexplained number.
- Enable the form card by default for a non-infinitive request, while preserving
  explicit disable/skip choices and the complete explanation preview.
- Save a confirmed missing form card before companion-note writes. A late
  duplicate rejection for a companion becomes an already-existing outcome;
  other write errors are reported without concealing a successful form write.
- Report what happened to the form specifically, including its note ID when
  created or found. Do not summarize a form-only addition as merely `Added gehen`.
- Stop the spinner before displaying an error or recovery choices. Retrying must
  recognize a form that was successfully written during a partial previous run.

## Scope

This is a bounded correction of the existing verb workflow and its duplicate
helpers. It reuses the current form explanation, template, audio, confirmation,
and Anki note type. New lemma and companion notes retain their normal preparation
when they are eligible. Infinitive-only requests and morphology packages retain
their existing behavior. Anki's duplicate prohibition remains enabled.

The form-creation workflow reads existing notes for duplicate detection and
creates missing confirmed notes. The companion Back-only migration may compact
existing signed dictionary-form answers after a local backup, preserving note
identity and scheduling. No notes are deleted and no additional
reverse/production note type is introduced.

## Evidence and Verification

- Sources: `src/verbMode.js`, `src/verbConfirm.js`, `src/anki.js`,
  `src/templates/verb/dictionary.js`, and `src/verbDictionaryPreview.js`.
- Regression coverage in `tests/verbMode.test.js`, `tests/anki.test.js`, and
  `tests/verbConfirm.test.js` checks exact/headword picture matches, dedicated
  form lookup, independent writes, partial retries, dismissal, dry-run,
  spinner cleanup, and the wording of both requested-form previews.

## Status

Reviewed by the user and implemented in the verb workflow. Existing Anki notes
were only read for duplicate detection; no migration was run.

Follow-up feedback on the `geh` run showed that the first confirmation screen
was still unclear: it led with the infinitive `gehen`, used "Form card" and
"Lemma card" without showing the Front, repeated the existing-lemma list, and
displayed a bare note ID. The present change also corrects that screen.

A subsequent `geh` attempt exposed a separate sentence-route problem: the
chooser offered `Ich gehe zu Fuß zur Arbeit.` and `Wir gehen heute ins Kino.`
alongside `Geh bitte nach Hause.` Although all are examples of `gehen`, only
the last contains the requested form `geh`. The chooser will filter suggestions
by the actual German form, accept case and punctuation differences, and offer
manual entry or skip when none match. It will not substitute a lemma example
for a requested-form example.

The revised picture-route screen still said `Back: meaning and grammar will be
reviewed before saving.` for `geh` when `gehen` already existed. That text was a
placeholder, not a card preview. When the existing infinitive card makes the
form explanation the only output, the workflow will open its complete
Front/Back preview directly. The learner can accept, regenerate, or skip there;
there is no preliminary `Continue` gate with an empty Back.

The full dictionary preview already shows the form meaning, grammar, usage,
and translated example, as in the supplied `Lass` reference. Its pronunciation
line belongs to the infinitive `lassen`, however. For `geh`, the workflow will
look up pronunciation for `geh` separately, label its IPA in the full preview,
and include available form audio/IPA on the saved Back. The Back shows only a
short `От глагола gehen` reference near the grammar; it does not repeat the
infinitive's audio, IPA, or translation. The terminal preview uses the same
compact layout. A failed external
pronunciation lookup does not invent an IPA or prevent card creation.

The existing `geh` card was confirmed to contain both form and infinitive audio.
The migration now recognizes that exact signed two-audio layout and prepares a
Back-only update that keeps the form explanation and recording while collapsing
the infinitive to one text row. Unrecognized notes remain unchanged.

The `hab` sentence route exposed one remaining duplicate confirmation: after
the learner chooses `Hab bitte Geduld.`, the CLI displays a provisional
Front/sentence plan and requires `Continue` before showing the complete
dictionary-card preview. For a requested form with an accompanying sentence,
the complete dictionary preview will be the first confirmation. It will say
that acceptance also adds the already chosen audio sentence. The learner may
accept both, skip only the form, regenerate the explanation, or dismiss both.
The sentence result will show a real `nid:` query; `createNote` currently
discards AnkiConnect's `addNote` ID, producing `nid:undefined`.
