import { TOTAL_LESSONS } from './lessons';
import { DAY, addCard, checkAchievements, dayKey, ensureQuests, heartsNow } from './game';

export { LANGS, UNITS, WORDS, ROWS, SCENES } from './content';
export * from './lessons';
export { dayKey } from './game';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function weekXP(S) {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  return DAYS.map((d, i) => {
    const off = i - dow;
    return { d, v: off > 0 ? null : S.xp[dayKey(off)] || 0, today: off === 0 };
  });
}

const base = () => ({
  streak: 0, lastDay: null, xp: {}, totalXp: 0, lessons: 0, wordsTotal: 0,
  goal: 20, goalDay: dayKey(0), goalWords: 0, goalDays: [],
  courses: [], vocab: [], saved: [], srs: {},
  hearts: { n: 5, ts: Date.now() }, freezes: 0, quests: null,
  stats: { perfect: 0, speakPass: 0, reviews: 0, matches: 0, maxStreak: 0 },
  earned: {}, celebrate: [],
  gender: null, // 'f' | 'm' | 'x' (prefer not to say: masculine forms). Picks word forms in some languages.
});

// A newly signed-up learner. No courses yet: the language picker runs first.
export function freshState(name, email) {
  const s = { ...base(), name, email };
  ensureQuests(s);
  return s;
}

// Sample progress for the demo account (matches the design mockups)
export function seed() {
  const s = { ...base(), name: 'Alex Johnson', email: 'demo@lingua.app' };
  [30, 55, 20, 65, 40, 70, 25].forEach((v, i) => (s.xp[dayKey(i - 6)] = v));
  Object.assign(s, {
    streak: 12, lastDay: dayKey(0), totalXp: 1240, lessons: 12, wordsTotal: 86, goalWords: 12, freezes: 1,
    goalDays: [dayKey(-6), dayKey(-4), dayKey(-2)],
    courses: [{ id: 'es', done: 16 }, { id: 'fr', done: 10 }, { id: 'ja', done: 5 }],
    saved: ['Spanish · Greetings', 'French · At the café'],
    hearts: { n: 4, ts: Date.now() - 12 * 60 * 1000 },
    stats: { perfect: 3, speakPass: 6, reviews: 24, matches: 4, maxStreak: 12 },
  });
  const words = [
    ['es', 'hola', 'hello'], ['es', 'adiós', 'goodbye'], ['es', 'por favor', 'please'], ['es', 'perro', 'dog'],
    ['es', 'gato', 'cat'], ['es', 'agua', 'water'], ['es', 'pan', 'bread'], ['es', 'manzana', 'apple'],
    ['fr', 'bonjour', 'hello'], ['fr', 'merci', 'thank you'], ['fr', 'fromage', 'cheese'], ['fr', 'gare', 'station'],
    ['ja', 'こんにちは', 'hello'], ['ja', 'みず', 'water'], ['es', 'tienda', 'shop'], ['es', 'billete', 'ticket'],
  ];
  words.forEach(([lang, w, m], k) => {
    addCard(s, lang, w, m);
    // 8 cards due now, the rest spread over the coming days
    const c = s.srs[`${lang}|${w}`];
    c.due = k < 8 ? Date.now() - (k + 1) * 3600 * 1000 : Date.now() + (k - 6) * DAY;
    c.ivl = k < 8 ? 1 : 3;
    s.vocab.push([w, m]);
  });
  ensureQuests(s);
  s.quests.list[0].prog = 25; // "Earn 30 XP": 25 / 30 so far today
  checkAchievements(s, true);
  return s;
}

// Bring saved progress from older app versions up to the current shape
export function migrate(s) {
  const b = base();
  for (const k of Object.keys(b)) if (s[k] === undefined) s[k] = b[k];
  s.stats = { ...b.stats, ...s.stats, maxStreak: Math.max(s.stats?.maxStreak || 0, s.streak || 0) };
  s.courses = s.courses.map((c) => (c.done == null ? { id: c.id, done: Math.round(((c.p || 0) / 100) * TOTAL_LESSONS) } : c));
  if (!s.totalXp) s.totalXp = Object.values(s.xp).reduce((a, v) => a + v, 0);
  const h = heartsNow(s.hearts);
  s.hearts = { n: h.n, ts: h.ts };
  ensureQuests(s);
  checkAchievements(s, true);
  return s;
}
