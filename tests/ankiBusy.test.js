import { jest } from '@jest/globals'
import { findNotesByQuery, createNote } from '../src/anki.js'
import { runWithWorkflowRecovery } from '../src/workflowRecovery.js'

const originalFetch = global.fetch
beforeEach(() => {
  jest.useFakeTimers()
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  global.fetch = originalFetch
  jest.useRealTimers()
  jest.restoreAllMocks()
})

const reply = (error, result = null) => ({ json: async () => ({ error, result }) })

test.each(['Collection lifecycle operation is active.', 'A collection operation is active.'])(
  'resumes the same lookup after %s', async (busy) => {
    const requests = []
    global.fetch = async (_url, request) => {
      requests.push(request.body)
      return requests.length < 3 ? reply(busy) : reply(null, [42])
    }
    const result = findNotesByQuery('lemma:Krieg')
    const checked = expect(result).resolves.toEqual([42])
    await jest.runAllTimersAsync()
    await checked
    expect(requests).toHaveLength(3)
    expect(new Set(requests).size).toBe(1)
    expect(console.warn).toHaveBeenCalledTimes(1)
  },
)

test('retries a rejected write but executes the note creation only once', async () => {
  const requests = []
  let saved = 0
  global.fetch = async (_url, request) => {
    requests.push(request.body)
    if (requests.length === 1) return reply('Collection lifecycle operation is active.')
    saved++
    return reply(null, 123)
  }
  const result = createNote({ german: 'Der Krieg endet.', russian: 'Война заканчивается.' })
  const checked = expect(result).resolves.toBe(123)
  await jest.runAllTimersAsync()
  await checked
  expect(saved).toBe(1)
  expect(requests[0]).toBe(requests[1])
})

test('stops a persistently busy item without AI regeneration or an AI recovery menu', async () => {
  let requests = 0
  let analyses = 0
  global.fetch = async () => { requests++; return reply('Collection lifecycle operation is active.') }
  const ask = jest.fn().mockResolvedValue('5')
  const write = jest.fn()
  const result = runWithWorkflowRecovery({ input: 'Krieg', ask, write,
    runAttempt: async () => { analyses++; return findNotesByQuery('Krieg') },
  })
  await jest.runAllTimersAsync()
  expect(await result).toBe(false)
  expect(requests).toBe(11)
  expect(analyses).toBe(1)
  expect(ask).not.toHaveBeenCalled()
  expect(write).toHaveBeenCalledWith(expect.stringContaining('Anki is still busy'))
})

test.each(['network', 'json', 'duplicate', 'other-busy'])('does not replay a write after %s failure', async (kind) => {
  let requests = 0
  global.fetch = async () => {
    requests++
    if (kind === 'network') throw new Error('connection lost')
    if (kind === 'json') return { json: async () => { throw new Error('invalid JSON') } }
    return reply(kind === 'duplicate' ? 'cannot create note because it is a duplicate' : 'Search snapshot capacity exceeded.')
  }
  await expect(createNote({ german: 'Hallo', russian: 'Привет' })).rejects.toThrow()
  expect(requests).toBe(1)
})
