import { jest } from '@jest/globals'
import { Chalk } from 'chalk'
import { stripVTControlCharacters } from 'node:util'
import { prepareVerbDictionaryExplanation, formatDictionaryReviewActions } from '../src/verbDictionaryPreview.js'
import { buildVerbDictionaryNote } from '../src/templates/verb/dictionary.js'

const explanation = {
  form: 'wäre', infinitive: 'sein', formMeaning: 'был бы', grammar: 'Konjunktiv II',
  usage: 'Желание в настоящем.', ambiguity: 'ich / er / sie / es', contrast: null,
  example: { german: 'Ich wäre gern zu Hause.', russian: 'Я хотел бы быть дома.' },
}
const input = { verbData: { infinitive: 'sein', displayForm: 'wäre', ipa: '[zaɪn]' }, selectedMeaning: { russian: 'быть' } }

test('shows the complete answer before accepting the optional card', async () => {
  const log = jest.fn()
  const ask = jest.fn(async () => {
    const preview = log.mock.calls.flat().join('\n')
    for (const text of ['был бы', 'Konjunktiv II', 'Ich wäre gern zu Hause.', 'Я хотел бы быть дома.', 'Infinitive', 'sein']) {
      expect(preview).toContain(text)
    }
    expect(preview).not.toContain('[zaɪn]')
    expect(preview).not.toMatch(/│\s+быть\s*\n/)
    return 'y'
  })
  expect(await prepareVerbDictionaryExplanation(input, { generate: async () => explanation, ask, log })).toEqual(explanation)
})

test('shows the requested form IPA separately from the infinitive IPA', async () => {
  const log = jest.fn()
  await prepareVerbDictionaryExplanation({
    verbData: { infinitive: 'gehen', displayForm: 'geh', ipa: '[ˈɡeːən]' },
    selectedMeaning: { russian: 'идти' },
    formPronunciation: { ipa: '[ɡeː]' },
  }, {
    generate: async () => ({
      form: 'geh', infinitive: 'gehen', formMeaning: 'иди',
      grammar: 'Imperativ, 2-е лицо, единственное число.',
      usage: 'Просьба пойти домой.', ambiguity: null, contrast: null,
      example: { german: 'Geh bitte nach Hause.', russian: 'Иди, пожалуйста, домой.' },
    }),
    ask: async () => 'y', log, chalkRef: new Chalk({ level: 0 }),
  })
  const preview = log.mock.calls.flat().join('\n')
  expect(preview).toMatch(/Pronunciation\s+\[ɡeː\]/)
  expect(preview).toMatch(/Infinitive\s+gehen/)
  expect(preview).not.toContain('[ˈɡeːən]')
  expect(preview).toContain('Back')
  expect(preview).toContain('иди')
})

test('lets the learner dismiss the fully previewed card', async () => {
  expect(await prepareVerbDictionaryExplanation(input, {
    generate: async () => explanation, ask: async () => 's', log: () => {},
  })).toBeNull()
})

test('sentence companion is named in the complete preview and may be dismissed together', async () => {
  const log = jest.fn()
  const ask = jest.fn(async () => 'd')
  const result = await prepareVerbDictionaryExplanation({
    ...input,
    companionSentence: { german: 'Ich wäre gern zu Hause.', russian: 'Я хотел бы быть дома.' },
  }, { generate: async () => explanation, ask, log, chalkRef: new Chalk({ level: 0 }) })
  expect(result).toBe(false)
  const preview = log.mock.calls.flat().join('\n')
  expect(preview).toContain('┌─ Card preview')
  expect(preview).toContain('Ready to add')
  expect(preview).toContain('• Form card')
  expect(preview).toContain('• Audio sentence card')
  expect(preview).toContain('[D] Cancel')
  expect(ask.mock.calls[0][0]).toBe('Choose [Y]: ')
})

