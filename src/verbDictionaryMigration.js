import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { findNotesByQuery, getNotesInfo, snapshotNote, applyNoteBackUpdates } from './anki.js';
import { parseLegacyVerbDictionary } from './cardContent/verbDictionaryMigration.js';
import { isCurrentVerbFormAnswer } from './cardContent/verbFormExplanation.js';
import { escapeHtml, stripHtml } from './cardContent/html.js';
import { explainVerbForm } from './verbFormEnricher.js';
import { buildVerbDictionaryNote } from './templates/verb/dictionary.js';
import { DERDIEDECK_SHARED_CSS } from './templates/shared/styles.js';

const PLAN_KIND = 'derdiedeck-verb-form-v1';
const uniqueName = (prefix) => `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;

export async function prepareVerbDictionaryMigration({ generate = explainVerbForm, noteIds = [], onEntry = () => {} } = {}) {
  let ids = await findNotesByQuery('tag:mode-verb-dictionary');
  if (noteIds.length) ids = ids.filter((id) => noteIds.includes(id));
  const notes = await getNotesInfo(ids);
  const entries = [];
  for (const note of notes) {
    const entry = {
      noteId: note.noteId, form: stripHtml(note.fields?.Front?.value || ''),
      original: snapshotNote(note), status: 'skipped',
    };
    if (!note.tags?.includes('mode-verb-dictionary')) {
      entry.reason = 'Dictionary tag missing';
    } else if (isCurrentVerbFormAnswer(note.fields?.Back?.value)) {
      entry.status = 'already-current';
    } else {
      let legacy;
      try {
        legacy = parseLegacyVerbDictionary(note);
      } catch (error) {
        entry.reason = error.message;
      }
      if (legacy) {
        try {
          const formExplanation = await generate(legacy);
          const rendered = buildVerbDictionaryNote({
            verbData: { infinitive: legacy.infinitive, displayForm: legacy.form },
            selectedMeaning: { russian: legacy.meaning }, formExplanation,
            infinitiveHtml: legacy.infinitiveHtml,
          });
          entry.status = 'ready';
          entry.newBack = rendered.back;
          entry.explanation = formExplanation;
        } catch (error) {
          entry.status = 'failed';
          entry.reason = error.message;
        }
      }
    }
    entries.push(entry);
    onEntry(entry);
  }
  return { kind: PLAN_KIND, createdAt: new Date().toISOString(), entries };
}

export async function saveVerbDictionaryPreview(plan, directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const name = uniqueName('preview');
  const planPath = join(directory, `${name}.json`);
  const htmlPath = join(directory, `${name}.html`);
  const showAudio = (html) => html.replace(/\[sound:[^\[\]<>\r\n]+\]/g,
    '<span class="preview-audio">▶ Аудио инфинитива (в Anki)</span>');
  const cards = plan.entries.map((entry) => {
    // Only render the known legacy template and our generated template as HTML.
    let oldAnswer = `<pre>${escapeHtml(entry.original.fields.Back || '')}</pre>`;
    if (entry.status === 'ready') oldAnswer = showAudio(entry.original.fields.Back);
    return `<section><h2>${escapeHtml(entry.form)} · ${entry.noteId}</h2><p>${escapeHtml(entry.status)} ${escapeHtml(entry.reason || '')}</p>
      <div class="comparison"><article><h3>Old answer</h3><div class="card">${oldAnswer}</div></article>
      <article><h3>Proposed answer</h3><div class="card">${showAudio(entry.newBack || 'No change')}</div></article></div></section>`;
  }).join('\n');
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Verb form migration preview</title><style>${DERDIEDECK_SHARED_CSS}
    body{font-family:Arial,sans-serif;margin:24px;background:#f1f5f9;color:#111827}section{margin:32px 0}
    .comparison{display:grid;grid-template-columns:1fr 1fr;gap:20px}article{min-width:0}
    .card{background:white;padding:24px;border-radius:12px;text-align:center;font-size:22px;overflow-wrap:anywhere}
    .preview-audio{font-size:.8em;color:#475569}
    pre{white-space:pre-wrap;font-size:14px}@media(max-width:700px){.comparison{grid-template-columns:1fr}.card{font-size:20px}}
    </style><h1>Verb form migration preview</h1><p>Read-only preview. Only Back will change; note and card identities remain intact.</p>${cards}</html>`;
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  await writeFile(htmlPath, html, { flag: 'wx', mode: 0o600 });
  return { planPath, htmlPath };
}

export async function runVerbDictionaryMigration(options = {}) {
  const output = resolve(options.output || join(homedir(), '.derdiedeck', 'migrations'));
  const logResult = (entry) => console.log(`${entry.noteId} ${entry.form || ''}: ${entry.status}${entry.reason ? ` — ${entry.reason}` : ''}`);
  if (options.apply) {
    const plan = JSON.parse(await readFile(resolve(options.apply), 'utf8'));
    if (plan.kind !== PLAN_KIND || !Array.isArray(plan.entries)) throw new Error('Unsupported migration plan');
    const backupPath = options.backup ? resolve(options.backup) : join(output, `${uniqueName('backup')}.json`);
    const results = await applyNoteBackUpdates(plan.entries, {
      saveBackup: async (backup) => {
        await mkdir(dirname(backupPath), { recursive: true, mode: 0o700 });
        await writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
        console.log(`Backup: ${backupPath}`);
      },
      onResult: logResult,
    });
    await mkdir(output, { recursive: true, mode: 0o700 });
    const resultPath = join(output, `${uniqueName('result')}.json`);
    await writeFile(resultPath, `${JSON.stringify(results, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    console.log(`Results: ${resultPath}`);
    if (results.some((entry) => entry.status === 'failed')) process.exitCode = 1;
    return { results, backupPath, resultPath };
  }
  const noteIds = (options.noteId || []).map(Number);
  if (noteIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) throw new Error('Invalid --note-id');
  const plan = await prepareVerbDictionaryMigration({ noteIds, onEntry: (entry) => {
    logResult(entry);
    if (entry.status === 'ready') {
      console.log(`  Old: ${stripHtml(entry.original.fields.Back)}`);
      console.log(`  Proposed: ${stripHtml(entry.newBack)}`);
    }
  } });
  const files = await saveVerbDictionaryPreview(plan, output);
  console.log(`Preview: ${files.htmlPath}\nPlan: ${files.planPath}`);
  console.log(`Apply this reviewed plan: node src/index.js migrate-verb-dictionary --apply "${files.planPath}"`);
  if (plan.entries.some((entry) => entry.status === 'failed')) process.exitCode = 1;
  return { plan, ...files };
}
