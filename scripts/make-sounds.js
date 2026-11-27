// Generates the app's short sound effects as 16-bit mono WAV files in assets/sounds.
// Run: node scripts/make-sounds.js
const fs = require('fs');
const path = require('path');

const RATE = 22050;
const out = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(out, { recursive: true });

// notes: [frequency Hz, start s, length s, volume]
function render(notes, shape = 'bell') {
  const len = Math.ceil(RATE * Math.max(...notes.map(([, s, l]) => s + l)) + RATE * 0.05);
  const buf = new Float32Array(len);
  for (const [f, start, dur, vol = 0.5] of notes) {
    const s0 = Math.floor(start * RATE), n = Math.floor(dur * RATE);
    for (let i = 0; i < n; i++) {
      const t = i / RATE;
      const attack = Math.min(1, i / (RATE * 0.006));
      const decay = Math.exp(-t * (shape === 'bell' ? 7 : 12));
      let v = Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t) + 0.1 * Math.sin(2 * Math.PI * f * 3 * t);
      if (shape === 'soft') v = Math.sin(2 * Math.PI * f * t) * 0.9 + 0.15 * Math.sin(2 * Math.PI * f * 1.5 * t);
      buf[s0 + i] += v * attack * decay * vol;
    }
  }
  const peak = Math.max(...buf.map(Math.abs)) || 1;
  const data = Buffer.alloc(len * 2);
  for (let i = 0; i < len; i++) data.writeInt16LE(Math.round((buf[i] / peak) * 0.6 * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G6 = 1568;
const sounds = {
  correct: render([[C6, 0, 0.12, 0.5], [E6, 0.09, 0.28, 0.6]]),
  wrong: render([[233, 0, 0.16, 0.6], [196, 0.13, 0.3, 0.6]], 'soft'),
  complete: render([[C5, 0, 0.18], [E5, 0.1, 0.18], [G5, 0.2, 0.18], [C6, 0.3, 0.6, 0.7]]),
  celebrate: render([[G5, 0, 0.2], [C6, 0.09, 0.2], [E6, 0.18, 0.2], [G6, 0.27, 0.7, 0.7], [C6, 0.27, 0.7, 0.35]]),
  tap: render([[880, 0, 0.05, 0.3]]),
};
for (const [name, wav] of Object.entries(sounds)) {
  fs.writeFileSync(path.join(out, `${name}.wav`), wav);
  console.log(name, wav.length, 'bytes');
}
