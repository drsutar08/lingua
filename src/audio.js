// Plays a phrase: the bundled audio clip when there is one (recorded or neural voice,
// see scripts/make-audio.mjs), otherwise the device's text-to-speech voice.
import * as Speech from 'expo-speech';
import { CLIPS } from '../assets/audio';
import { clipName } from './audioKey';

let createAudioPlayer = null;
try {
  createAudioPlayer = require('expo-audio').createAudioPlayer;
} catch {}

let player = null;

export const clipFor = (lang, text) => (text && CLIPS[lang]?.[clipName(text)]) || null;
export const hasClips = (lang) => !!CLIPS[lang] && Object.keys(CLIPS[lang]).length > 0;

export function stopSpeech() {
  Speech.stop();
  try { player?.pause(); } catch {}
}

// Returns 'clip' or 'tts' (useful for tests)
export function speak(lang, voice, text, { slow = false } = {}) {
  stopSpeech();
  if (!text) return null;
  const clip = clipFor(lang, text);
  if (clip && createAudioPlayer) {
    try {
      if (!player) player = createAudioPlayer(clip);
      else player.replace(clip);
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(slow ? 0.7 : 1);
      player.seekTo(0);
      player.play();
      return 'clip';
    } catch {}
  }
  Speech.speak(text, { language: voice, rate: slow ? 0.6 : 0.85 });
  return 'tts';
}
