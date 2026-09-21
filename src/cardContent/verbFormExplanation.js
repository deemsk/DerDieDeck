import { createHash } from 'node:crypto';

function words(text) {
  return String(text || '').normalize('NFC').toLocaleLowerCase('de').match(/[\p{L}\p{M}]+/gu) || [];
}

// Ordered whole tokens also cover separable verbs: kommt ... an.
export function containsVerbForm(sentence, form) {
  const target = words(form);
  const tokens = words(sentence);
  let index = 0;
  for (const token of tokens) {
    if (token === target[index]) index += 1;
  }
  return target.length > 0 && index === target.length;
}

export function validateVerbFormExplanation(value, { form, infinitive, selectedSentence = null }) {
  const fail = (reason) => { throw new Error(`Invalid verb form explanation: ${reason}`); };
  if (!value || typeof value !== 'object') fail('missing explanation');
  for (const key of ['form', 'infinitive', 'formMeaning', 'grammar', 'usage']) {
    if (typeof value[key] !== 'string' || !value[key].trim()) fail(`missing ${key}`);
  }
  for (const key of ['ambiguity', 'contrast']) {
    if (value[key] !== null && typeof value[key] !== 'string') fail(`invalid ${key}`);
  }
  if (value.form.normalize('NFC') !== String(form).normalize('NFC')) fail('wrong target form');
  if (value.infinitive.normalize('NFC') !== String(infinitive).normalize('NFC')) fail('wrong infinitive');
  if (!containsVerbForm(value.example?.german, form)) fail('example does not contain the target form');
  for (const text of [value.formMeaning, value.usage, value.example?.russian]) {
    if (typeof text !== 'string' || !/[А-Яа-яЁё]/u.test(text)) fail('missing Russian meaning, usage or example translation');
  }
  if (selectedSentence?.german && containsVerbForm(selectedSentence.german, form)
      && value.example.german.trim() !== selectedSentence.german.trim()) {
    fail('example must use the final selected sentence');
  }
  return value;
}

const MARKER = /<!-- ddd-verb-form:v1:([a-f0-9]{64}) -->$/;
const digest = (text) => createHash('sha256').update(text).digest('hex');

export function markVerbFormAnswer(body) {
  return `${body}<!-- ddd-verb-form:v1:${digest(body)} -->`;
}

export function isCurrentVerbFormAnswer(back) {
  const match = String(back || '').match(MARKER);
  return Boolean(match && digest(back.slice(0, match.index)) === match[1]);
}
