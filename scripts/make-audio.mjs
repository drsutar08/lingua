// Builds the app's phrase audio in assets/audio/<lang>/<clip>.mp3 and the index the app loads.
// Phrases without a clip fall back to the device's text-to-speech voice, so any mix works.
//
//   node scripts/make-audio.mjs --list                 Write audio-recordings/recording-list.csv for native speakers
//   node scripts/make-audio.mjs --import <folder>      Copy recordings from <folder>/<lang>/<file>.mp3|m4a|wav
//   node scripts/make-audio.mjs --azure                Generate missing clips with Azure neural voices
//                                                      (needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION)
//   node scripts/make-audio.mjs                        Just rebuild assets/audio/index.js from the files present
//
// Options: --rate 18 (Azure requests per minute; the free tier allows about 20)  --lang es,fr (only these languages)  --force (regenerate existing neural clips)  --prune (delete unused clips)
// Recorded clips always win: --azure never overwrites a clip that was imported as a recording.
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// The app's src files are ES modules without "type": "module"; Node notes that once per file, which is just noise here
process.removeAllListeners('warning');
process.on('warning', (w) => { if (w.code !== 'MODULE_TYPELESS_PACKAGE_JSON') console.warn(w.message); });

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'audio');
const SRC_FILE = path.join(OUT, 'sources.json');
const EXTS = ['.mp3', '.m4a', '.wav'];

const load = (f) => import(pathToFileURL(path.join(ROOT, 'src', f)).href);
const { LANGS, UNITS, ROWS, WORDS, FEMININE } = await load('content.js');
const { TIPS } = await load('guides.js');
const { clipName, normalizeText } = await load('audioKey.js');

// One female neural voice per course language (the accent matches the course: es-ES, pt-PT, ar-SA...)
const AZURE_VOICES = {
  es: 'es-ES-ElviraNeural', fr: 'fr-FR-DeniseNeural', ja: 'ja-JP-NanamiNeural', de: 'de-DE-KatjaNeural',
  ko: 'ko-KR-SunHiNeural', zh: 'zh-CN-XiaoxiaoNeural', it: 'it-IT-ElsaNeural', hi: 'hi-IN-SwaraNeural',
  pt: 'pt-PT-RaquelNeural', nl: 'nl-NL-ColetteNeural', ru: 'ru-RU-SvetlanaNeural', ar: 'ar-SA-ZariyahNeural',
  tr: 'tr-TR-EmelNeural', id: 'id-ID-GadisNeural', sv: 'sv-SE-SofieNeural', pl: 'pl-PL-AgnieszkaNeural',
};

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const only = opt('--lang') ? opt('--lang').split(',') : null;
const langs = Object.keys(LANGS).filter((l) => !only || only.includes(l));

/* ---------- Every phrase the app can speak, per language ---------- */

function phrases(id) {
  const out = new Map(); // text -> { en, where }
  const add = (text, en, where) => {
    if (!text) return;
    const t = normalizeText(text);
    if (!out.has(t)) out.set(t, { en: en || '', where });
    else if (en && !out.get(t).en) out.set(t, { en, where }); // first seen as an answer option: use the unit where it is taught
    const fem = FEMININE[id]?.[text];
    if (fem && !out.has(normalizeText(fem))) out.set(normalizeText(fem), { en: en || '', where: where + ' (female speaker)' });
  };
  ROWS[id].forEach((r, i) => {
    const u = UNITS[i];
    const w = `Unit ${i + 1} ${u.title}`;
    add(r[0], u.b1.mean, w); add(r[1], u.ch.en, w); add(r[2], u.sp, w); add(r[3], u.b2.mean, w); add(r[4], r[6] || u.rev, w);
    r[5].forEach((x) => add(x, '', w + ' (answer option)'));
    WORDS[id][i].forEach((x, k) => add(x, u.words[k], w));
    const tip = TIPS[id]?.[i];
    if (tip) add(tip[2], tip[3], w + ' (grammar tip)');
  });
  return out;
}

/* ---------- Files on disk ---------- */

const sources = fs.existsSync(SRC_FILE) ? JSON.parse(fs.readFileSync(SRC_FILE, 'utf8')) : {};
const save = () => fs.writeFileSync(SRC_FILE, JSON.stringify(sources, null, 1) + '\n');
const clipsIn = (id) => {
  const dir = path.join(OUT, id);
  if (!fs.existsSync(dir)) return new Map();
  return new Map(fs.readdirSync(dir).filter((f) => EXTS.includes(path.extname(f))).map((f) => [path.basename(f, path.extname(f)), f]));
};

/* ---------- --list: recording sheet ---------- */

