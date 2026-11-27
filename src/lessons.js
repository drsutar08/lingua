import { FEMININE, JA_KANJI, LANGS, ROWS, UNITS, WORDS } from './content';

// Word forms follow the learner's grammatical gender (set from the store before building lessons)
let GENDER = 'm';
export function setContentGender(g) { GENDER = g === 'f' ? 'f' : 'm'; }
const fem = (id, x) => (GENDER === 'f' && FEMININE[id] && FEMININE[id][x]) || x;
const rowOf = (id, i) => ROWS[id][i].map((x) => (Array.isArray(x) ? x.map((y) => fem(id, y)) : typeof x === 'string' ? fem(id, x) : x));
const wordsOf = (id, i) => WORDS[id][i].map((w) => fem(id, w));

// Other accepted spellings for pronunciation scoring (Japanese kana lessons vs kanji from the recogniser)
export const altsOf = (id, text) => (id === 'ja' ? JA_KANJI[text] || [] : []);

export function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const VARIANTS = [
  { key: 'learn', title: 'Learn', icon: 'book' },
  { key: 'practice', title: 'Practice', icon: 'star' },
  { key: 'listen', title: 'Listen & speak', icon: 'micsm' },
];
export const PER_UNIT = VARIANTS.length;
export const TOTAL_LESSONS = UNITS.length * PER_UNIT;

// A course is { id, done } where done = lessons completed in order (0..TOTAL_LESSONS)
export const coursePct = (c) => Math.round((Math.min(c.done, TOTAL_LESSONS) / TOTAL_LESSONS) * 100);
export const unitOf = (c) => Math.min(UNITS.length - 1, Math.floor(c.done / PER_UNIT));
export const lessonName = (idx) => `Unit ${Math.floor(idx / PER_UNIT) + 1} · ${VARIANTS[idx % PER_UNIT].title}`;

export const CATEGORY_UNIT = { Beginner: 0, Travel: 2, Business: 3, Kids: 4 };
export const MODE_TITLES = { vocab: 'Vocabulary', listen: 'Listening', speak: 'Speak', grammar: 'Grammar', review: 'Review', placement: 'Placement test' };

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const ENGLISH_POOL = [...new Set(UNITS.flatMap((u) => u.words.map(cap)))];
const PUNCT = /^[¿¡"“«(]+|[?!.,:;"”»)]+$/g;

/* ---------- Item builders ---------- */

function baseItems(id, i) {
  const u = UNITS[i];
  const [s1, ch, sp, s2, rev, wrong, revEn = u.rev] = rowOf(id, i);
  return [
    { t: 'build', prompt: s1, answer: u.b1.en, extra: u.b1.extra, word: [s1, u.b1.mean] },
    { t: 'choice', q: 'What does this mean?', prompt: ch, ans: u.ch.en, options: u.ch.opts, word: [ch, u.ch.en.toLowerCase()] },
    { t: 'speak', text: sp, meaning: u.sp, word: [sp, u.sp.toLowerCase()] },
    { t: 'build', prompt: s2, answer: u.b2.en, extra: u.b2.extra, word: [s2, u.b2.mean] },
    { t: 'choice', q: `How do you say “${revEn}”?`, prompt: null, ans: rev, options: [rev, ...wrong], word: [rev, revEn.toLowerCase()] },
  ];
}

export const pairsOf = (id, i) => wordsOf(id, i).map((w, k) => [w, UNITS[i].words[k]]);
// Pairs whose word is spelled the same in both languages ("no" / "no", "hotel" / "hotel") are too easy: use them last
const same = ([w, m]) => w.toLowerCase() === m.toLowerCase();
const mixedPairs = (id, i) => shuffle(pairsOf(id, i)).sort((a, b) => same(a) - same(b));

// n pairs for match-the-pairs, with no same-spelled pairs. When a unit doesn't have enough,
// top up from earlier units first (words the learner has seen), then later ones.
export function matchPairs(id, unit, n = 5, skip = []) {
  const ok = (p, taken) => !same(p) && !skip.includes(p[0]) && !taken.some((t) => t[0] === p[0] || t[1] === p[1]);
  const picked = [];
  const order = [unit, ...shuffle(UNITS.map((_, i) => i).filter((i) => i < unit)), ...shuffle(UNITS.map((_, i) => i).filter((i) => i > unit))];
  for (const i of order) {
    for (const p of shuffle(pairsOf(id, i))) {
      if (picked.length >= n) return picked;
      if (ok(p, picked)) picked.push(p);
    }
  }
  return picked;
}

const matchItem = (pairs) => ({ t: 'match', pairs, learned: pairs });

const typeItem = (prompt, answer) => ({ t: 'type', prompt, answer, word: [prompt, answer.toLowerCase()] });

