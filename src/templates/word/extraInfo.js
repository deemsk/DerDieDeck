import { escapeHtml } from '../../cardContent/html.js';
import { buildWordMetadataComment } from '../../cardContent/wordMetadata.js';

/**
 * Builds one labeled visual row for word back-side metadata.
 */
function infoRow(label, value, className = '') {
  if (!value) {
    return '';
  }

  return `<div class="yt2anki-extra-row ddd-extra-row ${className}"><span class="yt2anki-extra-label ddd-extra-label">${escapeHtml(label)}</span><span class="yt2anki-extra-value ddd-extra-value">${escapeHtml(value)}</span></div>`;
}

export function buildWordExtraInfo({
  meaning,
  plainMeaning = false,
  plural,
  exampleSentence = null,
  exampleSentenceTranslation = null,
  dictionaryForm = null,
  contrast = null,
  metadata,
}) {
  const lines = [];

  if (meaning) {
    lines.push(plainMeaning
      ? `<div class="yt2anki-extra-meaning ddd-extra-meaning">${escapeHtml(meaning)}</div>`
      : infoRow('Meaning', meaning, 'yt2anki-extra-meaning'));
  }

  if (plural) {
    lines.push(infoRow('Plural', plural));
  }

  if (exampleSentence) {
    lines.push(`<div class="yt2anki-extra-example ddd-extra-example"><span class="yt2anki-extra-label ddd-extra-label">Example</span><span class="yt2anki-extra-value ddd-extra-example-value">${escapeHtml(exampleSentence)}</span></div>`);
    if (exampleSentenceTranslation) {
      lines.push(`<div class="yt2anki-extra-example-translation ddd-extra-example-translation">${escapeHtml(exampleSentenceTranslation)}</div>`);
    }
  }

  if (dictionaryForm) {
    lines.push(infoRow('Dictionary form', dictionaryForm));
  }

  if (contrast) {
    lines.push(infoRow('Contrast', contrast));
  }

  lines.push(buildWordMetadataComment(metadata));

  return lines.join('');
}
