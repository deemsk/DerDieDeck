import { normalizeGermanForCompare } from './german.js';

/**
 * Builds the context label shown on sentence cards for a target verb form.
 */
export function buildVerbFormContext(infinitive, formSpec) {
  return `${formSpec.label} ${formSpec.displayForm || formSpec.form} → ${infinitive}`;
}

/**
 * Checks whether a sentence is short and syntactically simple enough for a key-form card.
 */
function isSimpleSentence(sentence = '') {
  const text = String(sentence || '').trim();
  if (!text) return false;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 9) return false;
  return !/\b(obwohl|weil|dass|wenn|während|bevor|nachdem|damit|der|die|das)\b.*,/i.test(text);
}

/**
 * Checks whether a separable particle appears naturally after the finite form.
 */
function hasSeparatedParticle(sentence, form, particle) {
  if (!particle) return true;
  const normalized = normalizeGermanForCompare(sentence).replace(/[.!?]/g, '');
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const formIndex = tokens.indexOf(normalizeGermanForCompare(form));
  const particleIndex = tokens.lastIndexOf(normalizeGermanForCompare(particle));
  return formIndex >= 0 && particleIndex > formIndex;
}

function containsRussianPronoun(text = '', pronoun = '') {
  const expected = String(pronoun || '').trim().toLowerCase();
  if (!expected) return true;

  return String(text || '')
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(Boolean)
    .includes(expected);
}

/**
 * Checks that generated Russian text preserves the person/number of the target form.
 */
export function validateVerbFormRussianAgreement(sentence = {}, formSpec = {}) {
  const expected = formSpec.russianPronoun;
  if (!expected) return true;

  const sentenceMatches = containsRussianPronoun(sentence.russian, expected);
  const formMatches = !sentence.formRussian || containsRussianPronoun(sentence.formRussian, expected);
  return sentenceMatches && formMatches;
}

function validateUnambiguousGermanPronoun(german = '', formSpec = {}) {
  if (formSpec.key !== 'sie' || formSpec.russianPronoun !== 'они') {
    return true;
  }

  const tokens = String(german || '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return tokens.slice(1).includes('sie');
}

/**
 * Validates that a generated sentence really trains the selected verb form.
 */
export function validateVerbFormSentence(sentence, formSpec, morphology) {
  const german = String(sentence?.german || '').trim();
  const normalized = normalizeGermanForCompare(german).replace(/[.!?]/g, '');
  const pronoun = normalizeGermanForCompare(formSpec.pronoun);
  const form = normalizeGermanForCompare(formSpec.form);
  const tokens = normalized.split(/\s+/).filter(Boolean);

  return Boolean(
    isSimpleSentence(german) &&
    tokens.includes(pronoun) &&
    tokens.includes(form) &&
    hasSeparatedParticle(german, formSpec.form, morphology.particle) &&
    validateUnambiguousGermanPronoun(german, formSpec) &&
    validateVerbFormRussianAgreement(sentence, formSpec)
  );
}

/**
 * Creates the package plan from selected morphology forms and generated sentences.
 */
export function buildStrongVerbPackagePlan({ morphology, sentences }) {
  const forms = Array.isArray(morphology?.selectedForms) ? morphology.selectedForms : [];
  if (morphology?.confidence !== 'high' || forms.length === 0) {
    return null;
  }

  const validSentences = [];
  for (const formSpec of forms) {
    const sentence = sentences.find((candidate) => candidate.formKey === formSpec.key);
    if (!sentence || !validateVerbFormSentence(sentence, formSpec, morphology)) {
      return null;
    }

    validSentences.push({
      ...sentence,
      focusForm: formSpec.form,
      formSpec,
    });
  }

  return {
    forms,
    sentences: validSentences,
  };
}
