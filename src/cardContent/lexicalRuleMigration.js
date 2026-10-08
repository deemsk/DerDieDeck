import { stripHtml } from './html.js';
import { parseWordMetadataComment } from './wordMetadata.js';
import { toTagSlug } from './german.js';
import { formatRussianLexicalTypeLabel } from './lexicalTypes.js';
import { renderLexicalRule } from './lexicalRule.js';

// Recognize only the application's known answer structure, retaining every byte
// outside the rule. Unknown/custom markup is intentionally left for manual review.
const ANSWER = /^(?<before>\s*<div class="ddd-answer-stack">\s*(?:<div class="ddd-answer-ipa"><span class="(?:yt2anki-ipa(?: ddd-ipa)?|ddd-ipa)">[^<>]*<\/span><\/div>\s*)?<div class="ddd-answer-translation">[^<>]*<\/div>\s*<div class="ddd-answer-extra"><div class="ddd-cloze-context">(?<label>[^<>]*)<\/div>)(?<rule><div class="ddd-cloze-pattern"><b>(?:Правило|Pattern):<\/b> (?<explanation>[^<>]*)<\/div>)?(?<after>(?:<div class="ddd-cloze-contrast"><b>(?:Различие|Contrast):<\/b> [^<>]*<\/div>)?<\/div>\s*<\/div><!-- yt2anki-word:[^<>]* -->\s*)$/;

export function parseLexicalClozeRule(note) {
  const fail = () => { throw new Error('Unrecognized or inconsistent lexical-cloze note; manual review required'); };
  if (!note.tags?.includes('mode-lexical-cloze')) fail();
  const fields = Object.keys(note.fields || {});
  const textFields = fields.filter((name) => /^text$/i.test(name));
  const extraFields = fields.filter((name) => /^(?:back )?extra$/i.test(name));
  if (textFields.length !== 1 || extraFields.length !== 1) fail();
  const textField = textFields[0];
  const extraField = extraFields[0];
  const extra = note.fields[extraField]?.value;
  const match = typeof extra === 'string' && extra.match(ANSWER);
  if (!match) fail();
  const metadata = parseWordMetadataComment(extra);
  if (!metadata || !['canonical', 'lexicalType'].every((key) =>
    typeof metadata[key] === 'string' && metadata[key].trim())
    || !(metadata.meaning === null || typeof metadata.meaning === 'string')) fail();
  const { canonical, lexicalType, meaning } = metadata;
  const label = stripHtml(match.groups.label);
  if (![`${canonical} · ${lexicalType}`, `${canonical} · ${formatRussianLexicalTypeLabel(lexicalType)}`].includes(label)) fail();

  const rawText = note.fields[textField]?.value;
  if (typeof rawText !== 'string') fail();
  const text = rawText.replace(/^(?:\[sound:[^\[\]<>\r\n]+\]<br\s*\/?>)?/i, '');
  if (/[<>]/.test(text)) fail();
  const clozes = [...text.matchAll(/\{\{c1::([^{}:]+)(?:::[^{}]*)?\}\}/g)];
  if (clozes.length !== 1) fail();
  const target = stripHtml(clozes[0][1]);
  const restored = text.replace(clozes[0][0], () => clozes[0][1]);
  if (!target || /[{}]|\[sound:/i.test(restored)) fail();
  for (const [prefix, value] of [['canonical-', canonical], ['lemma-', metadata.lemma || canonical], ['word-form-', target]]) {
    if (note.tags.some((tag) => tag.startsWith(prefix) && tag !== `${prefix}${toTagSlug(value)}`)) fail();
  }
  return {
    canonical, target, lexicalType, meaning, sentence: stripHtml(restored),
    existingHint: match.groups.rule ? stripHtml(match.groups.explanation) : null,
    textField, extraField, before: match.groups.before, after: match.groups.after,
  };
}

export function replaceLexicalClozeRule(note, explanation) {
  const { before, after } = parseLexicalClozeRule(note);
  return before + renderLexicalRule(explanation) + after;
}
