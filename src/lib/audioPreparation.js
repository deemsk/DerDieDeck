import { resolveWordPronunciation } from './wordSources.js';
import { generateSimpleSpeech, generateSpeech } from './tts.js';

export async function preparePronunciation({ wordData, spokenText, fallbackPath, speed, fallbackIpa = null }) {
  let ipa = fallbackIpa;
  try {
    const pronunciation = await resolveWordPronunciation(wordData);
    ipa = pronunciation?.ipa || ipa;
    if (pronunciation?.audioPath) {
      return { audioPath: pronunciation.audioPath, ipa, source: pronunciation.source };
    }
  } catch {
    // A missing or unavailable recording falls back to speech synthesis.
  }
  await generateSimpleSpeech(spokenText, fallbackPath, { speed, ipa });
  return { audioPath: fallbackPath, ipa, source: 'Google TTS' };
}

export async function prepareSentenceAudio(sentence, audioPath) {
  await generateSpeech(sentence, audioPath);
  return { audioPath, source: 'Google TTS' };
}
