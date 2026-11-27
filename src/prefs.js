import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Device-wide preferences (shared by every account on this device)
const KEY = 'lingua-prefs';
export const DEFAULT_PREFS = {
  theme: 'light', // light (default) | dark | system
  textScale: 1, // 0.9 | 1 | 1.15 | 1.3
  reduceMotion: false, // also on when the OS setting is on
  sound: true,
  haptics: true,
  reminder: { on: false, h: 19, m: 0 },
  showRoman: true, // pronunciation guide under Japanese, Chinese, Korean and Hindi
  tutorUrl: '', // AI tutor server address (see server/tutor.mjs)
  tutorToken: '', // optional access token, if the server sets TUTOR_TOKEN
};

const PrefsCtx = createContext({ prefs: DEFAULT_PREFS, set: () => {}, ready: false, osReduceMotion: false });

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  const [osReduceMotion, setOsReduce] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = JSON.parse(await AsyncStorage.getItem(KEY));
        const oldTheme = await AsyncStorage.getItem('lingua-theme'); // from the previous version
        setPrefs({ ...DEFAULT_PREFS, ...(oldTheme ? { theme: oldTheme } : {}), ...(saved || {}) });
      } catch {}
      setReady(true);
    })();
    AccessibilityInfo.isReduceMotionEnabled?.().then(setOsReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setOsReduce);
    return () => sub?.remove?.();
  }, []);

  const set = useCallback((k, v) => {
    setPrefs((p) => {
      const n = { ...p, [k]: v };
      AsyncStorage.setItem(KEY, JSON.stringify(n)).catch(() => {});
      return n;
    });
  }, []);

  const value = useMemo(() => ({ prefs, set, ready, osReduceMotion }), [prefs, set, ready, osReduceMotion]);
  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

export const usePrefs = () => useContext(PrefsCtx);

export function useThemePref() {
  const { prefs, set } = usePrefs();
  return { pref: prefs.theme, setPref: (v) => set('theme', v) };
}

// True when animations should be skipped (in-app setting or the OS accessibility setting)
export function useReducedMotion() {
  const { prefs, osReduceMotion } = usePrefs();
  return prefs.reduceMotion || osReduceMotion;
}
