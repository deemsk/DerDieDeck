import { createInterface } from 'node:readline/promises';
import chalk from 'chalk';

async function question(prompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return await rl.question(prompt); } finally { rl.close(); }
}

export async function reviewClozeAlternatives(target, alternatives, { ask = question, log = console.log } = {}) {
  log(`\nOther valid answers: ${alternatives.join(', ')}`);
  log(`This example cannot uniquely test “${target}”.`);
  log(`${chalk.yellow('[S]')} Sentence card    ${chalk.yellow('[E]')} Edit example    ${chalk.yellow('[D]')} Skip`);
  while (true) {
    const answer = String(await ask('Choose [D]: ')).trim().toLowerCase();
    if (answer === 's') return { action: 'sentence' };
    if (answer === 'e') {
      const german = String(await ask('Enter an example sentence (Enter to skip): ')).trim();
      return german ? { action: 'edit', german } : { action: 'skip' };
    }
    if (['', 'd'].includes(answer)) return { action: 'skip' };
  }
}
