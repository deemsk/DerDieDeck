const STYLE_START = '/* DerDieDeck shared styles start */';
const STYLE_END = '/* DerDieDeck shared styles end */';

export const DERDIEDECK_STYLE_MARKERS = {
  start: STYLE_START,
  end: STYLE_END,
};

export const DERDIEDECK_SHARED_CSS = `${STYLE_START}
:root {
  --ddd-text: #111827;
  --ddd-muted: #475569;
  --ddd-divider: rgba(15, 23, 42, 0.42);
  --ddd-panel: rgba(148, 163, 184, 0.12);
  --ddd-ipa: #475569;
  --ddd-focus-label: #64748b;
  --ddd-masculine: #2563eb;
  --ddd-feminine: #dc2626;
  --ddd-neuter: #0f766e;
  --ddd-personal-bg: rgba(245, 158, 11, 0.13);
  --ddd-personal-border: rgba(217, 119, 6, 0.34);
  --ddd-personal-text: #78350f;
  --ddd-dialogue-border: rgba(245, 158, 11, 0.55);
  --ddd-dialogue-bg: linear-gradient(135deg, rgba(251, 191, 36, 0.16), rgba(249, 115, 22, 0.10));
  --ddd-dialogue-kicker: rgba(146, 64, 14, 0.95);
  --ddd-dialogue-slot-border: rgba(217, 119, 6, 0.45);
  --ddd-dialogue-slot-bg: rgba(255, 255, 255, 0.55);
}

.card {
  color: var(--ddd-text);
}

.yt2anki-ipa,
.ddd-ipa {
  color: var(--yt2anki-ipa, var(--ddd-ipa)) !important;
  font-size: 0.92em !important;
  font-style: italic !important;
  line-height: 1.28 !important;
}

.yt2anki-word-display,
.ddd-word-display {
  font-size: 1.55em !important;
  line-height: 1.12 !important;
  font-weight: 700 !important;
}

.yt2anki-gender-masculine {
  color: var(--yt2anki-gender-masculine, var(--ddd-masculine)) !important;
}

.yt2anki-gender-feminine {
  color: var(--yt2anki-gender-feminine, var(--ddd-feminine)) !important;
}

.yt2anki-gender-neuter {
  color: var(--yt2anki-gender-neuter, var(--ddd-neuter)) !important;
}

.yt2anki-front-context {
  background: var(--ddd-panel) !important;
  color: var(--ddd-muted) !important;
}

.ddd-task-header {
  margin: 0 auto 12px !important;
  max-width: 520px !important;
  text-align: center !important;
  color: var(--ddd-muted) !important;
}

.ddd-task-title {
  color: var(--ddd-focus-label) !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  letter-spacing: 0.09em !important;
  text-transform: uppercase !important;
}

.ddd-task-detail {
  margin-top: 4px !important;
  color: var(--ddd-muted) !important;
  font-size: 14px !important;
  line-height: 1.25 !important;
}

.ddd-focus {
  margin: 12px auto 10px !important;
  max-width: 420px !important;
  padding: 7px 11px !important;
  border-radius: 999px !important;
  background: var(--ddd-panel) !important;
  color: var(--ddd-muted) !important;
  font-size: 13px !important;
  line-height: 1.25 !important;
  text-align: center !important;
}

.ddd-focus-label {
  font-size: 12px !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  opacity: 0.78 !important;
}

.ddd-focus-value {
  margin-left: 6px !important;
  font-weight: 600 !important;
}

.ddd-answer-stack {
  margin: 0 auto !important;
  max-width: 720px !important;
  text-align: center !important;
  color: var(--ddd-text) !important;
}

.ddd-answer-german {
  font-size: 1.28em !important;
  line-height: 1.22 !important;
  font-weight: 500 !important;
}

.ddd-answer-ipa .yt2anki-ipa {
  display: inline-block;
  max-width: 100%;
}

.ddd-answer-extra {
  margin-top: 9px !important;
  color: var(--ddd-text) !important;
}

.ddd-answer-translation {
  margin-top: 9px !important;
  font-size: 1.14em !important;
  line-height: 1.24 !important;
  font-weight: 700 !important;
}

.ddd-answer-ipa {
  margin-top: 7px !important;
}

.ddd-image {
  margin: 14px auto 0 !important;
  max-width: 92% !important;
  text-align: center !important;
}

.ddd-image img {
  max-width: 100%;
  height: auto;
}

.yt2anki-word-contrast,
.ddd-word-contrast {
  margin: 14px auto 0 !important;
  max-width: 420px !important;
  text-align: center !important;
  color: var(--ddd-neuter) !important;
}

.ddd-word-contrast-label {
  display: block !important;
  color: var(--ddd-neuter) !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
}

.ddd-word-contrast-value {
  display: block !important;
  margin-top: 4px !important;
  color: var(--ddd-neuter) !important;
  font-size: 20px !important;
  font-weight: 600 !important;
  line-height: 1.15 !important;
}

.yt2anki-extra-row,
.ddd-extra-row {
  margin-top: 8px !important;
  color: var(--ddd-muted) !important;
  font-size: 0.82em !important;
  line-height: 1.22 !important;
}

.yt2anki-extra-label,
.ddd-extra-label {
  display: block !important;
  color: var(--ddd-focus-label) !important;
  font-size: 0.68em !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
}

.yt2anki-extra-meaning,
.ddd-extra-meaning {
  margin-top: 8px !important;
  color: var(--ddd-text) !important;
  font-size: 0.92em !important;
  font-weight: 650 !important;
  line-height: 1.22 !important;
}

.yt2anki-extra-example,
.ddd-extra-example {
  margin: 22px auto 0 !important;
  max-width: 520px !important;
  padding: 13px 14px 12px !important;
  border-top: 1px solid var(--ddd-divider) !important;
  border-radius: 14px !important;
  background: var(--ddd-panel) !important;
  color: var(--ddd-text) !important;
}

.ddd-extra-example-value {
  display: block !important;
  margin-top: 6px !important;
  font-size: 0.88em !important;
  font-weight: 650 !important;
  line-height: 1.24 !important;
}

.yt2anki-extra-example .yt2anki-extra-value {
  margin-top: 6px !important;
  font-weight: 650 !important;
}

.yt2anki-extra-example-translation,
.ddd-extra-example-translation {
  margin: 7px auto 0 !important;
  max-width: 520px !important;
  color: var(--ddd-muted) !important;
  font-size: 0.76em !important;
  line-height: 1.2 !important;
}

.yt2anki-extra-example {
  margin-top: 22px !important;
}

.yt2anki-extra-personal {
  color: var(--ddd-muted) !important;
}

.yt2anki-personal-cue,
.ddd-personal-cue {
  margin: 12px auto 0 !important;
  max-width: 520px !important;
  padding: 10px 12px !important;
  border: 1px solid var(--ddd-personal-border) !important;
  border-radius: 14px !important;
  background: var(--ddd-personal-bg) !important;
  color: var(--ddd-personal-text) !important;
  text-align: center !important;
}

.ddd-personal-cue-label {
  display: block !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: 0.09em !important;
  text-transform: uppercase !important;
  opacity: 0.72 !important;
}

.ddd-personal-cue-value {
  display: block !important;
  margin-top: 4px !important;
  font-size: 14px !important;
  font-weight: 650 !important;
  line-height: 1.25 !important;
}

.ddd-task-panel,
.yt2anki-task {
  margin: 12px 0 10px !important;
  padding: 12px 14px !important;
  border-radius: 16px !important;
  text-align: left !important;
}

.ddd-task-panel-dialogue,
.yt2anki-task-dialogue {
  border: 2px solid var(--ddd-dialogue-border) !important;
  background: var(--ddd-dialogue-bg) !important;
}

.ddd-task-kicker,
.yt2anki-task-kicker {
  color: var(--ddd-dialogue-kicker) !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
}

.ddd-task-main,
.yt2anki-task-main {
  margin-top: 6px !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
}

.ddd-task-sub,
.yt2anki-task-sub {
  margin-top: 6px !important;
  font-size: 13px !important;
  line-height: 1.35 !important;
  opacity: 0.86 !important;
}

.ddd-reply-slot,
.yt2anki-reply-slot {
  padding: 10px 12px !important;
  border: 1.5px dashed var(--ddd-dialogue-slot-border) !important;
  border-radius: 14px !important;
  background: var(--ddd-dialogue-slot-bg) !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  text-align: left !important;
}

.ddd-production-source,
.yt2anki-production-source {
  font-size: 20px !important;
  font-weight: 700 !important;
  line-height: 1.28 !important;
  text-align: center !important;
}

.ddd-production-hint,
.yt2anki-production-hint {
  margin-top: 8px !important;
  font-size: 13px !important;
  line-height: 1.35 !important;
  text-align: center !important;
  opacity: 0.86 !important;
}

.ddd-keyform-prompt,
.ddd-keyform-recognition {
  text-align: center !important;
}

.ddd-keyform-kicker {
  color: var(--ddd-focus-label) !important;
  font-size: 13px !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
}

.ddd-keyform-main {
  margin-top: 8px !important;
  font-size: 28px !important;
  font-weight: 700 !important;
  line-height: 1.15 !important;
}

.ddd-cloze-context {
  color: var(--ddd-muted) !important;
  font-size: 0.86em !important;
  line-height: 1.25 !important;
}

.ddd-cloze-pattern,
.ddd-cloze-contrast {
  margin-top: 7px !important;
  color: var(--ddd-muted) !important;
  font-size: 0.82em !important;
  line-height: 1.25 !important;
}

.ddd-sound-target {
  color: var(--ddd-muted) !important;
  font-size: 0.86em !important;
}

.card:has(#answer) .yt2anki-personal-cue,
.card:has(.yt2anki-word-display) .yt2anki-personal-cue,
.card:has(span[style*="font-size:1.5em"]) .yt2anki-personal-cue {
  display: none !important;
}

.nightMode,
.night_mode {
  --ddd-text: #f8fafc;
  --ddd-muted: #cbd5e1;
  --ddd-divider: rgba(226, 232, 240, 0.48);
  --ddd-panel: rgba(148, 163, 184, 0.16);
  --ddd-ipa: #cbd5e1;
  --ddd-personal-bg: rgba(245, 158, 11, 0.17);
  --ddd-personal-border: rgba(251, 191, 36, 0.42);
  --ddd-personal-text: #fde68a;
  --ddd-dialogue-slot-bg: rgba(15, 23, 42, 0.28);
}

.nightMode .yt2anki-personal-cue,
.night_mode .yt2anki-personal-cue,
.nightMode .ddd-personal-cue,
.night_mode .ddd-personal-cue {
  background: var(--ddd-personal-bg) !important;
  border-color: var(--ddd-personal-border) !important;
  color: var(--ddd-personal-text) !important;
}

.mobile .yt2anki-ipa,
.iphone .yt2anki-ipa,
.ipad .yt2anki-ipa,
.android .yt2anki-ipa {
  font-size: 0.86em !important;
  line-height: 1.22 !important;
}
${STYLE_END}`;

export function mergeDerDieDeckStyles(existingCss = '') {
  const css = String(existingCss || '');
  const startIndex = css.indexOf(STYLE_START);
  const endIndex = css.indexOf(STYLE_END);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = css.slice(0, startIndex).trimEnd();
    const after = css.slice(endIndex + STYLE_END.length).trimStart();
    return [before, DERDIEDECK_SHARED_CSS, after].filter(Boolean).join('\n\n');
  }

  return [css.trimEnd(), DERDIEDECK_SHARED_CSS].filter(Boolean).join('\n\n');
}

export function hasCurrentDerDieDeckStyles(existingCss = '') {
  return String(existingCss || '').includes(DERDIEDECK_SHARED_CSS);
}
