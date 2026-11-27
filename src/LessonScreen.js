import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hasClips, speak, stopSpeech } from './audio';
import { Button, IconButton, PBar, Txt } from './components';
import { Icon } from './icons';
import { Boy, Girl } from './illustrations';
import {
  LANGS, MODE_TITLES, UNITS, VARIANTS, altsOf, buildDrill, buildPlacement, buildReview, buildUnitLesson, lessonName, setContentGender, shuffle, unitOf,
} from './data';
import { PASS, canScore, compareTyped, listen, scoreBest, stopListening, verdict } from './pronounce';
import { dueCards, heartsNow } from './game';
import { useStore } from './store';
import { usePrefs, useReducedMotion } from './prefs';
import { romanOf, tipFor } from './guides';
import TipCard from './TipCard';
import { fx } from './fx';
import { hasVoice, missingVoiceText } from './voices';
import { F, shadow, useT } from './theme';

function prepItem(it) {
  const n = { ...it };
  if (n.t === 'build') n.bank = shuffle(n.answer.concat(n.extra)).map((w, k) => ({ w, k }));
  if (n.t === 'choice' || n.t === 'fill') n.shown = shuffle(n.options);
  if (n.t === 'match') { n.left = shuffle(n.pairs.map((p) => p[0])); n.right = shuffle(n.pairs.map((p) => p[1])); }
  return n;
}

function Pulse({ active }) {
  const T = useT();
  const still = useReducedMotion();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active || still) return;
    const loop = Animated.loop(Animated.timing(a, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => { loop.stop(); a.setValue(0); };
  }, [active, still]);
  if (!active) return null;
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: T.accent,
      opacity: still ? 0.6 : a.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
      transform: [{ scale: still ? 1.1 : a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] }) }],
    }} />
  );
}

