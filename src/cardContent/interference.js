import { normalizeGermanForCompare } from './german.js';

const CONTRAST_FAMILIES = [
  {
    id: 'position-vs-placement',
    label: 'Position vs placement',
    members: ['liegen', 'legen', 'stehen', 'stellen', 'sitzen', 'setzen'],
    prompt: 'Check whether the meaning is position/state or placement/action.',
  },
  {
    id: 'know-contrast',
    label: 'kennen vs wissen',
    members: ['kennen', 'wissen'],
    prompt: 'Kennen is familiarity with a person/place; wissen is factual knowledge.',
  },
  {
    id: 'subjunction-choice',
    label: 'wenn/als/ob',
    members: ['wenn', 'als', 'ob'],
    prompt: 'Wenn is if/when; als is one past event; ob is whether.',
  },
  {
    id: 'because-that-connectors',
    label: 'weil/denn/dass',
    members: ['weil', 'denn', 'dass'],
    prompt: 'Weil and dass trigger subordinate word order; denn keeps main-clause order.',
  },
  {
    id: 'negation-system',
    label: 'nicht/nichts/kein',
    members: ['nicht', 'nichts', 'kein', 'keine', 'keinen'],
    prompt: 'Nicht negates; nichts means nothing; kein negates a noun.',
  },
  {
    id: 'common-prepositions',
    label: 'mit/für/zu/nach',
    members: ['mit', 'fuer', 'für', 'zu', 'nach'],
    prompt: 'Check role and case instead of memorizing a one-word translation.',
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
