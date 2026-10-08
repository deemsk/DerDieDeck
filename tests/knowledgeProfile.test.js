import { buildLearnerProfilePromptContext } from '../src/knowledgeProfile/promptContext.js'

test('separates review evidence and excludes the target family from both lists', () => {
  const words = [
    { canonical: 'Buch', state: 'familiar' },
    { canonical: 'trotzdem', state: 'learning' },
    { canonical: 'neu', state: 'new' },
    { canonical: 'geh', lemma: 'gehen', state: 'learning' },
    { canonical: 'gehen', lemma: 'gehen', state: 'familiar' },
  ]
  const context = buildLearnerProfilePromptContext({ summary: { words, estimatedLevel: 'B2' } }, { target: { rawInput: 'geh', lemma: 'gehen' } })
  expect(context).toContain('Familiar vocabulary you may reuse naturally: Buch.')
  expect(context).toContain('Still learning; optionally reinforce one when natural: trotzdem.')
  expect(context).not.toMatch(/neu|gehen|: geh|B2|beginner filler/)
})

test('no review evidence produces no tuning request', () => {
  expect(buildLearnerProfilePromptContext({ summary: { words: [{ canonical: 'neu', state: 'new' }] } })).toBeNull()
})

test('limits familiar vocabulary and strips articles for target matching', () => {
  const context = buildLearnerProfilePromptContext({ summary: { words: ['das Buch', 'Haus', 'Tisch'].map(canonical => ({ canonical, state: 'familiar' })) } }, { target: { rawInput: 'Buch' }, maxKnownWords: 1 })
  expect(context).toContain(': Haus.')
  expect(context).not.toMatch(/Buch|Tisch/)
})
