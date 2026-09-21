import { formatIpaHtml, formatPlainWord, formatPrimaryTranslation } from '../shared/components.js';
import { joinHtml } from '../shared/html.js';
import { escapeHtml } from '../../cardContent/html.js';
import { markVerbFormAnswer, validateVerbFormExplanation } from '../../cardContent/verbFormExplanation.js';

export function buildVerbDictionaryNote({
  verbData,
  selectedMeaning,
  focusForm = null,
  pronunciationField = null,
  formExplanation,
  infinitiveHtml = null,
}) {
  const displayForm = focusForm || verbData.displayForm || verbData.infinitive;
  const explanation = validateVerbFormExplanation(formExplanation, {
    form: displayForm, infinitive: verbData.infinitive,
  });
  const row = (text) => text ? `<div class="ddd-extra-row">${escapeHtml(text)}</div>` : '';
  const dictionary = infinitiveHtml || joinHtml([
    formatPlainWord(verbData.infinitive),
    pronunciationField || formatIpaHtml(verbData.ipa),
    formatPrimaryTranslation(selectedMeaning?.russian),
  ]);
  const back = markVerbFormAnswer([
    formatPrimaryTranslation(explanation.formMeaning),
    row(explanation.grammar),
    row(explanation.usage),
    row(explanation.ambiguity),
    row(explanation.contrast),
    `<div class="ddd-extra-example"><span class="ddd-extra-example-value">${escapeHtml(explanation.example.german)}</span><span class="ddd-extra-example-translation">${escapeHtml(explanation.example.russian)}</span></div>`,
    `<div class="ddd-extra-row"><span class="ddd-extra-label">Инфинитив</span>${dictionary}</div>`,
  ].join(''));

  return {
    front: formatPlainWord(displayForm),
    back,
  };
}
