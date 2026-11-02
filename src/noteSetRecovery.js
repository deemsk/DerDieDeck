import { readFile, rename, unlink, open, link } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

function stepTag(operationId, stepId) {
  return `ddd-op-${operationId}-step-${stepId}`;
}

function validIdentifier(value) {
  return typeof value === 'string' && /^[a-z0-9]+$/.test(value);
}

async function writeAtomic(path, journal, createOnly = false) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  let file;
  try {
    file = await open(temporary, 'wx', 0o600);
    await file.writeFile(JSON.stringify(journal, null, 2));
    await file.sync();
    await file.close();
    file = null;
    if (createOnly) await link(temporary, path);
    else await rename(temporary, path);
    const directory = await open(dirname(path), 'r');
    try { await directory.sync(); } finally { await directory.close(); }
  } finally {
    if (file) await file.close();
    await unlink(temporary).catch(() => {});
  }
}

export async function createNoteSetJournal(path, { operationId, collectionId, steps }) {
  if (!validIdentifier(operationId) || typeof collectionId !== 'string' || !collectionId.trim() ||
      !Array.isArray(steps) || !steps.length || steps.some(step => !validIdentifier(step.id)) ||
      new Set(steps.map(step => step.id)).size !== steps.length) throw new Error('Invalid note set plan');
  const journal = { version: 1, operationId, collectionId, steps: steps.map(step => ({ id: step.id, kind: step.kind, payload: step.payload, allowExistingDuplicate: step.allowExistingDuplicate === true, noteId: null })) };
  await writeAtomic(path, journal, true);
  return journal;
}

export async function resumeNoteSet(path, { collectionId, find, create }) {
  // A database transaction holds the lock in this process; the OS releases
  // it on a crash. The database file must remain in place between attempts.
  const lock = new DatabaseSync(`${path}.lock.sqlite`);
  try {
    lock.exec('PRAGMA busy_timeout = 0; BEGIN IMMEDIATE');
  } catch (error) {
    lock.close();
    if (error.code === 'ERR_SQLITE_ERROR' && /locked|busy/i.test(error.message)) {
      throw new Error('A recovery lock is active.');
    }
    throw error;
  }
  try {
    const journal = JSON.parse(await readFile(path, 'utf8'));
    if (journal.version !== 1 || !validIdentifier(journal.operationId) || !Array.isArray(journal.steps) ||
        journal.steps.length === 0 || journal.steps.some(step => !validIdentifier(step.id)) ||
        new Set(journal.steps.map(step => step.id)).size !== journal.steps.length) throw new Error('Invalid note set journal');
    const verifyCollection = async () => {
      const active = typeof collectionId === 'function' ? await collectionId() : collectionId;
      if (!active || journal.collectionId !== active) throw new Error('Anki collection does not match the saved plan');
    };
    await verifyCollection();
    for (const step of journal.steps) {
      if (step.status === 'existing-duplicate' && step.allowExistingDuplicate) continue;
      await verifyCollection();
      const tag = stepTag(journal.operationId, step.id);
      const matches = await find(tag);
      if (!Array.isArray(matches)) throw new Error(`Cannot reconcile ${step.id}`);
      if (matches.length > 1) throw new Error(`Multiple notes for ${step.id}: ${matches.join(', ')}`);
      if (matches.length === 1) {
        if (step.noteId != null && step.noteId !== matches[0]) throw new Error(`Conflicting note ID for ${step.id}`);
        step.noteId = matches[0];
        await writeAtomic(path, journal);
        continue;
      }
      if (step.noteId != null) throw new Error(`Previously confirmed note for ${step.id} is missing`);
      await verifyCollection();
      let noteId;
      try {
        noteId = await create(step, tag);
      } catch (error) {
        if (!step.allowExistingDuplicate || error.code !== 'anki-note-duplicate') throw error;
        step.status = 'existing-duplicate';
        await writeAtomic(path, journal);
        continue;
      }
      if (!Number.isSafeInteger(noteId) || noteId <= 0) throw new Error(`Invalid note ID for ${step.id}`);
      step.noteId = noteId;
      await writeAtomic(path, journal);
    }
    return journal;
  } finally {
    try { lock.exec('ROLLBACK'); } finally { lock.close(); }
  }
}
