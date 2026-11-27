// Unit tests for src/game.js: hearts, streaks + freezes, XP levels, daily quests, achievements, spaced repetition.
// Run with: npm test
import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY, MAX_HEARTS, REFILL_MS, MAX_FREEZES, QUEST_XP,
  dayKey, heartsNow, loseHeart, gainHeart, applyStreak, practiced,
  xpForLevel, levelOf, addXp, questsFor, questDef, ensureQuests, bump,
  ACHIEVEMENTS, checkAchievements, cardKey, addCard, grade, dueCards, nextDue,
} from '../src/game.js';

const MIN = 60 * 1000;
// A fixed local time (10 March 2026, 09:00) so day boundaries are predictable
const NOW = new Date(2026, 2, 10, 9, 0, 0).getTime();
const TODAY = '2026-03-10';
const YESTERDAY = '2026-03-09';

const setNow = (t) => mock.timers.setTime(t);

// A fresh user state with only the fields game.js reads and writes
function state(over = {}) {
  return {
    hearts: null, streak: 0, lastDay: null, freezes: 0,
    stats: {}, celebrate: [], xp: {}, totalXp: 0, srs: {},
    quests: null, courses: [{ id: 'es' }], lessons: 0, wordsTotal: 0, goalDays: [], earned: {},
    ...over,
  };
}

beforeEach(() => mock.timers.enable({ apis: ['Date'], now: NOW }));
afterEach(() => mock.timers.reset());

describe('dayKey', () => {
  test('returns today as YYYY-MM-DD', () => {
    assert.equal(dayKey(), TODAY);
  });
  test('offsets by whole days, across month boundaries', () => {
    assert.equal(dayKey(-1), YESTERDAY);
    assert.equal(dayKey(-10), '2026-02-28');
    assert.equal(dayKey(22), '2026-04-01');
  });
  test('late evening still counts as the same day', () => {
    assert.equal(dayKey(0, new Date(2026, 2, 10, 23, 59).getTime()), TODAY);
    assert.equal(dayKey(0, new Date(2026, 2, 10, 0, 1).getTime()), TODAY);
  });
});

describe('hearts', () => {
  test('a new user has full hearts and no refill timer', () => {
    assert.deepEqual(heartsNow(null, NOW), { n: MAX_HEARTS, ts: NOW, next: null });
  });

  test('refills one heart every 30 minutes', () => {
    const h = { n: 2, ts: NOW };
    assert.equal(heartsNow(h, NOW + REFILL_MS - 1).n, 2);
    assert.equal(heartsNow(h, NOW + REFILL_MS).n, 3);
    assert.equal(heartsNow(h, NOW + 2 * REFILL_MS + 5 * MIN).n, 4);
  });

  test('reports time until the next heart, keeping partial progress', () => {
    const r = heartsNow({ n: 2, ts: NOW }, NOW + REFILL_MS + 10 * MIN);
    assert.equal(r.n, 3);
    assert.equal(r.next, 20 * MIN);
  });

  test('never refills past the maximum', () => {
    const r = heartsNow({ n: 1, ts: NOW }, NOW + 100 * REFILL_MS);
    assert.equal(r.n, MAX_HEARTS);
    assert.equal(r.next, null);
  });

  test('losing a heart from full starts the refill timer now', () => {
    const s = state({ hearts: { n: MAX_HEARTS, ts: NOW - DAY } });
    loseHeart(s);
    assert.deepEqual(s.hearts, { n: MAX_HEARTS - 1, ts: NOW });
  });

  test('losing another heart keeps the running timer', () => {
    const s = state({ hearts: { n: 3, ts: NOW - 10 * MIN } });
    loseHeart(s);
    assert.deepEqual(s.hearts, { n: 2, ts: NOW - 10 * MIN });
  });

  test('hearts never go below zero', () => {
    const s = state({ hearts: { n: 0, ts: NOW } });
    loseHeart(s);
    assert.equal(s.hearts.n, 0);
  });

  test('gaining hearts is capped at the maximum', () => {
    const s = state({ hearts: { n: 4, ts: NOW } });
    gainHeart(s, 3);
    assert.equal(s.hearts.n, MAX_HEARTS);
  });
});