if (flag('--list')) {
  const dir = path.join(ROOT, 'audio-recordings');
  fs.mkdirSync(dir, { recursive: true });
  const rows = [['language', 'folder', 'file name (save as .mp3, .m4a or .wav)', 'say this', 'english', 'where it appears', 'already has']];
  for (const id of langs) {
    const have = clipsIn(id);
    for (const [t, { en, where }] of phrases(id)) {
      const name = clipName(t);
      rows.push([LANGS[id].name, id, name, t, en, where, have.has(name) ? sources[id]?.[name] || 'clip' : '']);
    }
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  fs.writeFileSync(path.join(dir, 'recording-list.csv'), '﻿' + csv);
  console.log(`Wrote ${rows.length - 1} phrases to audio-recordings/recording-list.csv`);
}

/* ---------- --import: native-speaker recordings ---------- */

if (opt('--import')) {
  const from = path.resolve(opt('--import'));
  let n = 0;
  for (const id of langs) {
    const dir = path.join(from, id);
    if (!fs.existsSync(dir)) continue;
    const valid = new Set([...phrases(id).keys()].map(clipName));
    fs.mkdirSync(path.join(OUT, id), { recursive: true });
    for (const f of fs.readdirSync(dir)) {
      const ext = path.extname(f).toLowerCase();
      const name = path.basename(f, path.extname(f));
      if (!EXTS.includes(ext)) continue;
      if (!valid.has(name)) { console.log(`skip ${id}/${f}: not a file name from the recording list`); continue; }
      for (const e of EXTS) fs.rmSync(path.join(OUT, id, name + e), { force: true }); // replace any neural clip
      fs.copyFileSync(path.join(dir, f), path.join(OUT, id, name + ext));
      (sources[id] ||= {})[name] = 'recorded';
      n++;
    }
  }
  save();
  console.log(`Imported ${n} recordings`);
}

/* ---------- --azure: neural voices for missing clips ---------- */

const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function azure(id, text, file) {
  const key = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;
  const voice = AZURE_VOICES[id];
  const ssml = `<speak version="1.0" xml:lang="${LANGS[id].voice}"><voice name="${voice}"><prosody rate="-8%">${xml(text)}</prosody></voice></speak>`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'lingua-audio-builder',
      },
      body: ssml,
    });
    if (r.ok) { fs.writeFileSync(file, Buffer.from(await r.arrayBuffer())); return voice; }
    if (r.status === 429 || r.status >= 500) {
      const after = Number(r.headers.get('retry-after')) || 5 * (attempt + 1);
      await new Promise((ok) => setTimeout(ok, after * 1000));
      continue;
    }
    throw new Error(`Azure ${r.status}: ${(await r.text()).slice(0, 200)}`);
  }
  throw new Error('Azure kept rate-limiting; try again later');
}

if (flag('--azure')) {
  if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
    console.error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (from your Azure Speech resource) first.');
    process.exit(1);
  }
  const gap = 60000 / (Number(opt('--rate')) || 18);
  let made = 0, kept = 0;
  for (const id of langs) {
    fs.mkdirSync(path.join(OUT, id), { recursive: true });
    const have = clipsIn(id);
    const todo = [...phrases(id).keys()].filter((t) => {
      const name = clipName(t);
      if (sources[id]?.[name] === 'recorded') { kept++; return false; }
      return flag('--force') || !have.has(name);
    });
    console.log(`${LANGS[id].name}: ${todo.length} to generate`);
    // One request at a time, spaced to stay under the rate limit. Progress is saved after each clip,
    // so an interrupted run picks up where it stopped.
    for (const t of todo) {
      const started = Date.now();
      const name = clipName(t);
      const voice = await azure(id, t, path.join(OUT, id, name + '.mp3'));
      (sources[id] ||= {})[name] = 'azure:' + voice;
      save();
      if (++made % 25 === 0) console.log(`  ${made} clips so far`);
      await new Promise((ok) => setTimeout(ok, Math.max(0, gap - (Date.now() - started))));
    }
  }
  console.log(`Generated ${made} clips (kept ${kept} recordings)`);
}

/* ---------- Always: rebuild the index ---------- */

let total = 0, unused = 0;
const lines = ['// Generated by scripts/make-audio.mjs. Do not edit by hand.', '// CLIPS[lang][clipName(text)] = bundled audio file. Phrases without a clip use the device voice.', 'export const CLIPS = {'];
const summary = {};
for (const id of Object.keys(LANGS)) {
  const valid = new Set([...phrases(id).keys()].map(clipName));
  const files = [...clipsIn(id)].filter(([name, f]) => {
    if (valid.has(name)) return true;
    unused++;
    if (flag('--prune')) { fs.rmSync(path.join(OUT, id, f)); delete sources[id]?.[name]; }
    return false;
  });
  if (!files.length) continue;
  lines.push(`  ${id}: {`);
  for (const [name, f] of files.sort()) lines.push(`    '${name}': require('./${id}/${f}'),`);
  lines.push('  },');
  total += files.length;
  const kinds = {};
  for (const [name] of files) { const s = sources[id]?.[name] || 'unknown'; kinds[s] = (kinds[s] || 0) + 1; }
  summary[id] = { clips: files.length, phrases: valid.size, kinds };
}
lines.push('};', '// Where each language\'s clips came from: counts per source', `export const SOURCES = ${JSON.stringify(summary)};`, '');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.js'), lines.join('\n'));
if (flag('--prune')) save();

for (const id of langs) {
  const n = phrases(id).size, s = summary[id];
  console.log(`${LANGS[id].name.padEnd(11)} ${String(s?.clips || 0).padStart(4)} / ${n} phrases have audio${s ? '  ' + JSON.stringify(s.kinds) : ''}`);
}
console.log(`Index: ${total} clips${unused ? `, ${unused} unused file(s)${flag('--prune') ? ' deleted' : ' (run with --prune to delete)'}` : ''}`);
