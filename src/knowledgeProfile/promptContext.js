import { CEFR_LEVEL_ORDER, DEFAULT_OVERUSED_BEGINNER_WORDS } from '../data/learnerProfile.js';
import { normalizeGermanForCompare } from '../cardContent/german.js';

function clampLimit(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function levelIndex(level) {
  return CEFR_LEVEL_ORDER.indexOf(String(level || '').toUpperCase());
}

function nextLevel(level) {
  const index = levelIndex(level);
  if (index < 0) {
    return null;
  }
  return CEFR_LEVEL_ORDER[Math.min(index + 1, CEFR_LEVEL_ORDER.length - 1)];
}

function sortByMaturityAndLevel(a, b) {
  const maturityDiff = (b.maturityScore || 0) - (a.maturityScore || 0);
  if (maturityDiff !== 0) {
    return maturityDiff;
  }

  return levelIndex(b.cefrLevel) - levelIndex(a.cefrLevel);
}

function sortWeakWords(a, b) {
  const lapseDiff = (b.lapses || 0) - (a.lapses || 0);
  if (lapseDiff !== 0) {
    return lapseDiff;
  }

  return (b.reps || 0) - (a.reps || 0);
}

function formatWordList(words = [], limit = 20) {
  return words
    .map((word) => word.canonical || word.lemma)
    .filter(Boolean)
    .slice(0, limit)
    .join(', ');
}

function selectKnownWords(words = [], target = {}, limit = 60) {
  const normalizedTargets = new Set([
    target.canonical,
    target.lemma,
    target.rawInput,
  ].map((value) => normalizeGermanForCompare(value || '')).filter(Boolean));

  return [...words]
    .filter((word) => {
      const label = word.canonical || word.lemma;
      if (!label) return false;
      return !normalizedTargets.has(normalizeGermanForCompare(label));
    })
    .sort(sortByMaturityAndLevel)
    .slice(0, limit);
}

function selectWeakWords(words = [], limit = 12) {
  return [...words]
    .filter((word) => (word.lapses || 0) > 0 || ((word.reps || 0) > 0 && (word.intervalDays || 0) <= 3))
    .sort(sortWeakWords)
    .slice(0, limit);
}

function formatCefrCounts(counts = {}) {
  return CEFR_LEVEL_ORDER
    .map((level) => `${level}:${counts[level] || 0}`)
    .join(', ');
}

export function buildLearnerProfilePromptContext(profile, {
  target = {},
  maxKnownWords = 60,
} = {}) {
  if (!profile?.summary) {
    return null;
  }

  const summary = profile.summary;
  const knownLimit = clampLimit(maxKnownWords, 60);
  const knownWords = selectKnownWords(summary.words || [], target, knownLimit);
  const weakWords = selectWeakWords(summary.words || []);
  const estimatedLevel = summary.estimatedLevel || null;
  const targetLevel = nextLevel(estimatedLevel) || estimatedLevel || 'B1';
  const knownWordText = formatWordList(knownWords, knownLimit);
  const weakWordText = formatWordList(weakWords, 12);
  const overusedText = DEFAULT_OVERUSED_BEGINNER_WORDS.join(', ');
  const modeCounts = Object.entries(summary.modeCounts || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mode, count]) => `${mode}:${count}`)
    .join(', ');

  return [
    'Learner progress context. Use as a preference, never as a hard rule.',
    `Estimated comfortable level: ${estimatedLevel || 'unknown'}; aim examples around ${targetLevel} when natural.`,
    `Known card count: ${summary.totalNotes || 0}; CEFR evidence: ${formatCefrCounts(summary.cefrCounts)}.`,
    modeCounts ? `Existing card mix: ${modeCounts}.` : null,
    knownWordText ? `Known vocabulary you may reuse naturally: ${knownWordText}.` : null,
    weakWordText ? `Useful weak/recent words to reinforce when natural: ${weakWordText}.` : null,
    `Avoid defaulting to beginner filler unless it is clearly the best example: ${overusedText}.`,
    'Correct German, the requested target word, and the intended meaning are more important than level tuning.',
  ].filter(Boolean).join('\n');
}
