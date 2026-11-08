import { jest } from '@jest/globals'
const execFile = jest.fn((_command, _args, _options, callback) => callback(null, { stdout: 'secret-value\n', stderr: '' }))
jest.unstable_mockModule('child_process', () => ({ execFile }))
const { resolveSecret } = await import('../src/lib/secrets.js')
test('reuses a resolved 1Password reference during the same process', async () => {
  expect(await resolveSecret('op://test/shared')).toBe('secret-value')
  expect(await resolveSecret('op://test/shared', { timeoutMs: 5000 })).toBe('secret-value')
  expect(execFile).toHaveBeenCalledTimes(1)
})
test('failed secret lookup is not cached', async () => {
  execFile.mockImplementationOnce((_command, _args, _options, callback) => callback(new Error('unavailable')))
  await expect(resolveSecret('op://test/retry')).rejects.toThrow('unavailable')
  expect(await resolveSecret('op://test/retry')).toBe('secret-value')
})
test('a bounded lookup does not inherit a separate unbounded pending lookup', async () => {
  execFile.mockImplementationOnce(() => {})
  const stalled = resolveSecret('op://test/concurrent')
  const secret = await resolveSecret('op://test/concurrent', { timeoutMs: 25 })
  expect(secret).toBe('secret-value')
  expect(stalled).toBeInstanceOf(Promise)
})
