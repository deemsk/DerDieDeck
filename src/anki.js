import { readFile } from 'fs/promises';
import { basename } from 'path';
import { config } from './lib/config.js';
import { buildSentenceNoteFields, formatCardForAnki } from './templates/index.js';
import {
  buildPictureWordFields,
  buildPictureWordTags,
  PICTURE_WORD_FIELDS,
  PICTURE_WORD_MODEL,
} from './templates/word/pictureWord.js';
import { buildClozeNoteFields } from './templates/grammar/clozeNote.js';
import { escapeHtml } from './cardContent/html.js';
import { normalizeGermanForCompare, toTagSlug } from './cardContent/german.js';
import { extractCanonicalWord, extractWordLexicalType, extractWordMeaning, parseWordMetadataComment } from './cardContent/wordMetadata.js';
import { buildLearningIntentTags, buildSiblingStageTags } from './cardContent/learningDesign.js';
import { hasCurrentDerDieDeckStyles, mergeDerDieDeckStyles } from './templates/shared/styles.js';
import { parseGrammarMetadataComment } from './grammar/utils.js';

/**
 * Call AnkiConnect API
 */
async function ankiConnect(action, params = {}) {
  const response = await fetch(config.ankiConnectUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6, params }),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(`AnkiConnect error: ${result.error}`);
  }

  return result.result;
}

/**
 * Check if AnkiConnect is available
 */
export async function checkConnection() {
  try {
    await ankiConnect('version');
    return true;
  } catch {
    return false;
  }
}

export async function syncCollection() {
  return ankiConnect('sync');
}

export async function findNotesByQuery(query) {
  return ankiConnect('findNotes', { query });
}

export async function getNotesInfo(noteIds = []) {
  if (!noteIds.length) {
    return [];
  }

  return ankiConnect('notesInfo', { notes: noteIds });
}

export async function findCardsByQuery(query) {
  return ankiConnect('findCards', { query });
}

export async function getCardsInfo(cardIds = []) {
  if (!cardIds.length) {
    return [];
  }

  return ankiConnect('cardsInfo', { cards: cardIds });
}

/**
 * Ensure deck exists
 */
export async function ensureDeck(deckName = config.ankiDeck) {
  const decks = await ankiConnect('deckNames');
  if (!decks.includes(deckName)) {
    await ankiConnect('createDeck', { deck: deckName });
  }
}

/**
 * Store audio file in Anki media collection
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<string>} - Filename in Anki media
 */
export async function storeMedia(mediaPath) {
  const mediaData = await readFile(mediaPath);
  const base64 = mediaData.toString('base64');
  const filename = basename(mediaPath);

  await ankiConnect('storeMediaFile', {
    filename,
    data: base64,
  });

  return filename;
}

export async function storeAudio(audioPath) {
  return storeMedia(audioPath);
}

/**
 * Create Anki note with audio (legacy single-card method)
 * Audio-first format for comprehension:
 *   Front: audio + optional context
 *   Back: german + ipa + russian
 *
 * @param {Object} data
 * @param {string} data.german - German text
 * @param {string} data.ipa - IPA transcription
 * @param {string} data.russian - Russian translation
 * @param {string} data.audioFilename - Audio filename in Anki media
 * @param {string} data.context - Optional context/situation
 * @param {boolean} data.addReversed - Whether to add reversed card
 * @param {Object} data.cefr - CEFR estimation result
 * @param {string} data.deck - Optional deck override
 */
