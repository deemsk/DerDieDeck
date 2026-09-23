# Structure and shorten the dictionary-card preview

## Why

The user reports that the dictionary-card preview looks like an undifferentiated
wall of text. The current implementation strips the answer HTML into consecutive
lines, giving the meaning, grammar, usage, example, and infinitive similar visual
weight. The user supplied a `denkst` preview demonstrating the problem and
explicitly requested both formatting and removal of unnecessary explanations.
They pointed to the app's other console previews as the visual reference.

## What Changes

- Render the terminal preview from the structured explanation data.
- Follow `showWordDictionarySummary` in `src/wordConfirm.js`: cyan `┌─`, `│`,
  and `└─` framing, a bold heading and target, muted aligned labels, and
  consistent padding. Use the existing Chalk conventions, not a new visual style.
- Separate Front and Back with explicit labels and blank lines.
- Emphasize the target form and form meaning. Give grammar, usage, optional notes,
  example, and infinitive information recognizable labels and consistent indentation.
- Keep the German example and its Russian translation together.
- Group the infinitive, available IPA, and lexical translation together.
- Wrap long text with aligned continuation lines; retain readable structure when
  terminal color is disabled or output is redirected.
- Separate the existing accept/regenerate/skip prompt from the content.
- Preserve all proposed answer content so the learner can review the complete card.
- Generate only useful explanation content: concise grammar and contextual usage;
  ambiguity only when there is a meaningful alternative reading; contrast only
  when it prevents confusion about the encountered form.
- Omit statements that merely announce the absence of ambiguity, repeated grammar,
  and unrelated lexical constructions. A simple form needs no minimum word count.
- Shorten the structured explanation itself, keeping preview and saved answer in
  agreement rather than hiding content solely in the terminal.

## Scope

This changes terminal presentation and the concision of newly generated form
explanations. The existing Anki HTML structure and required meaning/grammar/example
contract remain intact. This preview-focused change does not migrate existing
notes. Existing confirmation, retry, dismissal, and dry-run behavior remains part
of the preview contract. The final selected sentence and its full translation
must remain available; essential ambiguity and distinctions must not be removed.

## Capabilities

### Modified Capabilities

- `verb-cards`: structured terminal presentation matching existing previews, and
  concise, relevant dictionary-form explanations.

## Evidence and Verification

The current flattening occurs in `src/verbDictionaryPreview.js`; the existing
visual reference is `showWordDictionarySummary` in `src/wordConfirm.js`.
Explanation generation and review rules live in `src/verbFormEnricher.js`.
Verify framing, color and plain output, aligned labels, grouped fields, optional
notes, wrapping, prompt ordering, and agreement between previewed and saved content.
Check that `denkst` can omit ambiguity and contrast, while `wäre`, `sind`, and
`wurde` retain their necessary distinctions. Run focused preview, enrichment,
and verb workflow tests. Inspect terminal output before updating the baseline spec.

## Review Status

Approved by the user and implemented. Baseline specifications are synchronized.
The full Jest suite and live generation checks passed; read-only code review
found no concrete bugs or meaningful gaps. See `tasks.md` for verification details.
