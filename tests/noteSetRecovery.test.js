import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createNoteSetJournal, resumeNoteSet } from '../src/noteSetRecovery.js'

let dir
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'note-set-test-')) })
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

test('reconciles a lost response without creating a duplicate', async () => {
  const path = join(dir, 'journal.json')
  await createNoteSetJournal(path, { operationId: 'abc123', collectionId: 'collection-a', steps: [{ id: 'form', payload: { front: 'geh' } }, { id: 'sentence', payload: { front: 'audio' } }] })
  const existing = new Map()
  let first = true
  const find = async tag => existing.get(tag) || []
  const create = async (step, tag) => {
    existing.set(tag, [step.id === 'form' ? 101 : 102])
    if (first) { first = false; throw new Error('response lost') }
    return 102
  }
  await expect(resumeNoteSet(path, { collectionId: 'collection-a', find, create })).rejects.toThrow('response lost')
  const result = await resumeNoteSet(path, { collectionId: 'collection-a', find, create })
  expect(result.steps.map(step => step.noteId)).toEqual([101, 102])
  expect([...existing.values()]).toEqual([[101], [102]])
})

test('stops for ambiguous matches or collection mismatch without writing', async () => {
  const path = join(dir, 'journal.json')
  await createNoteSetJournal(path, { operationId: 'abc123', collectionId: 'collection-a', steps: [{ id: 'form', payload: {} }] })
  let writes = 0
  const create = async () => { writes++; return 1 }
  await expect(resumeNoteSet(path, { collectionId: 'other', find: async () => [], create })).rejects.toThrow(/collection/i)
  await expect(resumeNoteSet(path, { collectionId: 'collection-a', find: async () => [1, 2], create })).rejects.toThrow(/1.*2/)
  expect(writes).toBe(0)
})

test('never creates notes if reconciliation lookup fails', async () => {
  const path = join(dir, 'journal.json')
  await createNoteSetJournal(path, { operationId: 'abc123', collectionId: 'collection-a', steps: [{ id: 'form', payload: {} }] })
  let writes = 0
  await expect(resumeNoteSet(path, { collectionId: 'collection-a', find: async () => { throw new Error('Anki unavailable') }, create: async () => { writes++; return 1 } })).rejects.toThrow('Anki unavailable')
  expect(writes).toBe(0)
})

test('rejects malformed or duplicate persisted steps before querying Anki', async () => {
  const path = join(dir, 'journal.json')
  await createNoteSetJournal(path, { operationId: 'abc123', collectionId: 'collection-a', steps: [{ id: 'form', payload: {} }] })
  const { writeFile } = await import('node:fs/promises')
  await writeFile(path, JSON.stringify({ version: 1, operationId: 'abc123', collectionId: 'collection-a', steps: [{ id: 'form' }, { id: 'form' }] }))
  let reads = 0
  await expect(resumeNoteSet(path, { collectionId: 'collection-a', find: async () => { reads++; return [] }, create: async () => 1 })).rejects.toThrow(/invalid/i)
  expect(reads).toBe(0)
})

test('an active recovery lock prevents concurrent writes', async () => {
  const path = join(dir, 'journal.json')
  await createNoteSetJournal(path, { operationId: 'abc123', collectionId: 'collection-a', steps: [{ id: 'form', payload: {} }] })
  let release, entered
  const started = new Promise(resolve => { entered = resolve })
  const pending = new Promise(resolve => { release = resolve })
  const first = resumeNoteSet(path, { collectionId: 'collection-a', find: async () => { entered(); await pending; return [] }, create: async () => 42 })
  await started
  await expect(resumeNoteSet(path, { collectionId: 'collection-a', find: async () => [], create: async () => 43 })).rejects.toThrow(/lock.*active/i)
  release()
  expect((await first).steps[0].noteId).toBe(42)
})

test('a lock file left after a crash does not prevent recovery', async () => {
  const path = join(dir, 'journal.json')
  await createNoteSetJournal(path, { operationId: 'abc123', collectionId: 'collection-a', steps: [{ id: 'form', payload: {} }] })
  const { writeFile } = await import('node:fs/promises')
  await writeFile(`${path}.lock`, 'stale')
  const result = await resumeNoteSet(path, { collectionId: 'collection-a', find: async () => [], create: async () => 42 })
  expect(result.steps[0].noteId).toBe(42)
})

test('releases the OS lock when the recovery process is killed', async () => {
  const path = join(dir, 'journal.json')
  await createNoteSetJournal(path, { operationId: 'abc123', collectionId: 'collection-a', steps: [{ id: 'form', payload: {} }] })
  const { spawn } = await import('node:child_process')
  const { once } = await import('node:events')
  const moduleUrl = new URL('../src/noteSetRecovery.js', import.meta.url).href
  const script = `import { resumeNoteSet } from ${JSON.stringify(moduleUrl)}; await resumeNoteSet(process.argv[1], { collectionId:'collection-a', find: async () => { console.log('locked'); return new Promise(() => {}) }, create: async () => 99 });`
  const child = spawn(process.execPath, ['--input-type=module', '-e', script, path], { stdio: ['ignore', 'pipe', 'pipe'] })
  try {
    const [data] = await once(child.stdout, 'data')
    expect(data.toString()).toContain('locked')
    const exited = once(child, 'exit')
    child.kill('SIGKILL')
    await exited
    // The lock helper notices EOF asynchronously after the owner exits.
    let result
    for (let i = 0; i < 50; i++) {
      try {
        result = await resumeNoteSet(path, { collectionId: 'collection-a', find: async () => [], create: async () => 42 })
        break
      } catch (error) {
        if (!/lock is active/.test(error.message)) throw error
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    }
    expect(result?.steps[0].noteId).toBe(42)
  } finally {
    if (child.exitCode == null && child.signalCode == null) child.kill('SIGKILL')
  }
})

test('stops before the next write when the active collection changes', async () => {
  const path = join(dir, 'journal.json')
  await createNoteSetJournal(path, { operationId: 'abc123', collectionId: 'collection-a', steps: [{ id: 'form', payload: {} }, { id: 'sentence', payload: {} }] })
  let collection = 'collection-a'
  const saved = new Map()
  let writes = 0
  await expect(resumeNoteSet(path, {
    collectionId: async () => collection,
    find: async tag => saved.get(tag) || [],
    create: async (step, tag) => { writes++; saved.set(tag, [101]); collection = 'collection-b'; return 101 },
  })).rejects.toThrow(/collection/i)
  expect(writes).toBe(1)
})
