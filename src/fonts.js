// Fonts for scripts that Plus Jakarta Sans doesn't cover.
// - Hindi (Devanagari): Noto Sans Devanagari, bundled with the app (about 0.4 MB for two weights).
// - Japanese, Chinese, Korean on the web: Noto Sans JP / SC / KR from Google Fonts, which only
//   downloads the character ranges a page uses.
// - Japanese, Chinese, Korean on phones: the built-in system font, which supports real bold.
//   On Android that is Noto Sans CJK; on iPhone, Apple's Hiragino / PingFang / Apple SD Gothic.
//   (Bundling Noto CJK would add about 46 MB to the app.)
import { Platform } from 'react-native';

export const NOTO_DEVA = { r: 'NotoSansDevanagari_400Regular', b: 'NotoSansDevanagari_700Bold' };
const WEB_FAMILY = { ja: "'Noto Sans JP'", zh: "'Noto Sans SC'", ko: "'Noto Sans KR'" };
// Russian (Cyrillic) and Arabic: Noto Sans / Noto Sans Arabic on the web, system fonts on phones
const WEB_OTHER = { ru: "'Noto Sans'", ar: "'Noto Sans Arabic'" };

// Which special script a piece of text uses, if any
export function scriptOf(text) {
  if (!text) return null;
  if (/[぀-ヿ]/.test(text)) return 'ja'; // kana
  if (/[가-힯ᄀ-ᇿ㄰-㆏]/.test(text)) return 'ko'; // hangul
  if (/[一-鿿㐀-䶿]/.test(text)) return 'zh'; // han without kana
  if (/[ऀ-ॿ]/.test(text)) return 'hi'; // devanagari
  if (/[؀-ۿ]/.test(text)) return 'ar'; // arabic
  if (/[Ѐ-ӿ]/.test(text)) return 'ru'; // cyrillic
  return null;
}

// Style overrides for Txt. `jakarta` is the Plus Jakarta family for this weight; `bold` covers sb/b/xb.
export function scriptStyle(text, jakarta, bold) {
  const s = scriptOf(text);
  if (!s) return null;
  const weight = bold ? '700' : '400';
  if (s === 'hi') {
    const deva = bold ? NOTO_DEVA.b : NOTO_DEVA.r;
    // Web falls back glyph by glyph, so Latin letters in the same string stay in Plus Jakarta
    return Platform.OS === 'web' ? { fontFamily: `${deva}, ${jakarta}, sans-serif` } : { fontFamily: deva };
  }
  if (s === 'ru' || s === 'ar') {
    return Platform.OS === 'web' ? { fontFamily: `${jakarta}, ${WEB_OTHER[s]}, sans-serif`, fontWeight: weight } : { fontFamily: undefined, fontWeight: weight };
  }
  if (Platform.OS === 'web') {
    const others = ['ja', 'zh', 'ko'].filter((k) => k !== s).map((k) => WEB_FAMILY[k]);
    return { fontFamily: `${jakarta}, ${WEB_FAMILY[s]}, ${others.join(', ')}, sans-serif`, fontWeight: weight };
  }
  // Phones: use the system font so bold looks right
  return { fontFamily: undefined, fontWeight: weight };
}

// Web only: load Noto Sans JP/SC/KR and stop browsers faking bold on Plus Jakarta's single-weight faces
export function installWebFonts() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById('lingua-noto')) return;
  const link = document.createElement('link');
  link.id = 'lingua-noto';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Sans+SC:wght@400;700&family=Noto+Sans:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&display=swap';
  document.head.appendChild(link);
  const style = document.createElement('style');
  style.textContent = '* { font-synthesis: none; }';
  document.head.appendChild(style);
}
