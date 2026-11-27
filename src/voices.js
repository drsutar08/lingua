// Checks whether the device has a text-to-speech voice for a language,
// so we can warn instead of silently playing nothing.
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

let voices = null;

async function load() {
  if (voices && voices.length) return voices;
  try {
    const list = await Speech.getAvailableVoicesAsync();
    if (list && list.length) voices = list; // browsers can report an empty list until voices load; retry next time
    return list || [];
  } catch {
    return [];
  }
}

// true: a voice exists. false: definitely none. null: can't tell (empty or unavailable list).
export async function hasVoice(code) {
  const list = await load();
  if (!list.length) return null;
  const base = code.split('-')[0].toLowerCase();
  return list.some((v) => String(v.language || '').toLowerCase().replace('_', '-').split('-')[0] === base);
}

export function missingVoiceText(name) {
  if (Platform.OS === 'web') return `Your browser has no ${name} voice, so audio won’t play. Try Chrome or Edge, or add a ${name} voice in your system’s speech settings.`;
  if (Platform.OS === 'ios') return `No ${name} voice is installed, so audio won’t play. Add one in Settings › Accessibility › Spoken Content › Voices.`;
  return `No ${name} voice is installed, so audio won’t play. Add one in your phone’s Text-to-speech settings.`;
}
