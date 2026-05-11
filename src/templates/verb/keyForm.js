import { escapeHtml } from '../../cardContent/html.js';
import { formatIpaHtml, formatPrimaryTranslation } from '../shared/components.js';
import { html, joinHtml } from '../shared/html.js';

/**
 * Builds the active-recall prompt for a key verb form.
 */
export function buildVerbKeyFormProductionFront(infinitive, formSpec) {
  return html`
    <div class="ddd-keyform-prompt">
      <div class="ddd-keyform-kicker">Produce the form</div>
      <div class="ddd-keyform-main">${escapeHtml(infinitive)} → ${escapeHtml(formSpec.label)}</div>
    </div>
  `;
}

/**
 * Builds the answer for a key verb form production card.
 */
export function buildVerbKeyFormProductionBack(formSpec, selectedMeaning = null) {
  return joinHtml([
    `<strong>${escapeHtml(formSpec.label)} ${escapeHtml(formSpec.displayForm || formSpec.form)}</strong>`,
    formatPrimaryTranslation(selectedMeaning?.russian),
  ]);
}

/**
 * Builds the recognition prompt for an inflected verb form.
 */
export function buildVerbKeyFormRecognitionFront(formSpec) {
  return html`
    <div class="ddd-keyform-recognition">
      <div class="ddd-keyform-kicker">Recognize the form</div>
      <div class="ddd-keyform-main">${escapeHtml(formSpec.label)} ${escapeHtml(formSpec.displayForm || formSpec.form)}</div>
    </div>
  `;
}

/**
 * Builds the answer for an inflected verb form recognition card.
 */
export function buildVerbKeyFormRecognitionBack(verbData, selectedMeaning = null) {
  return joinHtml([
    `<strong>${escapeHtml(verbData.infinitive)}</strong>`,
    formatIpaHtml(verbData.ipa),
    formatPrimaryTranslation(selectedMeaning?.russian),
  ]);
}
