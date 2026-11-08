import chalk from 'chalk';
import { generateImageSearchQuery } from './imageSearchEnricher.js';
import { buildGoogleImagesUrl } from './lib/wordSources.js';
import { normalizeGermanForCompare } from './cardContent/german.js';

export function senseSpecificFallback(meaning = {}, target = '', example = null) {
  const normalizedHead = text => normalizeGermanForCompare(String(text || '').normalize('NFC')).replace(/^(der|die|das)\s+/, '');
  const bareTarget = normalizedHead(target);
  if (meaning.userProvided) return String(example?.german || '').trim();
  const english = String(meaning.english || '').trim();
  return (Array.isArray(meaning.imageSearchTerms) ? meaning.imageSearchTerms : [])
    .find(term => typeof term === 'string' && term.trim() && normalizedHead(term) !== bareTarget)?.trim() ||
    (normalizedHead(english) !== bareTarget ? english : '') || String(example?.german || '').trim();
}

export async function prepareContextualImageSearch({ target, meaning, example, fallbackQuery = '', spinner }) {
  try {
    spinner.start('Preparing image search scenes...');
    const query = await generateImageSearchQuery({ target, meaning, example });
    spinner.stop();
    return { query, url: buildGoogleImagesUrl(query) };
  } catch {
    spinner.stop();
    console.log(chalk.dim('Could not generate an image search. Using available context as a fallback.'));
    const query = String(fallbackQuery || '').trim() || String(target || '').trim();
    return { query, url: buildGoogleImagesUrl(query) };
  }
}
