import { normalizeGermanForCompare, toTagSlug } from './german.js';

const INTENT_BY_CARD_TYPE = {
  comprehension: {
    id: 'sound-meaning',
    trains: ['sound-map', 'meaning-recognition'],
    frontShouldHide: ['german', 'ipa', 'direct-translation'],
  },
  dialogue: {
    id: 'conversation-reply',
    trains: ['conversation-response', 'active-recall'],
    frontShouldHide: ['reply'],
  },
  production: {
    id: 'meaning-to-german',
    trains: ['active-production', 'word-order', 'pronunciation-after-recall'],
    frontShouldHide: ['german', 'ipa', 'audio'],
  },
  pattern: {
    id: 'grammar-pattern',
    trains: ['grammar-pattern', 'transfer'],
    frontShouldHide: ['example-list'],
  },
  cloze: {
    id: 'grammar-cloze',
    trains: ['form-selection', 'grammar-in-context'],
    frontShouldHide: ['answer'],
  },
  sound: {
    id: 'sound-discrimination',
    trains: ['sound-map', 'pronunciation'],
    frontShouldHide: ['written-answer'],
  },
};

/**
 * Builds the default learning intent contract for a generated card type.
 */
export function buildLearningIntent(type, overrides = {}) {
  const base = INTENT_BY_CARD_TYPE[type] || {
    id: type || 'unknown',
    trains: ['recall'],
    frontShouldHide: [],
  };

  return {
    id: overrides.id || base.id,
    trains: overrides.trains || base.trains,
    frontShouldHide: overrides.frontShouldHide || base.frontShouldHide,
    answer: overrides.answer || null,
    contrastFamily: overrides.contrastFamily || null,
    patternFamily: overrides.patternFamily || null,
  };
}

/**
 * Returns tags that make card intent visible in Anki search and audits.
 */
export function buildLearningIntentTags(intent = {}) {
  const tags = [];
  if (intent.id) {
    tags.push(`intent-${toTagSlug(intent.id)}`);
  }

  for (const trained of intent.trains || []) {
    tags.push(`trains-${toTagSlug(trained)}`);
  }

  if (intent.contrastFamily) {
    tags.push(`contrast-family-${toTagSlug(intent.contrastFamily)}`);
  }

  if (intent.patternFamily) {
    tags.push(`pattern-family-${toTagSlug(intent.patternFamily)}`);
  }

  return tags;
}

/**
 * Adds sibling-staging tags so related cards can be introduced across days.
 */
export function buildSiblingStageTags(index = 0, total = 1) {
  if (total <= 1) {
    return [];
  }

  return [
    'has-siblings',
    `sibling-stage-day-${Math.max(0, index)}`,
    `sibling-count-${total}`,
  ];
}

/**
 * Validates that a generated card has an explicit learning intent and no obvious front leak.
 */
export function validateCardIntent(card = {}) {
  if (!card.intent?.id || !Array.isArray(card.intent.trains) || card.intent.trains.length === 0) {
    return {
      valid: false,
      reason: 'missing learning intent',
    };
  }

  if (card.type === 'production') {
    const frontText = normalizeGermanForCompare([card.front?.russian, card.front?.situation].filter(Boolean).join(' '));
    const german = normalizeGermanForCompare(card.back?.german || '');
    const ipa = normalizeGermanForCompare(card.back?.ipa || '');
    if (german && frontText.includes(german)) {
      return {
        valid: false,
        reason: 'production front leaks German answer',
      };
    }
    if (ipa && frontText.includes(ipa)) {
      return {
        valid: false,
        reason: 'production front leaks IPA',
      };
    }
  }

  if (card.type === 'cloze') {
    const answer = normalizeGermanForCompare(card.back?.answer || '');
    const frontSentence = normalizeGermanForCompare(card.front?.sentence || '');
    if (answer && frontSentence.includes(answer)) {
      return {
        valid: false,
        reason: 'cloze front leaks answer',
      };
    }
  }

  return {
    valid: true,
    reason: null,
  };
}

/**
 * Throws if a generated card violates its learning intent contract.
 */
export function assertValidCardIntent(card = {}) {
  const result = validateCardIntent(card);
  if (!result.valid) {
    throw new Error(`Invalid ${card.type || 'card'} intent: ${result.reason}`);
  }
}
