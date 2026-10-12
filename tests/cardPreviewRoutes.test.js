import { jest } from '@jest/globals'
import { Chalk } from 'chalk'
import { stripVTControlCharacters } from 'node:util'

jest.unstable_mockModule('readline', () => ({ createInterface: () => ({
  question: (_prompt, callback) => callback('d'), close() {},
}) }))
const { confirmWordSelection, confirmSentenceWordSelection } = await import('../src/wordConfirm.js')
const { confirmPictureVerbSelection, confirmSentenceVerbSelection, confirmStrongVerbPackage } = await import('../src/verbConfirm.js')
const { confirmGrammarSelection } = await import('../src/grammarConfirm.js')
const { confirmCard, confirmCardSet } = await import('../src/confirm.js')
const plain = new Chalk({ level: 0 })
const sentence = { german: 'Sie schenkt ihrer Mutter einen Blumenstrauß.', russian: 'Она дарит своей маме букет цветов.', ipa: '[ipa]', context: 'test' }
const word = { canonical: 'der Blumenstrauß', lexicalType: 'noun', plural: 'Blumensträuße', ipa: '[ipa]', exampleSentences: [sentence] }
const base = { selectedMeaning: { russian: 'букет цветов' }, frequencyInfo: { bandLabel: 'Rare' }, duplicateInfo: { headwordMatches: [] }, autoPlay: false, showImage: false, audioSource: 'Google TTS' }
const verb = { ...base, verbData: { infinitive: 'geben', exampleSentences: [sentence] } }
const routes = [
  ['picture noun', () => confirmWordSelection({ ...base, wordData: word }), ['Blumensträuße', 'Google TTS', 'Rare', sentence.german, sentence.russian]],
  ['sentence word', () => confirmSentenceWordSelection({ ...base, wordData: word, sentenceData: sentence }), [sentence.german, sentence.russian]],
  ['picture verb', () => confirmPictureVerbSelection(verb), ['geben', 'Rare']],
  ['optional infinitive', () => confirmPictureVerbSelection({ ...verb, optionalInfinitive: true }), ['Optional infinitive card', sentence.german]],
  ['sentence verb', () => confirmSentenceVerbSelection({ ...verb, sentenceData: sentence }), [sentence.german, sentence.russian]],
  ['verb package', () => confirmStrongVerbPackage({ ...verb, morphology: { classification: 'strong', source: 'Wiktionary' }, packagePlan: { forms: [{ label: 'Past', form: 'gab' }], sentences: [sentence] } }), ['Past gab', sentence.german]],
  ['grammar', () => confirmGrammarSelection({ family: { title: 'Test' }, lemma: 'geben', units: [{ slotHint: 'Past', surfaceForm: 'gab', previewGerman: sentence.german, russian: sentence.russian, explanation: 'Правило' }] }), ['✓ [1]', 'Правило']],
  ['single sentence', () => confirmCard(sentence, plain, null, null, false), [sentence.german, sentence.russian]],
  ['card set', () => confirmCardSet([{ type: 'comprehension', label: 'Listen', front: {}, back: sentence }], sentence, plain, null, null, false), ['✓ [1] Listen', '[audio]', sentence.russian]],
]
test.each(routes)('%s uses a complete framed preview before confirmation', async (_name, run, fields) => {
  const log = jest.spyOn(console, 'log').mockImplementation(() => {})
  try {
    await run()
    const text = stripVTControlCharacters(log.mock.calls.map(args => args.join(' ')).join('\n'))
    const frame = text.slice(text.indexOf('┌─ Card preview'), text.indexOf('└─') + 2)
    expect(frame).toContain('┌─ Card preview')
    expect(frame).toContain('└─')
    const content = frame.replace(/│/g, '').replace(/\s+/g, ' ')
    for (const field of fields) expect(content).toContain(field)
  } finally { log.mockRestore() }
})
