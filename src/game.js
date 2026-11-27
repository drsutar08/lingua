// Game rules: hearts, streaks + freezes, daily quests, XP levels, achievements, spaced repetition.
// All functions are pure or mutate the state object they are given (the store passes a clone).

export const DAY = 24 * 3600 * 1000;

// Local calendar date as YYYY-MM-DD. Built from local fields: toISOString() would give the UTC date,
// which is a day behind for UTC+13 and beyond (New Zealand in summer, Tonga, Samoa, Kiribati).
export function dayKey(offset = 0, from = Date.now()) {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / DAY);

/* ---------- Hearts ---------- */
export const MAX_HEARTS = 5;
export const REFILL_MS = 30 * 60 * 1000; // one heart every 30 minutes

export function heartsNow(h, now = Date.now()) {
  if (!h) return { n: MAX_HEARTS, ts: now, next: null };
  let { n, ts } = h;
  if (n < MAX_HEARTS) {
    const k = Math.floor((now - ts) / REFILL_MS);
    if (k > 0) { n = Math.min(MAX_HEARTS, n + k); ts += k * REFILL_MS; }
  }
  return { n, ts, next: n < MAX_HEARTS ? ts + REFILL_MS - now : null };
}

export function loseHeart(s) {
  const h = heartsNow(s.hearts);
  s.hearts = { n: Math.max(0, h.n - 1), ts: h.n >= MAX_HEARTS ? Date.now() : h.ts };
}

export function gainHeart(s, k = 1) {
  const h = heartsNow(s.hearts);
  s.hearts = { n: Math.min(MAX_HEARTS, h.n + k), ts: h.ts };
}

/* ---------- Streak + freezes ---------- */
export const MAX_FREEZES = 2;

// Run when the app opens: use freezes for missed days, or reset the streak
export function applyStreak(s) {
  const today = dayKey(0);
  if (!s.lastDay || !s.streak) return null;
  const missed = daysBetween(s.lastDay, today) - 1;
  if (missed <= 0) return null;
  if ((s.freezes || 0) >= missed) {
    s.freezes -= missed;
    s.lastDay = dayKey(-1);
    return `Streak freeze used. Your ${s.streak}-day streak is safe 🧊`;
  }
  const lost = s.streak;
  s.streak = 0;
  return `Your ${lost}-day streak ended. Start a new one today!`;
}

// Practising today extends the streak. Every 7 days earns a freeze.
export function practiced(s) {
  const t = dayKey(0);
  if (s.lastDay === t) return;
  s.streak = s.lastDay === dayKey(-1) ? s.streak + 1 : 1;
  s.lastDay = t;
  s.stats.maxStreak = Math.max(s.stats.maxStreak || 0, s.streak);
  if (s.streak % 7 === 0 && (s.freezes || 0) < MAX_FREEZES) {
    s.freezes = (s.freezes || 0) + 1;
    s.celebrate.push({ type: 'freeze', streak: s.streak });
  }
}

/* ---------- XP + levels ---------- */
export const xpForLevel = (L) => 50 * (L - 1) * L; // L1: 0, L2: 100, L3: 300, L4: 600, L5: 1000 ...
export function levelOf(total) {
  let L = 1;
  while (total >= xpForLevel(L + 1)) L++;
  return { level: L, into: total - xpForLevel(L), span: xpForLevel(L + 1) - xpForLevel(L) };
}

export function addXp(s, n) {
  if (!n) return;
  const t = dayKey(0);
  const before = levelOf(s.totalXp || 0).level;
  s.xp[t] = (s.xp[t] || 0) + n;
  s.totalXp = (s.totalXp || 0) + n;
  const after = levelOf(s.totalXp).level;
  if (after > before) s.celebrate.push({ type: 'level', level: after });
  bump(s, 'xp', n);
}

/* ---------- Daily quests ---------- */
const QUESTS = [
  { id: 'xp', label: 'Earn 30 XP', goal: 30, ev: 'xp', icon: 'bolt' },
  { id: 'lessons', label: 'Complete 2 lessons', goal: 2, ev: 'lesson', icon: 'book' },
  { id: 'speak', label: 'Speak 5 phrases', goal: 5, ev: 'speak', icon: 'micsm' },
  { id: 'review', label: 'Review 10 words', goal: 10, ev: 'review', icon: 'vocab' },
  { id: 'perfect', label: 'Finish a lesson with no mistakes', goal: 1, ev: 'perfect', icon: 'star' },
  { id: 'match', label: 'Complete 2 match exercises', goal: 2, ev: 'match', icon: 'blocks' },
];
export const QUEST_XP = 10;

export function questsFor(day) {
  // "Earn 30 XP" every day, plus two others that rotate by date
  const n = [...day].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rest = QUESTS.slice(1);
  const a = n % rest.length, b = (a + 1 + (n % (rest.length - 1))) % rest.length;
  return [QUESTS[0], rest[a], rest[b === a ? (a + 1) % rest.length : b]].map((q) => ({ id: q.id, prog: 0, done: false }));
}
export const questDef = (id) => QUESTS.find((q) => q.id === id);

