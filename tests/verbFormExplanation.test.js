import { containsVerbForm, validateVerbFormExplanation } from '../src/cardContent/verbFormExplanation.js'
import { buildVerbDictionaryNote } from '../src/templates/verb/dictionary.js'

export const hypothetical = {
  form: 'wäre', infinitive: 'sein', formMeaning: 'был бы / была бы / было бы',
  grammar: 'Konjunktiv II; 1-е или 3-е лицо, единственное число',
  usage: 'Желание или воображаемое состояние в настоящем или будущем, не обычное прошлое.',
  ambiguity: 'Без контекста: ich / er / sie / es. В примере — ich.', contrast: null,
  example: { german: 'Ich wäre gern zu Hause.', russian: 'Я хотел бы быть дома.' },
}

describe('verb form explanations', () => {
  test.each([
    ['Ich wäre gern zu Hause.', 'wäre', true],
    ['Ich war zu Hause.', 'wäre', false],
    ['Er kommt heute an.', 'kommt an', true],
    ['Er bekommt heute einen Brief.', 'kommt', false],
    ['An der Ecke kommt er.', 'kommt an', false],
    ['Sie sind verbunden.', 'verbunden', true],
  ])('matches exact target tokens: %s / %s', (sentence, form, expected) => {
    expect(containsVerbForm(sentence, form)).toBe(expected)
  })

  test('accepts a complete explanation and preserves final selected context', () => {
    expect(validateVerbFormExplanation(hypothetical, {
      form: 'wäre', infinitive: 'sein', selectedSentence: hypothetical.example,
    })).toEqual(hypothetical)
  })

  test.each([
    { formMeaning: '' }, { grammar: '' }, { usage: '' }, { infinitive: 'werden' },
    { form: 'war' }, { example: { german: 'Ich war zu Hause.', russian: 'Я был дома.' } },
    { example: { german: 'Ich wäre gern zu Hause.', russian: '' } },
  ])('rejects incomplete or mismatched content: %j', (patch) => {
    expect(() => validateVerbFormExplanation({ ...hypothetical, ...patch }, {
      form: 'wäre', infinitive: 'sein',
    })).toThrow()
  })

  test('rejects a stale example when the final sentence contains the target', () => {
    expect(() => validateVerbFormExplanation(hypothetical, {
      form: 'wäre', infinitive: 'sein', selectedSentence: { german: 'Er wäre gern hier.' },
    })).toThrow(/selected sentence/i)
  })

  test('renders meaning, grammar, example, then labeled infinitive pronunciation', () => {
    const note = buildVerbDictionaryNote({
      verbData: { infinitive: 'sein', displayForm: 'wäre', ipa: '[zaɪn]' },
      selectedMeaning: { russian: 'быть' }, formExplanation: hypothetical,
      pronunciationField: '[sound:sein.mp3]<br>[zaɪn]',
    })
    expect(note.front).toBe('<span class="yt2anki-word-display ddd-word-display">wäre</span>')
    const positions = ['был бы', 'Konjunktiv II', 'Ich wäre', 'Инфинитив', '[sound:sein.mp3]']
      .map((text) => note.back.indexOf(text))
    expect(positions.every((pos) => pos >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(note.back).toContain('Я хотел бы быть дома.')
    expect(note.back).not.toContain('style=')
  })

  test('escapes explanation text and rejects lemma-only template input', () => {
    const args = { verbData: { infinitive: 'sein', displayForm: 'wäre' }, selectedMeaning: { russian: 'быть' } }
    expect(() => buildVerbDictionaryNote(args)).toThrow(/explanation/i)
    const note = buildVerbDictionaryNote({ ...args, formExplanation: { ...hypothetical, usage: 'Желание <script>bad</script>' } })
    expect(note.back).not.toContain('<script>')
    expect(note.back).toContain('&lt;script&gt;')
  })
})
