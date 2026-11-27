// Lingua AI tutor server.
// The app sends the role-play conversation here; this server calls Claude with your API key,
// so the key never ships inside the app.
//
//   cd server && npm install
//   ANTHROPIC_API_KEY=sk-ant-... npm start        (PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."; npm start)
//
// Then in the app: Settings -> AI tutor server -> http://<this computer's IP>:8787
import http from 'node:http';
import Anthropic from '@anthropic-ai/sdk';

const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.TUTOR_MODEL || 'claude-opus-5-5';
// Optional protection once the server is reachable by others:
// TUTOR_TOKEN: require 'Authorization: Bearer <token>' (set the same token in the app's Settings)
// TUTOR_RATE_LIMIT: max tutor turns per client address per 10 minutes (default 40)
const TOKEN = process.env.TUTOR_TOKEN || '';
const LIMIT = Number(process.env.TUTOR_RATE_LIMIT || 40);
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return recent.length > LIMIT;
}
// Created on first use: reads ANTHROPIC_API_KEY (or an `ant auth login` profile)
let client = null;
class NoCredentials extends Error {}
function getClient() {
  if (client) return client;
  try { client = new Anthropic(); } catch { throw new NoCredentials(); }
  return client;
}

const LANGS = {
  es: 'Spanish (Spain)', fr: 'French', ja: 'Japanese', de: 'German', ko: 'Korean',
  zh: 'Mandarin Chinese (simplified characters)', it: 'Italian', hi: 'Hindi (Devanagari script)', pt: 'European Portuguese', nl: 'Dutch',
  ru: 'Russian', ar: 'Modern Standard Arabic (no vowel marks)', tr: 'Turkish', id: 'Indonesian', sv: 'Swedish', pl: 'Polish',
};

// How to romanize the languages that don't use Latin letters
const ROMAN_STYLE = {
  ja: 'Hepburn romaji with long vowels written out (koohii, ohayou) and particles as said (wa, o)',
  zh: 'Hanyu Pinyin with tone marks',
  ko: 'Revised Romanization of Korean',
  hi: 'simple everyday romanization without diacritics (aap kaise hain?)',
  ru: 'simple Latin transliteration without accents (Kak dela?)',
  ar: 'simple romanization with doubled vowels for long sounds (kayfa haaluk?)',
};

// The shape every tutor turn comes back in
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'reply_en', 'reply_roman', 'correction', 'suggestions', 'done'],
  properties: {
    reply: { type: 'string', description: 'Your next line in the target language. One or two short sentences.' },
    reply_en: { type: 'string', description: 'English translation of reply.' },
    reply_roman: { type: 'string', description: 'Pronunciation guide for reply in Latin letters (see instructions). Empty for Latin-script languages.' },
    correction: {
      type: 'object',
      additionalProperties: false,
      required: ['needed', 'fixed', 'note'],
      properties: {
        needed: { type: 'boolean', description: "True only if the learner's last message had a real mistake." },
        fixed: { type: 'string', description: "The learner's last message, corrected. Empty if not needed." },
        note: { type: 'string', description: 'A short, kind explanation in English. Empty if not needed.' },
      },
    },
    suggestions: {
      type: 'array',
      description: '2-3 short things the learner could say next, in the target language.',
      items: {
        type: 'object', additionalProperties: false, required: ['text', 'en', 'roman'],
        properties: { text: { type: 'string' }, en: { type: 'string' }, roman: { type: 'string', description: 'Pronunciation guide, or empty for Latin-script languages.' } },
      },
    },
    done: { type: 'boolean', description: 'True when the scene goal is reached and you have said goodbye.' },
  },
};