describe('streaks and freezes', () => {
  test('first practice starts a 1-day streak', () => {
    const s = state();
    practiced(s);
    assert.equal(s.streak, 1);
    assert.equal(s.lastDay, TODAY);
    assert.equal(s.stats.maxStreak, 1);
  });

  test('practising on consecutive days extends the streak', () => {
    const s = state({ streak: 4, lastDay: YESTERDAY });
    practiced(s);
    assert.equal(s.streak, 5);
  });

  test('practising twice in one day counts once', () => {
    const s = state({ streak: 4, lastDay: YESTERDAY });
    practiced(s);
    practiced(s);
    assert.equal(s.streak, 5);
  });

  test('a gap restarts the streak at 1 but keeps the best streak', () => {
    const s = state({ streak: 9, lastDay: '2026-03-07', stats: { maxStreak: 12 } });
    practiced(s);
    assert.equal(s.streak, 1);
    assert.equal(s.stats.maxStreak, 12);
  });

  test('every 7th day earns a freeze, up to the maximum', () => {
    const s = state({ streak: 6, lastDay: YESTERDAY });
    practiced(s);
    assert.equal(s.freezes, 1);
    assert.deepEqual(s.celebrate, [{ type: 'freeze', streak: 7 }]);

    const full = state({ streak: 13, lastDay: YESTERDAY, freezes: MAX_FREEZES });
    practiced(full);
    assert.equal(full.freezes, MAX_FREEZES);
    assert.deepEqual(full.celebrate, []);
  });

  test('opening the app the day after practising changes nothing', () => {
    const s = state({ streak: 5, lastDay: YESTERDAY, freezes: 1 });
    assert.equal(applyStreak(s), null);
    assert.equal(s.streak, 5);
    assert.equal(s.freezes, 1);
  });

  test('a missed day uses a freeze and keeps the streak alive', () => {
    const s = state({ streak: 5, lastDay: '2026-03-08', freezes: 1 });
    const msg = applyStreak(s);
    assert.match(msg, /Streak freeze used/);
    assert.equal(s.freezes, 0);
    assert.equal(s.streak, 5);
    assert.equal(s.lastDay, YESTERDAY);
    // ...so practising today continues it
    practiced(s);
    assert.equal(s.streak, 6);
  });

  test('two missed days need two freezes', () => {
    const s = state({ streak: 5, lastDay: '2026-03-07', freezes: 2 });
    applyStreak(s);
    assert.equal(s.freezes, 0);
    assert.equal(s.streak, 5);
  });

  test('not enough freezes ends the streak and keeps the freezes', () => {
    const s = state({ streak: 5, lastDay: '2026-03-06', freezes: 2 });
    const msg = applyStreak(s);
    assert.match(msg, /5-day streak ended/);
    assert.equal(s.streak, 0);
    assert.equal(s.freezes, 2);
  });

  test('users without a streak are left alone', () => {
    assert.equal(applyStreak(state()), null);
    assert.equal(applyStreak(state({ lastDay: '2026-01-01', streak: 0 })), null);
  });
});

describe('XP and levels', () => {
  test('level thresholds: 0, 100, 300, 600, 1000', () => {
    assert.deepEqual([1, 2, 3, 4, 5].map(xpForLevel), [0, 100, 300, 600, 1000]);
  });

  test('levelOf reports level and progress into it', () => {
    assert.deepEqual(levelOf(0), { level: 1, into: 0, span: 100 });
    assert.deepEqual(levelOf(99), { level: 1, into: 99, span: 100 });
    assert.deepEqual(levelOf(100), { level: 2, into: 0, span: 200 });
    assert.deepEqual(levelOf(650), { level: 4, into: 50, span: 400 });
  });

  test('addXp records daily and total XP', () => {
    const s = state();
    addXp(s, 15);
    addXp(s, 5);
    assert.equal(s.xp[TODAY], 20);
    assert.equal(s.totalXp, 20);
  });

  test('crossing a level threshold celebrates the new level', () => {
    const s = state({ totalXp: 95 });
    addXp(s, 10);
    assert.ok(s.celebrate.some((c) => c.type === 'level' && c.level === 2));
  });

  test('adding zero XP does nothing', () => {
    const s = state();
    addXp(s, 0);
    assert.deepEqual(s.xp, {});
    assert.equal(s.quests, null);
  });
});

