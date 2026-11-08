import { runExamplePipeline, pairEnrichedExample } from '../src/examplePipeline.js'

test('prepares and independently validates a bilingual example with a supplied policy', async () => {
  const calls = []
  const result = await runExamplePipeline({ context: { target: 'fest', meaning: 'прочный' },
    prepare: async () => ({ german: 'feste Schraube', russian: 'прочно закреплённый винт', focusForm: 'feste' }),
    validate: async (example, context) => { calls.push({ example, context }); return { valid: true } },
  })
  expect(result.russian).toBe('прочно закреплённый винт')
  expect(calls).toHaveLength(1)
  expect(calls[0].context.target).toBe('fest')
})
test('repairs a missing translation using the failure feedback before accepting', async () => {
  const attempts = []
  const result = await runExamplePipeline({ context: {}, prepare: async ({ feedback }) => {
    attempts.push(feedback)
    return attempts.length === 1 ? { german: 'feste Schraube', russian: '', focusForm: 'feste' } : { german: 'feste Schraube', russian: 'прочно закреплённый винт', focusForm: 'feste' }
  }, validate: async () => ({ valid: true }) })
  expect(attempts[1]).toMatch(/translation/i)
  expect(result.russian).toContain('винт')
})
test('rejects an example when review keeps rejecting its selected meaning', async () => {
  await expect(runExamplePipeline({ context: {}, prepare: async () => ({ german: 'Das ist ein Schatz.', russian: 'Это клад.', focusForm: 'Schatz' }), validate: async () => ({ valid: false, reason: 'Wrong sense' }) })).rejects.toThrow('Wrong sense')
})
test('does not attach an old translation when enrichment changes the German text', () => {
  expect(pairEnrichedExample({ german: 'Er ging ins Bett.', russian: 'Он лёг спать.' }, { german: 'Er ging nach Hause.', russian: 'Он пошёл домой.' }).russian).toBe('Он лёг спать.')
  expect(pairEnrichedExample({ german: 'Er ging nach Hause.', russian: 'Он ушёл домой.' }, { german: 'Er ging nach Hause.', russian: 'Он пошёл домой.' }).russian).toBe('Он пошёл домой.')
})
test('punctuation or German capitalization changes invalidate the old translation', () => {
  expect(pairEnrichedExample({ german: 'Kommst du?', russian: 'Ты придёшь?' }, { german: 'Kommst du.', russian: 'Ты приходишь.' }).russian).toBe('Ты придёшь?')
  expect(pairEnrichedExample({ german: 'Sie kommt.', russian: 'Она приходит.' }, { german: 'sie kommt.', russian: 'она приходит.' }).russian).toBe('Она приходит.')
})
test('allows inflected verb sentences when the policy validates the lemma', async () => {
  const example = { german: 'Er geht nach Hause.', russian: 'Он идёт домой.', focusForm: 'gehen' }
  expect(await runExamplePipeline({ context: { requireExactForm: false }, prepare: async () => example, validate: async () => ({ valid: true }) })).toEqual(example)
})
