import { readFile, mkdir, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRecoveryMarker, verifyRecoveryMarker, findNotesByQuery, buildRecoverableNote, createPreparedNote, recoveryMediaExists } from './anki.js';
import { createNoteSetJournal, resumeNoteSet } from './noteSetRecovery.js';

export async function startNoteSet(path, { operationId, steps }) {
  if (!steps.every(step => ['basic', 'sentence'].includes(step.kind))) throw new Error('Unsupported note set step');
  const prepared = steps.map(step => {
    const note = buildRecoverableNote(step.kind, step.payload);
    const text = JSON.stringify(note);
    const media = [...text.matchAll(/\[sound:([^\]]+)\]/g)].map(match => match[1]);
    for (const filename of [step.payload.audioFilename, step.payload.imageFilename]) {
      if (filename) media.push(filename);
    }
    return { id: step.id, kind: 'prepared', payload: { note, media: [...new Set(media)] } };
  });
  const marker = await createRecoveryMarker(operationId);
  await createNoteSetJournal(path, { operationId, collectionId: JSON.stringify(marker), steps: prepared });
  return resumeSavedNoteSet(path);
}

export async function resumeSavedNoteSet(path) {
  const journal = JSON.parse(await readFile(path, 'utf8'));
  let marker;
  try { marker = JSON.parse(journal.collectionId); } catch { throw new Error('Invalid recovery collection marker'); }
  return resumeNoteSet(path, {
    collectionId: async () => await verifyRecoveryMarker(marker) ? JSON.stringify(marker) : null,
    find: (tag) => findNotesByQuery(`tag:${tag}`),
    create: async (step, tag) => {
      if (step.kind !== 'prepared' || !step.payload?.note || !Array.isArray(step.payload.media)) {
        throw new Error(`Unsupported note set step: ${step.kind}`);
      }
      for (const filename of step.payload.media) {
        if (!(await recoveryMediaExists(filename))) throw new Error(`Required Anki media is unavailable: ${filename}`);
      }
      const note = step.payload.note;
      return createPreparedNote({ ...note, tags: [...(note.tags || []), tag] });
    },
  });
}

export const recoveryDirectory = () => join(homedir(), '.derdiedeck', 'recovery');

export async function listIncompleteNoteSets(directory = recoveryDirectory()) {
  let names;
  try { names = await readdir(directory); } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const results = [];
  for (const name of names.filter(name => name.endsWith('.json')).sort()) {
    const path = join(directory, name);
    try {
      const journal = JSON.parse(await readFile(path, 'utf8'));
      if (Array.isArray(journal.steps) && journal.steps.some(step => step.noteId == null)) {
        results.push({ operationId: journal.operationId, path });
      }
    } catch {
      results.push({ operationId: 'unreadable', path });
    }
  }
  return results;
}

export async function startWordNoteSet(steps) {
  const operationId = randomUUID().replaceAll('-', '');
  const directory = recoveryDirectory();
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, `${operationId}.json`);
  try {
    return await startNoteSet(path, { operationId, steps });
  } catch (error) {
    let journal;
    try { journal = JSON.parse(await readFile(path, 'utf8')); } catch { throw error; }
    const saved = journal.steps.filter(step => step.noteId != null).map(step => `${step.id}: nid:${step.noteId}`).join(', ');
    const failure = new Error(`Card set could not be completed: ${error.message}.${saved ? ` Confirmed notes: ${saved}.` : ''} A failed write may have succeeded. To resume the approved set, run: npm run resume -- "${path}"`);
    failure.code = 'partial-note-write';
    throw failure;
  }
}
