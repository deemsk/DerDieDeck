import { escapeHtml } from '../../cardContent/html.js';
import { answerStack, soundTag, taskHeader } from '../shared/components.js';

/**
 * Formats a sound-focused card that trains audio before orthography.
 */
export function formatSoundCard(card, audioFilename) {
  return {
    Front: `${taskHeader('Hear the sound', 'Listen before reading the word or phrase')}${soundTag(audioFilename)}`,
    Back: answerStack({
      german: card.back.german,
      ipa: card.back.ipa,
      extraHtml: card.back.targetSound
        ? `<div class="ddd-sound-target">Target sound: ${escapeHtml(card.back.targetSound)}</div>`
        : null,
    }),
  };
}
