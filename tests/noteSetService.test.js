import { jest } from '@jest/globals'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const marker = { profile: 'User 1', filename: '_marker', data: 'abc' }
const createRecoveryMarker = jest.fn(async () => marker)
const verifyRecoveryMarker = jest.fn(async () => true)
const findNotesByQuery = jest.fn()
const createBasicNote = jest.fn()
const createNote = jest.fn()
const buildRecoverableNote = jest.fn((kind, payload) => ({ ...payload, kind, tags: payload.tags || [] }))
const createPreparedNote = jest.fn(async note => note.kind === 'basic' ? createBasicNote(note) : createNote(note))
const recoveryMediaExists = jest.fn(async () => true)
jest.unstable_mockModule('../src/anki.js', () => ({ createRecoveryMarker, verifyRecoveryMarker, findNotesByQuery, buildRecoverableNote, createPreparedNote, recoveryMediaExists }))
const { startNoteSet, resumeSavedNoteSet } = await import('../src/noteSetService.js')
let dir
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'service-test-')); jest.clearAllMocks() })
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })
test('resumes saved approved steps after a lost note response without repeating it', async () => {
  const existing = new Map()
  findNotesByQuery.mockImplementation(async query => existing.get(query.slice(4)) || [])
  createBasicNote.mockImplementationOnce(async args => { existing.set(args.tags.at(-1), [101]); throw new Error('connection lost') })
  createNote.mockResolvedValue(102)
  const path = join(dir, 'abc123.json')
  await expect(startNoteSet(path, { operationId: 'abc123', steps: [
    { id: 'word', kind: 'basic', payload: { front: 'groß', back: 'большой', tags: [] } },
    { id: 'sentence', kind: 'sentence', payload: { german: 'Das Haus ist groß.', tags: [] } },
  ] })).rejects.toThrow('connection lost')
  const result = await resumeSavedNoteSet(path)
  expect(result.steps.map(step => step.noteId)).toEqual([101, 102])
  expect(createBasicNote).toHaveBeenCalledTimes(1)
  expect(createNote).toHaveBeenCalledTimes(1)
})
test('does not create notes when the collection marker cannot be verified', async () => {
  findNotesByQuery.mockResolvedValue([])
  verifyRecoveryMarker.mockResolvedValueOnce(false)
  const path = join(dir, 'abc123.json')
  await expect(startNoteSet(path, { operationId: 'abc123', steps: [{ id: 'word', kind: 'basic', payload: { front: 'x' } }] })).rejects.toThrow(/collection/i)
  expect(createBasicNote).not.toHaveBeenCalled()
})
test('lists incomplete plans after interruption while hiding completed plans', async () => {
  const { createNoteSetJournal } = await import('../src/noteSetRecovery.js')
  const { listIncompleteNoteSets } = await import('../src/noteSetService.js')
  await createNoteSetJournal(join(dir, 'pending.json'), { operationId: 'abc123', collectionId: JSON.stringify(marker), steps: [{ id: 'word', kind: 'basic', payload: { front: 'groß' } }] })
  await createNoteSetJournal(join(dir, 'done.json'), { operationId: 'def456', collectionId: JSON.stringify(marker), steps: [{ id: 'word', kind: 'basic', payload: { front: 'klein' } }] })
  const fs = await import('node:fs/promises')
  const done = JSON.parse(await fs.readFile(join(dir, 'done.json'), 'utf8'))
  done.steps[0].noteId = 101
  await fs.writeFile(join(dir, 'done.json'), JSON.stringify(done))
  const pending = await listIncompleteNoteSets(dir)
  expect(pending.map(item => item.operationId)).toEqual(['abc123'])
})

test('does not write a pending note when its approved audio is missing', async () => {
  findNotesByQuery.mockResolvedValue([])
  recoveryMediaExists.mockResolvedValueOnce(false)
  const path = join(dir, 'abc123.json')
  await expect(startNoteSet(path, { operationId: 'abc123', steps: [{ id: 'word', kind: 'basic', payload: { front: '[sound:word.mp3]' } }] })).rejects.toThrow(/word.mp3/)
  expect(createPreparedNote).not.toHaveBeenCalled()
})

test.each([0, 1, 2, 3])('resumes a verb package after a lost response at step %i', async (failIndex) => {
  const existing = new Map(), writes = []
  findNotesByQuery.mockImplementation(async query => existing.get(query.slice(4)) || [])
  verifyRecoveryMarker.mockResolvedValue(true)
  recoveryMediaExists.mockResolvedValue(true)
  createPreparedNote.mockImplementation(async note => {
    const tag = note.tags.at(-1), id = 201 + writes.length
    writes.push(tag); existing.set(tag, [id])
    if (writes.length - 1 === failIndex) throw new Error('response lost')
    return id
  })
  const path = join(dir, `package${failIndex}.json`)
  const steps = [
    { id: 'lemma', kind: 'basic', payload: { front: 'sprechen' } },
    { id: 'production0', kind: 'basic', payload: { front: 'sprechen → du' } },
    { id: 'recognition0', kind: 'basic', payload: { front: 'du sprichst' } },
    { id: 'cloze0', kind: 'cloze', payload: { text: 'Du {{c1::sprichst}}.' } },
  ]
  await expect(startNoteSet(path, { operationId: `abc${failIndex}`, steps })).rejects.toThrow('response lost')
  const result = await resumeSavedNoteSet(path)
  expect(result.steps.map(step => step.noteId)).toEqual([201, 202, 203, 204])
  expect(writes).toHaveLength(4)
  expect(new Set(writes).size).toBe(4)
})
test('only an explicit Anki duplicate may complete an optional companion', async () => {
  findNotesByQuery.mockResolvedValue([])
  verifyRecoveryMarker.mockResolvedValue(true)
  recoveryMediaExists.mockResolvedValue(true)
  createPreparedNote.mockRejectedValueOnce(new Error('AnkiConnect error: cannot create note because it is a duplicate'))
  const path = join(dir, 'dup.json')
  const result = await startNoteSet(path, { operationId: 'abc123', steps: [{ id: 'lemma', kind: 'picture', allowExistingDuplicate: true, payload: { front: 'gehen' } }] })
  expect(result.steps[0].status).toBe('existing-duplicate')
  expect(await listIncompleteForTest(dir)).toEqual([])
})
async function listIncompleteForTest(directory) {
  const { listIncompleteNoteSets } = await import('../src/noteSetService.js')
  return listIncompleteNoteSets(directory)
}
