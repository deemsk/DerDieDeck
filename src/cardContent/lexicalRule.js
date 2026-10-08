import { FUNCTION_WORD_TYPE_PATTERNS } from '../data/functionWordPatterns.js';
import { escapeHtml } from './html.js';

const normalize = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
const genericRules = Object.values(FUNCTION_WORD_TYPE_PATTERNS).map(normalize);

export function validateLexicalRule(value) {
  if (value === null) return;
  if (typeof value !== 'string' || !value.trim() || value.length > 650
      || !/[А-Яа-яЁё]/u.test(value) || /[<>`\n\r]|\*\*|\[[^\]]*\]\(/u.test(value)
      || genericRules.some((rule) => normalize(value).includes(rule))) {
    throw new Error('Invalid lexical explanation: use concise contextual Russian plain text, never generic prose');
  }
}

export function renderLexicalRule(explanation) {
  validateLexicalRule(explanation);
  return explanation === null ? '' : `<div class="ddd-cloze-pattern"><b>Правило:</b> ${escapeHtml(explanation)}</div>`;
}
