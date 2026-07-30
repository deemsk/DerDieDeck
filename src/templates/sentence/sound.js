import { escapeHtml } from '../../cardContent/html.js';
import { answerStack, soundTag, taskHeader } from '../shared/components.js';

/**
 * Formats a sound-focused card that trains audio before orthography.
 */
export function formatSoundCard(card, audioFilename) {
  return {
    Front: `${taskHeader('Услышьте звук', 'Сначала прослушайте, затем прочитайте слово или фразу')}${soundTag(audioFilename)}`,
    Back: answerStack({
      german: card.back.german,
      ipa: card.back.ipa,
      extraHtml: card.back.targetSound
        ? `<div class="ddd-sound-target">Целевой звук: ${escapeHtml(card.back.targetSound)}</div>`
        : null,
    }),
  };
}
