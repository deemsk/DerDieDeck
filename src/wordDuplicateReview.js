import { createInterface } from 'node:readline/promises';
import chalk from 'chalk';

async function question(prompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return await rl.question(prompt); } finally { rl.close(); }
}

export async function reviewWordDuplicates(duplicates, { sentence = false, ask = question, log = console.log } = {}) {
  const exact = duplicates.exactMatches || [];
  const matches = [...exact, ...(duplicates.headwordMatches || [])];
  if (!matches.length) return 'new';
  log('\nExisting word cards:');
  for (const match of matches) log(`  ${chalk.bold.cyan(match.canonical)} — ${match.meaning || 'meaning unavailable'} (nid:${match.noteId})`);
  if (exact.length && !sentence) {
    log('This meaning already exists. Skipping the new word card.');
    return 'skip';
  }
  log(sentence ? 'Example only adds the sentence without another word card.' : 'Add only if this is a different meaning.');
  while (true) {
    const prompt = [sentence ? '[E] Example only' : null, !exact.length ? '[N] New meaning' : null, '[S] Skip'].filter(Boolean).join('    ');
    log(prompt);
    const answer = String(await ask(sentence ? 'Choose [E]: ' : 'Choose [S]: ')).trim().toLowerCase();
    if (sentence && ['', 'e'].includes(answer)) return 'example';
    if (!exact.length && answer === 'n') return 'new';
    if (answer === 's' || (!sentence && answer === '')) return 'skip';
  }
}
