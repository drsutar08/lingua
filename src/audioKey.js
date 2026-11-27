// Stable file name for a phrase's audio clip, shared by the app and scripts/make-audio.mjs.
// FNV-1a hash of the normalised text, so a clip follows its phrase even if the content order changes.
export const normalizeText = (t) => String(t).normalize('NFC').trim().replace(/\s+/g, ' ');

export function clipName(text) {
  let h = 0x811c9dc5;
  for (const ch of normalizeText(text)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(7, '0');
}