function ScoreCard({ r, rtl }) {
  const T = useT();
  const pass = r.score >= PASS;
  const col = { good: T.good, close: '#E89A0C', miss: T.bad };
  return (
    <View style={{ backgroundColor: T.soft, borderRadius: 18, padding: 16, gap: 12 }} accessible accessibilityLabel={`Pronunciation score ${r.score} out of 100. ${verdict(r.score)}. We heard: ${r.heard}. ${r.words.map((w) => `${w.text}: ${w.status === 'good' ? 'clear' : w.status === 'close' ? 'close' : 'missed'}`).join(', ')}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 5, borderColor: pass ? T.good : T.bad, alignItems: 'center', justifyContent: 'center', backgroundColor: T.surface }}>
          <Txt w="xb" size={20} color={pass ? T.good : T.bad}>{r.score}</Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt w="b" size={15}>{verdict(r.score)}</Txt>
          <Txt size={12.5} color={T.muted} style={{ marginTop: 2 }} numberOfLines={2}>We heard: “{r.heard}”</Txt>
        </View>
      </View>
      <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 6 }}>
        {r.words.map((w, k) => (
          <View key={k} style={{ paddingVertical: 4, paddingHorizontal: 9, borderRadius: 9, backgroundColor: T.surface, borderWidth: 1.5, borderColor: col[w.status] }}>
            <Txt w="sb" size={13.5} color={col[w.status]}>{w.text}</Txt>
          </View>
        ))}
      </View>
      <Txt size={11.5} color={T.muted}>Green: clear · Amber: close · Red: missed</Txt>
    </View>
  );
}

function SpeakerBubble({ text, onPress, label, roman, rtl }) {
  const T = useT();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label || `Play: ${text}${roman ? `, said ${roman}` : ''}`}
      style={[{ alignSelf: 'flex-start', backgroundColor: T.surface, borderRadius: 16, borderBottomLeftRadius: 4, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: T.dark ? 1 : 0, borderColor: T.line, maxWidth: '100%' }, !T.dark && shadow]}>
      <Icon name="speaker" size={18} color={T.accent} />
      <View style={{ flexShrink: 1 }}>
        <Txt w="sb" size={16}>{text}</Txt>
        {roman ? <Txt size={12.5} color={T.accent} style={[{ marginTop: 2 }, rtl && { textAlign: 'right' }]}>{roman}</Txt> : null}
      </View>
    </Pressable>
  );
}

function buildItems({ S, id, idx, mode, unit, variant, all }) {
  setContentGender(S.gender);
  if (mode === 'review') {
    const cards = all ? shuffle(Object.values(S.srs)).slice(0, 10) : dueCards(S).slice(0, 10);
    return buildReview(cards);
  }
  if (mode === 'placement') return buildPlacement(id);
  if (idx != null) return buildUnitLesson(id, unit, variant);
  const course = S.courses.find((c) => c.id === id);
  if (mode) return buildDrill(id, mode, unit ?? (course ? unitOf(course) : 0));
  return buildUnitLesson(id, unit ?? 0, 0);
}

export default function LessonScreen({ id, idx, mode, title, unit, variant, all, onClose }) {
  const T = useT();
  const insets = useSafeAreaInsets();
  const { S, finishLesson, finishReview, loseHeart } = useStore();
  const isReview = mode === 'review';
  const isPlacement = mode === 'placement';
  const usesHearts = !isReview && !isPlacement;
  const [items] = useState(() => buildItems({ S, id, idx, mode, unit, variant, all }));
  const [i, setI] = useState(0);
  const [item, setItem] = useState(() => (items[0] ? prepItem(items[0]) : null));
  const [state, setState] = useState('ask'); // ask | listening | retry | ok | no | done
  const [heard, setHeard] = useState('');
  const [result, setResult] = useState(null);
  const [micErr, setMicErr] = useState(null);
  const [pick, setPick] = useState([]);
  const [choice, setChoice] = useState(null);
  const [typed, setTyped] = useState('');
  const [typedNote, setTypedNote] = useState(null);
  const [match, setMatch] = useState({ sel: null, done: [], bad: null, slips: 0 });
  const [hearts, setHearts] = useState(() => (usesHearts ? heartsNow(S.hearts).n : Infinity));
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [xp, setXp] = useState(0);
  const [learned, setLearned] = useState([]);
  const [graded, setGraded] = useState([]);
  const [placeAnswers, setPlaceAnswers] = useState([]);
  const [speakPass, setSpeakPass] = useState(0);
  const [matches, setMatches] = useState(0);
  const listening = useRef(null);
  const timer = useRef(null);
  const [noVoice, setNoVoice] = useState(null);

  const lang = item?.lang || id;
  const { prefs } = usePrefs();
  const ro = (t) => (prefs.showRoman !== false ? romanOf(lang, t) : null); // pronunciation guide
  // A unit's Learn lesson opens with its grammar tip
  const [tipOpen, setTipOpen] = useState(() => idx != null && variant === 0 && !!tipFor(id, unit));
  const L = LANGS[lang] || LANGS.es;
  const heading = title || (idx != null ? lessonName(idx) : mode ? MODE_TITLES[mode] : `Unit ${(unit ?? 0) + 1} · ${UNITS[unit ?? 0].title}`);

  // Warn once per language if the device can't speak it
  useEffect(() => {
    let live = true;
    hasVoice(L.voice).then((ok) => { if (live) setNoVoice(ok === false && !hasClips(lang) ? L.name : null); });
    return () => { live = false; };
  }, [L.voice]);

  // Review items can come from several courses, so speak in the item's own language
  const say = (text, slow) => { const lg = (item && item.lang) || lang; speak(lg, (LANGS[lg] || L).voice, text, { slow }); };
  // Right-to-left courses (Arabic): rows that lay out target-language words in reading order run right to left
  const rtl = !!(LANGS[(item && item.lang) || lang] || L).rtl;

  useEffect(() => {
    if (!item) return;
    if (item.listen) { const t = setTimeout(() => say(item.prompt || item.ans), 350); return () => clearTimeout(t); }
    if (item.t === 'dictate') { const t = setTimeout(() => say(item.text), 350); return () => clearTimeout(t); }
  }, [item]);
  useEffect(() => () => { clearTimeout(timer.current); stopSpeech(); listening.current?.cancel(); }, []);

  const grade = (ok, { words } = {}) => {
    setState(ok ? 'ok' : 'no');
    ok ? fx.correct() : fx.wrong();
    if (isPlacement) setPlaceAnswers((a) => [...a, ok]);
    if (isReview && item.card) setGraded((g) => [...g, { key: item.card, ok }]);
    if (ok) {
      setCorrect((c) => c + 1);
      setXp((x) => x + (isReview ? 3 : 4));
      const add = words || (item.word ? [item.word] : []);
      if (!isReview && !isPlacement) setLearned((l) => [...l, ...add.filter((w) => !l.some((x) => x[0] === w[0]))]);
    } else {
      setMistakes((m) => m + 1);
      if (usesHearts) { setHearts((h) => h - 1); loseHeart(); }
    }
  };

  const check = () => {
    if (item.t === 'build') return grade(pick.map((k) => item.bank.find((b) => b.k === k).w).join(' ') === item.answer.join(' '));
    if (item.t === 'type' || item.t === 'dictate') {
      const target = item.t === 'type' ? item.answer : item.text;
      const r = compareTyped(target, typed);
      setTypedNote(r.ok && !r.exact ? `Correct spelling: ${target}` : null);
      return grade(r.ok);
    }
    if (item.t === 'fill') return grade(choice === item.answer);
    grade(choice === item.ans);
  };

  const finish = () => {
    setState('done');
    if (isReview) { finishReview({ graded, xp }); fx.complete(); return; }
    if (isPlacement) { fx.complete(); return; }
    if (hearts > 0) {
      finishLesson({ id, idx, xp: xp + (mistakes === 0 ? 5 : 0), learned, mistakes, speakPass, matches });
      fx.complete();
    }
  };

  const next = () => {
    // Placement stops after the second miss
    const placeMisses = placeAnswers.filter((a) => !a).length;
    if (hearts <= 0 || i === items.length - 1 || (isPlacement && placeMisses >= 2)) return finish();
    const n = i + 1;
    setI(n); setItem(prepItem(items[n])); setPick([]); setChoice(null); setState('ask');
    setHeard(''); setResult(null); setMicErr(null); setTyped(''); setTypedNote(null);
    setMatch({ sel: null, done: [], bad: null, slips: 0 });
  };

  const onMic = () => {
    if (!canScore) {
      // Expo Go: no recogniser, so play the phrase and give time to repeat it
      say(item.text);
      setState('listening');
      timer.current = setTimeout(() => { setSpeakPass((n) => n + 1); grade(true); }, 2600);
      return;
    }
    stopSpeech();
    setHeard(''); setResult(null); setMicErr(null); setState('listening');
    const p = listen(L.voice, { onPartial: setHeard });
    listening.current = p;
    p.then((list) => {
      const r = scoreBest(item.text, list, !!L.chars, altsOf(lang, item.text));
      setResult(r);
      if (r.score >= PASS) {
        setSpeakPass((n) => n + 1);
        grade(true);
        if (r.score >= 90) setXp((x) => x + 2);
      } else { setState('retry'); fx.wrong(); }
    }).catch((e) => {
      if (e.code === 'aborted') return;
      setMicErr(e.code === 'no-speech' ? 'We didn’t catch that. Tap the mic and try again.'
        : e.code === 'not-allowed' ? 'Allow microphone access to get a pronunciation score.'
        : e.code === 'network' ? 'Pronunciation scoring needs an internet connection.'
        : e.code === 'language-not-supported' ? `Speech recognition for ${L.name} isn’t installed on this device.`
        : e.message || 'Something went wrong with the microphone.');
      setState('ask');
    });
  };

  // Match the pairs: tap a word, then its meaning
  const tapMatch = (side, val) => {
    if (state !== 'ask' || match.done.includes(val)) return;
    if (side === 'L') say(val);
    const sel = match.sel;
    if (!sel || sel.side === side) return setMatch({ ...match, sel: { side, val }, bad: null });
    const [w, m] = side === 'L' ? [val, sel.val] : [sel.val, val];
    const ok = item.pairs.some((p) => p[0] === w && p[1] === m);
    if (!ok) {
      fx.wrong();
      setMatch({ ...match, sel: null, bad: [w, m], slips: match.slips + 1 });
      return;
    }
    fx.tap();
    const done = [...match.done, w, m];
    setMatch({ ...match, sel: null, done, bad: null });
    if (done.length === item.pairs.length * 2) {
      setMatches((n) => n + 1);
      if (match.slips) setMistakes((x) => x + 1); // slips spoil a perfect lesson but cost no hearts
      setTimeout(() => grade(true, { words: item.learned }), 250);
    }
  };

  const retry = () => onClose(null);
  const wrap = { flex: 1, backgroundColor: T.surface, paddingTop: insets.top, paddingBottom: insets.bottom };

  /* ---------- Empty / done screens ---------- */

  if (tipOpen && item) {
    return (
      <View style={wrap}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8 }}>
          <IconButton name="back" label="Leave lesson" onPress={() => onClose(null)} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 12 }}>
          <TipCard lang={id} unit={unit} action="Start lesson" onDone={() => setTipOpen(false)} />
        </ScrollView>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[wrap, { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }]}>
        <Girl size={140} />
        <Txt w="xb" size={22} style={{ textAlign: 'center' }}>All caught up!</Txt>
        <Txt color={T.muted} style={{ textAlign: 'center' }}>No words are due for review right now. New words from lessons come back the next day.</Txt>
        <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}><Button title="Back" onPress={() => onClose(null)} /></View>
      </View>
    );
  }

  if (state === 'done') {
    if (isPlacement) {
      const firstMiss = placeAnswers.indexOf(false);
      const placed = Math.min(UNITS.length - 1, firstMiss < 0 ? placeAnswers.length : firstMiss);
      return (
        <View style={[wrap, { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }]}>
          <Girl size={140} />
          <Txt w="xb" size={24} style={{ textAlign: 'center' }}>{placed ? 'Nice, you know some already!' : 'Let’s start from the beginning'}</Txt>
          <Txt color={T.muted} style={{ textAlign: 'center' }}>You’ll start at</Txt>
          <View style={{ backgroundColor: T.accentSoft, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 20 }}>
            <Txt w="xb" size={20} color={T.accent}>Unit {placed + 1} · {UNITS[placed].title}</Txt>
          </View>
          <Txt size={13} color={T.muted}>{placeAnswers.filter(Boolean).length} of {placeAnswers.length} correct</Txt>
          <View style={{ flexDirection: 'row', alignSelf: 'stretch', marginTop: 8 }}><Button title="Start learning" onPress={() => onClose({ placement: placed })} /></View>
        </View>
      );
    }
    const out = hearts <= 0;
    const h = heartsNow(S.hearts);
    const mins = h.next ? Math.ceil(h.next / 60000) : 0;
    const perfect = !out && mistakes === 0 && !isReview;
    return (
      <View style={[wrap, { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }]}>
        <Girl size={150} />
        <Txt w="xb" size={24} style={{ textAlign: 'center' }}>{out ? 'Out of hearts' : isReview ? 'Review complete!' : perfect ? 'Perfect lesson!' : 'Lesson complete!'}</Txt>
        {out ? <Txt color={T.muted} style={{ textAlign: 'center' }}>Your next heart comes back in {mins} min. Review words to earn one now.</Txt>
             : <Txt w="xb" size={42} color={T.accent}>+{xp + (perfect ? 5 : 0)} XP</Txt>}
        {isReview && !out ? <Txt w="sb" color={T.bad}>+1 heart ❤️</Txt> : null}
        {perfect ? <Txt w="sb" size={13} color={T.good}>+5 bonus XP for no mistakes</Txt> : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[[`${correct}/${items.length}`, 'correct'], isReview ? [graded.length, 'words reviewed'] : [learned.length, 'new words'], [S.streak, 'day streak']].map(([v, l]) => (
            <View key={l} style={{ backgroundColor: T.soft, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16 }}>
              <Txt w="xb" size={18}>{v}</Txt>
              <Txt size={12} color={T.muted}>{l}</Txt>
            </View>
          ))}
        </View>
        <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 8 }}>
          <View style={{ flexDirection: 'row' }}><Button title={out ? 'Back' : 'Continue'} variant={out ? 'ghost' : 'primary'} onPress={() => onClose(out ? null : { saved: true })} /></View>
        </View>
      </View>
    );
  }

  /* ---------- Exercise bodies ---------- */

  const answered = state === 'ok' || state === 'no';
  const Tile = ({ w, onPress, hidden }) => (
    <Pressable onPress={onPress} disabled={hidden || state !== 'ask'} accessibilityRole="button" accessibilityLabel={w}
      style={{ opacity: hidden ? 0 : 1, paddingVertical: 11, paddingHorizontal: 15, borderRadius: 14, backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.line, borderBottomWidth: 4 }}>
      <Txt w="sb" size={15}>{w}</Txt>
    </Pressable>
  );
  const Option = ({ o, sel, onPress }) => (
    <Pressable disabled={state !== 'ask'} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: sel }}
      style={{ paddingVertical: 15, paddingHorizontal: 16, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: sel ? T.accent : T.line, backgroundColor: sel ? T.accentSoft : T.surface }}>
      <Txt w="sb" size={15} color={sel ? T.accent : T.ink}>{o}</Txt>
      {ro(o) ? <Txt size={12.5} color={T.muted} style={[{ marginTop: 2 }, rtl && { textAlign: 'right' }]}>{ro(o)}</Txt> : null}
    </Pressable>
  );
  const input = { fontFamily: F.m, fontSize: 16, color: T.ink, backgroundColor: T.soft, borderRadius: 14, padding: 14, minHeight: 90, textAlignVertical: 'top', borderWidth: 1.5, borderColor: T.line };

  let body, canCheck = false, rightAnswer = '';
  if (item.t === 'build') {
    canCheck = pick.length > 0;
    rightAnswer = item.answer.join(' ').replace(' ?', '?');
    body = (
      <>
        <Txt w="b" size={18}>{item.listen ? 'Listen and translate' : 'Translate this sentence'}</Txt>
        <View style={{ backgroundColor: T.soft, borderRadius: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, minHeight: 150 }}>
          <Boy size={120} />
          <View style={{ maxWidth: '58%', marginBottom: 28 }}>
            <SpeakerBubble text={item.listen ? 'Tap to hear again' : item.prompt} roman={item.listen ? null : ro(item.prompt)} rtl={rtl} onPress={() => say(item.prompt)} label={`Play sentence${item.listen ? '' : `: ${item.prompt}`}`} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, minHeight: 56, paddingVertical: 8, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: T.line, borderStyle: 'dashed' }} accessibilityLabel="Your answer">
          {pick.map((k, n) => <Tile key={`${k}-${n}`} w={item.bank.find((b) => b.k === k).w} onPress={() => setPick((p) => p.filter((_, j) => j !== n))} />)}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {item.bank.map((b) => <Tile key={b.k} w={b.w} hidden={pick.includes(b.k)} onPress={() => setPick((p) => [...p, b.k])} />)}
        </View>
      </>
    );
  } else if (item.t === 'choice') {
    canCheck = choice !== null;
    rightAnswer = item.ans;
    body = (
      <>
        <Txt w="b" size={18}>{item.listen ? 'What did you hear?' : item.q}</Txt>
        {item.prompt || item.listen ? (
          <Pressable onPress={() => say(item.prompt || item.ans)} accessibilityRole="button" accessibilityLabel={item.listen ? 'Play again' : `Play: ${item.prompt}`}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 }}>
            <Icon name="speaker" size={22} color={T.accent} />
            <View style={{ flexShrink: 1, alignItems: 'center' }}>
              <Txt w="xb" size={26} style={{ textAlign: 'center' }}>{item.listen ? 'Play again' : item.prompt}</Txt>
              {!item.listen && ro(item.prompt) ? <Txt size={14} color={T.accent} style={{ marginTop: 2 }}>{ro(item.prompt)}</Txt> : null}
            </View>
          </Pressable>
        ) : null}
        <View style={{ gap: 10 }}>{item.shown.map((o) => <Option key={o} o={o} sel={choice === o} onPress={() => setChoice(o)} />)}</View>
      </>
    );
  } else if (item.t === 'fill') {
    canCheck = choice !== null;
    rightAnswer = `${item.before}${item.answer}${item.after}`;
    body = (
      <>
        <Txt w="b" size={18}>Fill in the blank</Txt>
        <Txt size={13.5} color={T.muted}>“{item.meaning}”</Txt>
        <Pressable onPress={() => say(rightAnswer)} accessibilityRole="button" accessibilityLabel="Play the full sentence"
          style={{ backgroundColor: T.soft, borderRadius: 18, padding: 18, flexDirection: rtl ? 'row-reverse' : 'row', flexWrap: 'wrap', alignItems: 'center' }}>
          <Txt w="sb" size={19}>{item.before}</Txt>
          <View style={{ minWidth: 70, borderBottomWidth: 2.5, borderColor: T.accent, marginHorizontal: 2, paddingHorizontal: 6, alignItems: 'center' }}>
            <Txt w="b" size={19} color={T.accent}>{choice || ' '}</Txt>
          </View>
          <Txt w="sb" size={19}>{item.after}</Txt>
        </Pressable>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {item.shown.map((o) => <Tile key={o} w={o} onPress={() => { setChoice(o); say(o); }} hidden={false} />)}
        </View>
      </>
    );
  } else if (item.t === 'type' || item.t === 'dictate') {
    const dict = item.t === 'dictate';
    canCheck = typed.trim().length > 0;
    rightAnswer = dict ? item.text : item.answer;
    body = (
      <>
        <Txt w="b" size={18}>{dict ? 'Type what you hear' : 'Type the meaning in English'}</Txt>
        {dict ? (
          <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', paddingVertical: 8 }}>
            <Pressable onPress={() => say(item.text)} accessibilityRole="button" accessibilityLabel="Play"
              style={{ width: 84, height: 84, borderRadius: 24, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="speaker" size={34} color="#fff" />
            </Pressable>
            <Pressable onPress={() => say(item.text, true)} accessibilityRole="button" accessibilityLabel="Play slowly"
              style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: T.accentSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' }}>
              <Txt w="b" size={13} color={T.accent}>Slow</Txt>
            </Pressable>
          </View>
        ) : (
          <SpeakerBubble text={item.prompt} roman={ro(item.prompt)} rtl={rtl} onPress={() => say(item.prompt)} />
        )}
        <TextInput value={typed} onChangeText={setTyped} editable={state === 'ask'} multiline placeholder={dict ? `Type in ${L.name}` : 'Type in English'}
          placeholderTextColor={T.muted} autoCapitalize="none" autoCorrect={false} accessibilityLabel="Your answer" style={[input, { outlineStyle: 'none' }]} />
      </>
    );
  } else if (item.t === 'match') {
    rightAnswer = '';
    const cell = (side, val) => {
      const done = match.done.includes(val);
      const sel = match.sel && match.sel.side === side && match.sel.val === val;
      const bad = match.bad && match.bad.includes(val);
      return (
        <Pressable key={side + val} onPress={() => tapMatch(side, val)} disabled={done || state !== 'ask'} accessibilityRole="button"
          accessibilityState={{ selected: sel, disabled: done }} accessibilityLabel={done ? `${val}, matched` : val}
          style={{ minHeight: 54, borderRadius: 14, borderWidth: 1.5, borderBottomWidth: 3.5, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', opacity: done ? 0.35 : 1,
            borderColor: bad ? T.bad : sel ? T.accent : T.line, backgroundColor: done ? T.goodSoft : sel ? T.accentSoft : bad ? T.badSoft : T.surface }}>
          <Txt w="sb" size={15} color={sel ? T.accent : T.ink} style={{ textAlign: 'center' }}>{val}</Txt>
          {side === 'L' && ro(val) ? <Txt size={11.5} color={T.muted} style={{ textAlign: 'center' }}>{ro(val)}</Txt> : null}
        </Pressable>
      );
    };
    body = (
      <>
        <Txt w="b" size={18}>Match the pairs</Txt>
        <Txt size={13} color={T.muted}>Tap a word, then its meaning.</Txt>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 10 }}>{item.left.map((v) => cell('L', v))}</View>
          <View style={{ flex: 1, gap: 10 }}>{item.right.map((v) => cell('R', v))}</View>
        </View>
      </>
    );
  } else {
    const live = state === 'listening';
    body = (
      <>
        <Txt w="b" size={18}>Speak this sentence</Txt>
        <SpeakerBubble text={item.text} roman={ro(item.text)} rtl={rtl} onPress={() => say(item.text)} />
        <Txt color={T.muted}>{item.meaning}</Txt>
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
          <Pulse active={live} />
          <Pressable onPress={live && canScore ? stopListening : onMic} disabled={!(state === 'ask' || (live && canScore))}
            accessibilityRole="button" accessibilityLabel={live ? 'Stop listening' : 'Tap the mic and speak'}
            style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: T.accentSoft, alignItems: 'center', justifyContent: 'center', opacity: state === 'ask' || live ? 1 : 0.6 }}>
            <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="mic" size={38} color="#fff" />
            </View>
          </Pressable>
        </View>
        {result ? <ScoreCard r={result} rtl={rtl} /> : (
          <Txt size={13.5} color={micErr ? T.bad : T.muted} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
            {micErr || (live ? (heard ? `“${heard}”` : 'Listening… say it now') : state === 'ask' ? 'Tap the mic and speak' : '')}
          </Txt>
        )}
        {!canScore && state === 'ask' ? (
          <Txt size={12} color={T.muted} style={{ textAlign: 'center' }}>
            Pronunciation scoring works in the web app (Chrome or Edge) and in a development build. In Expo Go, listen and repeat.
          </Txt>
        ) : null}
      </>
    );
  }

  let foot;
  if (answered) {
    const ok = state === 'ok';
    const okTitle = item.t === 'speak' ? (result ? `${verdict(result.score)} · ${result.score}/100` : 'Nice work!') : item.t === 'match' ? 'All matched!' : 'Correct!';
    foot = (
      <View accessibilityLiveRegion="polite" style={{ backgroundColor: ok ? T.goodSoft : T.badSoft, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, gap: 10, marginHorizontal: -18, marginBottom: -18 - insets.bottom, paddingBottom: 18 + insets.bottom }}>
        <Txt w="b" size={16} color={ok ? T.good : T.bad}>{ok ? okTitle : 'Not quite'}</Txt>
        {!ok && rightAnswer ? <Txt size={13}>Answer: {rightAnswer}</Txt> : null}
        {ok && typedNote ? <Txt size={13}>{typedNote}</Txt> : null}
        {ok && item.t === 'speak' ? <Txt size={13}>{result && result.score >= 90 ? '+2 bonus XP for a great score.' : 'Keep practising out loud. It builds confidence.'}</Txt> : null}
        <View style={{ flexDirection: 'row' }}><Button title="Continue" variant={ok ? 'good' : 'bad'} onPress={next} /></View>
      </View>
    );
  } else if (state === 'retry') {
    foot = (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Skip" variant="ghost" onPress={next} />
        <Button title="Try again" onPress={() => { setResult(null); say(item.text); setState('ask'); }} />
      </View>
    );
  } else if (item.t === 'speak') {
    foot = <View style={{ flexDirection: 'row' }}><Button title="I can’t speak right now" variant="ghost" onPress={() => { clearTimeout(timer.current); next(); }} /></View>;
  } else if (item.t === 'match') {
    foot = <View style={{ flexDirection: 'row' }}><Button title={`${match.done.length / 2} / ${item.pairs.length} matched`} disabled onPress={() => {}} /></View>;
  } else {
    foot = <View style={{ flexDirection: 'row' }}><Button title="Check" disabled={!canCheck} onPress={check} /></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={wrap}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8 }}>
        <IconButton name="back" label="Leave lesson" onPress={() => onClose(null)} />
        <Txt w="b" size={15} accessibilityRole="header" numberOfLines={1} style={{ flexShrink: 1 }}>{heading}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 40, justifyContent: 'flex-end' }}
          accessibilityLabel={usesHearts ? `${hearts} hearts left` : undefined}>
          {usesHearts ? (<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.badSoft, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 10 }}><Icon name="heart" size={15} color={T.bad} /><Txt w="b" size={13} color={T.bad}>{hearts}</Txt></View>) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 6 }}>
        <Txt size={11} color={T.muted}>{i + 1} / {items.length}</Txt>
        <PBar pct={(i / items.length) * 100} height={10} style={{ flex: 1 }} />
      </View>
      {noVoice ? (
        <View accessibilityRole="alert" style={{ marginHorizontal: 18, marginTop: 10, backgroundColor: T.yellowSoft, borderRadius: 12, padding: 10 }}>
          <Txt w="sb" size={12.5}>{missingVoiceText(noVoice)}</Txt>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 20, gap: 18 }} keyboardShouldPersistTaps="handled">{body}</ScrollView>
      <View style={{ padding: 18 }}>{foot}</View>
    </KeyboardAvoidingView>
  );
}
