import { jest } from '@jest/globals'
import * as lexicalMode from '../src/lexicalMode.js'

const candidates = {
  reason: 'both-plausible',
  wordAnalysis: { canonical: 'lass', lexicalType: 'particle' },
  verbAnalysis: { infinitive: 'lassen', displayForm: 'lass' },
}

async function dialog(classification = candidates, answers = ['s']) {
  const lines = []
  const prompts = []
  const remaining = [...answers]
  const route = await lexicalMode.askLexicalRoute('lass', classification, {
    write: (line = '') => lines.push(line),
    ask: async (prompt) => {
      prompts.push(prompt)
      if (!remaining.length) throw new Error('Dialog requested an unexpected extra answer')
      return remaining.shift()
    },
  })
  return { route, text: lines.join('\n'), prompts }
}

test('shows proposed parts of speech and encountered form before infinitive', async () => {
  const { text, prompts } = await dialog()
  expect(text).toContain('Which interpretation did you intend for "lass"?')
  expect(text).toContain('possible interpretations')
  expect(text).toContain('1. Particle: lass')
  expect(text).toContain('2. Verb form: lass → lassen')
  expect(text).not.toMatch(/word.*verb/i)
  expect(prompts).toEqual(['Choose [1/2], or [S]kip (Enter = skip): '])
})

test('associates the first available Russian gloss with each lexical item', async () => {
  const { text } = await dialog({
    ...candidates,
    wordAnalysis: { canonical: 'Lassen', lexicalType: 'noun', meanings: [{ russian: '' }, { russian: 'оставление' }] },
    verbAnalysis: { ...candidates.verbAnalysis, meanings: [null, { russian: ' ' }, { russian: 'позволять, оставлять' }, { russian: 'допускать' }] },
  })
  expect(text).toContain('1. Noun: Lassen — оставление')
  expect(text).toContain('2. Verb form: lass → lassen — позволять, оставлять')
  expect(text).not.toContain('lass — позволять')
  expect(text).not.toContain('допускать')
})

test('does not repeat an infinitive or show empty gloss placeholders', async () => {
  const { text } = await dialog({ ...candidates, verbAnalysis: { infinitive: 'lassen', displayForm: 'lassen', meanings: [] } })
  expect(text).toContain('2. Verb: lassen')
  expect(text).not.toContain('→')
  expect(text).not.toMatch(/undefined|null|—\s*$/m)
})

test.each([{}, { wordAnalysis: null, verbAnalysis: null }])('labels unavailable analyses without inventing a noun', async (analyses) => {
  const { text } = await dialog({ reason: 'both-weak', ...analyses })
  expect(text).toContain('Neither analysis is reliable')
  expect(text).toContain('1. Part of speech unavailable: analysis unavailable')
  expect(text).toContain('2. Verb: analysis unavailable')
  expect(text).not.toContain('Noun')
})

test('retains a known lexical item when its type is missing', async () => {
  const { text } = await dialog({ reason: 'both-weak', wordAnalysis: { canonical: 'lass' }, verbAnalysis: {} })
  expect(text).toContain('1. Part of speech unavailable: lass')
})

test.each([
  ['1', 'word'], [' W ', 'word'], ['WORD', 'word'],
  [' 2 ', 'verb'], ['V', 'verb'], [' verb ', 'verb'],
  ['', null], ['  ', null], ['S', null], [' SKIP ', null],
])('maps %j to the intended workflow or dismissal', async (input, expected) => {
  expect((await dialog(candidates, [input])).route).toBe(expected)
})

test('invalid input repeats the prompt without silently selecting a route', async () => {
  const { route, prompts } = await dialog(candidates, ['3', '2abc', 'yes', '2'])
  expect(route).toBe('verb')
  expect(prompts).toHaveLength(4)
})
