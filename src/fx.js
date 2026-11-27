// Sound effects and haptic feedback. Both respect the user's Settings.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

let createAudioPlayer = null;
try {
  createAudioPlayer = require('expo-audio').createAudioPlayer;
} catch {}

const FILES = {
  correct: require('../assets/sounds/correct.wav'),
  wrong: require('../assets/sounds/wrong.wav'),
  complete: require('../assets/sounds/complete.wav'),
  celebrate: require('../assets/sounds/celebrate.wav'),
  tap: require('../assets/sounds/tap.wav'),
};

let cfg = { sound: true, haptics: true };
export const configureFx = (c) => { cfg = { ...cfg, ...c }; };

const players = {};
function play(name) {
  if (!cfg.sound || !createAudioPlayer) return;
  try {
    const p = players[name] || (players[name] = createAudioPlayer(FILES[name]));
    p.seekTo(0);
    p.play();
  } catch {}
}

function buzz(kind) {
  if (!cfg.haptics || Platform.OS === 'web') return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

export const fx = {
  correct: () => { play('correct'); buzz('success'); },
  wrong: () => { play('wrong'); buzz('error'); },
  complete: () => { play('complete'); buzz('success'); },
  celebrate: () => { play('celebrate'); buzz('success'); },
  tap: () => { buzz('light'); },
};
