import OpenAI from 'openai';
import { config } from './lib/config.js';
import { resolveSecret } from './lib/secrets.js';
import { OPENAI_MODEL_ROLES, withOpenAIModel } from './lib/openaiModels.js';
import { stripHtml } from './cardContent/html.js';
import { normalizeLexicalType } from './cardContent/lexicalTypes.js';
import { normalizeGermanForCompare, toTagSlug } from './cardContent/german.js';
import { jsonSchemaResponse, strictObject } from './lib/openaiSchemas.js';

export async function lookupExisting(word, { signal } = {}) {
  const { findWordDuplicates, findVerbLemmaDuplicates, findVerbSentenceDuplicates, findNotesByQuery, getNotesInfo } = await import('./anki.js');
  const canonical = word.lemma || word.canonical;
  const targets = [word.canonical];
  if (word.lemma && normalizeGermanForCompare(word.lemma) !== normalizeGermanForCompare(word.canonical)) targets.push(word.lemma);
  const results = await Promise.all(targets.map(target => findWordDuplicates({ canonical: target, lexicalType: word.lexicalType, ...(signal ? { signal } : {}) })));
  const existing = results.flatMap((result, index) => [...result.exactMatches, ...result.headwordMatches].map(item => ({
    ...item, ...(index > 0 ? { sourceForm: targets[index] } : {}),
  }))).filter(item =>
    !item.lexicalType || !word.lexicalType || normalizeLexicalType(item.lexicalType) === normalizeLexicalType(word.lexicalType));
  const missingIds = [...new Set(existing.filter(item => item.noteId && !item.meaning).map(item => item.noteId))];
  if (missingIds.length) {
    const notes = await (signal ? getNotesInfo(missingIds, { signal }) : getNotesInfo(missingIds));
    const byId = new Map(notes.map(note => [note.noteId, note]));
    for (const item of existing) {
      if (item.meaning || !byId.has(item.noteId)) continue;
      const note = byId.get(item.noteId);
      const fields = ['Back', 'Text', 'Back Extra', 'Extra'].map(name => note.fields?.[name]?.value || '');
      const context = stripHtml(fields.join(' ').replace(/\[sound:[^\]]+\]/gi, ' ')).slice(0, 600);
      if (context) item.meaning = `Card context (not a standalone gloss): ${context}`;
    }
  }
  if (word.lexicalType === 'verb') {
    const escapeSearch = text => String(text || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const [lemma, sentences, dictionaryIds, legacyIds] = await Promise.all([
      findVerbLemmaDuplicates({ infinitive: canonical, ...(signal ? { signal } : {}) }), findVerbSentenceDuplicates({ infinitive: canonical, ...(signal ? { signal } : {}) }),
      ...(signal ? [
        findNotesByQuery(`tag:mode-verb-dictionary tag:lemma-${toTagSlug(canonical)}`, { signal }),
        findNotesByQuery(`note:"${escapeSearch(config.ankiNoteType)}" "${escapeSearch(canonical)}"`, { signal }),
      ] : [
        findNotesByQuery(`tag:mode-verb-dictionary tag:lemma-${toTagSlug(canonical)}`),
        findNotesByQuery(`note:"${escapeSearch(config.ankiNoteType)}" "${escapeSearch(canonical)}"`),
      ]),
    ]);
    const taggedIds = new Set([...lemma.exactMatches, ...sentences.exactMatches].map(item => item.noteId).concat(dictionaryIds));
    const ids = [...new Set([...taggedIds, ...legacyIds])];
    for (const note of await (signal ? getNotesInfo(ids, { signal }) : getNotesInfo(ids))) {
      const front = stripHtml(String(note.fields?.Front?.value || '').replace(/\[sound:[^\]]+\]/gi, ' '));
      if (!taggedIds.has(note.noteId) && normalizeGermanForCompare(front) !== normalizeGermanForCompare(canonical)) continue;
      existing.push({ noteId: note.noteId, meaning: stripHtml(note.fields?.Back?.value || '').slice(0, 600) });
    }
  }
  const unique = new Map();
  for (const item of existing) {
    if (!item.noteId || !item.meaning || unique.has(item.noteId)) continue;
    unique.set(item.noteId, { noteId: item.noteId, meaning: item.meaning, ...(item.sourceForm ? { sourceForm: item.sourceForm } : {}) });
  }
  return [...unique.values()];
}

