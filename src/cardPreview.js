import chalk from 'chalk';
import { stripVTControlCharacters } from 'node:util';

function wrapText(text, width) {
  const lines = [];
  let line = '';
  for (const word of String(text).trim().split(/\s+/u)) {
    if (line && [...stripVTControlCharacters(`${line} ${word}`)].length > width) {
      lines.push(line);
      line = '';
    }
    line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

// Rows are [label, value, optionalStyle]; null labels span the frame,
// while empty labels align translations with the preceding value.
export function formatCardPreview(groups, {
  chalkRef = chalk, columns = process.stdout.columns || 80,
} = {}) {
  groups = groups.map(group => group.filter(([, value]) => value !== null && value !== undefined && String(value).trim())).filter(group => group.length);
  const labelWidth = Math.max(0, ...groups.flat().map(([name]) => (name || '').length));
  const width = Number.isFinite(columns) && columns > 0 ? columns : 80;
  const stacked = width - labelWidth - 5 < 12;
  const valueWidth = Math.max(1, width - (stacked ? 5 : labelWidth + 5));
  const border = chalkRef.green('│');
  const lines = [`${chalkRef.green('┌─')} ${chalkRef.bold('Card preview')}`];
  groups.forEach((group, index) => {
    if (index) lines.push(border);
    for (const [name, value, style = (text) => text] of group) {
      if (name === null) {
        for (const part of wrapText(value, Math.max(1, width - 3))) lines.push(`${border}  ${style(part)}`);
        continue;
      }
      if (stacked && name) lines.push(`${border}  ${chalkRef.dim(name)}`);
      wrapText(value, valueWidth).forEach((part, lineIndex) => {
        const label = (lineIndex === 0 ? name : '').padEnd(labelWidth);
        lines.push(stacked
          ? `${border}    ${style(part)}`
          : `${border}  ${chalkRef.dim(label)}  ${style(part)}`);
      });
    }
  });
  lines.push(chalkRef.green('└─'));
  return lines.join('\n');
}
