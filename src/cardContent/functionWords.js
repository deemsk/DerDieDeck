import { normalizeGermanForCompare } from './german.js';

const FUNCTION_WORDS = {
  aber: {
    lexicalType: 'conjunction',
    canonical: 'aber',
    lemma: 'aber',
    clozeHint: 'contrast connector',
    meanings: [
      {
        russian: 'но',
        english: 'but',
        imageSearchTerms: ['aber Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Ich bin müde, aber ich komme.',
        russian: 'Я устал, но я приду.',
        focusForm: 'aber',
      },
      {
        german: 'Das Auto ist klein, aber schnell.',
        russian: 'Машина маленькая, но быстрая.',
        focusForm: 'aber',
      },
      {
        german: 'Ich möchte gehen, aber ich habe keine Zeit.',
        russian: 'Я хочу уйти, но у меня нет времени.',
        focusForm: 'aber',
      },
    ],
  },
  wenn: {
    lexicalType: 'subjunction',
    canonical: 'wenn',
    lemma: 'wenn',
    clozeHint: 'subordinate-clause connector',
    meanings: [
      {
        russian: 'если, когда',
        english: 'if, when',
        imageSearchTerms: ['wenn Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Wenn ich Zeit habe, komme ich.',
        russian: 'Если у меня будет время, я приду.',
        focusForm: 'Wenn',
      },
      {
        german: 'Wenn es regnet, bleibe ich zu Hause.',
        russian: 'Если идет дождь, я остаюсь дома.',
        focusForm: 'Wenn',
      },
      {
        german: 'Ich helfe dir, wenn du willst.',
        russian: 'Я помогу тебе, если ты хочешь.',
        focusForm: 'wenn',
      },
    ],
  },
  nichts: {
    lexicalType: 'pronoun',
    canonical: 'nichts',
    lemma: 'nichts',
    clozeHint: 'negative pronoun',
    meanings: [
      {
        russian: 'ничего',
        english: 'nothing',
        imageSearchTerms: ['nichts Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Ich sehe nichts.',
        russian: 'Я ничего не вижу.',
        focusForm: 'nichts',
      },
      {
        german: 'Er sagt nichts.',
        russian: 'Он ничего не говорит.',
        focusForm: 'nichts',
      },
      {
        german: 'Wir kaufen nichts.',
        russian: 'Мы ничего не покупаем.',
        focusForm: 'nichts',
      },
    ],
  },
  weil: {
    lexicalType: 'subjunction',
    canonical: 'weil',
    lemma: 'weil',
    clozeHint: 'because + subordinate clause',
    meanings: [
      {
        russian: 'потому что',
        english: 'because',
        imageSearchTerms: ['weil Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Ich bleibe zu Hause, weil ich krank bin.',
        russian: 'Я остаюсь дома, потому что я болен.',
        focusForm: 'weil',
      },
      {
        german: 'Sie kommt nicht, weil sie keine Zeit hat.',
        russian: 'Она не придет, потому что у нее нет времени.',
        focusForm: 'weil',
      },
      {
        german: 'Wir gehen, weil das Wetter gut ist.',
        russian: 'Мы идем, потому что погода хорошая.',
        focusForm: 'weil',
      },
    ],
  },
  dass: {
    lexicalType: 'subjunction',
    canonical: 'dass',
    lemma: 'dass',
    clozeHint: 'that + subordinate clause',
    meanings: [
      {
        russian: 'что',
        english: 'that',
        imageSearchTerms: ['dass Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Ich glaube, dass er zu Hause ist.',
        russian: 'Я думаю, что он дома.',
        focusForm: 'dass',
      },
      {
        german: 'Sie sagt, dass sie morgen kommt.',
        russian: 'Она говорит, что придет завтра.',
        focusForm: 'dass',
      },
      {
        german: 'Ich weiß, dass du müde bist.',
        russian: 'Я знаю, что ты устал.',
        focusForm: 'dass',
      },
    ],
  },
  ob: {
    lexicalType: 'subjunction',
    canonical: 'ob',
    lemma: 'ob',
    clozeHint: 'whether/if + subordinate clause',
    meanings: [
      {
        russian: 'ли',
        english: 'whether',
        imageSearchTerms: ['ob Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Ich frage, ob du Zeit hast.',
        russian: 'Я спрашиваю, есть ли у тебя время.',
        focusForm: 'ob',
      },
      {
        german: 'Er weiß nicht, ob sie kommt.',
        russian: 'Он не знает, придет ли она.',
        focusForm: 'ob',
      },
      {
        german: 'Wir sehen, ob das passt.',
        russian: 'Мы посмотрим, подойдет ли это.',
        focusForm: 'ob',
      },
    ],
  },
  als: {
    lexicalType: 'subjunction',
    canonical: 'als',
    lemma: 'als',
    clozeHint: 'when/than connector',
    meanings: [
      {
        russian: 'когда; чем',
        english: 'when; than',
        imageSearchTerms: ['als Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Als ich klein war, wohnte ich in Berlin.',
        russian: 'Когда я был маленьким, я жил в Берлине.',
        focusForm: 'Als',
      },
      {
        german: 'Ich war zu Hause, als du angerufen hast.',
        russian: 'Я был дома, когда ты позвонил.',
        focusForm: 'als',
      },
      {
        german: 'Als es dunkel wurde, gingen wir nach Hause.',
        russian: 'Когда стало темно, мы пошли домой.',
        focusForm: 'Als',
      },
    ],
  },
  denn: {
    lexicalType: 'conjunction',
    canonical: 'denn',
    lemma: 'denn',
    clozeHint: 'because connector',
    meanings: [
      {
        russian: 'так как, потому что',
        english: 'because, for',
        imageSearchTerms: ['denn Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Ich bleibe hier, denn ich bin müde.',
        russian: 'Я остаюсь здесь, потому что я устал.',
        focusForm: 'denn',
      },
      {
        german: 'Er kommt später, denn der Bus ist voll.',
        russian: 'Он придет позже, потому что автобус полный.',
        focusForm: 'denn',
      },
      {
        german: 'Wir gehen jetzt, denn es ist spät.',
        russian: 'Мы идем сейчас, потому что поздно.',
        focusForm: 'denn',
      },
    ],
  },
  doch: {
    lexicalType: 'particle',
    canonical: 'doch',
    lemma: 'doch',
    clozeHint: 'modal particle',
    meanings: [
      {
        russian: 'же, все-таки',
        english: 'after all, really',
        imageSearchTerms: ['doch Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Komm doch mit.',
        russian: 'Пойдем же с нами.',
        focusForm: 'doch',
      },
      {
        german: 'Das ist doch einfach.',
        russian: 'Это же просто.',
        focusForm: 'doch',
      },
      {
        german: 'Frag doch Maria.',
        russian: 'Спроси же Марию.',
        focusForm: 'doch',
      },
    ],
  },
  ja: {
    lexicalType: 'particle',
    canonical: 'ja',
    lemma: 'ja',
    clozeHint: 'modal particle',
    meanings: [
      {
        russian: 'же, ведь; да',
        english: 'after all; yes',
        imageSearchTerms: ['ja Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Das ist ja schön.',
        russian: 'Это же прекрасно.',
        focusForm: 'ja',
      },
      {
        german: 'Du bist ja schon hier.',
        russian: 'Ты ведь уже здесь.',
        focusForm: 'ja',
      },
      {
        german: 'Er kommt ja morgen.',
        russian: 'Он ведь придет завтра.',
        focusForm: 'ja',
      },
    ],
  },
  mal: {
    lexicalType: 'particle',
    canonical: 'mal',
    lemma: 'mal',
    clozeHint: 'softening particle',
    meanings: [
      {
        russian: 'ка, разок',
        english: 'just, once',
        imageSearchTerms: ['mal Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Schau mal hier.',
        russian: 'Посмотри-ка сюда.',
        focusForm: 'mal',
      },
      {
        german: 'Komm mal bitte.',
        russian: 'Подойди, пожалуйста.',
        focusForm: 'mal',
      },
      {
        german: 'Warte mal kurz.',
        russian: 'Подожди-ка немного.',
        focusForm: 'mal',
      },
    ],
  },
  mit: {
    lexicalType: 'preposition',
    canonical: 'mit',
    lemma: 'mit',
    clozeHint: 'dative preposition',
    meanings: [
      {
        russian: 'с',
        english: 'with',
        imageSearchTerms: ['mit Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Ich fahre mit dem Bus.',
        russian: 'Я еду на автобусе.',
        focusForm: 'mit',
      },
      {
        german: 'Sie spricht mit Maria.',
        russian: 'Она говорит с Марией.',
        focusForm: 'mit',
      },
      {
        german: 'Wir essen mit Freunden.',
        russian: 'Мы едим с друзьями.',
        focusForm: 'mit',
      },
    ],
  },
  fuer: {
    lexicalType: 'preposition',
    canonical: 'für',
    lemma: 'für',
    clozeHint: 'accusative preposition',
    meanings: [
      {
        russian: 'для, за',
        english: 'for',
        imageSearchTerms: ['für Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Das Geschenk ist für dich.',
        russian: 'Подарок для тебя.',
        focusForm: 'für',
      },
      {
        german: 'Ich kaufe Brot für uns.',
        russian: 'Я покупаю хлеб для нас.',
        focusForm: 'für',
      },
      {
        german: 'Sie lernt für die Prüfung.',
        russian: 'Она учится к экзамену.',
        focusForm: 'für',
      },
    ],
  },
  ohne: {
    lexicalType: 'preposition',
    canonical: 'ohne',
    lemma: 'ohne',
    clozeHint: 'accusative preposition',
    meanings: [
      {
        russian: 'без',
        english: 'without',
        imageSearchTerms: ['ohne Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Ich trinke Kaffee ohne Milch.',
        russian: 'Я пью кофе без молока.',
        focusForm: 'ohne',
      },
      {
        german: 'Er geht ohne Jacke.',
        russian: 'Он идет без куртки.',
        focusForm: 'ohne',
      },
      {
        german: 'Wir fahren ohne Auto.',
        russian: 'Мы едем без машины.',
        focusForm: 'ohne',
      },
    ],
  },
  kein: {
    lexicalType: 'determiner',
    canonical: 'kein',
    lemma: 'kein',
    clozeHint: 'negative determiner',
    meanings: [
      {
        russian: 'не, никакой',
        english: 'no, not a',
        imageSearchTerms: ['kein Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Ich habe keine Zeit.',
        russian: 'У меня нет времени.',
        focusForm: 'keine',
      },
      {
        german: 'Das ist kein Problem.',
        russian: 'Это не проблема.',
        focusForm: 'kein',
      },
      {
        german: 'Wir kaufen keinen Zucker.',
        russian: 'Мы не покупаем сахар.',
        focusForm: 'keinen',
      },
    ],
  },
  bitte: {
    lexicalType: 'interjection',
    canonical: 'bitte',
    lemma: 'bitte',
    clozeHint: 'polite expression',
    meanings: [
      {
        russian: 'пожалуйста',
        english: 'please',
        imageSearchTerms: ['bitte Beispielsatz'],
      },
    ],
    exampleSentences: [
      {
        german: 'Bitte komm.',
        russian: 'Пожалуйста, приходи.',
        focusForm: 'Bitte',
      },
      {
        german: 'Einen Kaffee, bitte.',
        russian: 'Один кофе, пожалуйста.',
        focusForm: 'bitte',
      },
      {
        german: 'Bitte langsam.',
        russian: 'Пожалуйста, медленно.',
        focusForm: 'Bitte',
      },
    ],
  },
};

/**
 * Returns a deterministic analysis for curated function words.
 */
export function getCuratedFunctionWordAnalysis(input = '') {
  const key = normalizeGermanForCompare(input);
  const entry = FUNCTION_WORDS[key];
  if (!entry) {
    return null;
  }

  return {
    shouldCreateWordCard: true,
    rejectionReason: null,
    lexicalType: entry.lexicalType,
    canonical: entry.canonical,
    lemma: entry.lemma,
    article: null,
    gender: null,
    ipa: null,
    register: 'neutral',
    isImageable: false,
    imageabilityReason: 'function word; learned through sentence context',
    recommendedMode: 'cloze-form',
    plural: null,
    noPlural: false,
    anchorPhrase: null,
    opposite: null,
    clozeHint: entry.clozeHint,
    meanings: entry.meanings,
    exampleSentences: entry.exampleSentences,
  };
}
