import { createInterface } from 'node:readline/promises';
import chalk from 'chalk';
import { explainVerbForm } from './verbFormEnricher.js';
import { validateVerbFormExplanation } from './cardContent/verbFormExplanation.js';

function wrapText(text, width) {
  const lines = [];
  let line = '';
  for (const word of String(text).trim().split(/\s+/u)) {
    if (line && [...`${line} ${word}`].length > width) {
      lines.push(line);
      line = '';
    }
    line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

export function formatVerbDictionaryPreview({ verbData, selectedMeaning, formExplanation }, {
  chalkRef = chalk, columns = process.stdout.columns || 80,
} = {}) {
  const e = formExplanation;
  const emphasize = (text) => chalkRef.bold.cyan(text);
  const groups = [
    [['Front', e.form, emphasize]],
    [
      ['Back', e.formMeaning, chalkRef.bold],
      ['Грамматика', e.grammar],
      ['Употребление', e.usage],
      ['Другие чтения', e.ambiguity],
      ['Различие', e.contrast],
    ],
    [['Пример', e.example.german, chalkRef.bold], ['', e.example.russian, chalkRef.dim]],
    [
      ['Инфинитив', [verbData.infinitive, verbData.ipa].filter(Boolean).join(' ')],
      ['', selectedMeaning?.russian],
    ],
  ].map((group) => group.filter(([, value]) => String(value || '').trim()));
  const labelWidth = Math.max(...groups.flat().map(([name]) => name.length));
  const width = Number.isFinite(columns) && columns > 0 ? columns : 80;
  const stacked = width - labelWidth - 5 < 12;
  const valueWidth = Math.max(1, width - (stacked ? 5 : labelWidth + 5));
  const border = chalkRef.cyan('│');
  const lines = [`${chalkRef.cyan('┌─')} ${chalkRef.bold('Dictionary card')}`];
  groups.forEach((group, index) => {
    if (index) lines.push(border);
    for (const [name, value, style = (text) => text] of group) {
      if (stacked && name) lines.push(`${border}  ${chalkRef.dim(name)}`);
      wrapText(value, valueWidth).forEach((part, lineIndex) => {
        const label = (lineIndex === 0 ? name : '').padEnd(labelWidth);
        lines.push(stacked
          ? `${border}    ${style(part)}`
          : `${border}  ${chalkRef.dim(label)}  ${style(part)}`);
      });
    }
  });
  lines.push(chalkRef.cyan('└─'));
  return lines.join('\n');
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
}, { generate = explainVerbForm, ask = question, log = console.log, chalkRef = chalk, columns = process.stdout.columns || 80 } = {}) {
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
      log(`\n${formatVerbDictionaryPreview({ verbData, selectedMeaning, formExplanation: explanation }, { chalkRef, columns })}\n`);
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
