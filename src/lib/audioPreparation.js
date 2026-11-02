import { debuglog } from 'node:util';
import { resolveWordPronunciation } from './wordSources.js';
import { generateSimpleSpeech, generateSpeech } from './tts.js';

const debugAudio = debuglog('derdiedeck-audio');

export async function preparePronunciation({ wordData, spokenText, fallbackPath, speed, fallbackIpa = null, onDiagnostic = () => {} }) {
  let diagnosticReported = false;
  const report = (reason) => {
    diagnosticReported = true;
    debugAudio('Pronunciation fallback: %s', reason);
    onDiagnostic(reason);
  };
  let ipa = fallbackIpa;
  try {
    const pronunciation = await resolveWordPronunciation(wordData, { onDiagnostic: report });
    ipa = pronunciation?.ipa || ipa;
    if (pronunciation?.audioPath) {
      return { audioPath: pronunciation.audioPath, ipa, source: pronunciation.source };
    }
    if (!diagnosticReported) report('recording-missing');
  } catch {
    report('audio-retrieval-failed');
  }
  await generateSimpleSpeech(spokenText, fallbackPath, { speed, ipa });
  return { audioPath: fallbackPath, ipa, source: 'Google TTS' };
}

export async function prepareSentenceAudio(sentence, audioPath) {
  await generateSpeech(sentence, audioPath);
  return { audioPath, source: 'Google TTS' };
}