test('the complete preview can request sentence revision before either note is written', async () => {
  const askSentenceReview = jest.fn(async () => 'use Buch')
  const result = await prepareVerbDictionaryExplanation({
    ...input,
    companionSentence: { german: 'Ich wäre gern zu Hause.', russian: 'Я хотел бы быть дома.' },
  }, {
    generate: async () => explanation, ask: async () => 'e', askSentenceReview,
    log: () => {}, chalkRef: new Chalk({ level: 0 }),
  })
  expect(result).toEqual({ reviewFeedback: 'use Buch' })
  expect(askSentenceReview).toHaveBeenCalledTimes(1)
})

test('failed explanation offers retry; invalid content is never accepted', async () => {
  const generate = jest.fn().mockResolvedValueOnce({}).mockResolvedValueOnce(explanation)
  const ask = jest.fn().mockResolvedValueOnce('r').mockResolvedValueOnce('y')
  const log = jest.fn()
  expect(await prepareVerbDictionaryExplanation(input, { generate, ask, log })).toEqual(explanation)
  expect(log.mock.calls.flat().join(' ')).toContain('[R] Retry')
  expect(ask.mock.calls[0][0]).toBe('Choose: ')
  expect(generate).toHaveBeenCalledTimes(2)
})

test('failed explanation can be skipped without failing the main note', async () => {
  const log = jest.fn()
  expect(await prepareVerbDictionaryExplanation(input, {
    generate: async () => { throw new Error('unavailable') }, ask: async () => 's', log,
  })).toBeNull()
  expect(log.mock.calls.flat().join(' ')).toContain('unavailable')
})

const denkst = {
  form: 'denkst', infinitive: 'denken', formMeaning: 'думаешь',
  grammar: 'Präsens Indikativ · 2-е лицо, ед. число',
  usage: 'Сейчас; в примере — думать о чём-то.', ambiguity: null, contrast: null,
  example: { german: 'Woran denkst du gerade?', russian: 'О чём ты сейчас думаешь?' },
}
const denkenInput = {
  verbData: { infinitive: 'denken', displayForm: 'denkst', ipa: '[ˈdɛŋkn̩]' },
  selectedMeaning: { russian: 'думать, считать (выражая мнение)' },
}

async function capturePreview(value = denkst, options = {}) {
  const log = jest.fn()
  const result = await prepareVerbDictionaryExplanation(denkenInput, {
    generate: async () => value, ask: async () => 'y', log,
    chalkRef: new Chalk({ level: 0 }), columns: 80, ...options,
  })
  return { text: log.mock.calls.flat().join('\n'), result }
}

test('uses the existing framed summary style with aligned groups and no empty optional rows', async () => {
  const { text } = await capturePreview()
  expect(text).toContain([
    '┌─ Card preview',
    '│  Front       denkst',
    '│',
    '│  Back        думаешь',
    '│  Infinitive  denken',
    '│  Grammar     Präsens Indikativ · 2-е лицо, ед. число',
    '│  Usage       Сейчас; в примере — думать о чём-то.',
    '│',
    '│  Example     Woran denkst du gerade?',
    '│              О чём ты сейчас думаешь?',
    '└─',
  ].join('\n'))
  expect(text).not.toContain('Other readings')
  expect(text).not.toContain('Contrast')
  expect(text).not.toContain('\u001b[')
})

test('wraps long prose and aligns continuations within a narrow terminal', async () => {
  const { text } = await capturePreview(denkst, { columns: 42 })
  const lines = text.split('\n').filter((line) => line.startsWith('│'))
  expect(lines.every((line) => [...line].length <= 42)).toBe(true)
  expect(lines).toContain('│              лицо, ед. число')
  expect(lines.join(' ').replace(/│/g, '').replace(/\s+/g, ' ')).toContain(denkst.usage)
})

test('uses color and emphasis without changing the plain text or wrapping', async () => {
  const plain = await capturePreview(denkst, { columns: 42 })
  const colored = await capturePreview(denkst, { columns: 42, chalkRef: new Chalk({ level: 1 }) })
  expect(colored.text).toContain('\u001b[32m┌─\u001b[39m')
  expect(colored.text).toContain('\u001b[32m│\u001b[39m')
  expect(colored.text).toContain('\u001b[32m└─\u001b[39m')
  expect(colored.text).toContain('\u001b[36mdenkst\u001b[39m')
  expect(colored.text).toContain('\u001b[1m')
  expect(colored.text).toContain('\u001b[2m')
  expect(stripVTControlCharacters(colored.text)).toBe(plain.text)
})

