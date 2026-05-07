export const LEXICAL_TYPES = new Set([
  'noun',
  'adjective',
  'adverb',
  'verb',
  'preposition',
  'conjunction',
  'subjunction',
  'pronoun',
  'determiner',
  'particle',
  'numeral',
  'interjection',
]);

export const FUNCTION_LEXICAL_TYPES = new Set([
  'preposition',
  'conjunction',
  'subjunction',
  'pronoun',
  'determiner',
  'particle',
  'numeral',
  'interjection',
]);

/**
 * Converts model-provided lexical type labels into the supported internal set.
 */
export function normalizeLexicalType(type = '') {
  const normalized = String(type || '').trim().toLowerCase();
  if (LEXICAL_TYPES.has(normalized)) {
    return normalized;
  }

  if (normalized === 'subordinating conjunction') {
    return 'subjunction';
  }

  return 'noun';
}

/**
 * Returns true for lexical items that should be learned primarily through context.
 */
export function isFunctionLexicalType(type = '') {
  return FUNCTION_LEXICAL_TYPES.has(normalizeLexicalType(type));
}

/**
 * Formats a compact label for CLI previews and card metadata checks.
 */
export function formatLexicalTypeLabel(type = '') {
  const normalized = normalizeLexicalType(type);
  if (normalized === 'adjective') return 'adj';
  if (normalized === 'adverb') return 'adv';
  if (normalized === 'conjunction') return 'conj';
  if (normalized === 'subjunction') return 'subj';
  if (normalized === 'preposition') return 'prep';
  if (normalized === 'pronoun') return 'pron';
  return normalized;
}
