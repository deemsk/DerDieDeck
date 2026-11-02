import { jest } from '@jest/globals'
import { createRecoveryMarker, verifyRecoveryMarker } from '../src/anki.js'
const originalFetch = global.fetch
afterEach(() => { global.fetch = originalFetch })
test('collection marker is written and checked against active profile and content', async () => {
  const media = new Map()
  global.fetch = jest.fn(async (_url, options) => {
    const { action, params } = JSON.parse(options.body)
    if (action === 'getActiveProfile') return { json: async () => ({ result: 'User 1', error: null }) }
    if (action === 'storeMediaFile') { media.set(params.filename, params.data); return { json: async () => ({ result: params.filename, error: null }) } }
    if (action === 'retrieveMediaFile') return { json: async () => ({ result: media.get(params.filename) || false, error: null }) }
    throw new Error(action)
  })
  const marker = await createRecoveryMarker('abc123')
  expect(await verifyRecoveryMarker(marker)).toBe(true)
  media.clear()
  expect(await verifyRecoveryMarker(marker)).toBe(false)
})
test('prepared note retains deck, model and rendered fields after config changes', async () => {
  const { config } = await import('../src/lib/config.js')
  const { buildRecoverableNote } = await import('../src/anki.js')
  const oldDeck = config.ankiDeck, oldModel = config.ankiNoteType
  try {
    config.ankiDeck = 'Original'; config.ankiNoteType = 'Basic'
    const prepared = buildRecoverableNote('sentence', { german: 'Hallo', russian: 'Привет', audioFilename: 'hello.mp3' })
    config.ankiDeck = 'Changed'; config.ankiNoteType = 'Other'
    expect(prepared.deckName).toBe('Original')
    expect(prepared.modelName).toBe('Basic')
    expect(prepared.fields.Back).toContain('Hallo')
  } finally { config.ankiDeck = oldDeck; config.ankiNoteType = oldModel }
})
test('freezes picture and cloze note models and fields in approved payloads', async () => {
  const { buildRecoverableNote } = await import('../src/anki.js')
  const picture = buildRecoverableNote('picture', { canonical: 'gehen', coloredWord: 'gehen', imageFilename: 'walk.jpg', pronunciationField: '[sound:walk.mp3]', modelName: 'Pictures', deck: 'Original' })
  const cloze = buildRecoverableNote('cloze', { text: 'Du {{c1::gehst}}.', extra: 'идёшь', modelName: 'Cloze', deck: 'Original' })
  expect(picture).toEqual(expect.objectContaining({ modelName: 'Pictures', deckName: 'Original' }))
  expect(Object.values(picture.fields).join(' ')).toContain('walk.jpg')
  expect(cloze).toEqual(expect.objectContaining({ modelName: 'Cloze', deckName: 'Original', fields: expect.objectContaining({ Text: 'Du {{c1::gehst}}.' }) }))
})