async function assessMeanings(word, existing, { signal } = {}) {
  const apiKey = await resolveSecret(config.openaiApiKey || process.env.OPENAI_API_KEY, { timeoutMs: 5000, signal });
  signal?.throwIfAborted();
  if (!apiKey) throw new Error('Meaning assessment unavailable');
  const client = new OpenAI({ apiKey, timeout: 8000, maxRetries: 0 });
  const schema = strictObject({
    groups: { type: 'array', items: { type: 'array', items: { type: 'integer' } } },
    existing: { type: 'array', items: strictObject({ group: { type: 'integer' }, noteId: { type: 'integer' }, confidence: { type: 'string', enum: ['high', 'possible'] } }) },
    commonGroup: { type: ['integer', 'null'] }, recommendedGroup: { type: ['integer', 'null'] },
    reason: { type: ['string', 'null'] },
  });
  const response = await client.chat.completions.create(withOpenAIModel(OPENAI_MODEL_ROLES.validation, {
    messages: [
      { role: 'system', content: 'Evaluate German lexical senses for a Russian learner. Return JSON only: {"groups":[[0]],"existing":[{"group":0,"noteId":123,"confidence":"high"}],"commonGroup":0,"recommendedGroup":0,"reason":"..."}. Every zero-based candidate index must appear exactly once. Merge indices ONLY when unequivocally identical senses, preserving distinct usages and constructions. Match an existing note ONLY when its gloss and context support the same sense; use confidence high or possible. A sourceForm identifies an existing lemma, not the requested form: consider related lexical sense while preserving the distinct grammatical degree of the form or usage. commonGroup is your best estimate, not measured frequency; use null when uncertain. If a confidently existing common sense has an unrepresented alternative, recommend the alternative; otherwise recommend the likely common sense only when well supported. Use null for uncertain recommendations. Write reason briefly in English. Never invent note IDs.' },
      { role: 'user', content: JSON.stringify({ word: word.canonical, lexicalType: word.lexicalType, meanings: word.meanings, existing }) },
    ],
    response_format: jsonSchemaResponse('meaning_selection', schema),
  }), { signal });
  return JSON.parse(response.choices[0].message.content);
}

async function withTimeout(operation, timeoutMs) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation({ signal: controller.signal })),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error('Meaning guidance timed out');
          controller.abort(error);
          reject(error);
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    if (!controller.signal.aborted) controller.abort();
  }
}

export async function buildMeaningGuidance({ word, lookup = lookupExisting, assess = assessMeanings, timeoutMs = 8000 }) {
  const meanings = Array.isArray(word.meanings) ? word.meanings : [];
  let existing = [], collectionAvailable = true;
  try { existing = await withTimeout(options => lookup(word, options), timeoutMs); } catch { collectionAvailable = false; }
  const fallback = { options: meanings.map(meaning => ({ meaning, status: 'unknown', noteIds: [] })), recommendedIndex: null, collectionAvailable, reason: null, assessmentAvailable: false };
  if (!collectionAvailable) return fallback;
  try {
    const result = await withTimeout(options => assess(word, existing, options), timeoutMs);
    const groups = result.groups;
    if (!Array.isArray(groups) || groups.some(group => !Array.isArray(group) || !group.length)) return fallback;
    const indices = groups.flat();
    if (indices.length !== meanings.length || new Set(indices).size !== meanings.length || indices.some(index => !Number.isInteger(index) || index < 0 || index >= meanings.length)) return fallback;
    const noteIds = new Set(existing.map(item => item.noteId));
    const options = groups.map((group, index) => {
      const matches = collectionAvailable && Array.isArray(result.existing) ? result.existing.filter(match => match.group === index && noteIds.has(match.noteId)) : [];
      const high = matches.filter(match => match.confidence === 'high');
      const possible = matches.filter(match => match.confidence === 'possible');
      return { meaning: { ...meanings[group[0]], russian: [...new Set(group.map(i => meanings[i].russian).filter(Boolean))].join('; '), duplicateMeanings: [...new Set(group.map(i => meanings[i].russian).filter(Boolean))], imageSearchTerms: [...new Set(group.flatMap(i => meanings[i].imageSearchTerms || []))] }, status: high.length ? 'existing' : possible.length ? 'possible' : 'unknown', noteIds: [...new Set([...high, ...possible].map(match => match.noteId))], evidence: existing.filter(item => [...high, ...possible].some(match => match.noteId === item.noteId)) };
    });
    const common = result.commonGroup;
    const proposed = result.recommendedGroup;
    const validCommon = Number.isInteger(common) && common >= 0 && common < options.length;
    const validProposed = Number.isInteger(proposed) && proposed >= 0 && proposed < options.length;
    const justified = validCommon && validProposed && (common === proposed || options[common].status === 'existing');
    const recommendedIndex = collectionAvailable && justified && groups[proposed].length === 1 && options[proposed].status === 'unknown' ? proposed : null;
    return { options, originals: groups.some(group => group.length > 1) ? meanings : null, recommendedIndex, collectionAvailable, reason: typeof result.reason === 'string' ? `Model estimate: ${result.reason}` : null, assessmentAvailable: true };
  } catch { return fallback; }
}