export async function createNote({
  german,
  ipa,
  russian,
  audioFilename,
  context = null,
  contextStyle = 'boxed',
  imageFilename = null,
  frontFooterHtml = null,
  addReversed = true,
  task = null,
  cefr = null,
  metadata = null,
  tags: extraTags = [],
  deck = null,
}) {
  const deckName = deck || config.ankiDeck;

  // Format front: Audio + optional context (audio-first for comprehension)
  const fields = buildSentenceNoteFields({
    german,
    ipa,
    russian,
    audioFilename,
    context,
    contextStyle,
    imageFilename,
    frontFooterHtml,
    task,
    metadata,
  });

  // Support "Basic (optional reversed card)" - needs "Add Reverse" field to be non-empty
  if (config.ankiNoteType.includes('optional reversed') && addReversed) {
    fields['Add Reverse'] = '1';
  }

  // Build tags
  const tags = ['yt2anki'];
  if (cefr && cefr.level) {
    tags.push(`cefr-${cefr.level.toLowerCase()}`);
  }
  tags.push(...extraTags);

  await ankiConnect('addNote', {
    note: {
      deckName,
      modelName: config.ankiNoteType,
      fields,
      options: {
        allowDuplicate: false,
      },
      tags,
    },
  });
}

/**
 * Create multiple Anki notes from generated cards.
 * Used by the Fluent Forever card system for batch creation.
 *
 * @param {Object[]} cards - Generated card objects from cardTypes.js
 * @param {string} audioFilename - Audio filename in Anki media
 * @param {Object} options
 * @param {string} options.sourceId - Unique ID for grouping related cards
 * @param {Object} options.cefr - CEFR estimation result
 * @param {string} options.deck - Override deck name
 * @returns {Promise<number[]>} Array of created note IDs
 */
export async function createNotes(cards, audioFilename, options = {}) {
  const { sourceId, cefr, deck } = options;
  const deckName = deck || config.ankiDeck;
  const noteIds = [];

  for (const card of cards) {
    const fields = formatCardForAnki(card, audioFilename);

    // Build tags
    const tags = [
      'yt2anki',
      `card-${card.type}`,
      ...buildLearningIntentTags(card.intent),
      ...buildSiblingStageTags(card.siblingStage?.index || 0, card.siblingStage?.total || cards.length),
    ];
    if (cefr?.level) {
      tags.push(`cefr-${cefr.level.toLowerCase()}`);
    }
    if (sourceId) {
      tags.push(`source-${sourceId}`);
    }

    try {
      const noteId = await ankiConnect('addNote', {
        note: {
          deckName,
          modelName: config.ankiNoteType,
          fields,
          options: {
            allowDuplicate: false,
          },
          tags,
        },
      });
      noteIds.push(noteId);
    } catch (err) {
      // If duplicate, continue with other cards
      if (err.message.includes('duplicate')) {
        console.warn(`Skipped duplicate ${card.type} card`);
        continue;
      }
      throw err;
    }
  }

  return noteIds;
}

export async function createPictureWordNote({
  canonical,
  coloredWord,
  imageFilename,
  personalConnection = null,
  pronunciationField,
  extraInfoField,
  gender = null,
  frequencyBand,
  lemma,
  imageSource,
  audioSource,
  lexicalType = 'noun',
  theme = null,
  deck = null,
  modelName = config.wordNoteType || PICTURE_WORD_MODEL,
  extraTags = [],
}) {
  const deckName = deck || config.ankiDeck;
  const fields = buildPictureWordFields({
    coloredWord,
    imageFilename,
    personalConnection,
    pronunciationField,
    extraInfoField,
  });
  const tags = [
    ...buildPictureWordTags({
      canonical,
      gender,
      frequencyBand,
      lemma,
      imageSource,
      audioSource,
      lexicalType,
      theme,
    }),
    ...extraTags,
  ];

  return ankiConnect('addNote', {
    note: {
      deckName,
      modelName,
      fields,
      options: {
        allowDuplicate: false,
      },
      tags,
    },
  });
}

export async function createBasicNote({
  front,
  back,
  tags = [],
  deck = null,
  modelName = config.ankiNoteType,
  addReversed = false,
}) {
  const deckName = deck || config.ankiDeck;
  const fields = {
    Front: front,
    Back: back,
  };

  if (modelName.includes('optional reversed') && addReversed) {
    fields['Add Reverse'] = '1';
  }

  return ankiConnect('addNote', {
    note: {
      deckName,
      modelName,
      fields,
      options: {
        allowDuplicate: false,
      },
      tags,
    },
  });
}

