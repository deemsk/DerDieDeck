import { stripHtml } from './html.js';
import { toTagSlug } from './german.js';

const WORD = /^<span class="(?:yt2anki-word-display(?: ddd-word-display)?|ddd-word-display)">([^<>]+)<\/span>$/;
const LEXEME = /^[\p{L}\p{M}]+(?:[ -][\p{L}\p{M}]+)*$/u;

export function parseLegacyVerbDictionary(note) {
  const fail = () => { throw new Error('Unrecognized or inconsistent legacy dictionary fields; manual review required'); };
  if (!note.tags?.includes('mode-verb-dictionary')) fail();
  const front = note.fields?.Front?.value?.trim();
  const back = note.fields?.Back?.value;
  if (!front || !back) fail();
  const form = stripHtml(front.match(WORD)?.[1] || (LEXEME.test(front) ? front : ''));
  const parts = back.split(/<br\s*\/?>/i).map((part) => part.trim());
  const infinitive = stripHtml(parts.shift()?.match(WORD)?.[1] || '');
  if (!LEXEME.test(form) || !LEXEME.test(infinitive)) fail();
  const meaningPart = parts.pop() || '';
  const meaningText = meaningPart.match(/^<div class="ddd-answer-translation">([^<>]+)<\/div>$/)?.[1]
    || (!/[<>]/.test(meaningPart) ? meaningPart : '');
  const meaning = stripHtml(meaningText);
  if (!/[А-Яа-яЁё]/u.test(meaning)) fail();
  let soundSeen = false;
  let ipaSeen = false;
  for (const part of parts) {
    if (!soundSeen && /^\[sound:[^\[\]<>\r\n]+\]$/.test(part)) soundSeen = true;
    else if (!ipaSeen && /^(?:<span class="(?:yt2anki-ipa(?: ddd-ipa)?|ddd-ipa)">)?\[[^\[\]<>]+\](?:<\/span>)?$/.test(part) && !part.includes('[sound:')) ipaSeen = true;
    else fail();
  }
  for (const [prefix, value] of [['lemma-', infinitive], ['form-', form]]) {
    const tags = note.tags.filter((tag) => tag.startsWith(prefix));
    if (tags.some((tag) => tag !== `${prefix}${toTagSlug(value)}`)) fail();
  }
  return { form, infinitive, meaning, infinitiveHtml: back };
}
