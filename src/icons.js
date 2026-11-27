import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

const st = (c, w = 1.9) => ({ fill: 'none', stroke: c, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' });

const ICONS = {
  home: (c) => <Path {...st(c, 1.8)} d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  explore: (c) => <G {...st(c, 1.8)}><Circle cx="12" cy="12" r="9" /><Path d="m15.5 8.5-2 5-5 2 2-5z" /></G>,
  practice: (c) => <Path {...st(c, 1.8)} d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  progress: (c) => <Path {...st(c, 1.8)} d="M5 20v-6M10 20V9M15 20v-4M20 20V5" />,
  chart: (c) => <Path {...st(c, 2.2)} d="M5 20v-6M10 20V9M15 20v-4M20 20V5" />,
  profile: (c) => <G {...st(c, 1.8)}><Circle cx="12" cy="8" r="4" /><Path d="M4 21a8 8 0 0 1 16 0" /></G>,
  chev: (c) => <Path {...st(c, 2)} d="m9 6 6 6-6 6" />,
  back: (c) => <Path {...st(c, 2)} d="m15 6-6 6 6 6" />,
  close: (c) => <Path {...st(c, 2)} d="M6 6l12 12M18 6 6 18" />,
  menu: (c) => <Path {...st(c, 2)} d="M4 7h16M4 12h16M4 17h10" />,
  search: (c) => <G {...st(c, 2)}><Circle cx="11" cy="11" r="7" /><Path d="m20 20-3.5-3.5" /></G>,
  gear: (c) => (
    <G {...st(c, 1.8)}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </G>
  ),
  flame: (c) => (
    <G>
      <Path fill={c === 'white' ? '#fff' : '#FF7A2F'} d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 1-3.5S9 11 11 11c0-4 1-9 1-9z" />
      <Path fill="#FFC53D" d="M12 13s2.5 1.7 2.5 4a2.5 2.5 0 0 1-5 0c0-1.6 2.5-4 2.5-4z" />
    </G>
  ),
  heart: (c) => <Path fill={c} d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />,
  speaker: (c) => <G {...st(c, 2)}><Path d="M11 5 6 9H3v6h3l5 4z" fill={c} /><Path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></G>,
  mic: (c) => <G {...st(c, 2)}><Rect x="9" y="3" width="6" height="11" rx="3" fill={c} /><Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></G>,
  target: (c) => <G {...st(c, 2)}><Circle cx="12" cy="12" r="9" /><Circle cx="12" cy="12" r="5" /><Circle cx="12" cy="12" r="1.5" fill={c} /></G>,
  gift: () => (
    <G>
      <Rect x="3" y="9" width="18" height="12" rx="2" fill="#9B86F7" />
      <Rect x="2" y="7" width="20" height="4" rx="1.5" fill="#7B61F0" />
      <Rect x="11" y="7" width="2.4" height="14" fill="#FF6E8A" />
      <Path d="M12 7c-2-3-5-3-5-1s3 1 5 1zm0 0c2-3 5-3 5-1s-3 1-5 1z" fill="#FF6E8A" />
    </G>
  ),
  book: (c) => <G {...st(c)}><Path d="M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.5-6-1.5-9 .5-3-2-6.5-2-9-.5z" /><Path d="M12 6v13.5" /></G>,
  headphones: (c) => <G {...st(c)}><Path d="M4 15v-3a8 8 0 0 1 16 0v3" /><Rect x="3" y="14" width="4" height="6" rx="1.5" fill={c} /><Rect x="17" y="14" width="4" height="6" rx="1.5" fill={c} /></G>,
  micsm: (c) => <G {...st(c)}><Rect x="9" y="3" width="6" height="11" rx="3" fill={c} /><Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></G>,
  grammar: (c) => <G {...st(c)}><Rect x="4" y="3" width="16" height="18" rx="2.5" /><Path d="M8 8h8M8 12h8M8 16h5" /></G>,
  vocab: (c) => <G {...st(c)}><Rect x="3" y="3" width="18" height="18" rx="4" /><Path d="m7 16 3-8 3 8M8 13.5h4M15 11.5c1.8-1 3 0 3 1.5V16m0-2c-2.2-.5-3.5.3-3.5 1.2 0 1.3 2.2 1.3 3.5-.2" /></G>,
  star: (c) => <Path fill={c} d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.3l-5.6 2.9 1.1-6.3L2.9 9.5l6.3-.9z" />,
  check: (c) => <Path {...st(c, 3)} d="m5 12.5 4.5 4.5L19 7.5" />,
  bolt: (c) => <Path fill={c === '#000' ? '#F5A524' : c} d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  drop: (c) => <Path fill={c === '#000' ? '#1FA874' : c} d="M12 2.5S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5z" />,
  health: (c) => <G {...st(c)}><Rect x="3.5" y="3.5" width="17" height="17" rx="5" fill={c} fillOpacity={0.25} /><Path d="M12 8v8M8 12h8" /></G>,
  clock: (c) => <G {...st(c)}><Circle cx="12" cy="12" r="8.5" fill={c} fillOpacity={0.25} /><Path d="M12 7.5V12l3 2" /></G>,
  smile: (c) => <G {...st(c)}><Circle cx="12" cy="12" r="8.5" fill={c} fillOpacity={0.25} /><Path d="M8.5 14a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" /></G>,
  bag: (c) => <G {...st(c)}><Rect x="3" y="7" width="18" height="13" rx="2.5" fill={c} fillOpacity={0.25} /><Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></G>,
  plane: (c) => <Path fill={c} d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z" />,
  blocks: (c) => <G {...st(c)}><Rect x="3" y="4" width="8" height="16" rx="1.5" /><Rect x="13" y="4" width="8" height="16" rx="1.5" /><Path d="M5.5 9h3M15.5 9h3" /></G>,
  case: (c) => <G {...st(c)}><Rect x="3" y="7" width="18" height="13" rx="2.5" /><Path d="M9 7V5h6v2M3 12h18" /></G>,
  kids: (c) => <Path fill={c} d="M12 3.5 14.4 8l5 .8-3.6 3.5.9 5-4.7-2.4-4.7 2.4.9-5L4.6 8.8l5-.8z" />,
  mail: (c) => <G {...st(c, 1.8)}><Rect x="3" y="5" width="18" height="14" rx="3" /><Path d="m4 7 8 6 8-6" /></G>,
  lock: (c) => <G {...st(c, 1.8)}><Rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><Path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></G>,
  user: (c) => <G {...st(c, 1.8)}><Circle cx="12" cy="8" r="4" /><Path d="M4 21a8 8 0 0 1 16 0" /></G>,
  eye: (c) => <G {...st(c, 1.8)}><Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><Circle cx="12" cy="12" r="3" /></G>,
  eyeOff: (c) => <G {...st(c, 1.8)}><Path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-2.9 3.7M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.5 4.6-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" /></G>,
  moon: (c) => <Path {...st(c, 1.8)} d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  logout: (c) => <G {...st(c, 1.8)}><Path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 16l-4-4 4-4M5 12h10" /></G>,
  save: (c) => <Path fill={c} d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />,
};

export function Icon({ name, size = 22, color = '#000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {ICONS[name](color)}
    </Svg>
  );
}
