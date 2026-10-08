import { jest } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildWordMetadataComment } from '../src/cardContent/wordMetadata.js'
import { parseLexicalClozeRule, replaceLexicalClozeRule } from '../src/cardContent/lexicalRuleMigration.js'
import { prepareLexicalRuleMigration, saveLexicalRulePreview } from '../src/lexicalRuleMigration.js'
import { applyLexicalRuleUpdates, snapshotNote } from '../src/anki.js'

const oldRule = '<div class="ddd-cloze-pattern"><b>Правило:</b> Наречие: его смысл и область действия определяются позицией и контекстом.</div>'
const newHint = 'je … desto … — чем …, тем …; mehr и besser — сравнительные формы.'
const newRule = `<div class="ddd-cloze-pattern"><b>Правило:</b> ${newHint}</div>`
const extra = '<div class="ddd-answer-stack">\n<div class="ddd-answer-ipa"><span class="yt2anki-ipa ddd-ipa">[jeː]</span></div>\n<div class="ddd-answer-translation">Чем больше ты тренируешься, тем лучше становишься.</div>\n<div class="ddd-answer-extra"><div class="ddd-cloze-context">je · наречие</div>' + oldRule + '</div>\n</div>' + buildWordMetadataComment({ canonical: 'je', lemma: 'je', lexicalType: 'adverb', meaning: 'чем', contrast: null, patternFamily: 'adverb' })
const makeNote = (id = 1, value = extra, extraField = 'Back Extra') => ({
  noteId: id, profile: 'User 1', modelName: 'Cloze', cards: [id + 100],
  tags: ['yt2anki', 'mode-lexical-cloze', 'lemma-je', 'canonical-je', 'word-form-je'],
  fields: { Text: { value: '[sound:je.mp3]<br>{{c1::Je::чем}} mehr du übst, desto besser wirst du.' },
    [extraField]: { value }, Custom: { value: 'keep this' } },
})
const originalFetch = global.fetch
afterEach(() => { global.fetch = originalFetch })

function fakeAnki(notes, { failId, noSave = false } = {}) {
  const requests = []
  global.fetch = async (_url, options) => {
    const req = JSON.parse(options.body)
    requests.push(req)
    let result = null
    if (req.action === 'findNotes') result = notes.map((note) => note.noteId)
    else if (req.action === 'notesInfo') result = req.params.notes.map((id) => notes.find((note) => note.noteId === id) || {})
    else if (req.action === 'updateNoteFields') {
      const { id, fields } = req.params.note
      if (id === failId) return { json: async () => ({ result: null, error: 'write failed' }) }
      if (!noSave) for (const [name, value] of Object.entries(fields)) notes.find((note) => note.noteId === id).fields[name].value = value
    } else throw new Error(`Unexpected Anki action ${req.action}`)
    return { json: async () => ({ result, error: null }) }
  }
  return requests
}

test.each(['Back Extra', 'Extra'])('extracts final context and replaces only the rule in %s', (field) => {
  const note = makeNote(1, extra, field)
  expect(parseLexicalClozeRule(note)).toMatchObject({ extraField: field, canonical: 'je', target: 'Je', meaning: 'чем', sentence: 'Je mehr du übst, desto besser wirst du.' })
  expect(replaceLexicalClozeRule(note, newHint)).toBe(extra.replace(oldRule, newRule))
  expect(replaceLexicalClozeRule(note, null)).toBe(extra.replace(oldRule, ''))
})

test('inserts a missing rule at the context boundary', () => {
  const note = makeNote(1, extra.replace(oldRule, ''))
  expect(replaceLexicalClozeRule(note, newHint)).toBe(extra.replace(oldRule, newRule))
})

test('allows a legacy empty meaning when the saved sentence and target are complete', () => {
  const note = makeNote(1, extra.replace('%22meaning%22%3A%22%D1%87%D0%B5%D0%BC%22', '%22meaning%22%3Anull'))
  expect(parseLexicalClozeRule(note)).toMatchObject({ meaning: null, target: 'Je', sentence: 'Je mehr du übst, desto besser wirst du.' })
})

test('recognizes early English Pattern labels without changing the context label', () => {
  const legacy = extra.replace(oldRule, '<div class="ddd-cloze-pattern"><b>Pattern:</b> An adverb depends on context.</div>').replace('je · наречие', 'je · adverb')
  expect(replaceLexicalClozeRule(makeNote(1, legacy), newHint)).toContain('je · adverb</div>' + newRule)
})

