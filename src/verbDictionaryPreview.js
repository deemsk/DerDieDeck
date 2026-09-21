import { createInterface } from 'node:readline/promises';
import { explainVerbForm } from './verbFormEnricher.js';
import { validateVerbFormExplanation } from './cardContent/verbFormExplanation.js';
import { buildVerbDictionaryNote } from './templates/verb/dictionary.js';
import { stripHtml } from './cardContent/html.js';

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
}, { generate = explainVerbForm, ask = question, log = console.log } = {}) {
  const context = {
    form: focusForm || verbData.displayForm || verbData.infinitive,
    infinitive: verbData.infinitive,
    meaning: selectedMeaning?.russian,
    selectedSentence,
  };
  while (true) {
    let explanation;
    try {
      log('Preparing dictionary form explanation...');
      explanation = validateVerbFormExplanation(await generate(context), context);
      const note = buildVerbDictionaryNote({ verbData, selectedMeaning, focusForm, formExplanation: explanation });
      const lines = note.back.split(/<\/div>|<\/span>/).map((part) => stripHtml(part)).filter(Boolean);
      log(`\nDictionary card — Front: ${context.form}\nBack:\n${lines.join('\n')}`);
    } catch (error) {
      explanation = null;
      log(`Dictionary card not prepared: ${error.message}`);
    }
    while (true) {
      const answer = String(await ask(explanation
        ? 'Dictionary card: [Y]es, [R]egenerate, [S]kip: '
        : 'Dictionary explanation failed: [R]etry, [S]kip this card: ')).trim().toLowerCase();
      if (['s', 'skip', 'n', 'no'].includes(answer)) return null;
      if (['r', 'retry', 'regenerate'].includes(answer)) break;
      if (explanation && ['', 'y', 'yes'].includes(answer)) return explanation;
    }
  }
}
