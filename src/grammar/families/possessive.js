import { buildEinWordForm, listEinWordSlots } from '../einWord.js';

const FAMILY_ID = 'possessive';
const FAMILY_LABEL = 'Притяжательные формы';
const FORM_PLACEHOLDER = '__FORM__';

const LEMMA_DEFINITIONS = {
  mein: { russianType: 'soft', russianStem: 'мо', russianGloss: 'мой', englishGloss: 'my' },
  dein: { russianType: 'soft', russianStem: 'тво', russianGloss: 'твой', englishGloss: 'your' },
  sein: { russianType: 'indeclinable', russianForm: 'его', russianGloss: 'его', englishGloss: 'his' },
  ihr: { russianType: 'indeclinable', russianForm: 'её', russianGloss: 'её / их', englishGloss: 'her / their' },
  unser: { russianType: 'hard', russianStem: 'наш', russianGloss: 'наш', englishGloss: 'our' },
  euer: { russianType: 'hard', russianStem: 'ваш', russianGloss: 'ваш', englishGloss: 'your (plural)' },
};

const SLOT_TEMPLATES = {
  'nom-masc-sg': {
    german: `${FORM_PLACEHOLDER} Bruder ist hier.`,
    russian: (forms) => `${capitalize(forms['nom-masc-sg'])} брат здесь.`,
    note: 'Перед существительным мужского рода в единственном числе, которое является подлежащим.',
    headNoun: 'Bruder',
  },
  'acc-masc-sg': {
    german: `Ich sehe ${FORM_PLACEHOLDER} Bruder.`,
    russian: (forms) => `Я вижу ${forms['acc-masc-sg']} брата.`,
    note: 'С существительным мужского рода в единственном числе после переходного глагола.',
    headNoun: 'Bruder',
  },
  'dat-masc-sg': {
    german: `Ich helfe ${FORM_PLACEHOLDER} Bruder.`,
    russian: (forms) => `Я помогаю ${forms['dat-masc-sg']} брату.`,
    note: 'С существительным мужского рода в единственном числе после глагола, требующего Dativ.',
    headNoun: 'Bruder',
  },
  'gen-masc-sg': {
    german: `Das Auto ${FORM_PLACEHOLDER} Bruders ist alt.`,
    russian: (forms) => `Машина ${forms['gen-masc-sg']} брата старая.`,
    note: 'С существительным мужского рода в единственном числе в конструкции с Genitiv.',
    headNoun: 'Bruder',
  },
  'nom-neut-sg': {
    german: `${FORM_PLACEHOLDER} Fenster ist offen.`,
    russian: (forms) => `${capitalize(forms['nom-neut-sg'])} окно открыто.`,
    note: 'Перед существительным среднего рода в единственном числе, которое является подлежащим.',
    headNoun: 'Fenster',
  },
  'acc-neut-sg': {
    german: `Ich öffne ${FORM_PLACEHOLDER} Fenster.`,
    russian: (forms) => `Я открываю ${forms['acc-neut-sg']} окно.`,
    note: 'С существительным среднего рода в единственном числе после переходного глагола.',
    headNoun: 'Fenster',
  },
  'dat-neut-sg': {
    german: `Ich sitze an ${FORM_PLACEHOLDER} Fenster.`,
    russian: (forms) => `Я сижу у ${forms['gen-neut-sg']} окна.`,
    note: 'С существительным среднего рода в единственном числе в обстоятельстве места с Dativ.',
    headNoun: 'Fenster',
  },
  'gen-neut-sg': {
    german: `Die Farbe ${FORM_PLACEHOLDER} Fensters gefällt mir.`,
    russian: (forms) => `Мне нравится цвет ${forms['gen-neut-sg']} окна.`,
    note: 'С существительным среднего рода в единственном числе в конструкции с Genitiv.',
    headNoun: 'Fenster',
  },
  'nom-fem-sg': {
    german: `${FORM_PLACEHOLDER} Schwester wohnt in Berlin.`,
    russian: (forms) => `${capitalize(forms['nom-fem-sg'])} сестра живёт в Берлине.`,
    note: 'Перед существительным женского рода в единственном числе, которое является подлежащим.',
    headNoun: 'Schwester',
  },
  'acc-fem-sg': {
    german: `Ich besuche ${FORM_PLACEHOLDER} Schwester morgen.`,
    russian: (forms) => `Я навещаю ${forms['acc-fem-sg']} сестру завтра.`,
    note: 'С существительным женского рода в единственном числе после переходного глагола.',
    headNoun: 'Schwester',
  },
  'dat-fem-sg': {
    german: `Ich helfe ${FORM_PLACEHOLDER} Schwester.`,
    russian: (forms) => `Я помогаю ${forms['dat-fem-sg']} сестре.`,
    note: 'С существительным женского рода в единственном числе после глагола, требующего Dativ.',
    headNoun: 'Schwester',
  },
  'gen-fem-sg': {
    german: `Der Name ${FORM_PLACEHOLDER} Schwester ist Anna.`,
    russian: (forms) => `Имя ${forms['gen-fem-sg']} сестры — Анна.`,
    note: 'С существительным женского рода в единственном числе в конструкции с Genitiv.',
    headNoun: 'Schwester',
  },
  'nom-pl': {
    german: `${FORM_PLACEHOLDER} Freunde sind hier.`,
    russian: (forms) => `${capitalize(forms['nom-pl'])} друзья здесь.`,
    note: 'Перед существительным во множественном числе, которое является подлежащим.',
    headNoun: 'Freunde',
  },
  'acc-pl': {
    german: `Ich suche ${FORM_PLACEHOLDER} Bücher.`,
    russian: (forms) => `Я ищу ${forms['acc-pl']} книги.`,
    note: 'С существительным во множественном числе после переходного глагола.',
    headNoun: 'Bücher',
  },
  'dat-pl': {
    german: `Ich helfe ${FORM_PLACEHOLDER} Freunden.`,
    russian: (forms) => `Я помогаю ${forms['dat-pl']} друзьям.`,
    note: 'С существительным во множественном числе после глагола, требующего Dativ.',
    headNoun: 'Freunden',
  },
  'gen-pl': {
    german: `Die Namen ${FORM_PLACEHOLDER} Freunde kenne ich.`,
    russian: (forms) => `Я знаю имена ${forms['gen-pl']} друзей.`,
    note: 'С существительным во множественном числе в конструкции с Genitiv.',
    headNoun: 'Freunde',
  },
};

