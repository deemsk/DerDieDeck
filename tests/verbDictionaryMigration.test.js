import { jest } from '@jest/globals'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseLegacyVerbDictionary } from '../src/cardContent/verbDictionaryMigration.js'
import { prepareVerbDictionaryMigration, saveVerbDictionaryPreview } from '../src/verbDictionaryMigration.js'
import { applyNoteBackUpdates, snapshotNote } from '../src/anki.js'
import { isCurrentVerbFormAnswer } from '../src/cardContent/verbFormExplanation.js'

const legacyBack = '<span class="yt2anki-word-display ddd-word-display">sein</span><br>[sound:sein.mp3]<br><span class="yt2anki-ipa ddd-ipa">[zaɪn]</span><br><div class="ddd-answer-translation">быть</div>'
const makeNote = (id = 1, back = legacyBack) => ({
  noteId: id, modelName: 'Basic (optional reversed card)', profile: 'User 1',
  tags: ['yt2anki', 'mode-verb-dictionary', 'lemma-sein', 'form-waere'], cards: [id + 100],
  fields: { Front: { value: '<span class="yt2anki-word-display ddd-word-display">wäre</span>' }, Back: { value: back }, 'Add Reverse': { value: '' } },
})
const explanation = {
  form: 'wäre', infinitive: 'sein', formMeaning: 'был бы', grammar: 'Konjunktiv II',
  usage: 'Воображаемое состояние, обычно настоящее или будущее.', ambiguity: 'ich / er / sie / es', contrast: null,
  example: { german: 'Ich wäre gern zu Hause.', russian: 'Я хотел бы быть дома.' },
}
const originalFetch = global.fetch
afterEach(() => { global.fetch = originalFetch })

function fakeAnki(notes, { failId = null, noSave = false } = {}) {
  const requests = []
  global.fetch = async (_url, options) => {
    const request = JSON.parse(options.body)
    requests.push(request)
    let result = null
    if (request.action === 'notesInfo') result = request.params.notes.map((id) => notes.find((n) => n.noteId === id) || {})
    else if (request.action === 'findNotes') result = notes.map((n) => n.noteId)
    else if (request.action === 'updateNoteFields') {
      const { note } = request.params
      if (note.id === failId) return { json: async () => ({ error: 'write failed', result: null }) }
      if (!noSave) notes.find((n) => n.noteId === note.id).fields.Back.value = note.fields.Back
    } else throw new Error(`Unexpected Anki action ${request.action}`)
    return { json: async () => ({ error: null, result: structuredClone(result) }) }
  }
  return requests
}

test('parses known legacy fields and retains original pronunciation markup verbatim', () => {
  expect(parseLegacyVerbDictionary(makeNote())).toEqual({
    form: 'wäre', infinitive: 'sein', meaning: 'быть', infinitiveHtml: legacyBack,
  })
  expect(parseLegacyVerbDictionary(makeNote(1, legacyBack.replace('<div class="ddd-answer-translation">быть</div>', 'быть'))).meaning).toBe('быть')
})

test.each([
  (note) => { note.tags = ['lemma-sein'] },
  (note) => { note.fields.Front.value += '<div>Extra context</div>' },
  (note) => { note.fields.Back.value = 'maybe sein or werden' },
  (note) => { note.tags.push('lemma-werden') },
  (note) => { note.fields.Back.value += '<script>alert(1)</script>' },
])('skips legacy data that cannot be interpreted safely', (edit) => {
  const note = makeNote(); edit(note)
  expect(() => parseLegacyVerbDictionary(note)).toThrow()
})

test('preview selects tagged notes, preserves media, and makes no writes', async () => {
  const notes = [makeNote()]
  const requests = fakeAnki(notes)
  const plan = await prepareVerbDictionaryMigration({ generate: async () => explanation })
  expect(requests[0]).toMatchObject({ action: 'findNotes', params: { query: 'tag:mode-verb-dictionary' } })
  expect(requests.every((r) => ['findNotes', 'notesInfo'].includes(r.action))).toBe(true)
  expect(plan.entries[0]).toMatchObject({ noteId: 1, form: 'wäre', status: 'ready', original: snapshotNote(notes[0]) })
  expect(plan.entries[0].newBack).toContain(legacyBack)
  expect(isCurrentVerbFormAnswer(plan.entries[0].newBack)).toBe(true)
})

test('reports invalid and failed notes separately and does not regenerate current ones', async () => {
  fakeAnki([makeNote()])
  const initial = await prepareVerbDictionaryMigration({ generate: async () => explanation })
  const generate = jest.fn(async () => { throw new Error('offline') })
  fakeAnki([makeNote(1, initial.entries[0].newBack), makeNote(2, 'unknown'), makeNote(3)])
  const plan = await prepareVerbDictionaryMigration({ generate })
  expect(plan.entries.map((e) => e.status)).toEqual(['already-current', 'skipped', 'failed'])
  expect(generate).toHaveBeenCalledTimes(1)
})