function systemPrompt({ lang, scene, unit, gender }) {
  return `You are a warm, patient ${LANGS[lang]} tutor running a short role-play with a beginner learner (about CEFR A1, unit ${unit + 1} of a beginner course).

Scene: ${scene.title}. ${scene.setup}
${gender === 'female' || gender === 'male' ? `The learner is ${gender}. When you suggest or correct what the learner says, use the forms a ${gender} speaker would use (this matters in languages like Hindi, French, Portuguese, Korean, Russian, Polish and Arabic).` : "The learner has not given a gender; when the learner's words need a gendered form, use the masculine form and do not correct their choice of gender."}
You play the other person in the scene. Stay in character.

How to reply:
- Write "reply" only in ${LANGS[lang]}, using simple, common words and short sentences a beginner can read. Ask one question at a time to keep the conversation going.
- Give an English translation in "reply_en".
- ${ROMAN_STYLE[lang] ? `Give a pronunciation guide in "reply_roman" and in each suggestion's "roman": ${ROMAN_STYLE[lang]}.` : 'Leave "reply_roman" and each suggestion\'s "roman" empty.'}${lang === 'ja' ? ' Write Japanese in hiragana and katakana only, with a space between words, because the learner is a beginner.' : ''}
- Look at the learner's last message. If it has a real mistake (wrong word, grammar, or it was written in English), set correction.needed to true, put a corrected ${LANGS[lang]} version in correction.fixed, and explain briefly and kindly in English in correction.note. Ignore missing accents, capital letters and punctuation. If it is fine, set needed to false and leave fixed and note empty.
- If the learner writes in English, understand them, gently show how to say it in ${LANGS[lang]} as a correction, and carry on.
- Offer 2-3 short suggestions the learner could say next.
- After about six exchanges, or once the scene goal is met, wrap up kindly, say goodbye, and set done to true.`;
}

async function tutorTurn({ lang, scene, unit, gender, messages }) {
  const history = messages.map((m) => ({ role: m.role === 'tutor' ? 'assistant' : 'user', content: m.text }));
  if (!history.length || history[0].role !== 'user') history.unshift({ role: 'user', content: '(Start the role-play: greet me and open the scene.)' });

  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 2000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default', // if the model declines, the API retries on a fallback model in the same call
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: systemPrompt({ lang, scene, unit, gender }),
    messages: history,
  });

  if (response.stop_reason === 'refusal') {
    return { reply: '…', reply_en: "Let's get back to the scene.", correction: { needed: false, fixed: '', note: '' }, suggestions: [], done: false };
  }
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return JSON.parse(text);
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true, model: MODEL });
  if (req.method !== 'POST' || req.url !== '/tutor') return send(res, 404, { error: 'Not found' });
  if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) return send(res, 401, { error: 'This tutor server needs an access token. Add it in Settings › AI tutor server.' });
  if (rateLimited(req.socket.remoteAddress || 'unknown')) return send(res, 429, { error: 'Too many tutor messages. Wait a few minutes and try again.' });

  let raw = '';
  req.on('data', (c) => {
    raw += c;
    if (raw.length > 100_000) req.destroy();
  });
  req.on('end', async () => {
    let body;
    try { body = JSON.parse(raw); } catch { return send(res, 400, { error: 'Invalid JSON' }); }
    const { lang, scene, unit = 0, gender = 'unspecified', messages = [] } = body || {};
    if (!LANGS[lang] || !scene?.title || !Array.isArray(messages) || messages.length > 40) return send(res, 400, { error: 'Bad request' });
    const clean = messages.map((m) => ({ role: m.role === 'tutor' ? 'tutor' : 'learner', text: String(m.text || '').slice(0, 500) }));
    try {
      send(res, 200, await tutorTurn({ lang, scene: { title: String(scene.title), setup: String(scene.setup || '') }, unit: Number(unit) || 0, gender: ['female', 'male'].includes(gender) ? gender : 'unspecified', messages: clean }));
    } catch (err) {
      if (err instanceof NoCredentials) return send(res, 500, { error: 'The tutor server has no Anthropic credentials. Set ANTHROPIC_API_KEY and restart it.' });
      if (err instanceof Anthropic.AuthenticationError) return send(res, 500, { error: 'The server has no valid ANTHROPIC_API_KEY.' });
      if (err instanceof Anthropic.RateLimitError) return send(res, 429, { error: 'The tutor is busy. Try again in a moment.' });
      if (err instanceof Anthropic.APIError) return send(res, 502, { error: `Claude API error ${err.status}` });
      if (err instanceof SyntaxError) return send(res, 502, { error: 'The tutor reply could not be read. Try again.' });
      console.error(err);
      send(res, 500, { error: `Tutor server error: ${err.message}` });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Lingua tutor listening on http://0.0.0.0:${PORT} (model ${MODEL})`);
  console.log(TOKEN ? 'Access token required (TUTOR_TOKEN is set).' : 'No access token set. Set TUTOR_TOKEN before exposing this server beyond your network.');
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) console.log('Note: ANTHROPIC_API_KEY is not set. Set it (or run "ant auth login") or tutor requests will fail.');
});