describe('daily quests', () => {
  test('each day has 3 different quests, always starting with "Earn 30 XP"', () => {
    for (let d = 0; d < 60; d++) {
      const list = questsFor(dayKey(d));
      assert.equal(list.length, 3);
      assert.equal(list[0].id, 'xp');
      assert.equal(new Set(list.map((q) => q.id)).size, 3, `duplicate quest on ${dayKey(d)}`);
      for (const q of list) {
        assert.ok(questDef(q.id), `unknown quest ${q.id}`);
        assert.deepEqual({ prog: q.prog, done: q.done }, { prog: 0, done: false });
      }
    }
  });

  test('the same date always gets the same quests', () => {
    assert.deepEqual(questsFor(TODAY), questsFor(TODAY));
  });

  test('quests reset on a new day', () => {
    const s = state();
    ensureQuests(s);
    s.quests.list[0].prog = 20;
    ensureQuests(s);
    assert.equal(s.quests.list[0].prog, 20, 'same day keeps progress');

    setNow(NOW + DAY);
    ensureQuests(s);
    assert.equal(s.quests.day, '2026-03-11');
    assert.equal(s.quests.list[0].prog, 0);
  });

  test('finishing a quest awards quest XP once', () => {
    const s = state();
    addXp(s, 30); // completes "Earn 30 XP"
    const xpQuest = s.quests.list.find((q) => q.id === 'xp');
    assert.equal(xpQuest.done, true);
    assert.equal(s.totalXp, 30 + QUEST_XP);
    assert.equal(s.xp[TODAY], 30 + QUEST_XP);

    addXp(s, 30); // already done: no second reward
    assert.equal(s.totalXp, 60 + QUEST_XP);
  });

  test('quest progress is capped at the goal', () => {
    const s = state();
    addXp(s, 500);
    const q = s.quests.list.find((x) => x.id === 'xp');
    assert.equal(q.prog, questDef('xp').goal);
  });

  test('finishing all quests opens the chest: a freeze, or 20 XP when freezes are full', () => {
    const finishAll = (s) => {
      ensureQuests(s);
      for (const q of s.quests.list) bump(s, questDef(q.id).ev, questDef(q.id).goal);
    };

    const s = state();
    finishAll(s);
    assert.equal(s.quests.chest, true);
    assert.equal(s.freezes, 1);
    assert.ok(s.celebrate.some((c) => c.type === 'chest' && c.reward === 'freeze'));

    const full = state({ freezes: MAX_FREEZES });
    finishAll(full);
    assert.equal(full.freezes, MAX_FREEZES);
    assert.equal(full.totalXp, 3 * QUEST_XP + 20);
    assert.ok(full.celebrate.some((c) => c.type === 'chest' && c.reward === 'xp'));
  });

  test('the chest opens only once per day', () => {
    const s = state();
    ensureQuests(s);
    for (const q of s.quests.list) bump(s, questDef(q.id).ev, 99);
    bump(s, 'xp', 99);
    assert.equal(s.celebrate.filter((c) => c.type === 'chest').length, 1);
  });
});