test.each([
  (note) => { note.tags = [] },
  (note) => { note.fields.Text.value += ' {{c2::auch}}' },
  (note) => { note.fields.Text.value = '<script>bad()</script>{{c1::Je}} mehr du übst.' },
  (note) => { note.fields['Back Extra'].value = extra.replace(oldRule, oldRule + oldRule) },
  (note) => { note.fields['Back Extra'].value = extra.replace(oldRule, '<p>Custom explanation</p>') },
  (note) => { note.fields['Back Extra'].value = extra.replace('je · наречие', 'weil · союз') },
  (note) => { note.tags.push('word-form-weil') },
])('rejects ambiguous or unrecognized notes instead of rebuilding them', (change) => {
  const note = makeNote()
  change(note)
  expect(() => parseLexicalClozeRule(note)).toThrow(/recogniz|inconsistent/i)
})

test('preview is read-only, filters IDs, records failures and preserves suitable rules', async () => {
  const notes = [makeNote(1), makeNote(2, extra.replace(oldRule, newRule)), makeNote(3), makeNote(4)]
  const requests = fakeAnki(notes)
  const contexts = []
  const generate = async (context) => {
    contexts.push(context)
    if (contexts.length === 3) throw new Error('offline')
    return newHint
  }
  const plan = await prepareLexicalRuleMigration({ noteIds: [1, 2, 3], generate })
  expect(plan.entries.map((entry) => entry.status)).toEqual(['ready', 'unchanged', 'failed'])
  expect(contexts[0]).toMatchObject({ target: 'Je', sentence: 'Je mehr du übst, desto besser wirst du.' })
  expect(plan.entries[0].newExtra).toBe(extra.replace(oldRule, newRule))
  expect(requests.every((req) => ['notesInfo', 'findNotes'].includes(req.action))).toBe(true)
  const dir = await mkdtemp(join(tmpdir(), 'ddd-lexical-'))
  try {
    const files = await saveLexicalRulePreview(plan, dir)
    expect(JSON.parse(await readFile(files.planPath, 'utf8'))).toEqual(plan)
    const html = await readFile(files.htmlPath, 'utf8')
    expect(html).toContain('Old explanation')
    expect(html).toContain(newHint)
    expect(html).toContain('Je mehr du übst, desto besser wirst du.')
  } finally { await rm(dir, { recursive: true, force: true }) }
})

async function planFor(notes, options = {}) {
  const requests = fakeAnki(notes, options)
  const plan = await prepareLexicalRuleMigration({ generate: async () => newHint })
  return { requests, plan }
}

test('backs up before writing only the extra field and verifies repeat application', async () => {
  const note = makeNote()
  const original = snapshotNote(note)
  const { requests, plan } = await planFor([note])
  const saveBackup = jest.fn(async (backup) => {
    expect(backup.notes).toEqual([original])
    expect(requests.some((req) => req.action === 'updateNoteFields')).toBe(false)
  })
  expect(await applyLexicalRuleUpdates(plan.entries, { saveBackup })).toEqual([{ noteId: 1, status: 'updated' }])
  expect(snapshotNote(note)).toEqual({ ...original, fields: { ...original.fields, 'Back Extra': extra.replace(oldRule, newRule) } })
  expect(requests.filter((req) => req.action === 'updateNoteFields')[0].params.note.fields).toEqual({ 'Back Extra': extra.replace(oldRule, newRule) })
  expect(await applyLexicalRuleUpdates(plan.entries, { saveBackup: async () => {} })).toEqual([{ noteId: 1, status: 'already-current' }])
  expect(requests.filter((req) => req.action === 'updateNoteFields')).toHaveLength(1)
})

test('backup failure prevents every write', async () => {
  const { requests, plan } = await planFor([makeNote()])
  await expect(applyLexicalRuleUpdates(plan.entries, { saveBackup: async () => { throw new Error('disk full') } })).rejects.toThrow('disk full')
  expect(requests.some((req) => req.action === 'updateNoteFields')).toBe(false)
})

test('stale notes and failures do not stop independent eligible updates', async () => {
  const notes = [makeNote(1), makeNote(2), makeNote(3)]
  const { plan } = await planFor(notes, { failId: 2 })
  notes[0].tags.push('user-edit')
  const results = await applyLexicalRuleUpdates(plan.entries, { saveBackup: async () => {} })
  expect(results.map((result) => result.status)).toEqual(['skipped', 'failed', 'updated'])
  expect(notes[0].fields['Back Extra'].value).toBe(extra)
})

test('readback mismatch is reported as failure', async () => {
  const { plan } = await planFor([makeNote()], { noSave: true })
  expect(await applyLexicalRuleUpdates(plan.entries, { saveBackup: async () => {} })).toEqual([
    expect.objectContaining({ status: 'failed', reason: expect.stringMatching(/verification/i) }),
  ])
})

test('tampered plans cannot change unrelated content', async () => {
  const { requests, plan } = await planFor([makeNote()])
  plan.entries[0].newExtra = plan.entries[0].newExtra.replace('[jeː]', '[wrong]')
  await expect(applyLexicalRuleUpdates(plan.entries, { saveBackup: async () => {} })).rejects.toThrow(/Invalid/)
  expect(requests.some((req) => req.action === 'updateNoteFields')).toBe(false)
})
