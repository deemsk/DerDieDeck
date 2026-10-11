import { reviewVerbExamples } from './verbSentenceValidation.js';
import { createInterface } from 'readline';
import chalk from 'chalk';
import { askReviewFeedback, playAudio } from './confirm.js';
import { normalizeGermanForCompare } from './cardContent/german.js';

function ask(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function label(text) {
  return chalk.cyan(text);
}

function formatImageSelectionLabel(imageChoice) {
  if (!imageChoice) {
    return 'none';
  }

  return imageChoice.source || imageChoice.type || 'image';
}

export function formatVerbPreviewSummary(chalkRef, verbData, translation, cefrLevel = null) {
  const meta = ['verb'];

  if (cefrLevel) {
    meta.push(cefrLevel);
  }

  const head = `${chalkRef.bold.cyan(verbData.infinitive)} ${chalkRef.dim(`(${meta.join(', ')})`)}`;
  return translation ? `${head} ${chalkRef.dim('—')} ${translation}` : head;
}

export function formatExistingInfinitiveNotice(chalkRef, infinitive) {
  return `${chalkRef.bold.cyan(infinitive)} is already in Anki and will not be added again.`;
}

export function resolveVerbFocusForm(verbData, chosenSentence = null) {
  return chosenSentence?.focusForm ||
    (verbData.displayForm && verbData.displayForm !== verbData.infinitive ? verbData.displayForm : null);
}

function containsRequestedForm(sentence, form) {
  const normalizedForm = normalizeGermanForCompare(form);
  const normalizedSentence = normalizeGermanForCompare(sentence);
  return Boolean(normalizedForm && (` ${normalizedSentence} `).includes(` ${normalizedForm} `));
}

export function filterVerbExampleSentences(examples, requestedForm = null, limit = 3) {
  const candidates = Array.isArray(examples) ? examples : [];
  return (requestedForm
    ? candidates.filter((sentence) => containsRequestedForm(sentence?.german, requestedForm))
    : candidates).slice(0, limit);
}

export async function chooseVerbSentence(verbData, preferredSentence = null, { askInput = ask, write = console.log } = {}) {
  const requestedForm = verbData.displayForm &&
    normalizeGermanForCompare(verbData.displayForm) !== normalizeGermanForCompare(verbData.infinitive)
    ? verbData.displayForm
    : null;
  const withFocus = (sentence) => requestedForm ? { ...sentence, focusForm: requestedForm } : sentence;
  const manualSentence = async (prompt) => {
    while (true) {
      const manual = (await askInput(prompt)).trim();
      if (!manual) return null;
      if (requestedForm && !containsRequestedForm(manual, requestedForm)) {
        write(`The example must contain ${requestedForm} as a separate form.`);
        continue;
      }
      if (!(await reviewVerbExamples(verbData, [{ german: manual }])).length) {
        write(`The example does not match ${requestedForm || verbData.displayForm || verbData.infinitive} from ${verbData.infinitive}. Try another sentence.`);
        continue;
      }
      return {
        german: manual,
        russian: verbData.meanings?.[0]?.russian || '',
        focusForm: requestedForm || verbData.displayForm || verbData.infinitive,
      };
    }
  };

  if (preferredSentence) {
    if (requestedForm && !containsRequestedForm(preferredSentence, requestedForm)) {
      write(`The supplied sentence does not contain the requested form ${requestedForm}.`);
      return null;
    }
    if (!(await reviewVerbExamples(verbData, [{ german: preferredSentence }])).length) {
      write(`The supplied sentence does not match ${verbData.infinitive} in this context.`);
      return null;
    }
    const existing = verbData.exampleSentences?.find((sentence) => sentence.german === preferredSentence);
    if (existing) {
      return withFocus(existing);
    }

    return {
      german: preferredSentence,
      russian: verbData.meanings?.[0]?.russian || '',
      focusForm: requestedForm || verbData.displayForm || verbData.infinitive,
    };
  }

  const candidates = filterVerbExampleSentences(verbData.exampleSentences, requestedForm, Infinity);
  if (candidates.length) write(chalk.dim(`Checking example sentences for ${verbData.infinitive}...`));
  const sentences = (await reviewVerbExamples(verbData, candidates)).slice(0, 3);
  if (candidates.length && !sentences.length) {
    write(`No suggested example matches ${requestedForm || verbData.infinitive} from ${verbData.infinitive}.`);
    return manualSentence(`Enter another example for ${verbData.infinitive}, or press Enter to skip: `);
  }
  if (sentences.length === 0) {
    if (requestedForm) write(`No suggested example contains ${requestedForm}.`);
    return manualSentence(requestedForm
      ? `Enter a sentence with ${requestedForm}, or press Enter to skip: `
      : 'Enter an example sentence for this verb, or press Enter to skip: ');
  }

  if (sentences.length === 1) {
    if (requestedForm) write(`Using example with ${requestedForm}: ${sentences[0].german}`);
    return withFocus(sentences[0]);
  }

  write();
  write(requestedForm ? `Example sentences with ${requestedForm}:` : `Example sentences for ${verbData.infinitive}:`);
  sentences.forEach((sentence, index) => {
    write(`  ${index + 1}. ${sentence.german}`);
    if (sentence.russian) {
      write(`     ${sentence.russian}`);
    }
  });

  while (true) {
    const answer = await askInput(`Choose sentence [1-${sentences.length}, Enter=1, E=edit]: `);
    const normalized = answer.toLowerCase();

    if (normalized === '') {
      return withFocus(sentences[0]);
    }

    if (normalized === 'e' || normalized === 'edit') {
      const manual = await manualSentence(requestedForm
        ? `Enter a sentence with ${requestedForm}, or press Enter to return: `
        : 'Enter an example sentence: ');
      if (!manual) continue;
      return manual;
    }

    const index = parseInt(normalized, 10);
    if (!Number.isNaN(index) && index >= 1 && index <= sentences.length) {
      return withFocus(sentences[index - 1]);
    }
  }
}

export async function confirmPictureVerbSelection({
  verbData,
  selectedMeaning,
  cefrLevel = null,
  frequencyInfo,
  duplicateInfo,
  imageChoice,
  showImage = true,
  audioSource,
  audioPath,
  loadAudio = null,
  addDictionaryForm = false,
  requestedForm = null,
  optionalInfinitive = false,
  dictionaryContext = null,
  contrast = null,
  theme = null,
  autoPlay = true,
  askInput = ask,
  write = console.log,
}) {
  if (requestedForm) throw new Error('Requested forms require the complete dictionary review.');
  let personalConnection = null;
  let dictionaryFormEnabled = addDictionaryForm;

  if (autoPlay && audioPath && !optionalInfinitive) {
    try {
      await playAudio(audioPath);
    } catch {
      // Ignore initial audio errors.
    }
  }

  while (true) {
    write();
    if (optionalInfinitive) write(chalk.dim('Optional infinitive card'));
    write(formatVerbPreviewSummary(chalk, verbData, selectedMeaning.russian, cefrLevel));
    if (verbData.ipa) {
      write(`${label('IPA:')} ${verbData.ipa}`);
    }
    write(`${label('Frequency:')} ${frequencyInfo.bandLabel}${frequencyInfo.rank ? ` (#${frequencyInfo.rank})` : ''}`);
    if (audioSource) write(`${label('Audio:')} ${audioSource}`);
    if (showImage) {
      write(`${label('Image:')} ${formatImageSelectionLabel(imageChoice)}`);
    }
    if (!optionalInfinitive) write(`${label('Dictionary form card:')} ${dictionaryFormEnabled ? 'yes' : 'no'}`);
    if (optionalInfinitive) {
      const example = verbData.exampleSentences?.[0];
      if (example?.german) write(`${label('Example:')} ${example.german}`);
      if (example?.russian) write(`${label('Russian:')} ${example.russian}`);
      if (dictionaryContext) write(`${label('Form context:')} ${dictionaryContext}`);
      if (contrast) write(`${label('Contrast:')} ${contrast}`);
    }
    if (theme) {
      write(`${label('Theme:')} ${theme}`);
    }
    if (personalConnection) {
      write(`${label('Personal connection:')} ${personalConnection}`);
    }
    if (duplicateInfo.headwordMatches.length > 0) {
      write();
      write(label('Existing notes with the same lemma:'));
      duplicateInfo.headwordMatches.slice(0, 3).forEach((match) => {
        write(`  - ${match.canonical}${match.meaning ? ` (${match.meaning})` : ''}`);
      });
    }

    if (optionalInfinitive) {
      write();
      write(`  ${chalk.bold.yellow('[A]')} Add infinitive card    ${chalk.bold.yellow('[S]')} Skip`);
      write(`  ${chalk.bold.yellow('[L]')} Listen                 ${chalk.bold.yellow('[P]')} Personal connection`);
    }
    const prompt = optionalInfinitive ? 'Choose [S]: '
      : '[A]dd, [L]isten, [T]oggle form card, [P]ersonal connection, [D]ismiss: ';
    const answer = await askInput(prompt);
    const normalized = answer.toLowerCase();

    if (optionalInfinitive && ['', 's', 'skip', 'd', 'dismiss'].includes(normalized)) {
      return { confirmed: false, personalConnection: null, addDictionaryForm: false };
    }
    if (normalized === '' || normalized === 'a' || normalized === 'add') {
      return { confirmed: true, personalConnection, addDictionaryForm: dictionaryFormEnabled };
    }

    if (normalized === 'l' || normalized === 'listen') {
      try {
        if (!audioPath && loadAudio) audioPath = await loadAudio();
        if (!audioPath) continue;
        await playAudio(audioPath);
      } catch (err) {
        write(`Could not play audio: ${err.message}`);
      }
      continue;
    }

    if (normalized === 't' || normalized === 'toggle') {
      if (optionalInfinitive) continue;
      dictionaryFormEnabled = !dictionaryFormEnabled;
      continue;
    }

    if (normalized === 'p' || normalized === 'personal') {
      const connection = await askInput('Personal connection (optional, Enter clears): ');
      personalConnection = connection || null;
      continue;
    }

    return { confirmed: false, personalConnection: null, addDictionaryForm: false };
  }
}

export async function confirmSentenceVerbSelection({
  verbData,
  selectedMeaning,
  sentenceData,
  chosenSentence,
  audioPath,
  similarCards = [],
  addDictionaryForm = false,
  requestedForm = null,
  autoPlay = true,
  askInput = ask,
  write = console.log,
}) {
  if (requestedForm) throw new Error('Requested forms require the complete dictionary review.');
  let dictionaryFormEnabled = addDictionaryForm;

  if (autoPlay && audioPath) {
    try {
      await playAudio(audioPath);
    } catch {
      // Ignore initial audio errors.
    }
  }

  while (true) {
    write();
    write(formatVerbPreviewSummary(chalk, verbData, selectedMeaning.russian, sentenceData.cefr?.level || null));
    write(`${label('Sentence:')} ${sentenceData.german}`);
    if (sentenceData.ipa) {
      write(`${label('IPA:')} ${sentenceData.ipa}`);
    }
    if (sentenceData.russian) {
      write(`${label('Russian:')} ${sentenceData.russian}`);
    }
    const focusForm = resolveVerbFocusForm(verbData, chosenSentence);
    if (focusForm) {
      write(`${label('Focus form:')} ${focusForm}`);
    }
    write(`${label('Dictionary form card:')} ${dictionaryFormEnabled ? 'yes' : 'no'}`);

    if (similarCards.length > 0) {
      write();
      write(label('Similar cards found:'));
      similarCards.slice(0, 3).forEach((card) => {
        write(`  - ${card.similarity}% "${card.german}"`);
      });
    }

    const answer = await askInput('[A]dd, [L]isten, [T]oggle form card, [R]eview, [D]ismiss: ');
    const normalized = answer.toLowerCase();

    if (normalized === '' || normalized === 'a' || normalized === 'add') {
      return { confirmed: true, addDictionaryForm: dictionaryFormEnabled };
    }

    if (normalized === 'l' || normalized === 'listen') {
      if (!audioPath) continue;
      try {
        await playAudio(audioPath);
      } catch (err) {
        write(`Could not play audio: ${err.message}`);
      }
      continue;
    }

    if (normalized === 't' || normalized === 'toggle') {
      dictionaryFormEnabled = !dictionaryFormEnabled;
      continue;
    }

    if (normalized === 'r' || normalized === 'review') {
      const feedback = await askReviewFeedback();
      if (!feedback) {
        continue;
      }
      return { confirmed: false, addDictionaryForm: dictionaryFormEnabled, reviewFeedback: feedback };
    }

    return { confirmed: false, addDictionaryForm: false };
  }
}

/**
 * Confirms a multi-card explicit morphology package with one compact preview.
 */
export async function confirmStrongVerbPackage({
  verbData,
  selectedMeaning,
  morphology,
  packagePlan,
}) {
  while (true) {
    console.log();
    console.log(formatVerbPreviewSummary(chalk, verbData, selectedMeaning.russian, null));
    console.log(`${label('Morphology:')} ${morphology.classification} (${morphology.source})`);
    console.log(`${label('Forms:')} ${packagePlan.forms.map((form) => `${form.label} ${form.form}`).join(', ')}`);
    console.log(`${label('Cards:')} 1 lemma, ${packagePlan.forms.length * 2} key-form, ${packagePlan.sentences.length} sentence, ${packagePlan.sentences.length} cloze`);
    console.log();
    packagePlan.sentences.forEach((sentence) => {
      console.log(`  - ${sentence.german}`);
      if (sentence.russian) {
        console.log(chalk.dim(`    ${sentence.russian}`));
      }
    });

    const answer = await ask('[A]dd package or [D]ismiss: ');
    const normalized = answer.toLowerCase();
    if (normalized === '' || normalized === 'a' || normalized === 'add') {
      return { confirmed: true };
    }

    if (normalized === 'd' || normalized === 'dismiss') {
      return { confirmed: false };
    }
  }
}
