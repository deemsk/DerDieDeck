import { escapeHtml } from '../../cardContent/html.js';
import { replySlot, smallText, soundTag, taskPanel } from '../shared/components.js';

function buildDialogueFront(audioFilename) {
  return soundTag(audioFilename) +
    taskPanel('dialogue', {
      emoji: '💬',
      kicker: 'Ваш ответ',
      main: 'Ответьте вслух по-немецки',
      sub: 'Ответьте собеседнику, не переводите его реплику',
    }) +
    replySlot();
}

export function formatDialogueCard(card, audioFilename) {
  let back = escapeHtml(card.back.german);
  if (card.back.russian) {
    back += `<br>${smallText(card.back.russian)}`;
  }

  return {
    Front: buildDialogueFront(audioFilename),
    Back: back,
  };
}
