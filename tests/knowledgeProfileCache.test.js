import { jest } from '@jest/globals'
const refresh = jest.fn(), read = jest.fn(), write = jest.fn()
const config = { ankiConnectUrl: 'http://localhost:8765', knowledgeProfileQuery: 'tag:yt2anki', knowledgeProfileMaxCacheAgeDays: 21 }
jest.unstable_mockModule('../src/lib/config.js', () => ({ config }))
jest.unstable_mockModule('../src/knowledgeProfile/ankiSnapshot.js', () => ({ PROFILE_VERSION: 2, refreshProfileFromAnki: refresh }))
jest.unstable_mockModule('../src/knowledgeProfile/store.js', () => ({ readProfileCache: read, writeProfileCache: write }))
const { getLearnerProfilePromptContext: get, resetLearnerProfileStateForTests: reset, resolveLearnerProfileForInput, consumeLearnerProfileWarning } = await import('../src/knowledgeProfile/index.js')
const profile = (extra = {}) => ({ version: 2, sourceQuery: config.knowledgeProfileQuery, sourceEndpoint: config.ankiConnectUrl, refreshedAt: new Date().toISOString(), cardStatus: 'ok', summary: { words: [{ canonical: 'Buch', state: 'familiar' }] }, ...extra })
beforeEach(() => {
  reset(); jest.useFakeTimers(); jest.setSystemTime(new Date('2026-10-08T12:00:00Z'))
  refresh.mockReset().mockRejectedValue(new Error('offline'))
  read.mockReset().mockResolvedValue(null); write.mockReset().mockResolvedValue(undefined)
  config.knowledgeProfileEnabled = true
})
afterEach(() => jest.useRealTimers())
test.each([{ version: 1 }, { cardStatus: 'failed' }, { sourceQuery: 'other' }, { sourceEndpoint: 'other' }, { refreshedAt: '2026-09-01' }, { refreshedAt: '2026-11-01' }])('rejects incompatible cache on every path: %j', async extra => {
  read.mockResolvedValue(profile(extra))
  expect((await get({ allowRefresh: false })).promptContext).toBeNull()
  expect((await get()).promptContext).toBeNull()
  expect(write).not.toHaveBeenCalled()
})
test('uses compatible fallback without overwriting it', async () => {
  read.mockResolvedValue(profile())
  expect((await get()).status).toBe('stale')
  expect(write).not.toHaveBeenCalled()
})
test('cache write failure retains live data', async () => {
  refresh.mockResolvedValue(profile()); write.mockRejectedValue(new Error('read-only'))
  expect((await get()).status).toBe('fresh')
  expect(read).not.toHaveBeenCalled()
})
test('coalesces requests, expires successes and separates sync options', async () => {
  refresh.mockImplementation(async () => profile())
  await Promise.all([get(), get()]); expect(refresh).toHaveBeenCalledTimes(1)
  await get({ allowSync: false }); expect(refresh).toHaveBeenCalledTimes(2)
  jest.advanceTimersByTime(300001)
  await get(); expect(refresh).toHaveBeenCalledTimes(3)
})
test('retries unavailable profile after thirty seconds', async () => {
  await get(); await get(); expect(refresh).toHaveBeenCalledTimes(1)
  jest.advanceTimersByTime(30001); refresh.mockResolvedValue(profile())
  expect((await get()).status).toBe('fresh')
})
test('prepared analysis still gets context, excludes lemma, and disables dry-run sync', async () => {
  refresh.mockResolvedValue(profile())
  expect(await resolveLearnerProfileForInput('geh', { analysisResult: { infinitive: 'gehen' }, dryRun: true })).toContain('Buch')
  expect(refresh.mock.calls[0][0].syncBeforeRefresh).toBe(false)
  expect(await resolveLearnerProfileForInput('Buch', { analysisResult: { lemma: 'Buch' }, dryRun: true })).toBeNull()
})
test('disabled profile does not read and warnings appear once', async () => {
  config.knowledgeProfileEnabled = false
  expect((await get()).status).toBe('disabled'); expect(refresh).not.toHaveBeenCalled()
  expect(consumeLearnerProfileWarning({ warning: 'offline' })).toBe('offline')
  expect(consumeLearnerProfileWarning({ warning: 'offline' })).toBeNull()
})

test('session reuse cannot extend the maximum disk-cache age', async () => {
  read.mockResolvedValue(profile({ refreshedAt: new Date(Date.now() - 21 * 86400000 + 1000).toISOString() }))
  expect((await get({ allowRefresh: false })).status).toBe('stale')
  jest.advanceTimersByTime(1001)
  expect((await get({ allowRefresh: false })).status).toBe('unavailable')
})

test('timed-out refresh cannot overwrite cache when it eventually finishes', async () => {
  config.knowledgeProfileRefreshTimeoutMs = 10
  let finish
  refresh.mockImplementation(() => new Promise(resolve => { finish = resolve }))
  read.mockResolvedValue(profile())
  const pending = get()
  await jest.advanceTimersByTimeAsync(11)
  expect((await pending).status).toBe('stale')
  finish(profile())
  await Promise.resolve()
  expect(write).not.toHaveBeenCalled()
  delete config.knowledgeProfileRefreshTimeoutMs
})