function capitalize(value = '') {
  const text = String(value || '');
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : '';
}

function buildRussianSoftForms(stem) {
  return {
    'nom-masc-sg': `${stem}й`,
    'acc-masc-sg': `${stem}его`,
    'dat-masc-sg': `${stem}ему`,
    'gen-masc-sg': `${stem}его`,
    'nom-neut-sg': `${stem}ё`,
    'acc-neut-sg': `${stem}ё`,
    'dat-neut-sg': `${stem}ему`,
    'gen-neut-sg': `${stem}его`,
    'nom-fem-sg': `${stem}я`,
    'acc-fem-sg': `${stem}ю`,
    'dat-fem-sg': `${stem}ей`,
    'gen-fem-sg': `${stem}ей`,
    'nom-pl': `${stem}и`,
    'acc-pl': `${stem}и`,
    'dat-pl': `${stem}им`,
    'gen-pl': `${stem}их`,
  };
}

function buildRussianHardForms(stem) {
  return {
    'nom-masc-sg': stem,
    'acc-masc-sg': `${stem}его`,
    'dat-masc-sg': `${stem}ему`,
    'gen-masc-sg': `${stem}его`,
    'nom-neut-sg': `${stem}е`,
    'acc-neut-sg': `${stem}е`,
    'dat-neut-sg': `${stem}ему`,
    'gen-neut-sg': `${stem}его`,
    'nom-fem-sg': `${stem}а`,
    'acc-fem-sg': `${stem}у`,
    'dat-fem-sg': `${stem}ей`,
    'gen-fem-sg': `${stem}ей`,
    'nom-pl': `${stem}и`,
    'acc-pl': `${stem}и`,
    'dat-pl': `${stem}им`,
    'gen-pl': `${stem}их`,
  };
}

