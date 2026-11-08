# Improve meaning selection

## Why
Generated options sometimes restate the same sense, and learners cannot tell which sense is likely common or already represented in their collection before choosing.

## Approaches
1. Compare gloss strings only and use the generated order: cheap, but misses paraphrases and cannot establish sense frequency or collection coverage.
2. Use a conservative structured semantic assessment of candidate senses and existing note evidence, displaying confidence and uncertainty. This is the recommended approach.
3. Require an external sense-frequency corpus: potentially better evidence, but no such source is currently integrated and coverage or licensing may be insufficient.

## Design
Before meaning selection in word and verb workflows, collect existing notes for the same lexical identity, including relevant note types and legacy notes. Compare their actual glosses and context with candidate senses; avoid treating all cards of a lemma as one sense. Separately assess whether candidates are paraphrases of the same sense and merge only when confidence is high; preserve distinct senses and the original candidate content when uncertain. Do not merge merely because two senses have overlapping translations.

Rank remaining candidates using sense-level evidence when available. If only a model estimate is available, label it as an estimate, not corpus frequency. Do not invent percentages or rankings when evidence is insufficient. Display each sense's status: already represented only when confidently supported by Anki evidence, possibly represented when uncertain, or not confirmed in the collection. Show useful existing glosses and Anki search links for review. Recommend an unrepresented common sense when evidence supports one; if the common sense is already represented, retain it visibly and suggest an unrepresented alternative without claiming it is common unless supported. Default Enter selects a recommended option only when one is justified; otherwise require an explicit choice. The user may select any option, expand merged options to choose an original meaning with its original metadata, edit, or skip. A merged option is never silently selected by Enter.

Existing duplicate checks remain authoritative; this guidance never disables them. User-provided meaning bypasses recommendations and is preserved. Collection lookup or assessment failure leaves all candidates selectable, clearly indicates unavailable guidance, and never claims a sense is absent. Dry-run performs no writes. No existing cards are changed.

## Interface
Use a compact, framed selection matching existing terminal panels, with an English heading and Russian glosses. A green `★ Recommended` marks the justified default; a muted `✓ In Anki` marks a confidently matched sense; `? Possible match` marks uncertainty. Commonness and the reason for recommending a sense are explained through Info, with model estimates identified as estimates. Display these text labels as well as colors so the dialog works without color. Do not add an absence label to every unmarked row. A single short line explains an unavailable collection check, and no recommendation based on collection absence is shown in that case.

Only print statuses that apply. The full evidence and searchable note ID for an existing sense are available through `[I]nfo`, not expanded on every row. Show `[I]nfo` only if there is evidence to inspect. Number shortcuts and action keys use yellow, distinct from cyan lexical targets. A recommended default is reflected in the prompt; without one Enter does not silently choose.

```text
┌─ Choose meaning · der Schatz
│
│  1  сокровище; клад             ✓ In Anki
│  2  дорогой / дорогая            ★ Recommended
│
└─
  [1–2] Select   [I] Info   [E] Edit   [S] Skip
Choose [2]:
```

```text
┌─ Choose meaning · das Wort
│
│  1  первое значение             ? Possible match
│  2  другое значение
│
└─
  [1–2] Select   [I] Info   [E] Edit   [S] Skip
Choose:
```