export function resolveClozeFieldMap(fieldNames = []) {
  const textField = fieldNames.find((field) => /^text$/i.test(field));
  const extraField = fieldNames.find((field) => /^back extra$/i.test(field)) ||
    fieldNames.find((field) => /^extra$/i.test(field));

  if (!textField || !extraField) {
    throw new Error(`Grammar note type must contain Text and Back Extra/Extra fields. Found: ${fieldNames.join(', ')}`);
  }

  return { textField, extraField };
}

export async function createClozeNote({
  text,
  extra = '',
  tags = [],
  deck = null,
  modelName = config.grammarNoteType || 'Cloze',
  fieldMap = { textField: 'Text', extraField: 'Back Extra' },
}) {
  const deckName = deck || config.ankiDeck;
  const fields = buildClozeNoteFields({ text, extra, fieldMap });

  return ankiConnect('addNote', {
    note: {
      deckName,
      modelName,
      fields,
      options: {
        allowDuplicate: false,
      },
      tags,
    },
  });
}

/**
 * Get available note types
 */
export async function getNoteTypes() {
  return ankiConnect('modelNames');
}

/**
 * Get fields for a note type
 */
export async function getNoteFields(modelName) {
  return ankiConnect('modelFieldNames', { modelName });
}

export async function getNoteStyling(modelName) {
  return ankiConnect('modelStyling', { modelName });
}

export async function updateNoteStyling(modelName, css) {
  return ankiConnect('updateModelStyling', {
    model: {
      name: modelName,
      css,
    },
  });
}

export function getConfiguredDerDieDeckNoteTypes() {
  return Array.from(new Set([
    config.ankiNoteType,
    config.wordNoteType || PICTURE_WORD_MODEL,
    config.grammarNoteType || 'Cloze',
  ].filter(Boolean)));
}

export async function ensureDerDieDeckStyling({
  modelNames = getConfiguredDerDieDeckNoteTypes(),
  dryRun = false,
} = {}) {
  const availableModels = await getNoteTypes();
  const results = [];

  for (const modelName of modelNames) {
    if (!availableModels.includes(modelName)) {
      results.push({ modelName, status: 'missing' });
      continue;
    }

    const styling = await getNoteStyling(modelName);
    const currentCss = styling?.css || '';
    const nextCss = mergeDerDieDeckStyles(currentCss);

    if (hasCurrentDerDieDeckStyles(currentCss)) {
      results.push({ modelName, status: 'current' });
      continue;
    }

    if (!dryRun) {
      await updateNoteStyling(modelName, nextCss);
    }

    results.push({
      modelName,
      status: dryRun ? 'would-update' : 'updated',
    });
  }

  return results;
}

export async function updateNoteFields(noteId, fields) {
  return ankiConnect('updateNoteFields', {
    note: {
      id: noteId,
      fields,
    },
  });
}

export async function suspendCards(cardIds) {
  if (!cardIds.length) {
    return null;
  }

  return ankiConnect('suspend', { cards: cardIds });
}

/**
 * Normalize German text for comparison
 */
