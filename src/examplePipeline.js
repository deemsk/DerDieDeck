import { containsVerbForm } from './cardContent/verbFormExplanation.js';

/** Preserve a chosen translation only while it still refers to the same German text. */
export function sameGermanExample(left, right) {
  const canonicalText = value => String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  return Boolean(canonicalText(left)) && canonicalText(left) === canonicalText(right);
}

export function pairEnrichedExample(enriched = {}, chosen = {}) {
  const sameText = sameGermanExample(enriched.german, chosen.german);
  const russian = sameText && String(chosen.russian || '').trim() ? chosen.russian : enriched.russian;
  return { ...enriched, russian };
}

/** Shared lifecycle; target/sense/grammar reviews are supplied as policies. */
export async function runExamplePipeline({ context, prepare, validate, maxRepairs = 1 }) {
  let feedback = null;
  let previousExample = null;
  for (let attempt = 0; attempt <= maxRepairs; attempt++) {
    const example = await prepare({ context, feedback, previousExample, attempt });
    previousExample = example;
    if (!example?.german?.trim() || !example?.russian?.trim()) {
      feedback = 'Example must include German text and a complete Russian translation.';
      continue;
    }
    if (context?.requireExactForm !== false && (!example?.focusForm?.trim() || !containsVerbForm(example.german, example.focusForm))) {
      feedback = 'Example must contain the target surface form.';
      continue;
    }
    const review = await validate(example, context);
    if (review?.valid === true) return example;
    feedback = review?.reason || 'Example review did not accept the selected meaning and translation.';
  }
  throw new Error(`Could not prepare an example for the selected meaning: ${feedback}`);
}
