// Exports all course content to content-review.csv for native-speaker review.
// Run: node scripts/export-content.js
// Reviewers fill in the "suggested fix" and "notes" columns; apply fixes in src/content.js.
const fs = require('fs');
const path = require('path');

(async () => {
  const { pathToFileURL } = require('url');
  const { LANGS, UNITS, ROWS, WORDS, FEMININE } = await import(pathToFileURL(path.join(__dirname, '..', 'src', 'content.js')).href);
  const { TIPS, ROMAN, romanOf } = await import(pathToFileURL(path.join(__dirname, '..', 'src', 'guides.js')).href);
  const rows = [['language', 'unit', 'type', 'text (target language)', 'english meaning', 'suggested fix', 'notes']];
  const KIND = ['sentence 1', 'word to recognise', 'phrase to speak', 'sentence 2', 'word to recall'];
  for (const [id, units] of Object.entries(ROWS)) {
    units.forEach((row, i) => {
      const u = UNITS[i];
      const en = [u.b1.mean, u.ch.en, u.sp, u.b2.mean, row[6] || u.rev];
      for (let k = 0; k < 5; k++) rows.push([LANGS[id].name, `${i + 1} ${u.title}`, KIND[k], row[k], en[k], '', '']);
      row[5].forEach((w) => rows.push([LANGS[id].name, `${i + 1} ${u.title}`, 'wrong option (should be a real word, not the answer)', w, '', '', '']));
      WORDS[id][i].forEach((w, k) => rows.push([LANGS[id].name, `${i + 1} ${u.title}`, 'vocabulary pair', w, u.words[k], '', '']));
    });
  }
  // Grammar tips: one per unit
  for (const [id, tips] of Object.entries(TIPS)) {
    tips.forEach(([title, body, ex, exEn], i) => rows.push([LANGS[id].name, `${i + 1} ${UNITS[i].title}`, `grammar tip: ${title}`, ex, exEn, '', body]));
  }
  // Pronunciation guides (Japanese is generated from the kana; the rest are hand-written)
  const jaTexts = new Set(ROWS.ja.flatMap((r) => [r[0], r[1], r[2], r[3], r[4], ...r[5]]).concat(WORDS.ja.flat()));
  for (const t of jaTexts) rows.push(['Japanese', '', 'pronunciation guide (romaji, generated)', t, romanOf('ja', t), '', '']);
  const ruTexts = new Set(ROWS.ru.flatMap((r) => [r[0], r[1], r[2], r[3], r[4], ...r[5]]).concat(WORDS.ru.flat()));
  for (const t of ruTexts) rows.push(['Russian', '', 'pronunciation guide (transliteration, generated)', t, romanOf('ru', t), '', '']);
  for (const [id, map] of Object.entries(ROMAN)) {
    for (const [t, r] of Object.entries(map)) rows.push([LANGS[id].name, '', 'pronunciation guide', t, r, '', '']);
  }
  for (const [id, forms] of Object.entries(FEMININE)) {
    for (const [masc, femForm] of Object.entries(forms)) rows.push([LANGS[id].name, '', `female speaker form (male form: ${masc})`, femForm, '', '', '']);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const out = path.join(__dirname, '..', 'content-review.csv');
  fs.writeFileSync(out, '﻿' + csv); // BOM so Excel opens non-Latin scripts correctly
  console.log(`Wrote ${rows.length - 1} items to ${out}`);
})();
