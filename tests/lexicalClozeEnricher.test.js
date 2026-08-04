import { jest } from '@jest/globals'

const mockCreate = jest.fn()

jest.unstable_mockModule('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}))

jest.unstable_mockModule('../src/lib/secrets.js', () => ({
  resolveSecret: jest.fn(async (value) => value || 'test-key'),
}))

const {
  buildMaskedLexicalCloze,
  generateUnambiguousLexicalClozeSentence,
  verifyLexicalClozeUniqueness,
} = await import('../src/lexicalClozeEnricher.js')

const ihmWord = {
  canonical: 'ihm',
  lemma: 'ihm',
  lexicalType: 'pronoun',
  clozeHint: 'dative pronoun',
}

describe('lexical cloze uniqueness verification', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  test('shows the verifier only the learner-visible masked front', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        unique: false,
        answer: '',
        alternatives: ['ihr', 'ihnen'],
        reason: 'The antecedent does not identify the recipient.',
      }) } }],
    })
    const sentence = { german: 'Sie glaubt ihm nicht.', focusForm: 'ihm' }

    expect(buildMaskedLexicalCloze(sentence, ihmWord)).toBe('Sie glaubt ___ nicht.')
    await expect(verifyLexicalClozeUniqueness(sentence, ihmWord)).resolves.toEqual({
      valid: false,
      unique: false,
      answer: '',
      alternatives: ['ihr', 'ihnen'],
      reason: 'The antecedent does not identify the recipient.',
    })

    const request = mockCreate.mock.calls[0][0]
    expect(request.messages[1].content).toBe(JSON.stringify({
      front: 'Sie glaubt ___ nicht.',
      hint: 'dative pronoun',
    }))
    expect(request.messages.map(({ content }) => content).join('\n')).not.toContain('ihm')
    expect(request.messages[0].content).toContain('Do not choose merely the most likely answer')
  })

  test('accepts only a unique reconstruction that matches the hidden target', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({
        unique: true,
        answer: 'ihm',
        alternatives: [],
        reason: 'The masculine antecedent fixes the dative pronoun.',
      }) } }],
    })
    await expect(verifyLexicalClozeUniqueness({
      german: 'Der Mann sagt die Wahrheit, aber sie glaubt ihm nicht.',
      focusForm: 'ihm',
    }, ihmWord)).resolves.toEqual({
      valid: true,
      unique: true,
      answer: 'ihm',
      alternatives: [],
      reason: 'The masculine antecedent fixes the dative pronoun.',
    })

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({
        unique: true,
        answer: 'ihr',
        alternatives: [],
        reason: 'The feminine antecedent fixes the dative pronoun.',
      }) } }],
    })
    await expect(verifyLexicalClozeUniqueness({
      german: 'Die Frau sagt die Wahrheit, aber sie glaubt ihm nicht.',
      focusForm: 'ihm',
    }, ihmWord)).resolves.toEqual({
      valid: false,
      unique: true,
      answer: 'ihr',
      alternatives: [],
      reason: 'The feminine antecedent fixes the dative pronoun.',
    })
  })

  test('rewrites an ambiguous example with the target available only to the generator', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        german: 'Der Mann sagt die Wahrheit, aber sie glaubt ihm nicht.',
        russian: 'Мужчина говорит правду, но она ему не верит.',
        focusForm: 'ihm',
      }) } }],
    })

    const result = await generateUnambiguousLexicalClozeSentence({
      german: 'Sie glaubt ihm nicht.',
      russian: 'Она ему не верит.',
      focusForm: 'ihm',
    }, ihmWord, {
      diagnosis: {
        answer: '',
        alternatives: ['ihr', 'ihnen'],
        reason: 'The recipient is not identified.',
      },
      attempt: 2,
    })

    expect(result.german).toContain('Der Mann')
    expect(JSON.parse(mockCreate.mock.calls[0][0].messages[1].content)).toEqual(
      expect.objectContaining({
        target: 'ihm',
        repairAttempt: 2,
        previousDiagnosis: expect.objectContaining({ alternatives: ['ihr', 'ihnen'] }),
      })
    )
    expect(mockCreate.mock.calls[0][0].messages[0].content).toContain('governing verb')
  })
})
