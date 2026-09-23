import { jest } from '@jest/globals'
import { Chalk } from 'chalk'
import { stripVTControlCharacters } from 'node:util'
import { prepareVerbDictionaryExplanation } from '../src/verbDictionaryPreview.js'
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
    for (const text of ['был бы', 'Konjunktiv II', 'Ich wäre gern zu Hause.', 'Я хотел бы быть дома.', 'Инфинитив', '[zaɪn]', 'быть']) {
      expect(preview).toContain(text)
    }
    return 'y'
  })
  expect(await prepareVerbDictionaryExplanation(input, { generate: async () => explanation, ask, log })).toEqual(explanation)
})

test('lets the learner dismiss the fully previewed card', async () => {
  expect(await prepareVerbDictionaryExplanation(input, {
    generate: async () => explanation, ask: async () => 's', log: () => {},
  })).toBeNull()
})

test('failed explanation offers retry; invalid content is never accepted', async () => {
  const generate = jest.fn().mockResolvedValueOnce({}).mockResolvedValueOnce(explanation)
  const ask = jest.fn().mockResolvedValueOnce('r').mockResolvedValueOnce('y')
  expect(await prepareVerbDictionaryExplanation(input, { generate, ask, log: () => {} })).toEqual(explanation)
  expect(ask.mock.calls[0][0]).toContain('[R]etry')
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
    '┌─ Dictionary card',
    '│  Front         denkst',
    '│',
    '│  Back          думаешь',
    '│  Грамматика    Präsens Indikativ · 2-е лицо, ед. число',
    '│  Употребление  Сейчас; в примере — думать о чём-то.',
    '│',
    '│  Пример        Woran denkst du gerade?',
    '│                О чём ты сейчас думаешь?',
    '│',
    '│  Инфинитив     denken [ˈdɛŋkn̩]',
    '│                думать, считать (выражая мнение)',
    '└─',
  ].join('\n'))
  expect(text).not.toContain('Другие чтения')
  expect(text).not.toContain('Различие')
  expect(text).not.toContain('\u001b[')
})

test('wraps long prose and aligns continuations within a narrow terminal', async () => {
  const { text } = await capturePreview(denkst, { columns: 42 })
  const lines = text.split('\n').filter((line) => line.startsWith('│'))
  expect(lines.every((line) => [...line].length <= 42)).toBe(true)
  expect(lines).toContain('│                лицо, ед. число')
  expect(lines.join(' ').replace(/│/g, '').replace(/\s+/g, ' ')).toContain(denkst.usage)
})

test('uses color and emphasis without changing the plain text or wrapping', async () => {
  const plain = await capturePreview(denkst, { columns: 42 })
  const colored = await capturePreview(denkst, { columns: 42, chalkRef: new Chalk({ level: 1 }) })
  expect(colored.text).toContain('\u001b[36m')
  expect(colored.text).toContain('\u001b[1m')
  expect(colored.text).toContain('\u001b[2m')
  expect(stripVTControlCharacters(colored.text)).toBe(plain.text)
})

test('shows useful optional notes and returns the same complete content for the saved card', async () => {
  const value = { ...denkst, ambiguity: 'Полезное уточнение.', contrast: 'Полезное различие.' }
  const { text, result } = await capturePreview(value)
  expect(text).toMatch(/Другие чтения\s+Полезное уточнение\./)
  expect(text).toMatch(/Различие\s+Полезное различие\./)
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
    expect(text).toMatch(/└─\n$/)
    if (attempts++ === 0) return 'r'
    expect(text.lastIndexOf(revised.usage)).toBeGreaterThan(text.lastIndexOf(denkst.usage))
    return 'y'
  }
  const generate = jest.fn().mockResolvedValueOnce(denkst).mockResolvedValueOnce(revised)
  const result = await prepareVerbDictionaryExplanation(denkenInput, { generate, ask, log, columns: 100, chalkRef: new Chalk({ level: 0 }) })
  expect(result).toBe(revised)
})
