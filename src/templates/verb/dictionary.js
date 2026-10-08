import { formatPlainWord, formatPrimaryTranslation } from '../shared/components.js';
import { escapeHtml } from '../../cardContent/html.js';
import { markVerbFormAnswer, validateVerbFormExplanation } from '../../cardContent/verbFormExplanation.js';

export function buildVerbDictionaryNote({
  verbData,
  selectedMeaning,
  focusForm = null,
  formPronunciationField = null,
  formExplanation,
}) {
  const displayForm = focusForm || verbData.displayForm || verbData.infinitive;
  const explanation = validateVerbFormExplanation(formExplanation, {
    form: displayForm, infinitive: verbData.infinitive,
  });
  const row = (text) => text ? `<div class="ddd-extra-row">${escapeHtml(text)}</div>` : '';
  const back = markVerbFormAnswer([
    formatPrimaryTranslation(explanation.formMeaning),
    formPronunciationField
      ? `<div class="ddd-extra-row"><span class="ddd-extra-label">Произношение формы</span>${formPronunciationField}</div>`
      : '',
    `<div class="ddd-extra-row"><span class="ddd-extra-label">От глагола</span> ${escapeHtml(verbData.infinitive)}</div>`,
    row(explanation.grammar),
    row(explanation.usage),
    row(explanation.ambiguity),
    row(explanation.contrast),
    `<div class="ddd-extra-example"><span class="ddd-extra-example-value">${escapeHtml(explanation.example.german)}</span><span class="ddd-extra-example-translation">${escapeHtml(explanation.example.russian)}</span></div>`,
  ].join(''));

  return {
    front: formatPlainWord(displayForm),
    back,
  };
}
