import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayKey, freshState, migrate, seed } from './data';
import { DEMO, dataKey } from './auth';
import {
  addCard, addXp, applyStreak, bump, checkAchievements, ensureQuests, gainHeart, grade, loseHeart, practiced,
} from './game';

const StoreCtx = createContext(null);
const clone = (o) => JSON.parse(JSON.stringify(o));

// Progress for the signed-in account. Remount with key={user} when the account changes.
export function StoreProvider({ user, children }) {
  const KEY = dataKey(user);
  const [S, setS] = useState(null);
  const [notice, setNotice] = useState(null);
  const SRef = useRef(null);
  SRef.current = S;

  useEffect(() => {
    (async () => {
      let s = null;
      try {
        s = JSON.parse(await AsyncStorage.getItem(KEY));
      } catch {}
      s = s ? migrate(s) : user === DEMO.email ? seed() : freshState(user.split('@')[0], user);
      const msg = applyStreak(s);
      if (msg) setNotice(msg);
      if (s.goalDay !== dayKey(0)) { s.goalDay = dayKey(0); s.goalWords = 0; }
      ensureQuests(s);
      setS(s);
    })();
  }, []);

  useEffect(() => {
    if (S) AsyncStorage.setItem(KEY, JSON.stringify(S)).catch(() => {});
  }, [S]);

  // A new day can start while the app is open: re-check when it returns to the foreground and once a minute
  const loaded = !!S;
  useEffect(() => {
    if (!loaded) return;
    const check = () => {
      const cur = SRef.current;
      if (!cur || cur.goalDay === dayKey(0)) return;
      const n = clone(cur);
      const msg = applyStreak(n);
      n.goalDay = dayKey(0);
      n.goalWords = 0;
      ensureQuests(n);
      setS(n);
      if (msg) setNotice(msg);
    };
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') check(); });
    const timer = setInterval(check, 60 * 1000);
    return () => { sub.remove(); clearInterval(timer); };
  }, [loaded]);

  const actions = useMemo(() => {
    // Every change goes through here: run the change, then award any achievements it unlocked
    const update = (fn) => setS((p) => { const n = clone(p); fn(n); checkAchievements(n); return n; });

    const learn = (s, lang, words) => {
      let fresh = 0;
      for (const [w, m] of words) {
        if (!w || !m) continue;
        if (addCard(s, lang, w, m)) {
          fresh++;
          s.vocab.unshift([w, m]);
        }
      }
      s.wordsTotal += fresh;
      s.goalWords += fresh;
      if (s.goalWords >= s.goal && !s.goalDays.includes(dayKey(0))) s.goalDays.push(dayKey(0));
    };

    return {
      addCourse: (id, done = 0) => update((s) => {
        const c = s.courses.find((x) => x.id === id);
        if (c) c.done = Math.max(c.done, done);
        else s.courses.push({ id, done });
        s.courses.sort((a, b) => (a.id === id ? -1 : b.id === id ? 1 : 0));
      }),
      focusCourse: (id) => update((s) => { s.courses.sort((a, b) => (a.id === id ? -1 : b.id === id ? 1 : 0)); }),
      setGoal: (n) => update((s) => { s.goal = n; }),
      setGender: (g) => update((s) => { s.gender = g; }),
      saveProfile: (name) => update((s) => { s.name = name; }),
      reset: () => setS((p) => (user === DEMO.email ? seed() : freshState(p.name, user))),
      loseHeart: () => update(loseHeart),
      dismissCelebrate: () => update((s) => { s.celebrate.shift(); }),
      clearNotice: () => setNotice(null),

      // A lesson or drill finished (not called when the learner ran out of hearts)
      finishLesson: ({ id, idx, xp, learned, mistakes, speakPass = 0, matches = 0 }) =>
        update((s) => {
          practiced(s);
          addXp(s, xp);
          s.lessons++;
          learn(s, id, learned);
          const c = s.courses.find((x) => x.id === id);
          if (c && idx != null && idx === c.done) c.done++;
          s.stats.speakPass += speakPass;
          s.stats.matches += matches;
          if (mistakes === 0) s.stats.perfect++;
          bump(s, 'lesson');
          if (mistakes === 0) bump(s, 'perfect');
          if (speakPass) bump(s, 'speak', speakPass);
          if (matches) bump(s, 'match', matches);
          if (id) s.courses.sort((a, b) => (a.id === id ? -1 : b.id === id ? 1 : 0));
        }),

      // A spaced-review session finished: reschedule each card, and earn a heart back
      finishReview: ({ graded, xp }) =>
        update((s) => {
          practiced(s);
          for (const { key, ok } of graded) {
            const c = s.srs[key];
            if (!c) continue;
            // Early practice (card not due yet) only counts when you miss it; a correct early answer
            // keeps the existing schedule instead of stretching the interval
            if (c.due <= Date.now() || !ok) grade(s, key, ok);
          }
          s.stats.reviews += graded.length;
          bump(s, 'review', graded.length);
          addXp(s, xp);
          gainHeart(s, 1);
        }),
    };
  }, []);

  return <StoreCtx.Provider value={{ S, notice, ...actions }}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);

// UI-level actions shared by screens: switch tab, open a lesson or sheet, show a toast
export const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);
