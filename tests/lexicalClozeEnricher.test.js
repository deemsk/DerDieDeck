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
  prepareCompactClozeHint,
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
    expect(request).toEqual(expect.objectContaining({
      model: 'gpt-5.6-sol',
      reasoning_effort: 'low',
    }))
    expect(request.messages[1].content).toBe(JSON.stringify({
      front: 'Sie glaubt ___ nicht.',
      hint: 'dative pronoun',
    }))
    expect(request.messages.map(({ content }) => content).join('\n')).not.toContain('ihm')
    expect(request.messages[0].content).toContain('Do not choose merely the most likely answer')
    expect(request.messages[0].content).toContain('hint may be written in Russian')
    expect(request.messages[0].content).toContain('binding constraint')
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
        clozeHint: 'ему, местоимение в Dativ',
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
    expect(result.clozeHint).toBe('ему, местоимение в Dativ')
    expect(JSON.parse(mockCreate.mock.calls[0][0].messages[1].content)).toEqual(
      expect.objectContaining({
        target: 'ihm',
        repairAttempt: 2,
        previousDiagnosis: expect.objectContaining({ alternatives: ['ihr', 'ihnen'] }),
      })
    )
    expect(mockCreate.mock.calls[0][0].messages[0].content).toContain('governing verb')
    expect(mockCreate.mock.calls[0][0].messages[0].content).toContain('Preserve the intendedMeaning exactly')
    expect(mockCreate.mock.calls[0][0]).toEqual(expect.objectContaining({
      model: 'gpt-5.6-terra',
      reasoning_effort: 'low',
    }))
  })

  test('does not let the generator replace the intended focus form', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        german: 'Sie spricht darüber.',
        russian: 'Она говорит об этом.',
        focusForm: 'darüber',
        clozeHint: 'о чём-либо',
      }) } }],
    })

    const result = await generateUnambiguousLexicalClozeSentence({
      german: 'Wir sprechen über das Wetter.',
      russian: 'Мы говорим о погоде.',
      focusForm: 'über',
    }, {
      canonical: 'über',
      lemma: 'über',
      lexicalType: 'preposition',
      clozeHint: 'предлог с Akkusativ или Dativ',
    })

    expect(result).toEqual({
      german: 'Sie spricht darüber.',
      russian: 'Она говорит об этом.',
      focusForm: 'über',
      clozeHint: 'о чём-либо',
    })
  })
})

test('prepares a short Deshalb hint without copying the long analysis hint', async () => {
  mockCreate.mockReset().mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ hint: 'поэтому' }) } }] })
  const hint = await prepareCompactClozeHint({ german: 'Deshalb nahm Anna den Bus.' }, {
    canonical: 'deshalb', clozeHint: 'нейтральное наречие с компонентом половина',
    meanings: [{ russian: 'поэтому, по этой причине (следствие ранее названной причины)' }],
  })
  expect(hint).toBe('поэтому')
  expect(mockCreate.mock.calls[0][0].messages[1].content).not.toContain('половина')
})
test.each(['слово '.repeat(12), '{{c1::ответ}}', 'deshalb', 'therefore'])('rejects invalid hint %s without truncating it', async hint => {
  mockCreate.mockReset().mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ hint }) } }] })
  await expect(prepareCompactClozeHint({ german: 'Deshalb komme ich.' }, { canonical: 'deshalb', meanings: [{ russian: 'поэтому' }] })).rejects.toThrow('compact cloze hint')
  expect(mockCreate).toHaveBeenCalledTimes(2)
})