test('saves readable HTML and a reusable JSON plan without overwriting existing previews', async () => {
  fakeAnki([makeNote()])
  const plan = await prepareVerbDictionaryMigration({ generate: async () => explanation })
  const directory = await mkdtemp(join(tmpdir(), 'ddd-preview-test-'))
  try {
    const files = await saveVerbDictionaryPreview(plan, directory)
    expect(JSON.parse(await readFile(files.planPath, 'utf8')).entries[0].newBack).toBe(plan.entries[0].newBack)
    const html = await readFile(files.htmlPath, 'utf8')
    expect(html).toContain('Old answer')
    expect(html).toContain('Proposed answer')
    expect(html).toContain('Konjunktiv II')
    expect(html).toContain('Аудио инфинитива (в Anki)')
    expect(html).not.toContain('[sound:sein.mp3]')
    await saveVerbDictionaryPreview(plan, directory)
    expect((await readdir(directory)).length).toBe(4)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('backup failure prevents all writes', async () => {
  const requests = fakeAnki([makeNote()])
  const plan = await prepareVerbDictionaryMigration({ generate: async () => explanation })
  await expect(applyNoteBackUpdates(plan.entries, { saveBackup: async () => { throw new Error('disk full') } })).rejects.toThrow('disk full')
  expect(requests.some((r) => r.action === 'updateNoteFields')).toBe(false)
})

test('updates only Back after backup and preserves IDs, other fields and metadata; rerun does not write', async () => {
  const notes = [makeNote()]
  const original = structuredClone(notes[0])
  const requests = fakeAnki(notes)
  const plan = await prepareVerbDictionaryMigration({ generate: async () => explanation })
  const saveBackup = jest.fn(async (backup) => {
    expect(requests.some((r) => r.action === 'updateNoteFields')).toBe(false)
    expect(backup.notes[0]).toEqual(snapshotNote(original))
  })
  expect(await applyNoteBackUpdates(plan.entries, { saveBackup })).toEqual([{ noteId: 1, status: 'updated' }])
  const writes = requests.filter((r) => r.action === 'updateNoteFields')
  expect(writes[0].params.note).toEqual({ id: 1, fields: { Back: plan.entries[0].newBack } })
  const { Back, ...rest } = notes[0].fields
  expect(rest).toEqual({ Front: original.fields.Front, 'Add Reverse': original.fields['Add Reverse'] })
  expect(notes[0].cards).toEqual(original.cards)
  expect(notes[0].tags).toEqual(original.tags)
  expect(notes[0].modelName).toBe(original.modelName)
  const second = await applyNoteBackUpdates(plan.entries, { saveBackup: async () => {} })
  expect(second).toEqual([{ noteId: 1, status: 'already-current' }])
  expect(requests.filter((r) => r.action === 'updateNoteFields')).toHaveLength(1)
})

test('skips changed or untagged notes and continues after an individual update failure', async () => {
  const notes = [makeNote(1), makeNote(2), makeNote(3), makeNote(4)]
  fakeAnki(notes, { failId: 3 })
  const plan = await prepareVerbDictionaryMigration({ generate: async () => explanation })
  notes[0].fields.Front.value = 'user edit'
  notes[1].tags = []
  const results = await applyNoteBackUpdates(plan.entries, { saveBackup: async () => {} })
  expect(results.map((r) => r.status)).toEqual(['skipped', 'skipped', 'failed', 'updated'])
  expect(results[0].reason).toMatch(/changed/i)
})

test('Anki acknowledging a write without saving is reported as failure', async () => {
  fakeAnki([makeNote()], { noSave: true })
  const plan = await prepareVerbDictionaryMigration({ generate: async () => explanation })
  const results = await applyNoteBackUpdates(plan.entries, { saveBackup: async () => {} })
  expect(results[0]).toMatchObject({ status: 'failed', reason: expect.stringMatching(/verification/i) })
})

test('a matching upgraded Back does not hide concurrent edits to Front or profile', async () => {
  const notes = [makeNote(1), makeNote(2)]
  fakeAnki(notes)
  const plan = await prepareVerbDictionaryMigration({ generate: async () => explanation })
  notes[0].fields.Back.value = plan.entries[0].newBack
  notes[0].fields.Front.value = 'edited front'
  notes[1].fields.Back.value = plan.entries[1].newBack
  notes[1].profile = 'Another profile'
  const results = await applyNoteBackUpdates(plan.entries, { saveBackup: async () => {} })
  expect(results.map((result) => result.status)).toEqual(['skipped', 'skipped'])
})
