import { normalizeGermanForCompare } from '../cardContent/german.js';

export function buildLearnerProfilePromptContext(profile, { target = {}, maxKnownWords = 60 } = {}) {
  const normalize = (value) => normalizeGermanForCompare(value || '').replace(/^(der|die|das) /, '');
  const targets = new Set([target.canonical, target.lemma, target.rawInput].map(normalize).filter(Boolean));
  for (const word of profile?.summary?.words || []) {
    if (targets.has(normalize(word.canonical)) && word.lemma) targets.add(normalize(word.lemma));
  }
  const words = (profile?.summary?.words || []).filter((word) =>
    word.canonical && !targets.has(normalize(word.canonical)) && !targets.has(normalize(word.lemma))
  );
  const limit = Math.min(60, Math.max(1, Number(maxKnownWords) || 60));
  const list = (state, count) => words.filter((word) => word.state === state)
    .sort((a, b) => (b.intervalDays || 0) - (a.intervalDays || 0))
    .slice(0, count).map((word) => word.canonical).join(', ');
  const familiar = list('familiar', limit);
  const learning = list('learning', 12);
  if (!familiar && !learning) return null;
  return [
    'Anki review evidence, not a complete vocabulary inventory or a guarantee of mastery. Use only as a preference.',
    familiar ? `Familiar vocabulary you may reuse naturally: ${familiar}.` : null,
    learning ? `Still learning; optionally reinforce one when natural: ${learning}.` : null,
    'Keep examples short and natural. Basic vocabulary is welcome. Do not infer a CEFR level or increase difficulty from this list.',
    'Correct German, the exact requested target and intended meaning take priority. Preserve any user-selected sentence.',
  ].filter(Boolean).join('\n');
}