// Fill in the blank: hide the longest word of a sentence (spaced scripts only)
function fillItem(id, i, sentence, meaning) {
  if (LANGS[id].chars) return null;
  const toks = sentence.split(' ');
  let best = -1, bestLen = 0;
  toks.forEach((t, k) => {
    const clean = t.replace(PUNCT, '');
    if (clean.length > bestLen) { best = k; bestLen = clean.length; }
  });
  if (best < 0 || bestLen < 2) return null;
  const raw = toks[best];
  const answer = raw.replace(PUNCT, '');
  const lead = raw.slice(0, raw.indexOf(answer));
  const trail = raw.slice(raw.indexOf(answer) + answer.length);
  const pool = shuffle(UNITS.flatMap((_, i) => wordsOf(id, i)).filter((w) => w !== answer && !w.includes(' ')));
  return {
    t: 'fill',
    before: toks.slice(0, best).join(' ') + (best ? ' ' : '') + lead,
    after: trail + (best < toks.length - 1 ? ' ' : '') + toks.slice(best + 1).join(' '),
    answer,
    options: shuffle([answer, ...pool.slice(0, 3)]),
    meaning,
    word: [sentence, meaning],
  };
}

// Listen and type. Non-Latin scripts get "listen and pick what you heard" instead of typing.
function dictateItem(id, i, text, meaning) {
  if (LANGS[id].latin) return { t: 'dictate', text, meaning, word: [text, meaning.toLowerCase()] };
  const [s1, ch, sp, s2] = rowOf(id, i);
  const others = [s1, ch, sp, s2].filter((x) => x !== text);
  return { t: 'choice', listen: true, q: 'What did you hear?', prompt: text, ans: text, options: [text, ...others.slice(0, 3)], word: [text, meaning.toLowerCase()] };
}

/* ---------- Lessons ---------- */

export function buildUnitLesson(id, unit, variant) {
  const u = UNITS[unit];
  const row = rowOf(id, unit);
  const base = baseItems(id, unit);
  const pairs = mixedPairs(id, unit);
  if (variant === 0) return base;
  if (variant === 1) {
    return [
      matchItem(matchPairs(id, unit, 5)),
      fillItem(id, unit, row[3], u.b2.mean) || dictateItem(id, unit, row[3], u.b2.mean),
      typeItem(row[1], u.ch.en),
      base[4],
      base[0],
    ];
  }
  const [w, en] = pairs[0];
  return [
    dictateItem(id, unit, row[2], u.sp),
    { t: 'speak', text: row[3], meaning: u.b2.mean, word: [row[3], u.b2.mean] },
    typeItem(w, cap(en)),
    matchItem(matchPairs(id, unit, 5, [w])),
    { t: 'speak', text: pairs[1][0], meaning: cap(pairs[1][1]), word: pairs[1] },
  ];
}

// Practice drills from the Practice tab (skill-focused, from the current unit)
export function buildDrill(id, mode, unit = 0) {
  let items = baseItems(id, unit);
  const pairs = mixedPairs(id, unit);
  if (mode === 'vocab') {
    const mp = matchPairs(id, unit, 5);
    const rest = pairs.find((p) => !same(p) && !mp.some((m) => m[0] === p[0])) || pairs[0];
    return [matchItem(mp), ...items.filter((x) => x.t === 'choice'), typeItem(rest[0], cap(rest[1]))];
  }
  if (mode === 'listen') {
    const row = rowOf(id, unit);
    return [dictateItem(id, unit, row[2], UNITS[unit].sp), ...items.filter((x) => x.t !== 'speak').map((x) => ({ ...x, listen: true }))].slice(0, 5);
  }
  if (mode === 'speak')
    return items
      .filter((x) => x.t === 'speak')
      .concat(items.filter((x) => x.t !== 'speak').map((x) => ({ t: 'speak', text: x.word[0], meaning: x.word[1], word: x.word })))
      .slice(0, 3);
  if (mode === 'grammar') {
    const row = rowOf(id, unit);
    return [...items.filter((x) => x.t === 'build'), fillItem(id, unit, row[0], UNITS[unit].b1.mean)].filter(Boolean);
  }
  return items;
}

// Placement test: one question per unit, getting harder
export function buildPlacement(id) {
  return UNITS.map((u, i) => {
    const k = Math.floor(Math.random() * 6);
    const ans = cap(u.words[k]);
    const wrong = shuffle(u.words.filter((_, j) => j !== k).map(cap)).slice(0, 3);
    return { t: 'choice', q: 'What does this mean?', prompt: wordsOf(id, i)[k], ans, options: [ans, ...wrong], unit: i };
  });
}

// Spaced review: one exercise per due card, rotating the exercise type
export function buildReview(cards) {
  return cards.map((c, k) => {
    const lang = LANGS[c.lang];
    const mode = k % 3;
    const base = { card: c.key, lang: c.lang, word: [c.w, c.m] };
    if (mode === 1) return { ...base, t: 'type', prompt: c.w, answer: c.m };
    if (mode === 2 && lang.latin && !c.w.includes(' ')) return { ...base, t: 'dictate', text: c.w, meaning: c.m };
    const ans = cap(c.m);
    const wrong = shuffle(ENGLISH_POOL.filter((e) => e.toLowerCase() !== c.m.toLowerCase())).slice(0, 3);
    return { ...base, t: 'choice', q: 'What does this mean?', prompt: c.w, ans, options: [ans, ...wrong] };
  });
}
