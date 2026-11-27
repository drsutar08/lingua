import { createContext, useContext } from 'react';

export const light = {
  dark: false,
  bg: '#F5F4FB', surface: '#FFFFFF', soft: '#F3F1FB', ink: '#17142E', muted: '#6B6788', line: '#E9E6F4',
  accent: '#7B61F0', accent2: '#A08CF8', accentSoft: '#EEEAFE', onAccent: '#FFFFFF',
  good: '#1FA874', goodSoft: '#E3F7EE', bad: '#E5486A', badSoft: '#FDE8EE',
  redSoft: '#FDECEE', greenSoft: '#E5F7EF', yellowSoft: '#FFF4DB', blueSoft: '#E9EEFE',
  scrim: 'rgba(20,14,50,0.4)',
};

export const dark = {
  dark: true,
  bg: '#0D0B19', surface: '#17152B', soft: '#211E3A', ink: '#EEEBFF', muted: '#A39EC4', line: '#2A2645',
  accent: '#9A85FF', accent2: '#7B61F0', accentSoft: '#2C2652', onAccent: '#FFFFFF',
  good: '#3CCB93', goodSoft: '#163A2E', bad: '#FF6E8A', badSoft: '#40202C',
  redSoft: '#3A2030', greenSoft: '#173628', yellowSoft: '#3A3020', blueSoft: '#1F2647',
  scrim: 'rgba(0,0,0,0.55)',
};

// Icon tints for the colored tiles (same in both themes)
export const tint = { purple: '#7B61F0', red: '#E5486A', green: '#1FA874', yellow: '#E89A0C', blue: '#4B6BF0' };

export const F = {
  r: 'PlusJakartaSans_400Regular',
  m: 'PlusJakartaSans_500Medium',
  sb: 'PlusJakartaSans_600SemiBold',
  b: 'PlusJakartaSans_700Bold',
  xb: 'PlusJakartaSans_800ExtraBold',
};

export const ThemeCtx = createContext(light);

// Appearance preference lives with the other device preferences
export { useThemePref } from './prefs';
export const useT = () => useContext(ThemeCtx);

export const shadow = {
  shadowColor: '#4C38AA',
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

// Very soft lift for flat, bordered panels
export const soft = {
  shadowColor: '#3B2A99',
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 1,
};