export function ensureQuests(s) {
  const t = dayKey(0);
  if (!s.quests || s.quests.day !== t) s.quests = { day: t, list: questsFor(t), chest: false };
}

export function bump(s, ev, n = 1) {
  ensureQuests(s);
  for (const q of s.quests.list) {
    const d = questDef(q.id);
    if (d.ev !== ev || q.done) continue;
    q.prog = Math.min(d.goal, q.prog + n);
    if (q.prog >= d.goal) {
      q.done = true;
      const t = dayKey(0);
      s.xp[t] = (s.xp[t] || 0) + QUEST_XP; // reward (not counted toward the XP quest itself)
      s.totalXp = (s.totalXp || 0) + QUEST_XP;
    }
  }
  if (!s.quests.chest && s.quests.list.every((q) => q.done)) {
    s.quests.chest = true;
    if ((s.freezes || 0) < MAX_FREEZES) { s.freezes = (s.freezes || 0) + 1; s.celebrate.push({ type: 'chest', reward: 'freeze' }); }
    else { s.totalXp += 20; s.celebrate.push({ type: 'chest', reward: 'xp' }); }
  }
}

/* ---------- Achievements ---------- */
export const ACHIEVEMENTS = [
  { id: 'first_lesson', label: 'First Lesson Complete', desc: 'Finish your first lesson', icon: 'star', colors: ['#FFD25C', '#F59E0B'], prog: (s) => [s.lessons, 1] },
  { id: 'streak7', label: '7 Days Streak', desc: 'Practise 7 days in a row', icon: 'flame', colors: ['#FF9A5A', '#F2493B'], prog: (s) => [s.stats.maxStreak || s.streak, 7] },
  { id: 'words100', label: '100 Words Learner', desc: 'Learn 100 words and phrases', icon: 'book', colors: ['#9C88FF', '#6447E6'], prog: (s) => [s.wordsTotal, 100] },
  { id: 'week_goal', label: 'Week Goal Achiever', desc: 'Hit your daily goal on 5 days in a week', icon: 'check', colors: ['#6EE2B9', '#18A979'], prog: (s) => [(s.goalDays || []).filter((d) => d >= dayKey(-6)).length, 5] },
  { id: 'perfect', label: 'Perfectionist', desc: 'Finish a lesson with no mistakes', icon: 'target', colors: ['#7DD3FC', '#2563EB'], prog: (s) => [s.stats.perfect, 1] },
  { id: 'speaker', label: 'Confident Speaker', desc: 'Pass 10 speaking exercises', icon: 'mic', colors: ['#F9A8D4', '#DB2777'], prog: (s) => [s.stats.speakPass, 10] },
  { id: 'reviewer', label: 'Memory Master', desc: 'Review 50 words', icon: 'vocab', colors: ['#A7F3D0', '#059669'], prog: (s) => [s.stats.reviews, 50] },
  { id: 'polyglot', label: 'Polyglot', desc: 'Study 3 languages', icon: 'explore', colors: ['#C4B5FD', '#7C3AED'], prog: (s) => [s.courses.length, 3] },
  { id: 'level5', label: 'Rising Star', desc: 'Reach level 5', icon: 'bolt', colors: ['#FDE68A', '#D97706'], prog: (s) => [levelOf(s.totalXp || 0).level, 5] },
  { id: 'streak30', label: '30 Days Streak', desc: 'Practise 30 days in a row', icon: 'flame', colors: ['#FCA5A5', '#B91C1C'], prog: (s) => [s.stats.maxStreak || s.streak, 30] },
];

// Award newly reached achievements. silent = record without celebrating (used on migration).
export function checkAchievements(s, silent = false) {
  s.earned = s.earned || {};
  for (const a of ACHIEVEMENTS) {
    if (s.earned[a.id]) continue;
    const [cur, goal] = a.prog(s);
    if (cur >= goal) {
      s.earned[a.id] = dayKey(0);
      if (!silent) s.celebrate.push({ type: 'badge', id: a.id });
    }
  }
}

/* ---------- Spaced repetition (SM-2 style) ---------- */
const MIN = 60 * 1000;
export const cardKey = (lang, w) => `${lang}|${w}`;

export function addCard(s, lang, w, m) {
  const key = cardKey(lang, w);
  if (s.srs[key]) return false;
  s.srs[key] = { key, lang, w, m, ease: 2.5, ivl: 0, reps: 0, due: Date.now() + DAY }; // first review tomorrow
  return true;
}

export function grade(s, key, ok) {
  const c = s.srs[key];
  if (!c) return;
  if (ok) {
    c.reps++;
    c.ivl = c.ivl < 1 ? 1 : c.ivl < 3 ? 3 : Math.round(c.ivl * c.ease);
    c.ease = Math.min(3, c.ease + 0.05);
    c.due = Date.now() + c.ivl * DAY;
  } else {
    c.ivl = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.due = Date.now() + 10 * MIN; // see it again soon
  }
}

export const dueCards = (s, now = Date.now()) => Object.values(s.srs || {}).filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
export const nextDue = (s) => Object.values(s.srs || {}).reduce((m, c) => Math.min(m, c.due), Infinity);
