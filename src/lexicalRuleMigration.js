import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { findNotesByQuery, getNotesInfo, snapshotNote, applyLexicalRuleUpdates } from './anki.js';
import { parseLexicalClozeRule, replaceLexicalClozeRule } from './cardContent/lexicalRuleMigration.js';
import { explainLexicalCloze } from './lexicalRuleEnricher.js';
import { escapeHtml } from './cardContent/html.js';

const PLAN_KIND = 'derdiedeck-lexical-rule-v1';
const uniqueName = (prefix) => `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;

export async function prepareLexicalRuleMigration({ generate = explainLexicalCloze, noteIds = [], onEntry = () => {} } = {}) {
  let ids = await findNotesByQuery('tag:mode-lexical-cloze');
  if (noteIds.length) ids = ids.filter((id) => noteIds.includes(id));
  const notes = await getNotesInfo(ids);
  const entries = [];
  for (const note of notes) {
    const entry = { noteId: note.noteId, original: snapshotNote(note), status: 'skipped' };
    let parsed;
    try {
      parsed = parseLexicalClozeRule(note);
    } catch (error) {
      entry.reason = error.message;
    }
    if (parsed) {
      const { canonical, target, lexicalType, meaning, sentence, existingHint, extraField } = parsed;
      Object.assign(entry, { canonical, target, sentence, oldExplanation: existingHint, extraField });
      try {
        const explanation = await generate({ canonical, target, lexicalType, meaning, sentence, existingHint });
        const newExtra = explanation === existingHint
          ? note.fields[extraField].value : replaceLexicalClozeRule(note, explanation);
        Object.assign(entry, { explanation, newExtra,
          status: newExtra === note.fields[extraField].value ? 'unchanged' : 'ready' });
      } catch (error) {
        entry.status = 'failed';
        entry.reason = error.message;
      }
    }
    entries.push(entry);
    onEntry(entry);
  }
  return { kind: PLAN_KIND, createdAt: new Date().toISOString(), entries };
}

export async function saveLexicalRulePreview(plan, directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const name = uniqueName('lexical-preview');
  const planPath = join(directory, `${name}.json`);
  const htmlPath = join(directory, `${name}.html`);
  const cards = plan.entries.map((entry) => `<section>
    <h2>${escapeHtml(entry.target || '')} · ${escapeHtml(entry.noteId)}</h2>
    <p>${escapeHtml(entry.status)} ${escapeHtml(entry.reason || '')}</p>
    <p lang="de"><strong>${escapeHtml(entry.sentence || '')}</strong></p>
    <div class="comparison"><article><h3>Old explanation</h3><p>${escapeHtml(entry.oldExplanation ?? 'No rule')}</p></article>
    <article><h3>Proposed explanation</h3><p>${escapeHtml(['ready', 'unchanged'].includes(entry.status) ? (entry.explanation ?? 'No rule') : 'No change')}</p></article></div>
    </section>`).join('\n');
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Lexical rule migration preview</title><style>
    body{font-family:system-ui,sans-serif;margin:24px;background:#f1f5f9;color:#111827}section{margin:32px 0}
    .comparison{display:grid;grid-template-columns:1fr 1fr;gap:20px}article{background:white;padding:24px;border-radius:12px;min-width:0}
    p{font-size:20px;line-height:1.5;overflow-wrap:anywhere}h3{margin-top:0}
    @media(max-width:700px){.comparison{grid-template-columns:1fr}}
    </style><h1>Lexical rule migration preview</h1><p>Read-only preview. Only the rule block will change.</p>${cards}</html>`;
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  await writeFile(htmlPath, html, { flag: 'wx', mode: 0o600 });
  return { planPath, htmlPath };
}

export async function runLexicalRuleMigration(options = {}) {
  const output = resolve(options.output || join(homedir(), '.derdiedeck', 'migrations'));
  const logResult = (entry) => console.log(`${entry.noteId} ${entry.target || ''}: ${entry.status}${entry.reason ? ` — ${entry.reason}` : ''}`);
  if (options.apply) {
    const plan = JSON.parse(await readFile(resolve(options.apply), 'utf8'));
    if (plan.kind !== PLAN_KIND || !Array.isArray(plan.entries)) throw new Error('Unsupported migration plan');
    const backupPath = options.backup ? resolve(options.backup) : join(output, `${uniqueName('lexical-backup')}.json`);
    const results = await applyLexicalRuleUpdates(plan.entries, {
      saveBackup: async (backup) => {
        await mkdir(dirname(backupPath), { recursive: true, mode: 0o700 });
        await writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
        console.log(`Backup: ${backupPath}`);
      }, onResult: logResult,
    });
    await mkdir(output, { recursive: true, mode: 0o700 });
    const resultPath = join(output, `${uniqueName('lexical-result')}.json`);
    await writeFile(resultPath, `${JSON.stringify(results, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    console.log(`Results: ${resultPath}`);
    if (results.some((entry) => entry.status === 'failed')) process.exitCode = 1;
    return { results, backupPath, resultPath };
  }
  const noteIds = (options.noteId || []).map(Number);
  if (noteIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) throw new Error('Invalid --note-id');
  const plan = await prepareLexicalRuleMigration({ noteIds, onEntry: logResult });
  const files = await saveLexicalRulePreview(plan, output);
  console.log(`Preview: ${files.htmlPath}\nPlan: ${files.planPath}`);
  console.log(`Apply this reviewed plan: node src/index.js migrate-lexical-rules --apply "${files.planPath}"`);
  if (plan.entries.some((entry) => entry.status === 'failed')) process.exitCode = 1;
  return { plan, ...files };
}
