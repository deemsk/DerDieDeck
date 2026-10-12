import { formatCardPreview } from './cardPreview.js';
import { createInterface } from 'node:readline/promises';
import chalk from 'chalk';
import { explainVerbForm } from './verbFormEnricher.js';
import { validateVerbFormExplanation } from './cardContent/verbFormExplanation.js';
import { askReviewFeedback } from './confirm.js';

export function formatVerbDictionaryPreview({ verbData, selectedMeaning, formExplanation, formPronunciation = null }, {
  chalkRef = chalk, columns = process.stdout.columns || 80,
} = {}) {
  const e = formExplanation;
  const emphasize = (text) => chalkRef.bold.cyan(text);
  const groups = [
    [['Front', e.form, emphasize]],
    [
      ['Back', e.formMeaning, chalkRef.bold],
      ['Pronunciation', formPronunciation?.ipa],
      ['Infinitive', verbData.infinitive],
      ['Grammar', e.grammar],
      ['Usage', e.usage],
      ['Other readings', e.ambiguity],
      ['Contrast', e.contrast],
    ],
    [['Example', e.example.german, chalkRef.bold], ['', e.example.russian, chalkRef.dim]],
  ].map((group) => group.filter(([, value]) => String(value || '').trim()));
  return formatCardPreview(groups, { chalkRef, columns });
}

export function formatDictionaryReviewActions({ ready, companion }, {
  chalkRef = chalk, columns = process.stdout.columns || 80,
} = {}) {
  const actions = ready
    ? companion
      ? [['Y', 'Add both'], ['R', 'Regenerate'], ['E', 'Edit example'], ['S', 'Audio only'], ['D', 'Cancel']]
      : [['Y', 'Add card'], ['R', 'Regenerate'], ['S', 'Skip']]
    : companion
      ? [['N', 'New example'], ['E', 'Edit example'], ['R', 'Retry explanation'], ['S', 'Audio only'], ['D', 'Cancel']]
      : [['R', 'Retry'], ['S', 'Skip']];
  const labels = actions.map(([key, label]) => `[${key}] ${label}`);
  const cellWidth = Math.max(...labels.map(label => label.length)) + 4;
  const twoColumns = 2 + cellWidth + Math.max(...labels.filter((_label, index) => index % 2).map(label => label.length), 0) <= columns;
  const lines = [chalkRef.dim(`  ${ready ? 'Ready to add' : 'Form card unavailable'}`)];
  if (ready) lines.push('    • Form card');
  if (companion) lines.push(ready ? '    • Audio sentence card' : '    • Audio sentence card available');
  lines.push('');
  for (let index = 0; index < actions.length; index += twoColumns ? 2 : 1) {
    const render = (position) => {
      const [key, label] = actions[position];
      const style = key === 'Y' ? chalkRef.bold.green : chalkRef.bold.yellow;
      return `${style(`[${key}]`)} ${label}`;
    };
    let line = `  ${render(index)}`;
    if (twoColumns && actions[index + 1]) {
      line += ' '.repeat(cellWidth - labels[index].length) + render(index + 1);
    }
    lines.push(line);
  }
  return lines.join('\n') + '\n';
}

async function question(prompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(prompt);
  } finally {
    rl.close();
  }
}

export async function prepareVerbDictionaryExplanation({
  verbData, selectedMeaning, focusForm = null, selectedSentence = null,
  formPronunciation = null, companionSentence = null, learnerProfileContext = null,
}, { generate = explainVerbForm, ask = question, askSentenceReview = askReviewFeedback,
  log = console.log, chalkRef = chalk, columns = process.stdout.columns || 80 } = {}) {
  const context = {
    ...(learnerProfileContext ? { learnerProfileContext } : {}),
    form: focusForm || verbData.displayForm || verbData.infinitive,
    infinitive: verbData.infinitive,
    meaning: selectedMeaning?.russian,
    selectedSentence,
  };
  while (true) {
    let explanation;
    let failureReason;
    try {
      log('Preparing dictionary form explanation...');
      explanation = validateVerbFormExplanation(await generate(context), context);
      log(`\n${formatVerbDictionaryPreview({ verbData, selectedMeaning, formExplanation: explanation, formPronunciation }, { chalkRef, columns })}\n`);
    } catch (error) {
      explanation = null;
      failureReason = error.message;
      log(`Dictionary card not prepared: ${error.message}`);
    }
    while (true) {
      log(formatDictionaryReviewActions({ ready: Boolean(explanation), companion: Boolean(companionSentence) }, { chalkRef, columns }));
      const answer = String(await ask(explanation ? 'Choose [Y]: ' : 'Choose: ')).trim().toLowerCase();
      if (companionSentence && ['d', 'dismiss'].includes(answer)) return false;
      if (companionSentence && !explanation && ['n', 'new'].includes(answer)) {
        return { reviewFeedback: `Replace this example with a different short sentence using the exact form ${context.form} of ${context.infinitive}, preserving its intended meaning. Fix the reason for rejection: ${failureReason}` };
      }
      if (companionSentence && ['e', 'edit'].includes(answer)) {
        const reviewFeedback = await askSentenceReview();
        if (reviewFeedback) return { reviewFeedback };
        continue;
      }
      if (['s', 'skip', 'n', 'no'].includes(answer)) return null;
      if (['r', 'retry', 'regenerate'].includes(answer)) break;
      if (explanation && ['', 'y', 'yes'].includes(answer)) return explanation;
    }
  }
}
