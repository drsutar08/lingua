// Pronunciation scoring.
// Speech is turned into text by the platform recogniser (browser Web Speech API on web,
// Apple / Google speech services in a development build), then compared with the target phrase.
// Expo Go has no speech-recognition module, so `recognizer` is null there and the lesson falls back
// to listen-and-repeat without a score.

let Mod = null;
try {
  // Throws in Expo Go (native module missing). Fine on web and in development builds.
  Mod = require('expo-speech-recognition').ExpoSpeechRecognitionModule;
  if (Mod && Mod.isRecognitionAvailable && !Mod.isRecognitionAvailable()) Mod = null;
} catch {
  Mod = null;
}

export const canScore = !!Mod;

/**
 * Listen once. Calls onPartial(text) while the user talks and resolves with the list of
 * transcripts the recogniser thought likely (best first). Rejects with { code, message }.
 */
export function listen(lang, { onPartial } = {}) {
  if (!Mod) return Promise.reject({ code: 'unavailable', message: 'Speech recognition is not available here.' });
  let subs = [];
  const clean = () => { subs.forEach((s) => s.remove()); subs = []; };
  const promise = new Promise(async (resolve, reject) => {
    try {
      const perm = await Mod.requestPermissionsAsync();
      if (perm && perm.granted === false) {
        return reject({ code: 'not-allowed', message: 'Allow microphone and speech access to get a score.' });
      }
    } catch {}
    let best = [];
    subs.push(Mod.addListener('result', (e) => {
      const list = (e.results || []).map((r) => r.transcript).filter(Boolean);
      if (list.length) best = list;
      if (onPartial && list[0]) onPartial(list[0]);
    }));
    subs.push(Mod.addListener('error', (e) => {
      clean();
      reject({ code: e.error, message: e.message });
    }));
    subs.push(Mod.addListener('end', () => {
      clean();
      if (best.length) resolve(best);
      else reject({ code: 'no-speech', message: 'We didn’t hear anything.' });
    }));
    try {
      Mod.start({ lang, interimResults: true, maxAlternatives: 5, continuous: false });
    } catch (err) {
      clean();
      reject({ code: 'start-failed', message: String(err?.message || err) });
    }
  });
  promise.cancel = () => { try { Mod.abort(); } catch {} clean(); };
  return promise;
}

export function stopListening() {
  try { Mod && Mod.stop(); } catch {}
}

/* ---------- Scoring ---------- */

const PUNCT = /[.,!?¿¡"“”«»„。、，．！？・…:;()\[\]\-–—~؟،]/g;
const APOS = /['‘’]/g;

function norm(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // drop Latin accents only (keeps Devanagari vowel signs)
    .normalize('NFC')
    .toLowerCase()
    .replace(APOS, '')
    .replace(PUNCT, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

const sim = (a, b) => (a.length || b.length ? 1 - lev(a, b) / Math.max(a.length, b.length) : 1);

// Units to compare: words for spaced scripts, characters for Japanese / Chinese
function units(s, chars) {
  return chars ? Array.from(s.replace(/\s/g, '')) : s.split(' ').filter(Boolean);
}

// Ordered alignment (DP) where a pair of units can match partially by spelling similarity.
function align(target, heard, chars) {
  const m = target.length, n = heard.length;
  const S = (i, j) => {
    const v = chars ? (target[i] === heard[j] ? 1 : 0) : sim(target[i], heard[j]);
    return v >= 0.5 ? v : 0;
  };
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1], S(i, j) ? S(i, j) + dp[i + 1][j + 1] : 0);
  const per = new Array(m).fill(0);
  let i = 0, j = 0;
  while (i < m && j < n) {
    const s = S(i, j);
    if (s && Math.abs(dp[i][j] - (s + dp[i + 1][j + 1])) < 1e-9) { per[i] = s; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return per;
}

/**
 * Score one transcript against the target phrase.
 * Returns { score 0-100, words: [{ text, status: 'good' | 'close' | 'miss' }] }.
 */
export function scoreOne(target, heard, chars = false) {
  const nt = norm(target), nh = norm(heard);
  const tDisplay = chars ? Array.from(target.replace(/\s/g, '')).filter((c) => !c.match(PUNCT)) : target.split(/\s+/).filter((w) => norm(w));
  const tU = units(nt, chars), hU = units(nh, chars);
  const per = align(tU, hU, chars);
  const coverage = per.reduce((a, b) => a + b, 0) / Math.max(1, tU.length);
  const extra = Math.max(0, hU.length - tU.length) / Math.max(1, tU.length); // talking over the phrase
  const whole = sim(nt.replace(/\s/g, ''), nh.replace(/\s/g, ''));
  const score = Math.round(100 * Math.max(0, Math.min(1, 0.75 * coverage + 0.25 * whole - 0.15 * extra)));
  const words = tDisplay.map((text, k) => ({ text, status: per[k] >= 0.85 ? 'good' : per[k] >= 0.5 ? 'close' : 'miss' }));
  return { score, words, heard };
}

// Recognisers return several guesses; grade the best one
// alts: other accepted spellings of the target (e.g. kanji for a kana lesson)
export function scoreBest(target, transcripts, chars = false, alts = []) {
  const best = transcripts.map((h) => scoreOne(target, h, chars)).sort((a, b) => b.score - a.score)[0];
  let alt = null;
  for (const a of alts) for (const h of transcripts) {
    const r = scoreOne(a, h, chars);
    if (!alt || r.score > alt.score) alt = r;
  }
  if (!alt || alt.score <= best.score) return best;
  // Matched through another spelling: keep showing the words as taught, rated by the overall score
  const status = alt.score >= 85 ? 'good' : alt.score >= 50 ? 'close' : 'miss';
  return { score: alt.score, heard: alt.heard, words: best.words.map((w) => ({ ...w, status })) };
}

export const PASS = 60;

export function verdict(score) {
  if (score >= 90) return 'Excellent!';
  if (score >= 75) return 'Great pronunciation';
  if (score >= PASS) return 'Good, nearly there';
  if (score >= 35) return 'Close. Try again';
  return 'Not quite. Listen and try again';
}

/* ---------- Typed answers (type the answer, dictation) ---------- */

const plain = (s) => s.toLowerCase().replace(APOS, '').replace(PUNCT, ' ').replace(/\s+/g, ' ').trim();

// ok: close enough to count (small typos and missing accents are forgiven)
// exact: matches including accents, so we can say "watch the accents" when it doesn't
export function compareTyped(target, typed) {
  const a = norm(target).replace(/\s/g, ''), b = norm(typed).replace(/\s/g, '');
  if (!b) return { ok: false, exact: false };
  const ok = a === b || (a.length > 3 && sim(a, b) >= 0.85);
  return { ok, exact: plain(target) === plain(typed) };
}
