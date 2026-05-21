import { createHash } from 'crypto';
import {
  findCardsByQuery,
  findNotesByQuery,
  getCardsInfo,
  getNotesInfo,
  syncCollection,
} from '../anki.js';
import { extractCanonicalWord, extractWordLexicalType, extractWordMeaning, parseWordMetadataComment } from '../cardContent/wordMetadata.js';
import { parseGrammarMetadataComment } from '../grammar/utils.js';
import { normalizeGermanForCompare } from '../cardContent/german.js';
import { CEFR_LEVEL_ORDER } from '../data/learnerProfile.js';

const PROFILE_VERSION = 1;
const NOTE_INFO_CHUNK_SIZE = 250;
const CARD_INFO_CHUNK_SIZE = 500;

function sortStrings(values = []) {
  return [...values].map(String).sort((a, b) => a.localeCompare(b));
}

async function chunked(items, size, fn) {
  const results = [];
  for (let index = 0; index < items.length; index += size) {
    results.push(...await fn(items.slice(index, index + size)));
  }
  return results;
}

function getTags(note = {}) {
  return Array.isArray(note.tags) ? note.tags : [];
}

function getFieldValue(note = {}, fieldName = '') {
  return note.fields?.[fieldName]?.value || '';
}

function getAllFieldValues(note = {}) {
  return Object.values(note.fields || {})
    .map((field) => field?.value || '')
    .join(' ');
}

function stripHtml(text = '') {
  return String(text)
    .replace(/\[sound:[^\]]+\]/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function tagValue(tags = [], prefix = '') {
  const tag = tags.find((entry) => String(entry).toLowerCase().startsWith(prefix.toLowerCase()));
  return tag ? tag.slice(prefix.length).replace(/-/g, ' ') : null;
}

function extractMode(tags = []) {
  return tags.find((tag) => /^mode-/i.test(tag)) || null;
}

function extractCefr(tags = []) {
  const tag = tags.find((entry) => /^cefr-(a1|a2|b1|b2|c1)$/i.test(entry));
  return tag ? tag.replace(/^cefr-/i, '').toUpperCase() : null;
}

function extractLexicalType(tags = [], metadata = {}, extraField = '') {
  if (metadata?.lexicalType) {
    return String(metadata.lexicalType).trim();
  }

  const fromExtra = extractWordLexicalType(extraField);
  if (fromExtra) {
    return fromExtra;
  }

  const tag = tags.find((entry) => /^word-/i.test(entry));
  if (tag) {
    return tag.replace(/^word-/i, '');
  }

  if (tags.some((tagValue) => /^mode-verb-/i.test(tagValue))) {
    return 'verb';
  }

  return null;
}

function extractCanonical(note = {}, metadata = {}, tags = [], extraField = '') {
  if (metadata?.canonical) {
    return String(metadata.canonical).trim();
  }

  const canonicalTag = tagValue(tags, 'canonical-');
  if (canonicalTag) {
    return canonicalTag;
  }

  const pictureWord = getFieldValue(note, 'Word');
  const fromPictureWord = extractCanonicalWord(pictureWord, extraField);
  if (fromPictureWord) {
    return fromPictureWord;
  }

  const front = stripHtml(getFieldValue(note, 'Front'));
  if (front && front.length <= 80) {
    return front;
  }

  return tagValue(tags, 'lemma-') || tagValue(tags, 'grammar-lemma-');
}

function extractMeaning(note = {}, metadata = {}, extraField = '') {
  if (metadata?.meaning) {
    return String(metadata.meaning).trim();
  }

  const fromExtra = extractWordMeaning(extraField);
  if (fromExtra) {
    return fromExtra;
  }

  const back = stripHtml(getFieldValue(note, 'Back'));
  return back && back.length <= 120 ? back : null;
}

function buildCardStats(cardInfos = []) {
  const stats = new Map();

  for (const card of cardInfos) {
    const noteId = card.note || card.noteId;
    if (!noteId) continue;

    const current = stats.get(noteId) || {
      cardCount: 0,
      maxIntervalDays: 0,
      reps: 0,
      lapses: 0,
      hasDueCards: false,
    };

    const interval = Number(card.interval ?? card.ivl ?? 0);
    current.cardCount += 1;
    current.maxIntervalDays = Math.max(current.maxIntervalDays, Number.isFinite(interval) ? interval : 0);
    current.reps += Number(card.reps || 0);
    current.lapses += Number(card.lapses || 0);
    current.hasDueCards = current.hasDueCards || card.queue === 2 || card.isDue === true;
    stats.set(noteId, current);
  }

  return stats;
}

function maturityScore(stats = {}) {
  const intervalScore = Math.min(Number(stats.maxIntervalDays || 0), 90) / 90;
  const repsScore = Math.min(Number(stats.reps || 0), 8) / 8;
  const lapsePenalty = Math.min(Number(stats.lapses || 0), 4) * 0.12;
  return Math.max(0, Number((intervalScore + repsScore - lapsePenalty).toFixed(3)));
}

function stableFingerprint(notes = [], cardInfos = []) {
  const stableNotes = notes.map((note) => ({
    id: note.noteId,
    model: note.modelName,
    tags: sortStrings(getTags(note)),
    fields: Object.entries(note.fields || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, field]) => [name, field?.value || '']),
  })).sort((a, b) => Number(a.id) - Number(b.id));

  const stableCards = cardInfos.map((card) => ({
    id: card.cardId,
    note: card.note || card.noteId || null,
    type: card.type,
    queue: card.queue,
    due: card.due,
    interval: card.interval ?? card.ivl ?? null,
    reps: card.reps || 0,
    lapses: card.lapses || 0,
  })).sort((a, b) => Number(a.id) - Number(b.id));

  return createHash('sha256')
    .update(JSON.stringify({ notes: stableNotes, cards: stableCards }))
    .digest('hex');
}

