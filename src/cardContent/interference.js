import { normalizeGermanForCompare } from './german.js';

const CONTRAST_FAMILIES = [
  {
    id: 'position-vs-placement',
    label: 'Положение и перемещение',
    members: ['liegen', 'legen', 'stehen', 'stellen', 'sitzen', 'setzen'],
    prompt: 'Различайте положение или состояние и действие по перемещению предмета.',
  },
  {
    id: 'know-contrast',
    label: 'kennen и wissen',
    members: ['kennen', 'wissen'],
    prompt: 'Kennen означает знакомство с человеком, местом или объектом; wissen — знание факта.',
  },
  {
    id: 'subjunction-choice',
    label: 'wenn, als и ob',
    members: ['wenn', 'als', 'ob'],
    prompt: 'Wenn — «если» или повторяющееся «когда»; als — однократное событие в прошлом; ob — «ли».',
  },
  {
    id: 'because-that-connectors',
    label: 'weil, denn и dass',
    members: ['weil', 'denn', 'dass'],
    prompt: 'После weil и dass действует порядок слов придаточного предложения; после denn сохраняется порядок главного.',
  },
  {
    id: 'negation-system',
    label: 'nicht, nichts и kein',
    members: ['nicht', 'nichts', 'kein', 'keine', 'keinen'],
    prompt: 'Nicht выражает отрицание; nichts означает «ничего»; kein отрицает существительное.',
  },
  {
    id: 'common-prepositions',
    label: 'mit, für, zu и nach',
    members: ['mit', 'fuer', 'für', 'zu', 'nach'],
    prompt: 'Запоминайте значение и управление падежом, а не один перевод.',
  },
];

/**
 * Finds the contrast family for a lexical item when it is likely to interfere with neighbors.
 */
export function findContrastFamily(term = '') {
  const normalized = normalizeGermanForCompare(term);
  if (!normalized) {
    return null;
  }

  return CONTRAST_FAMILIES.find((family) =>
    family.members.some((member) => normalizeGermanForCompare(member) === normalized)
  ) || null;
}

/**
 * Builds compact learner-facing contrast text for card backs and previews.
 */
export function buildContrastHint(term = '') {
  const family = findContrastFamily(term);
  if (!family) {
    return null;
  }

  return `${family.label}: ${family.prompt}`;
}

/**
 * Returns tags that expose interference families in Anki search.
 */
export function buildContrastTags(term = '') {
  const family = findContrastFamily(term);
  return family ? [`contrast-family-${family.id}`] : [];
}
