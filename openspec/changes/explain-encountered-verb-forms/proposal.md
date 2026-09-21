# Explain encountered verb forms

## Why

Dictionary-form cards currently show an encountered form on Front and its
infinitive, infinitive pronunciation, and lexical translation on Back. For
example, `wäre` reveals `sein / быть`, and `wurde` reveals `werden / становиться`.
The learner can recover the lemma but still cannot tell what the encountered
form means, whether it refers to the past, or how to use it in a sentence.

The user explicitly identified this gap in their existing cards. The intended
outcome is to understand the form itself when revealing the answer, without
having to look it up elsewhere.

## What Changes

- Keep the encountered form on Front, without revealing its explanation there.
- Start Back with a Russian gloss of the form and a compact grammar explanation:
  tense and/or mood, person and number where applicable, and a plain-language
  account of its use. Do not treat mood as a time reference.
- Show one short German example using the target form, with a natural Russian
  translation. Prefer the final selected sentence when it illustrates that form.
- Distinguish the interpretation in the example from other possible readings of
  the isolated form. Add a brief contrast only when it prevents a likely confusion,
  such as `wurde` versus `würde`.
- Retain the infinitive, its lexical meaning, and its available audio/IPA in a
  separate, explicitly labeled dictionary block below the form explanation.
- Include the actual new answer content in preview and dry-run. Incomplete or
  mismatched explanations must not silently produce the old lemma-only card.
- Provide a previewable migration for existing dictionary-form notes, updating
  their answers in place while preserving note/card identity and review history.

The user approved these requirements for implementation.

## Capabilities

### New Capabilities

None. This extends the existing verb-card capability.

### Modified Capabilities

- `verb-cards`: extend dictionary-form cards with form meaning, grammar, a
  contextual example, an accurate preview, and defined failure behavior.

## Example answers

The text below illustrates the desired learner-facing content, not fixed wording
for every generated card. Specification prose remains English; card content is
German and Russian, following the product's language conventions.

### Front: wäre

> **был бы / была бы / было бы**
>
> **Konjunktiv II** — предположение или желание, обычно о настоящем или будущем;
> сама по себе форма не означает прошедшее время.
>
> Возможные лица: **ich / er / sie / es** (единственное число).
>
> **Ich wäre gern zu Hause.**
> Я хотел бы быть дома.
>
> **Инфинитив: sein — быть**
> [infinitive audio and IPA]

### Front: wurde

> **стал / стала / стало** — в значении «становиться».
>
> **Präteritum, Indikativ** — прошедшее время.
> Возможные лица: **ich / er / sie / es** (единственное число).
>
> **Er wurde müde.**
> Он устал.
>
> С Partizip II может образовывать пассив: **Er wurde gefragt.** — Его спросили.
> **wurde ≠ würde**: прошедшее время ≠ форма Konjunktiv II.
>
> **Инфинитив: werden — становиться**
> [infinitive audio and IPA]

If the selected sentence is `Er wurde gefragt.`, the primary explanation must
describe the passive usage in that sentence. It must not present `стал` as the
translation of `wurde` in that construction.

## Impact

### Existing evidence

- [Dictionary template](../../../src/templates/verb/dictionary.js): currently
  renders only the infinitive, pronunciation, and lexical translation on Back.
- [Verb workflow](../../../src/verbMode.js): both picture and sentence paths
  create dictionary-form notes; the sentence path can revise its selected sentence.
- [Verb analysis](../../../src/verbEnricher.js): currently supplies lemma, display
  form, meanings, and examples, without a dictionary-card explanation of the form.
- [Template tests](../../../tests/ankiVerb.test.js) and
  [workflow tests](../../../tests/verbMode.test.js): cover the current output and
  final dictionary-card selection. They do not establish the proposed behavior.

Grammar references for the illustrative cases:
[Duden: sein conjugation](https://www.duden.de/konjugation/sein_Hilfsverb),
[Duden: werden conjugation](https://www.duden.de/konjugation/werden_Vollverb),
[Duden: auxiliary werden](https://www.duden.de/rechtschreibung/werden_Hilfsverb).

### Scope

- Applies to newly created `mode-verb-dictionary` notes in both ordinary verb paths.
- Preserve the existing opt-out, note type, duplicate checks, and lemma audio.
- Form explanations and examples must work for other encountered forms, including
  present-tense forms, separable verbs, and participles; this is not a two-word patch.
- Changes to IPA colors, sentence-card Front hints, strong-verb packages, and
  video processing are outside this change.
- The user has requested both new-card support and updates to existing notes.
  Migration of existing `mode-verb-dictionary` notes is in scope. Preview each
  proposed change before applying it, keep a local backup of original fields,
  and update notes in place without recreating cards or resetting reviews.
  No existing Anki notes have been modified during specification drafting.

### Verification after approval

Add focused tests for the proposed scenarios, including incorrect target examples,
ambiguous forms, revised sentences, disabled cards, and dry-run. Run the verb
workflow/template tests and the full suite if shared modules change. Review a
rendered answer using the examples above, in addition to checking generated fields.
Verify migration selection, preview-only behavior, preservation of existing media
and note identity, safe reruns, and handling of incomplete or concurrently edited notes.

## Review status

Approved by the user, implemented, and verified. The baseline specification has
been synchronized. All 52 existing dictionary-form notes were upgraded in place
after preview and backup; post-write checks preserved note/card identity, other
fields, media, and scheduling. See `tasks.md` for verification details.
