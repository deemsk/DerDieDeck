import { escapeHtml } from '../../cardContent/html.js';
import { html, joinHtml } from './html.js';

export function soundTag(audioFilename) {
  const filename = String(audioFilename || '').trim();
  return filename ? `[sound:${filename}]` : '';
}

export function imageTag(imageFilename) {
  const filename = String(imageFilename || '').trim();
  return filename ? `<img src="${escapeHtml(filename)}" />` : '';
}

/**
 * Builds a front-side recall cue from a user's personal connection.
 */
export function personalConnectionCue(text = '') {
  const value = String(text || '').trim();
  if (!value) {
    return '';
  }

  return html`
    <div class="yt2anki-personal-cue ddd-personal-cue">
      <span class="ddd-personal-cue-label">Personal connection</span>
      <span class="ddd-personal-cue-value">${escapeHtml(value)}</span>
    </div>
  `;
}

export function imageBlock(imageFilename) {
  const image = imageTag(imageFilename);
  if (!image) {
    return '';
  }

  return `<div class="ddd-image">${image}</div>`;
}

export function smallText(text = '') {
  const value = String(text || '').trim();
  return value ? `<small>${escapeHtml(value)}</small>` : '';
}

export function formatIpaHtml(ipa = '') {
  const value = String(ipa || '').trim();
  if (!value) {
    return '';
  }

  return `<span class="yt2anki-ipa ddd-ipa">${escapeHtml(value)}</span>`;
}

export function formatGenderColoredWord(canonical, gender) {
  const genderClass = `yt2anki-gender-${escapeHtml(gender || 'neuter')}`;
  return `<span class="yt2anki-word-display ddd-word-display yt2anki-gender ${genderClass}">${escapeHtml(canonical)}</span>`;
}

export function formatPlainWord(canonical) {
  return `<span class="yt2anki-word-display ddd-word-display">${escapeHtml(canonical)}</span>`;
}

export function formatPronunciationField(audioFilename, ipa = '') {
  return joinHtml([soundTag(audioFilename), formatIpaHtml(ipa)]);
}

/**
 * Formats a primary translation so meanings stay visually consistent across card backs.
 */
export function formatPrimaryTranslation(text = '') {
  const value = String(text || '').trim();
  if (!value) {
    return '';
  }

  return `<div class="ddd-answer-translation">${escapeHtml(value)}</div>`;
}

export function taskHeader(label, instruction = null) {
  const title = String(label || '').trim();
  const detail = String(instruction || '').trim();
  if (!title) {
    return '';
  }

  return html`
    <div class="ddd-task-header">
      <div class="ddd-task-title">${escapeHtml(title)}</div>
      ${detail ? `<div class="ddd-task-detail">${escapeHtml(detail)}</div>` : ''}
    </div>
  `;
}

export function focusPill(context = null) {
  const value = String(context || '').trim();
  if (!value) {
    return '';
  }

  return html`
    <div class="yt2anki-front-context ddd-focus">
      <span class="ddd-focus-label">Focus</span>
      <span class="ddd-focus-value">${escapeHtml(value)}</span>
    </div>
  `;
}

export function answerStack({ german, ipa, russian, extraHtml = null }) {
  return html`
    <div class="ddd-answer-stack">
      ${german ? `<div class="ddd-answer-german">${escapeHtml(german)}</div>` : ''}
      ${ipa ? `<div class="ddd-answer-ipa">${formatIpaHtml(ipa)}</div>` : ''}
      ${formatPrimaryTranslation(russian)}
      ${extraHtml ? `<div class="ddd-answer-extra">${extraHtml}</div>` : ''}
    </div>
  `;
}

export function buildWordSentenceContrastFooter(contrast = null) {
  const value = String(contrast || '').trim();
  if (!value) {
    return null;
  }

  return html`
    <div class="yt2anki-word-contrast ddd-word-contrast">
      <span class="ddd-word-contrast-label">Contrast</span>
      <span class="ddd-word-contrast-value">${escapeHtml(value)}</span>
    </div>
  `;
}

export function taskPanel(type, { emoji, kicker, main, sub = null }) {
  return html`
    <div class="yt2anki-task ddd-task-panel yt2anki-task-${type} ddd-task-panel-${type}">
      <div class="yt2anki-task-kicker ddd-task-kicker">${emoji} ${escapeHtml(kicker)}</div>
      <div class="yt2anki-task-main ddd-task-main">${escapeHtml(main)}</div>
      ${sub ? `<div class="yt2anki-task-sub ddd-task-sub">${escapeHtml(sub)}</div>` : ''}
    </div>
  `;
}

export function replySlot() {
  return '<div class="yt2anki-reply-slot ddd-reply-slot">💬 Your reply: ______</div>';
}