function estimateLevel(cefrCounts = {}) {
  let total = 0;
  let weighted = 0;

  for (const [index, level] of CEFR_LEVEL_ORDER.entries()) {
    const count = Number(cefrCounts[level] || 0);
    total += count;
    weighted += count * index;
  }

  if (total === 0) {
    return null;
  }

  const average = weighted / total;
  return CEFR_LEVEL_ORDER[Math.max(0, Math.min(CEFR_LEVEL_ORDER.length - 1, Math.round(average)))];
}

function summarizeNotes(notes = [], cardInfos = []) {
  const cardStatsByNote = buildCardStats(cardInfos);
  const wordsByKey = new Map();
  const modeCounts = {};
  const cefrCounts = Object.fromEntries(CEFR_LEVEL_ORDER.map((level) => [level, 0]));
  const grammarFamilies = new Set();

  for (const note of notes) {
    const tags = getTags(note);
    const mode = extractMode(tags);
    if (mode) {
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;
    }

    const cefrLevel = extractCefr(tags);
    if (cefrLevel) {
      cefrCounts[cefrLevel] = (cefrCounts[cefrLevel] || 0) + 1;
    }

    const allFields = getAllFieldValues(note);
    const metadata = parseWordMetadataComment(allFields) || {};
    const grammarMetadata = parseGrammarMetadataComment(allFields);
    if (grammarMetadata?.familyId) {
      grammarFamilies.add(grammarMetadata.familyId);
    }

    const extraField = getFieldValue(note, 'Gender, Personal Connection, Extra Info (Back side)') ||
      getFieldValue(note, 'Back') ||
      getFieldValue(note, 'Back Extra') ||
      getFieldValue(note, 'Extra');
    const canonical = extractCanonical(note, metadata, tags, extraField);
    const lemma = metadata.lemma || tagValue(tags, 'lemma-') || canonical;
    const lexicalType = extractLexicalType(tags, metadata, extraField);
    const meaning = extractMeaning(note, metadata, extraField);

    if (!canonical && !lemma) {
      continue;
    }

    const stats = cardStatsByNote.get(note.noteId) || {};
    const key = normalizeGermanForCompare(`${lexicalType || 'word'}:${canonical || lemma}`);
    const current = wordsByKey.get(key) || {
      canonical: canonical || lemma,
      lemma,
      meaning,
      lexicalType,
      cefrLevel,
      noteCount: 0,
      reps: 0,
      lapses: 0,
      intervalDays: 0,
      maturityScore: 0,
    };

    current.noteCount += 1;
    current.meaning ||= meaning;
    current.cefrLevel ||= cefrLevel;
    current.reps += Number(stats.reps || 0);
    current.lapses += Number(stats.lapses || 0);
    current.intervalDays = Math.max(current.intervalDays, Number(stats.maxIntervalDays || 0));
    current.maturityScore = Math.max(current.maturityScore, maturityScore(stats));
    wordsByKey.set(key, current);
  }

  return {
    totalNotes: notes.length,
    totalCards: cardInfos.length,
    modeCounts,
    cefrCounts,
    estimatedLevel: estimateLevel(cefrCounts),
    grammarFamilies: [...grammarFamilies].sort((a, b) => a.localeCompare(b)),
    words: [...wordsByKey.values()]
      .sort((a, b) => (b.maturityScore || 0) - (a.maturityScore || 0) || String(a.canonical).localeCompare(String(b.canonical))),
  };
}

export async function refreshProfileFromAnki({
  query,
  syncBeforeRefresh = true,
} = {}) {
  let syncStatus = syncBeforeRefresh ? 'ok' : 'skipped';
  let syncError = null;

  if (syncBeforeRefresh) {
    try {
      await syncCollection();
    } catch (err) {
      syncStatus = 'failed';
      syncError = err.message;
    }
  }

  const noteIds = await findNotesByQuery(query);
  const notes = await chunked(noteIds, NOTE_INFO_CHUNK_SIZE, getNotesInfo);

  let cardInfos = [];
  let cardStatus = 'ok';
  let cardError = null;
  try {
    const cardIds = await findCardsByQuery(query);
    cardInfos = await chunked(cardIds, CARD_INFO_CHUNK_SIZE, getCardsInfo);
  } catch (err) {
    cardStatus = 'failed';
    cardError = err.message;
  }

  const profile = {
    version: PROFILE_VERSION,
    sourceQuery: query,
    refreshedAt: new Date().toISOString(),
    syncStatus,
    syncError,
    cardStatus,
    cardError,
    fingerprint: stableFingerprint(notes, cardInfos),
    summary: summarizeNotes(notes, cardInfos),
  };

  return profile;
}
