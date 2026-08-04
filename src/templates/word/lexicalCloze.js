import { escapeHtml } from '../../cardContent/html.js';
import { buildContrastHint } from '../../cardContent/interference.js';
import { buildFunctionWordPatternHint, getFunctionWordPatternFamily } from '../../cardContent/functionWordPatterns.js';
import { buildWordMetadataComment } from '../../cardContent/wordMetadata.js';
import { resolveSentenceFocusForm } from '../../cardContent/wordLexical.js';
import { formatRussianLexicalTypeLabel } from '../../cardContent/lexicalTypes.js';
import { answerStack } from '../shared/components.js';

/**
 * Escapes a literal string so it can be safely inserted into a regular expression.
 */
function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds Cloze text that asks the learner to recall a lexical function word.
 */
export function buildLexicalClozeText(sentence = {}, wordData = {}) {
  const german = String(sentence?.german || '').trim();
  const target = resolveSentenceFocusForm(sentence, wordData);
  if (!german || !target) {
    return '';
  }

  const hint = String(wordData.clozeHint || wordData.lexicalType || 'word').trim();
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegex(target)})(?=[^\\p{L}\\p{N}]|$)`, 'iu');
  const match = german.match(pattern);
  if (!match || match.index === undefined) {
    return escapeHtml(german);
  }

  const targetIndex = match.index + match[1].length;
  const before = german.slice(0, targetIndex);
  const matched = match[2];
  const after = german.slice(targetIndex + matched.length);

  return `${escapeHtml(before)}{{c1::${escapeHtml(matched)}::${escapeHtml(hint)}}}${escapeHtml(after)}`;
}

/**
 * Builds the Cloze extra field without duplicating the sentence already shown by Anki.
 */
export function buildLexicalClozeExtra({
  wordData = {},
  sentenceData = {},
  selectedMeaning = {},
} = {}) {
  const meaning = selectedMeaning?.russian || wordData.meanings?.[0]?.russian || null;
  const metadata = buildWordMetadataComment({
    canonical: wordData.canonical,
    meaning,
    lemma: wordData.lemma || wordData.canonical,
    lexicalType: wordData.lexicalType,
    contrast: buildContrastHint(wordData.canonical || wordData.lemma),
    patternFamily: getFunctionWordPatternFamily(wordData),
  });
  const typeLabel = formatRussianLexicalTypeLabel(wordData.lexicalType);
  const patternHint = buildFunctionWordPatternHint(wordData);
  const contrastHint = buildContrastHint(wordData.canonical || wordData.lemma);
  const extraRows = [
    `<div class="ddd-cloze-context">${escapeHtml(wordData.canonical)} · ${escapeHtml(typeLabel)}</div>`,
    patternHint ? `<div class="ddd-cloze-pattern"><b>Правило:</b> ${escapeHtml(patternHint)}</div>` : null,
    contrastHint ? `<div class="ddd-cloze-contrast"><b>Различие:</b> ${escapeHtml(contrastHint)}</div>` : null,
  ].filter(Boolean).join('');

  return answerStack({
    ipa: sentenceData.ipa,
    russian: sentenceData.russian || meaning,
    extraHtml: extraRows,
  }) + metadata;
}