test('shows useful optional notes and returns the same complete content for the saved card', async () => {
  const value = { ...denkst, ambiguity: 'Полезное уточнение.', contrast: 'Полезное различие.' }
  const { text, result } = await capturePreview(value)
  expect(text).toMatch(/Other readings\s+Полезное уточнение\./)
  expect(text).toMatch(/Contrast\s+Полезное различие\./)
  expect(result).toBe(value)
  const saved = buildVerbDictionaryNote({ ...denkenInput, formExplanation: result })
  expect(saved.back).toContain(value.ambiguity)
  expect(saved.back).toContain(value.contrast)
})

test('regeneration replaces the framed preview before the separated action prompt', async () => {
  const revised = { ...denkst, usage: 'Действие в момент речи.' }
  const log = jest.fn()
  let attempts = 0
  const ask = async () => {
    const text = log.mock.calls.flat().join('\n')
    expect(text.lastIndexOf('[Y] Add card')).toBeGreaterThan(text.lastIndexOf('└─'))
    if (attempts++ === 0) return 'r'
    expect(text.lastIndexOf(revised.usage)).toBeGreaterThan(text.lastIndexOf(denkst.usage))
    return 'y'
  }
  const generate = jest.fn().mockResolvedValueOnce(denkst).mockResolvedValueOnce(revised)
  const result = await prepareVerbDictionaryExplanation(denkenInput, { generate, ask, log, columns: 100, chalkRef: new Chalk({ level: 0 }) })
  expect(result).toBe(revised)
})

test('failed companion explanation can request a new example using the failure reason', async () => {
  const log = jest.fn()
  const ask = jest.fn(async prompt => {
    expect(prompt).toBe('Choose: ')
    const menu = log.mock.calls.flat().join(' ')
    expect(menu).toContain('[N] New example')
    expect(menu).toContain('[E] Edit example')
    return 'n'
  })
  const result = await prepareVerbDictionaryExplanation({ ...input, companionSentence: explanation.example }, {
    generate: async () => { throw new Error('wrong lemma: nachsehen') }, ask, log,
  })
  expect(result.reviewFeedback).toContain('nachsehen')
  expect(result.reviewFeedback).toContain('sein')
  expect(result.reviewFeedback).toContain('wäre')
})


test('action menu uses aligned columns, stacks on narrow terminals, and preserves text with color', () => {
  const state = { ready: true, companion: true }
  const plain = formatDictionaryReviewActions(state, { chalkRef: new Chalk({ level: 0 }), columns: 80 })
  expect(plain).toContain('  [Y] Add both        [R] Regenerate')
  expect(plain).toContain('  [E] Edit example    [S] Audio only')
  expect(plain).not.toContain('Accepting this card')
  const narrow = formatDictionaryReviewActions(state, { chalkRef: new Chalk({ level: 0 }), columns: 32 })
  expect(narrow).toContain('  [Y] Add both\n  [R] Regenerate\n')
  const color = formatDictionaryReviewActions(state, { chalkRef: new Chalk({ level: 1 }), columns: 80 })
  expect(stripVTControlCharacters(color)).toBe(plain)
  expect(color).toContain('\u001b[32m[Y]')
  expect(color).toContain('\u001b[33m[R]')
  expect(color).not.toContain('\u001b[36m')
})

test('Enter still accepts both cards and audio-only still skips the form', async () => {
  const options = { generate: async () => explanation, log: () => {} }
  const companion = { ...input, companionSentence: explanation.example }
  expect(await prepareVerbDictionaryExplanation(companion, { ...options, ask: async () => '' })).toEqual(explanation)
  expect(await prepareVerbDictionaryExplanation(companion, { ...options, ask: async () => 's' })).toBeNull()
})
