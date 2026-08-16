import {
  getOpenAIModel,
  getOpenAIReasoningEffort,
  OPENAI_MODEL_ROLES,
  withOpenAIModel,
} from '../src/lib/openaiModels.js'
import { migrateLegacyOpenAIModelSettings } from '../src/lib/config.js'

describe('OpenAI model roles', () => {
  test('maps content, validation, and utility work to separate GPT-5.6 tiers', () => {
    expect(getOpenAIModel(OPENAI_MODEL_ROLES.generation)).toBe('gpt-5.6-terra')
    expect(getOpenAIModel(OPENAI_MODEL_ROLES.validation)).toBe('gpt-5.6-sol')
    expect(getOpenAIModel(OPENAI_MODEL_ROLES.utility)).toBe('gpt-5.6-luna')
  })

  test('makes reasoning effort explicit for every GPT-5.6 role', () => {
    expect(getOpenAIReasoningEffort(OPENAI_MODEL_ROLES.generation)).toBe('low')
    expect(getOpenAIReasoningEffort(OPENAI_MODEL_ROLES.validation)).toBe('low')
    expect(getOpenAIReasoningEffort(OPENAI_MODEL_ROLES.utility)).toBe('none')

    expect(withOpenAIModel(OPENAI_MODEL_ROLES.validation, { temperature: 0 })).toEqual({
      model: 'gpt-5.6-sol',
      reasoning_effort: 'low',
    })
  })

  test('migrates the former default while preserving intentional custom models', () => {
    expect(migrateLegacyOpenAIModelSettings({ openaiModel: 'gpt-4o-mini' })).toEqual({
      openaiModel: 'gpt-4o-mini',
    })
    expect(migrateLegacyOpenAIModelSettings({ openaiModel: 'gpt-4.1' })).toEqual({
      openaiModel: 'gpt-4.1',
      openaiGenerationModel: 'gpt-4.1',
      openaiValidationModel: 'gpt-4.1',
      openaiUtilityModel: 'gpt-4.1',
    })
  })
})
