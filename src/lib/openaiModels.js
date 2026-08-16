import { config } from './config.js';

export const OPENAI_MODEL_ROLES = Object.freeze({
  generation: 'generation',
  validation: 'validation',
  utility: 'utility',
});

const ROLE_CONFIG = Object.freeze({
  generation: {
    modelKey: 'openaiGenerationModel',
    effortKey: 'openaiGenerationReasoningEffort',
  },
  validation: {
    modelKey: 'openaiValidationModel',
    effortKey: 'openaiValidationReasoningEffort',
  },
  utility: {
    modelKey: 'openaiUtilityModel',
    effortKey: 'openaiUtilityReasoningEffort',
  },
});

function normalizeRole(role) {
  return ROLE_CONFIG[role] ? role : OPENAI_MODEL_ROLES.generation;
}

function supportsReasoningEffort(model) {
  return /^gpt-5(?:\.|-|$)/i.test(String(model || ''));
}

function normalizeRequestForModel(model, request) {
  const normalized = { ...request };
  if (supportsReasoningEffort(model)) {
    delete normalized.temperature;
    delete normalized.top_p;
  }
  return normalized;
}

export function getOpenAIModel(role = OPENAI_MODEL_ROLES.generation) {
  const normalizedRole = normalizeRole(role);
  const { modelKey } = ROLE_CONFIG[normalizedRole];
  return String(config[modelKey] || config.openaiModel || '').trim();
}

export function getOpenAIReasoningEffort(role = OPENAI_MODEL_ROLES.generation) {
  const normalizedRole = normalizeRole(role);
  const { effortKey } = ROLE_CONFIG[normalizedRole];
  return String(config[effortKey] || '').trim();
}

/**
 * Adds the model and compatible reasoning settings to a Chat Completions request.
 */
export function withOpenAIModel(role, request = {}) {
  const model = getOpenAIModel(role);
  const effort = getOpenAIReasoningEffort(role);
  const modelSettings = { model };
  const compatibleRequest = normalizeRequestForModel(model, request);

  if (effort && supportsReasoningEffort(model)) {
    modelSettings.reasoning_effort = effort;
  }

  return {
    ...modelSettings,
    ...compatibleRequest,
  };
}
