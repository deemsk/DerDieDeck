import { stripHtml } from './html.js';

export function buildWordMetadataComment(metadata) {
  const encoded = encodeURIComponent(JSON.stringify(metadata));
  return `<!-- yt2anki-word:${encoded} -->`;
}

export function parseWordMetadataComment(text = '') {
  const match = String(text).match(/<!--\s*yt2anki-word:(.*?)\s*-->/i);
  if (!match) return null;

  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function extractWordMeaning(extraInfo = '') {
  const metadata = parseWordMetadataComment(extraInfo);
  if (metadata?.meaning) {
    return metadata.meaning;
  }

  const stripped = stripHtml(extraInfo);
  const match = stripped.match(/(?:Meaning|Значение):\s*(.+?)(?:(?:Plural|Множественное число|Example|Пример|Dictionary Form|Словарная форма|Contrast|Различие|Personal Connection):|$)/i);
  return match ? match[1].trim() : null;
}

export function extractCanonicalWord(wordField = '', extraInfo = '') {
  const metadata = parseWordMetadataComment(extraInfo);
  if (metadata?.canonical) {
    return metadata.canonical;
  }

  return stripHtml(String(wordField || '').replace(/<div\b[^>]*class="[^"]*\byt2anki-personal-cue\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ''));
}

export function extractWordLexicalType(extraInfo = '') {
  const metadata = parseWordMetadataComment(extraInfo);
  return metadata?.lexicalType ? String(metadata.lexicalType).trim() : null;
}

/** Split legacy gloss alternatives without splitting semicolons inside qualifiers. */
export function splitLegacyMeaningAlternatives(value = '') {
  const parts = [];
  let current = '';
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const char of String(value || '')) {
    if ('([{'.includes(char)) stack.push(char);
    else if (pairs[char] && stack.at(-1) === pairs[char]) stack.pop();
    if (char === ';' && !stack.length) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}