function normalizeGerman(text) {
  return normalizeGermanForCompare(text);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity percentage (0-100)
 */
function similarity(a, b) {
  const normA = normalizeGerman(a);
  const normB = normalizeGerman(b);
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 100;
  const dist = levenshtein(normA, normB);
  return Math.round((1 - dist / maxLen) * 100);
}

/**
 * Strip Anki field markup down to plain-text lines.
 */
function extractFieldLines(field) {
  return field
    .replace(/\[sound:[^\]]+\]/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(small|b|i)>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Extract searchable text candidates from a note.
 * Current cards often keep the German sentence on the back, not the front.
 */
function extractSearchableText(note) {
  const front = note.fields.Front?.value || '';
  const back = note.fields.Back?.value || '';

  const lines = [...extractFieldLines(front), ...extractFieldLines(back)];

  return lines.filter((line) => {
    if (!line) return false;
    if (line === 'Antworte') return false;
    if (/^(💬\s*)?тво[йе]\s+ответ\b/i.test(line)) return false;
    if (/^ответь\s+по-немецки\b/i.test(line)) return false;
    if (/^это\s+ответ\s+собеседнику\b/i.test(line)) return false;
    if (/^(🗣\s*)?скажи\s+по-немецки\b/i.test(line)) return false;
    if (/^передай\s+это\s+по-немецки\b/i.test(line)) return false;
    if (/^это\s+перевод\s+в\s+немецкую\s+фразу\b/i.test(line)) return false;
    if (/^(🧭\s*)?подсказка:/i.test(line)) return false;
    if (line.startsWith('Context:')) return false;
    if (line.startsWith('Contrast:')) return false;
    if (/^\[.*\]$/.test(line)) return false; // IPA-only line
    return true;
  });
}

function extractWordMetadataFromSentenceNote(note) {
  const embedded = parseWordMetadataComment(extractAllFieldValues(note));
  if (embedded) {
    return embedded;
  }

  const tags = Array.isArray(note.tags) ? note.tags : [];
  const lexicalTag = tags.find((tag) => /^word-(noun|adjective|adverb|verb|preposition|conjunction|subjunction|pronoun|determiner|particle|numeral|interjection)$/i.test(tag)) || null;
  const canonicalTag = tags.find((tag) => /^canonical-/i.test(tag)) || null;
  const lemmaTag = tags.find((tag) => /^lemma-/i.test(tag)) || null;

  if (!lexicalTag && !canonicalTag && !lemmaTag) {
    return null;
  }

  return {
    lexicalType: lexicalTag ? lexicalTag.replace(/^word-/i, '') : null,
    canonical: canonicalTag ? canonicalTag.replace(/^canonical-/i, '').replace(/-/g, ' ') : null,
    lemma: lemmaTag ? lemmaTag.replace(/^lemma-/i, '').replace(/-/g, ' ') : null,
    meaning: null,
  };
}

function extractAllFieldValues(note) {
  return Object.values(note.fields || {})
    .map((field) => field?.value || '')
    .join(' ');
}

function extractGrammarMetadataFromNote(note) {
  const embedded = parseGrammarMetadataComment(extractAllFieldValues(note));
  if (embedded) {
    return embedded;
  }

  const tags = Array.isArray(note.tags) ? note.tags : [];
  const familyTag = tags.find((tag) => /^grammar-family-/i.test(tag)) || null;
  const lemmaTag = tags.find((tag) => /^grammar-lemma-/i.test(tag)) || null;
  const slotTag = tags.find((tag) => /^grammar-slot-/i.test(tag)) || null;
  const surfaceTag = tags.find((tag) => /^grammar-surface-/i.test(tag)) || null;

  if (!familyTag && !lemmaTag && !slotTag && !surfaceTag) {
    return null;
  }

  return {
    familyId: familyTag ? familyTag.replace(/^grammar-family-/i, '').replace(/-/g, ' ') : null,
    lemma: lemmaTag ? lemmaTag.replace(/^grammar-lemma-/i, '').replace(/-/g, ' ') : null,
    slotId: slotTag ? slotTag.replace(/^grammar-slot-/i, '').replace(/-/g, '-') : null,
    surfaceForm: surfaceTag ? surfaceTag.replace(/^grammar-surface-/i, '').replace(/-/g, ' ') : null,
  };
}

/**
 * Find similar cards in the deck
 * @param {string} germanText - German text to search for
 * @param {number} threshold - Minimum similarity percentage (default: 70)
 * @returns {Promise<Array<{german: string, similarity: number}>>}
 */
export async function findSimilarCards(germanText, threshold = 70) {
  // Get all notes with yt2anki tag
  const noteIds = await ankiConnect('findNotes', {
    query: `tag:yt2anki`,
  });

  if (noteIds.length === 0) {
    return [];
  }

  // Get note info
  const notes = await ankiConnect('notesInfo', { notes: noteIds });

  const similar = [];

  for (const note of notes) {
    const candidates = extractSearchableText(note);
    if (candidates.length === 0) continue;

    let bestMatch = null;
    for (const candidate of candidates) {
      const sim = similarity(germanText, candidate);
      if (!bestMatch || sim > bestMatch.similarity) {
        bestMatch = { german: candidate, similarity: sim };
      }
    }

    if (bestMatch && bestMatch.similarity >= threshold) {
      similar.push({
        german: bestMatch.german,
        similarity: bestMatch.similarity,
      });
    }
  }

  // Sort by similarity descending
  similar.sort((a, b) => b.similarity - a.similarity);

  return similar;
}

export async function findWordDuplicates({
  canonical,
  meaning,
  lexicalType = null,
  modelName = config.wordNoteType || PICTURE_WORD_MODEL,
}) {
  const noteIds = await ankiConnect('findNotes', {
    query: `note:"${modelName}"`,
  });

  if (noteIds.length === 0) {
    return { exactMatches: [], headwordMatches: [] };
  }

  const notes = await ankiConnect('notesInfo', { notes: noteIds });
  const normalizedCanonical = normalizeGerman(canonical);
  const normalizedMeaning = normalizeGerman(meaning);
  const exactMatches = [];
  const headwordMatches = [];

  for (const note of notes) {
    const wordField = note.fields?.[PICTURE_WORD_FIELDS.word]?.value || '';
    const extraField = note.fields?.[PICTURE_WORD_FIELDS.extra]?.value || '';
    const existingCanonical = extractCanonicalWord(wordField, extraField);
    const existingLexicalType = extractWordLexicalType(extraField);

    if (!existingCanonical) continue;
    if (normalizeGerman(existingCanonical) !== normalizedCanonical) continue;
    if (lexicalType && existingLexicalType && existingLexicalType !== lexicalType) continue;

    const duplicate = {
      noteId: note.noteId,
      canonical: existingCanonical,
      lexicalType: existingLexicalType,
      meaning: extractWordMeaning(extraField),
    };

    if (duplicate.meaning && normalizeGerman(duplicate.meaning) === normalizedMeaning) {
      exactMatches.push(duplicate);
      continue;
    }

    headwordMatches.push(duplicate);
  }

  return { exactMatches, headwordMatches };
}

/**
 * Find existing Basic-style verb lemma notes created by the morphology package workflow.
 */
export async function findVerbLemmaDuplicates({
  infinitive,
  modelName = config.ankiNoteType,
}) {
  const normalizedInfinitive = normalizeGerman(infinitive);
  const noteIds = await ankiConnect('findNotes', {
    query: `note:"${modelName}" tag:mode-verb-lemma tag:lemma-${toTagSlug(infinitive)}`,
  });

  if (noteIds.length === 0) {
    return { exactMatches: [] };
  }

  const notes = await ankiConnect('notesInfo', { notes: noteIds });
  const exactMatches = notes
    .filter((note) => normalizeGerman(note.fields?.Front?.value || '') === normalizedInfinitive)
    .map((note) => ({
      noteId: note.noteId,
      infinitive,
    }));

  return { exactMatches };
}

export async function findVerbSentenceDuplicates({
  infinitive,
}) {
  const noteIds = await ankiConnect('findNotes', {
    query: `tag:mode-verb-sentence tag:lemma-${toTagSlug(infinitive)}`,
  });

  return {
    exactMatches: noteIds.map((noteId) => ({
      noteId,
      infinitive,
    })),
  };
}

export async function findVerbFormDuplicates({
  infinitive,
  form,
}) {
  const normalizedForm = String(form || '').trim();
  if (!normalizedForm) {
    return { exactMatches: [] };
  }

  const noteIds = await ankiConnect('findNotes', {
    query: `tag:lemma-${toTagSlug(infinitive)} tag:verb-form-${toTagSlug(normalizedForm)}`,
  });

  return {
    exactMatches: noteIds.map((noteId) => ({
      noteId,
      infinitive,
      form: normalizedForm,
    })),
  };
}

export async function findSentenceWordDuplicates({
  canonical,
  meaning = null,
  lexicalType = null,
}) {
  const noteIds = await ankiConnect('findNotes', {
    query: 'tag:mode-word-sentence',
  });

  if (noteIds.length === 0) {
    return { exactMatches: [], headwordMatches: [] };
  }

  const notes = await ankiConnect('notesInfo', { notes: noteIds });
  const normalizedCanonical = normalizeGerman(canonical);
  const normalizedMeaning = meaning ? normalizeGerman(meaning) : null;
  const exactMatches = [];
  const headwordMatches = [];

  for (const note of notes) {
    const metadata = extractWordMetadataFromSentenceNote(note);
    if (!metadata?.canonical) continue;
    if (normalizeGerman(metadata.canonical) !== normalizedCanonical) continue;
    if (lexicalType && metadata.lexicalType && metadata.lexicalType !== lexicalType) continue;

    const duplicate = {
      noteId: note.noteId,
      canonical: metadata.canonical,
      lexicalType: metadata.lexicalType,
      meaning: metadata.meaning || null,
    };

    if (normalizedMeaning && duplicate.meaning && normalizeGerman(duplicate.meaning) === normalizedMeaning) {
      exactMatches.push(duplicate);
      continue;
    }

    headwordMatches.push(duplicate);
  }

  return { exactMatches, headwordMatches };
}

/**
 * Find existing lexical Cloze notes for a canonical function word.
 */
export async function findLexicalClozeDuplicates({
  canonical,
  meaning = null,
  lexicalType = null,
}) {
  const noteIds = await ankiConnect('findNotes', {
    query: `tag:mode-lexical-cloze tag:lemma-${toTagSlug(canonical)}`,
  });

  if (noteIds.length === 0) {
    return { exactMatches: [], headwordMatches: [] };
  }

  const notes = await ankiConnect('notesInfo', { notes: noteIds });
  const normalizedCanonical = normalizeGerman(canonical);
  const normalizedMeaning = meaning ? normalizeGerman(meaning) : null;
  const exactMatches = [];
  const headwordMatches = [];

  for (const note of notes) {
    const metadata = extractWordMetadataFromSentenceNote(note);
    if (!metadata?.canonical) continue;
    if (normalizeGerman(metadata.canonical) !== normalizedCanonical) continue;
    if (lexicalType && metadata.lexicalType && metadata.lexicalType !== lexicalType) continue;

    const duplicate = {
      noteId: note.noteId,
      canonical: metadata.canonical,
      lexicalType: metadata.lexicalType,
      meaning: metadata.meaning || null,
    };

    if (normalizedMeaning && duplicate.meaning && normalizeGerman(duplicate.meaning) === normalizedMeaning) {
      exactMatches.push(duplicate);
      continue;
    }

    headwordMatches.push(duplicate);
  }

  return { exactMatches, headwordMatches };
}

export async function findGrammarDuplicates({
  familyId,
  lemma,
}) {
  const noteIds = await ankiConnect('findNotes', {
    query: `tag:mode-grammar tag:grammar-family-${toTagSlug(familyId)} tag:grammar-lemma-${toTagSlug(lemma)}`,
  });

  if (noteIds.length === 0) {
    return { exactMatches: [], lemmaMatches: [] };
  }

  const notes = await ankiConnect('notesInfo', { notes: noteIds });
  const normalizedFamily = normalizeGerman(familyId);
  const normalizedLemma = normalizeGerman(lemma);
  const lemmaMatches = [];

  for (const note of notes) {
    const metadata = extractGrammarMetadataFromNote(note);
    if (!metadata?.familyId || !metadata?.lemma || !metadata?.slotId) continue;
    if (normalizeGerman(metadata.familyId) !== normalizedFamily) continue;
    if (normalizeGerman(metadata.lemma) !== normalizedLemma) continue;

    lemmaMatches.push({
      noteId: note.noteId,
      familyId: metadata.familyId,
      lemma: metadata.lemma,
      slotId: metadata.slotId,
      slotLabel: metadata.slotLabel || null,
      surfaceForm: metadata.surfaceForm || null,
    });
  }

  return {
    exactMatches: [],
    lemmaMatches,
  };
}