describe('achievements', () => {
  test('every achievement has an id, label and progress function', () => {
    const ids = new Set();
    for (const a of ACHIEVEMENTS) {
      assert.ok(a.id && a.label && typeof a.prog === 'function');
      ids.add(a.id);
    }
    assert.equal(ids.size, ACHIEVEMENTS.length, 'duplicate achievement id');
  });

  test('a new user has earned nothing', () => {
    const s = state();
    checkAchievements(s);
    assert.deepEqual(s.earned, {});
    assert.deepEqual(s.celebrate, []);
  });

  test('reaching a goal awards the badge once, dated today', () => {
    const s = state({ lessons: 1 });
    checkAchievements(s);
    checkAchievements(s);
    assert.equal(s.earned.first_lesson, TODAY);
    assert.equal(s.celebrate.filter((c) => c.id === 'first_lesson').length, 1);
  });

  test('silent mode records badges without celebrating', () => {
    const s = state({ lessons: 3, courses: [{}, {}, {}] });
    checkAchievements(s, true);
    assert.ok(s.earned.first_lesson && s.earned.polyglot);
    assert.deepEqual(s.celebrate, []);
  });

  test('streak badges use the best streak, not just the current one', () => {
    const s = state({ streak: 1, stats: { maxStreak: 8 } });
    checkAchievements(s);
    assert.ok(s.earned.streak7);
    assert.equal(s.earned.streak30, undefined);
  });

  test('week goal counts only goal days from the last 7 days', () => {
    const old = state({ goalDays: ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05'] });
    checkAchievements(old);
    assert.equal(old.earned.week_goal, undefined);

    const recent = state({ goalDays: ['2026-03-04', '2026-03-06', '2026-03-07', '2026-03-09', TODAY] });
    checkAchievements(recent);
    assert.equal(recent.earned.week_goal, TODAY);
  });

  test('level 5 badge follows total XP', () => {
    const s = state({ totalXp: xpForLevel(5) });
    checkAchievements(s);
    assert.ok(s.earned.level5);
  });
});

describe('spaced repetition', () => {
  const KEY = cardKey('es', 'hola');

  test('a new card is due tomorrow', () => {
    const s = state();
    assert.equal(addCard(s, 'es', 'hola', 'hello'), true);
    assert.deepEqual(s.srs[KEY], { key: KEY, lang: 'es', w: 'hola', m: 'hello', ease: 2.5, ivl: 0, reps: 0, due: NOW + DAY });
  });

  test('adding the same word twice keeps the original card', () => {
    const s = state();
    addCard(s, 'es', 'hola', 'hello');
    grade(s, KEY, true);
    assert.equal(addCard(s, 'es', 'hola', 'hi'), false);
    assert.equal(s.srs[KEY].reps, 1);
  });

  test('the same word in two languages is two cards', () => {
    const s = state();
    addCard(s, 'es', 'no', 'no');
    addCard(s, 'it', 'no', 'no');
    assert.equal(Object.keys(s.srs).length, 2);
  });

  test('correct answers space reviews out: 1 day, 3 days, then growing by ease', () => {
    const s = state();
    addCard(s, 'es', 'hola', 'hello');
    const ivls = [];
    for (let i = 0; i < 5; i++) {
      grade(s, KEY, true);
      ivls.push(s.srs[KEY].ivl);
    }
    assert.deepEqual(ivls.slice(0, 2), [1, 3]);
    for (let i = 2; i < ivls.length; i++) assert.ok(ivls[i] > ivls[i - 1], `interval should grow: ${ivls}`);
    assert.equal(s.srs[KEY].due, NOW + ivls[4] * DAY);
    assert.equal(s.srs[KEY].reps, 5);
  });

  test('ease rises with correct answers but never above 3', () => {
    const s = state();
    addCard(s, 'es', 'hola', 'hello');
    for (let i = 0; i < 30; i++) grade(s, KEY, true);
    assert.equal(s.srs[KEY].ease, 3);
  });

  test('a miss brings the card back in 10 minutes and lowers ease, not below 1.3', () => {
    const s = state();
    addCard(s, 'es', 'hola', 'hello');
    grade(s, KEY, true);
    grade(s, KEY, true);
    grade(s, KEY, false);
    const c = s.srs[KEY];
    assert.equal(c.ivl, 0);
    assert.equal(c.due, NOW + 10 * MIN);
    assert.ok(Math.abs(c.ease - 2.4) < 1e-9);

    for (let i = 0; i < 20; i++) grade(s, KEY, false);
    assert.equal(c.ease, 1.3);
  });

  test('after a miss, the next correct answer restarts at 1 day', () => {
    const s = state();
    addCard(s, 'es', 'hola', 'hello');
    for (let i = 0; i < 4; i++) grade(s, KEY, true);
    grade(s, KEY, false);
    grade(s, KEY, true);
    assert.equal(s.srs[KEY].ivl, 1);
  });

  test('grading an unknown card is ignored', () => {
    const s = state();
    assert.doesNotThrow(() => grade(s, 'xx|nope', true));
    assert.deepEqual(s.srs, {});
  });

  test('dueCards returns only due cards, most overdue first', () => {
    const s = state({
      srs: {
        a: { key: 'a', due: NOW - DAY },
        b: { key: 'b', due: NOW + MIN },
        c: { key: 'c', due: NOW - MIN },
        d: { key: 'd', due: NOW },
      },
    });
    assert.deepEqual(dueCards(s, NOW).map((c) => c.key), ['a', 'c', 'd']);
    assert.deepEqual(dueCards(state(), NOW), []);
    assert.deepEqual(dueCards({}, NOW), []);
  });

  test('nextDue gives the earliest due time, or Infinity with no cards', () => {
    assert.equal(nextDue(state({ srs: { a: { due: NOW + 5 * MIN }, b: { due: NOW + MIN } } })), NOW + MIN);
    assert.equal(nextDue(state()), Infinity);
  });
});
