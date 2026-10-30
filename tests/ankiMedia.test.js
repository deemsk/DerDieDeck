import { storeMedia } from '../src/anki.js'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const original = global.fetch
let dir
afterEach(async () => { global.fetch = original; if (dir) await rm(dir, { recursive: true, force: true }) })
test('uses the actual media filename returned by Anki', async () => {
  dir = await mkdtemp(join(tmpdir(), 'anki-media-'))
  const path = join(dir, 'image.PNG')
  await writeFile(path, 'test')
  global.fetch = async () => ({ json: async () => ({ result: 'image.png', error: null }) })
  expect(await storeMedia(path)).toBe('image.png')
})
test('fails closed when Anki returns no filename', async () => {
  dir = await mkdtemp(join(tmpdir(), 'anki-media-'))
  const path = join(dir, 'image.PNG')
  await writeFile(path, 'test')
  global.fetch = async () => ({ json: async () => ({ result: null, error: null }) })
  await expect(storeMedia(path)).rejects.toThrow('filename')
})
