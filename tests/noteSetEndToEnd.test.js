import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'

const run = async (args, env) => {
  const child = spawn(process.execPath, args, { env, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', chunk => { output += chunk })
  child.stderr.on('data', chunk => { output += chunk })
  const [code] = await once(child, 'close')
  return { code, output }
}

test('resume CLI reconciles an Anki write whose response was lost', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ddd-resume-e2e-'))
  const media = new Map([['test.mp3', 'dGVzdA==']]), notes = []
  let drop = true
  const server = createServer((request, response) => {
    let body = ''
    request.on('data', chunk => { body += chunk })
    request.on('end', () => {
      const { action, params = {} } = JSON.parse(body)
      let result
      if (action === 'getActiveProfile') result = 'Test profile'
      else if (action === 'storeMediaFile') { media.set(params.filename, params.data); result = params.filename }
      else if (action === 'retrieveMediaFile') result = media.get(params.filename) || false
      else if (action === 'findNotes') result = notes.filter(note => note.tags.includes(params.query.slice(4))).map(note => note.id)
      else if (action === 'addNote') {
        const note = { ...params.note, id: 100 + notes.length }
        notes.push(note)
        if (drop) { drop = false; request.socket.destroy(); return }
        result = note.id
      } else throw new Error(`Unexpected action ${action}`)
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ result, error: null }))
    })
  })
  try {
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const port = server.address().port
    await writeFile(join(dir, '.derdiedeck.json'), JSON.stringify({ ankiConnectUrl: `http://127.0.0.1:${port}`, ankiNoteType: 'Basic' }))
    const journal = join(dir, 'operation.json')
    const script = `import { startNoteSet } from ${JSON.stringify(new URL('../src/noteSetService.js', import.meta.url).href)}; await startNoteSet(process.argv[1], { operationId:'abc123', steps:[{id:'word',kind:'basic',payload:{front:'groß',back:'большой'}},{id:'sentence',kind:'sentence',payload:{german:'Das Haus ist groß.',russian:'Дом большой.',audioFilename:'test.mp3'}}] });`
    const env = { ...process.env, HOME: dir }
    const first = await run(['--input-type=module', '-e', script, journal], env)
    expect(first.code).not.toBe(0)
    expect(notes).toHaveLength(1)
    await writeFile(join(dir, '.derdiedeck.json'), JSON.stringify({ ankiConnectUrl: `http://127.0.0.1:${port}`, ankiNoteType: 'Changed', ankiDeck: 'Different' }))
    const resumed = await run(['src/index.js', 'resume', journal], env)
    expect(resumed.code).toBe(0)
    expect(resumed.output).toContain('nid:100')
    expect(resumed.output).toContain('nid:101')
    expect(notes).toHaveLength(2)
    expect(notes[1].modelName).toBe('Basic')
    expect(notes[1].deckName).toBe('German::YouTube')
  } finally {
    await new Promise(resolve => server.close(resolve))
    await rm(dir, { recursive: true, force: true })
  }
}, 15000)
