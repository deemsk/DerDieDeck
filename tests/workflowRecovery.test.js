import { jest } from '@jest/globals'
import {
  RecoverableWorkflowError,
  buildRecoveryChoices,
  runWithWorkflowRecovery,
} from '../src/workflowRecovery.js'

describe('workflow recovery', () => {
  test('offers numbered actions and only adds manual sentence when it can help', () => {
    expect(buildRecoveryChoices().map((choice) => choice.id)).toEqual([
      'retry',
      'edit-input',
      'word',
      'verb',
      'skip',
    ])
    expect(buildRecoveryChoices({ allowManualSentence: true }).map((choice) => choice.id)).toEqual([
      'retry',
      'edit-input',
      'manual-sentence',
      'word',
      'verb',
      'skip',
    ])
  })

  test('automatically retries one recoverable AI failure', async () => {
    const runAttempt = jest.fn()
      .mockRejectedValueOnce(new RecoverableWorkflowError('weak analysis', { workflow: 'word' }))
      .mockResolvedValueOnce(true)
    const ask = jest.fn()

    await expect(runWithWorkflowRecovery({
      input: 'über',
      runAttempt,
      ask,
      write: jest.fn(),
    })).resolves.toBe(true)

    expect(runAttempt).toHaveBeenCalledTimes(2)
    expect(runAttempt.mock.calls[1][0]).toEqual(expect.objectContaining({ forcedRoute: 'word' }))
    expect(ask).not.toHaveBeenCalled()
  })

  test('lets the user provide a sentence after automatic repair fails', async () => {
    const failure = new RecoverableWorkflowError('ambiguous cloze', {
      workflow: 'word',
      allowManualSentence: true,
    })
    const runAttempt = jest.fn()
      .mockRejectedValueOnce(failure)
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(true)
    const ask = jest.fn()
      .mockResolvedValueOnce('3')
      .mockResolvedValueOnce('Darauf freue ich mich schon.')

    await expect(runWithWorkflowRecovery({
      input: 'darauf',
      runAttempt,
      ask,
      write: jest.fn(),
    })).resolves.toBe(true)

    expect(runAttempt.mock.calls[2][0]).toEqual(expect.objectContaining({
      forcedRoute: 'word',
      options: expect.objectContaining({ sentence: 'Darauf freue ich mich schon.' }),
    }))
  })

  test('does not silently swallow ordinary errors', async () => {
    const runAttempt = jest.fn().mockRejectedValue(new Error('network unavailable'))
    const ask = jest.fn().mockResolvedValue('5')
    const write = jest.fn()

    await expect(runWithWorkflowRecovery({
      input: 'über',
      runAttempt,
      ask,
      write,
    })).resolves.toBe(false)

    expect(runAttempt).toHaveBeenCalledTimes(1)
    expect(write).toHaveBeenCalledWith(expect.stringContaining('network unavailable'))
    expect(write).toHaveBeenCalledWith('Skipped "über" by user choice.')
  })
})