function buildIndeclinableRussianForms(form) {
  const entries = {};
  listEinWordSlots().forEach((slot) => {
    entries[slot.id] = form;
  });
  return entries;
}

function buildRussianForms(lemma) {
  const definition = LEMMA_DEFINITIONS[lemma];
  if (!definition) {
    throw new Error(`Unsupported possessive lemma: ${lemma}`);
  }

  if (definition.russianType === 'soft') {
    return buildRussianSoftForms(definition.russianStem);
  }

  if (definition.russianType === 'hard') {
    return buildRussianHardForms(definition.russianStem);
  }

  return buildIndeclinableRussianForms(definition.russianForm);
}

function buildReverseFormIndex() {
  const index = new Map();

  Object.keys(LEMMA_DEFINITIONS).forEach((lemma) => {
    listEinWordSlots().forEach((slot) => {
      index.set(buildEinWordForm(lemma, slot), lemma);
    });
  });

  return index;
}

const REVERSE_FORM_INDEX = buildReverseFormIndex();

function normalizeLemma(input = '') {
  const normalized = String(input || '').trim().toLowerCase();
  if (!normalized) {
    return '';
  }

  if (LEMMA_DEFINITIONS[normalized]) {
    return normalized;
  }

  return REVERSE_FORM_INDEX.get(normalized) || normalized;
}

function ensureSupportedLemma(input = '') {
  const lemma = normalizeLemma(input);
  if (!LEMMA_DEFINITIONS[lemma]) {
    throw new Error(
      `Unsupported possessive base "${input}". Supported bases: ${Object.keys(LEMMA_DEFINITIONS).join(', ')}`
    );
  }

  return lemma;
}

function withForm(template, replacement) {
  return template.replace(FORM_PLACEHOLDER, replacement);
}

function buildCloze(form, hint) {
  return `{{c1::${form}::${hint}}}`;
}

function buildExplanation(lemma, slot, template) {
  return `Притяжательный определитель «${lemma}»: ${slot.label}. ${template.note}`;
}

export function buildPossessiveUnits(inputLemma) {
  const lemma = ensureSupportedLemma(inputLemma);
  const lemmaDefinition = LEMMA_DEFINITIONS[lemma];
  const russianForms = buildRussianForms(lemma);

  return listEinWordSlots().map((slot) => {
    const template = SLOT_TEMPLATES[slot.id];
    const surfaceForm = buildEinWordForm(lemma, slot);
    const clozeText = withForm(template.german, buildCloze(surfaceForm, slot.hint));
    const fullGerman = withForm(template.german, surfaceForm);
    const previewGerman = withForm(template.german, `[${slot.hint}]`);

    return {
      familyId: FAMILY_ID,
      familyLabel: FAMILY_LABEL,
      lemma,
      englishGloss: lemmaDefinition.englishGloss,
      russianGloss: lemmaDefinition.russianGloss,
      slotId: slot.id,
      slotLabel: slot.label,
      slotHint: slot.hint,
      caseKey: slot.caseKey,
      gender: slot.gender,
      number: slot.number,
      headNoun: template.headNoun,
      surfaceForm,
      clozeText,
      fullGerman,
      previewGerman,
      russian: template.russian(russianForms),
      explanation: buildExplanation(lemma, slot, template),
      metadata: {
        familyId: FAMILY_ID,
        familyLabel: FAMILY_LABEL,
        lemma,
        slotId: slot.id,
        slotLabel: slot.label,
        slotHint: slot.hint,
        caseKey: slot.caseKey,
        gender: slot.gender,
        number: slot.number,
        headNoun: template.headNoun,
        surfaceForm,
      },
    };
  });
}

export const possessiveFamily = {
  id: FAMILY_ID,
  title: FAMILY_LABEL,
  aliases: ['possessive', 'possessives', 'poss'],
  supportedLemmas: Object.keys(LEMMA_DEFINITIONS),
  normalizeLemma,
  buildUnits: buildPossessiveUnits,
};
