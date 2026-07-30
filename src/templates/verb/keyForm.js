import { escapeHtml } from '../../cardContent/html.js';
import { formatIpaHtml, formatPrimaryTranslation, soundTag } from '../shared/components.js';
import { html, joinHtml } from '../shared/html.js';

/**
 * Builds the active-recall prompt for a key verb form.
 */
export function buildVerbKeyFormProductionFront(infinitive, formSpec) {
  return html`
    <div class="ddd-keyform-prompt">
      <div class="ddd-keyform-kicker">Образуйте форму</div>
      <div class="ddd-keyform-main">${escapeHtml(infinitive)} → ${escapeHtml(formSpec.label)}</div>
    </div>
  `;
}

/**
 * Builds the answer for a key verb form production card.
 */
export function buildVerbKeyFormProductionBack(formSpec, selectedMeaning = null, audioFilename = null, formRussian = null) {
  return joinHtml([
    `<strong>${escapeHtml(formSpec.label)} ${escapeHtml(formSpec.displayForm || formSpec.form)}</strong>`,
    soundTag(audioFilename),
    formatPrimaryTranslation(formRussian),
  ]);
}

/**
 * Builds the recognition prompt for an inflected verb form.
 */
export function buildVerbKeyFormRecognitionFront(formSpec) {
  return html`
    <div class="ddd-keyform-recognition">
      <div class="ddd-keyform-kicker">Узнайте форму</div>
      <div class="ddd-keyform-main">${escapeHtml(formSpec.label)} ${escapeHtml(formSpec.displayForm || formSpec.form)}</div>
    </div>
  `;
}

/**
 * Builds the answer for an inflected verb form recognition card.
 */
export function buildVerbKeyFormRecognitionBack(
  verbData,
  selectedMeaning = null,
  formSpec = null,
  formRussian = null,
  audioFilename = null
) {
  const formLine = formSpec
    ? `<strong>${escapeHtml(formSpec.label)} ${escapeHtml(formSpec.displayForm || formSpec.form)} → ${escapeHtml(verbData.infinitive)}</strong>`
    : null;

  return joinHtml([
    formLine,
    formatPrimaryTranslation(formRussian),
    soundTag(audioFilename),
    `<strong>${escapeHtml(verbData.infinitive)}</strong>`,
    formatIpaHtml(verbData.ipa),
    formatPrimaryTranslation(selectedMeaning?.russian),
  ]);
}
