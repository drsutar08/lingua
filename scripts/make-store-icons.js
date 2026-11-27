// Exports store-listing and web/PWA icon sizes from assets/icon.png.
//   node scripts/make-store-icons.js
// Writes store/icons/. Rerun whenever assets/icon.png changes.
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp-compact');

const root = path.join(__dirname, '..');
const src = path.join(root, 'assets', 'icon.png');
const out = path.join(root, 'store', 'icons');

const targets = [
  // App Store: 1024x1024, no alpha channel (App Store Connect rejects icons with one).
  { file: 'app-store-1024.png', size: 1024 },
  // Google Play: 512x512, 32-bit PNG; full-bleed square (Play applies the rounded mask).
  { file: 'play-store-512.png', size: 512, alpha: true },
  // Web / PWA manifest. The glyph sits well inside the 80% safe zone, so these work as "maskable" too.
  { file: 'web-192.png', size: 192 },
  { file: 'web-512.png', size: 512 },
  { file: 'apple-touch-icon-180.png', size: 180 },
];

// Minimal PNG encoder: 8-bit RGB (color type 2), no alpha channel.
function encodeRgbPng({ width, height, data }) {
  const zlib = require('zlib');
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, body) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length);
    const tb = Buffer.concat([Buffer.from(type, 'ascii'), body]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(tb));
    return Buffer.concat([len, tb, c]);
  };
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0, o = 0; y < height; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw[o++] = data[i]; raw[o++] = data[i + 1]; raw[o++] = data[i + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // bit depth 8, color type RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

(async () => {
  const icon = await Jimp.read(src);
  const { width, height } = icon.bitmap;
  if (width !== 1024 || height !== 1024) throw new Error(`assets/icon.png must be 1024x1024 (is ${width}x${height})`);

  // Store icons must be fully opaque.
  let transparent = 0;
  icon.scan(0, 0, width, height, (x, y, i) => { if (icon.bitmap.data[i + 3] < 255) transparent++; });
  if (transparent) throw new Error(`assets/icon.png has ${transparent} transparent pixels; store icons must be opaque`);

  fs.mkdirSync(out, { recursive: true });
  for (const t of targets) {
    const img = icon.clone();
    if (t.size !== width) img.resize(t.size, t.size, Jimp.RESIZE_BICUBIC);
    const dest = path.join(out, t.file);
    if (t.alpha) await img.writeAsync(dest);
    else fs.writeFileSync(dest, encodeRgbPng(img.bitmap)); // jimp's rgba(false) writes corrupt pixels, so encode RGB ourselves
    console.log(`store/icons/${t.file}  ${t.size}x${t.size}${t.alpha ? '' : '  (no alpha)'}`);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
