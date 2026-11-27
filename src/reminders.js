// Daily practice reminders (local notifications, no server needed).
// We schedule one reminder per day for the next 7 days at the chosen time. If you've
// already practised today, today's reminder is skipped. Rescheduled whenever the app opens
// or a lesson finishes, so the message always shows your current streak.
import { Platform } from 'react-native';

let N = null;
try {
  N = require('expo-notifications');
} catch {}

export const remindersSupported = Platform.OS !== 'web' && !!N;

if (remindersSupported) {
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
  } catch {}
}

export async function requestPermission() {
  if (!remindersSupported) return false;
  try {
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('reminders', { name: 'Daily reminders', importance: N.AndroidImportance.DEFAULT });
    }
    const cur = await N.getPermissionsAsync();
    if (cur.granted) return true;
    const req = await N.requestPermissionsAsync();
    return !!req.granted;
  } catch {
    return false;
  }
}

export function reminderText(streak, course) {
  if (streak > 0) return { title: `Your ${streak}-day streak is waiting 🔥`, body: 'A 5-minute lesson keeps it alive. Tap to practise.' };
  return { title: 'Time for a quick lesson 🌱', body: course ? `Keep your ${course} growing today.` : 'Five minutes a day adds up fast.' };
}

export async function scheduleReminders({ on, h, m, streak, practicedToday, course }) {
  if (!remindersSupported) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
    if (!on) return;
    const now = new Date();
    let first = true;
    for (let d = 0; d < 7; d++) {
      const at = new Date(now);
      at.setDate(now.getDate() + d);
      at.setHours(h, m, 0, 0);
      if (at <= now) continue;
      if (d === 0 && practicedToday) continue; // already practised today
      // The next reminder shows the exact streak; later ones (if the app isn't opened in between) stay general
      const text = first ? reminderText(streak, course) : { title: 'Keep your streak going 🔥', body: 'A quick lesson today keeps your progress growing.' };
      first = false;
      await N.scheduleNotificationAsync({
        content: { ...text, ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}) },
        trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'reminders' },
      });
    }
  } catch {}
}
