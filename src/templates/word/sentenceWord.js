import { buildContrastHint } from '../../cardContent/interference.js';
import { buildWordSentenceContrastFooter } from '../shared/components.js';

export function buildWordSentenceFrontFooter(wordData) {
  const contrast = (wordData?.lexicalType || 'adjective') === 'adjective'
    ? wordData?.opposite || null
    : buildContrastHint(wordData?.canonical || wordData?.lemma);

  return buildWordSentenceContrastFooter(contrast);
}
