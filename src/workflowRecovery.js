export class RecoverableWorkflowError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'RecoverableWorkflowError';
    this.code = options.code || 'generation-failed';
    this.workflow = options.workflow || null;
    this.allowManualSentence = Boolean(options.allowManualSentence);
  }
}

export function isRecoverableWorkflowError(error) {
  return error instanceof RecoverableWorkflowError || error?.name === 'RecoverableWorkflowError';
}

export function buildRecoveryChoices({ allowManualSentence = false } = {}) {
  return [
    { id: 'retry', label: 'Try again with AI' },
    { id: 'edit-input', label: 'Edit the lexical item' },
    ...(allowManualSentence
      ? [{ id: 'manual-sentence', label: 'Enter an example sentence manually' }]
      : []),
    { id: 'word', label: 'Use the word workflow' },
    { id: 'verb', label: 'Use the verb workflow' },
    { id: 'skip', label: 'Skip this item' },
  ];
}

export async function askRecoveryChoice({ error, ask, write = console.log }) {
  const choices = buildRecoveryChoices({
    allowManualSentence: error?.allowManualSentence,
  });

  write('');
  write(`Could not finish this item: ${error?.message || 'unknown error'}`);
  choices.forEach((choice, index) => write(`  ${index + 1}. ${choice.label}`));

  while (true) {
    const answer = await ask(`Choose [1-${choices.length}, Enter=1]: `);
    const normalized = String(answer || '').trim();
    const index = normalized === '' ? 1 : Number.parseInt(normalized, 10);
    if (Number.isInteger(index) && index >= 1 && index <= choices.length) {
      return choices[index - 1].id;
    }
  }
}

export async function runWithWorkflowRecovery({
  input,
  options = {},
  runAttempt,
  ask,
  write = console.log,
}) {
  let currentInput = input;
  let currentOptions = { ...options };
  let forcedRoute = null;
  let automaticRetryUsed = false;

  while (true) {
    try {
      return await runAttempt({
        input: currentInput,
        options: currentOptions,
        forcedRoute,
      });
    } catch (error) {
      if (isRecoverableWorkflowError(error) && !automaticRetryUsed) {
        automaticRetryUsed = true;
        forcedRoute = error.workflow || forcedRoute;
        write(`AI result was unusable: ${error.message}`);
        write('Trying once more with a fresh analysis...');
        continue;
      }

      const action = await askRecoveryChoice({ error, ask, write });
      if (action === 'skip') {
        write(`Skipped "${currentInput}" by user choice.`);
        return false;
      }
      if (action === 'retry') {
        automaticRetryUsed = true;
        continue;
      }
      if (action === 'word' || action === 'verb') {
        forcedRoute = action;
        automaticRetryUsed = true;
        continue;
      }
      if (action === 'edit-input') {
        const edited = await ask('Enter the corrected lexical item: ');
        if (edited) {
          currentInput = edited;
          currentOptions = { ...options };
          forcedRoute = null;
          automaticRetryUsed = false;
        }
        continue;
      }
      if (action === 'manual-sentence') {
        const sentence = await ask('Enter a German example sentence containing the target: ');
        if (sentence) {
          currentOptions = { ...currentOptions, sentence };
          automaticRetryUsed = true;
        }
      }
    }
  }
}
