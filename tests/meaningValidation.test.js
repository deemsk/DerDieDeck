import { jest } from '@jest/globals'
import { refineAiGeneratedMeanings } from '../src/cardContent/meaningValidation.js'

function buildClient(reviewedMeanings) {
  return {
    chat: {
      completions: {
        create: jest.fn(async () => ({
          choices: [{ message: { content: JSON.stringify({ meanings: reviewedMeanings }) } }],
        })),
      },
    },
  }
}

describe('AI-generated lexical meaning validation', () => {
  test('adds a distinction hidden by a broad Russian translation', async () => {
    const client = buildClient([{
      russian: 'следует; быть должным по указанию',
      english: 'should; be supposed to',
    }])
    const meanings = [{
      russian: 'должен',
      english: 'should',
      imageSearchTerms: ['example asset'],
    }]

    const result = await refineAiGeneratedMeanings({
      client,
      germanTerm: 'sollen',
      lexicalType: 'verb',
      meanings,
      exampleSentences: [{ german: 'Du sollst deine Mutter anrufen.' }],
    })

    expect(result).toEqual([{
      russian: 'следует; быть должным по указанию',
      english: 'should; be supposed to',
      imageSearchTerms: ['example asset'],
    }])

    const request = client.chat.completions.create.mock.calls[0][0]
    expect(request.messages[0].content).toContain('closest commonly confused German words')
    expect(request.messages[0].content).toContain('do not invent a distinction')
    expect(JSON.parse(request.messages[1].content)).toEqual(expect.objectContaining({
      germanTerm: 'sollen',
      proposedMeanings: [{ russian: 'должен', english: 'should' }],
    }))
  })

  test('keeps the original meanings when the reviewer breaks item alignment', async () => {
    const client = buildClient([])
    const meanings = [{ russian: 'знать', english: 'know' }]

    await expect(refineAiGeneratedMeanings({
      client,
      germanTerm: 'kennen',
      lexicalType: 'verb',
      meanings,
    })).resolves.toEqual(meanings)
  })

  test('keeps the original meanings when semantic review fails', async () => {
    const client = buildClient([])
    client.chat.completions.create.mockRejectedValueOnce(new Error('API unavailable'))
    const meanings = [{ russian: 'ставить', english: 'put' }]

    await expect(refineAiGeneratedMeanings({
      client,
      germanTerm: 'stellen',
      lexicalType: 'verb',
      meanings,
    })).resolves.toEqual(meanings)
  })
})
