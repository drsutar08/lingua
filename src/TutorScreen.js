import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { speak, stopSpeech } from './audio';
import { Button, Flag, IconButton, Txt } from './components';
import { Icon } from './icons';
import { LANGS } from './data';
import { canScore, listen } from './pronounce';
import { usePrefs } from './prefs';
import { useStore } from './store';
import { fx } from './fx';
import { hasVoice, missingVoiceText } from './voices';
import { GUIDE_LANGS } from './guides';
import { F, shadow, useT } from './theme';

// Where the tutor server runs (see server/tutor.mjs)
export function tutorUrl(prefs) {
  const u = (prefs.tutorUrl || process.env.EXPO_PUBLIC_TUTOR_URL || (Platform.OS === 'web' ? 'http://localhost:8787' : '')).trim();
  return u.replace(/\/+$/, '');
}

async function askTutor(url, payload, token) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const r = await fetch(`${url}/tutor`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload), signal: ctrl.signal });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `Tutor server error ${r.status}`);
    return j;
  } finally {
    clearTimeout(t);
  }
}

// AI role-play conversation with gentle corrections
export default function TutorScreen({ id, scene, onClose }) {
  const T = useT();
  const insets = useSafeAreaInsets();
  const { prefs } = usePrefs();
  const { S, finishLesson } = useStore();
  const L = LANGS[id];
  const url = tutorUrl(prefs);
  const showRoman = prefs.showRoman !== false && GUIDE_LANGS.includes(id);
  const [msgs, setMsgs] = useState([]); // { role: 'tutor'|'learner', text, en?, correction? }
  const [sugg, setSugg] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);
  const [showEn, setShowEn] = useState({});
  const [mic, setMic] = useState(false);
  const spoken = useRef(0);
  const scroller = useRef(null);
  const listening = useRef(null);
  const [noVoice, setNoVoice] = useState(false);
  useEffect(() => { hasVoice(L.voice).then((ok) => setNoVoice(ok === false)); }, [L.voice]);

  const say = (t) => speak(id, L.voice, t);

  const turn = async (history) => {
    if (!url) { setErr('no-url'); return; }
    setBusy(true); setErr(null);
    try {
      const r = await askTutor(url, { lang: id, unit: scene.unit, gender: S.gender === 'f' ? 'female' : S.gender === 'm' ? 'male' : 'unspecified', scene: { title: scene.title, setup: scene.setup }, messages: history.map(({ role, text }) => ({ role, text })) }, (prefs.tutorToken || '').trim());
      const next = [...history];
      // Attach the correction to the learner's last message
      if (r.correction?.needed && next.length && next[next.length - 1].role === 'learner') {
        next[next.length - 1] = { ...next[next.length - 1], correction: { fixed: r.correction.fixed, note: r.correction.note } };
      }
      next.push({ role: 'tutor', text: r.reply, en: r.reply_en, roman: r.reply_roman });
      setMsgs(next);
      setSugg(r.suggestions || []);
      say(r.reply);
      if (r.done) {
        setDone(true);
        fx.complete();
        finishLesson({ id, xp: 15, learned: [], mistakes: next.filter((m) => m.correction).length, speakPass: spoken.current });
      }
    } catch (e) {
      setErr(e.name === 'AbortError' ? 'The tutor took too long to answer. Try again.' : e.message === 'Network request failed' || e.message === 'Failed to fetch' ? 'unreachable' : e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { turn([]); return () => { stopSpeech(); listening.current?.cancel(); }; }, []);
  useEffect(() => { setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50); }, [msgs.length, busy]);

  const send = (t = text) => {
    const v = t.trim();
    if (!v || busy || done) return;
    const history = [...msgs, { role: 'learner', text: v }];
    setMsgs(history); setText(''); setSugg([]);
    turn(history);
  };

  const onMic = () => {
    if (mic) { listening.current?.cancel(); setMic(false); return; }
    setMic(true);
    const p = listen(L.voice, { onPartial: setText });
    listening.current = p;
    p.then((list) => { spoken.current++; setText(list[0]); }).catch(() => {}).finally(() => setMic(false));
  };

  const errorText = err === 'no-url'
    ? 'Set the AI tutor server address in Settings to start. See server/README in the project for setup.'
    : err === 'unreachable'
      ? `Can’t reach the tutor server at ${url}. Start it with “npm start” in the server folder, and check the address in Settings.`
      : err;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
        <IconButton name="back" label="Leave conversation" onPress={onClose} />
        <Flag id={id} size={28} />
        <View style={{ flex: 1 }}>
          <Txt w="b" size={15} accessibilityRole="header">{scene.title}</Txt>
          <Txt size={11.5} color={T.muted}>AI role-play · {L.name}</Txt>
        </View>
      </View>

      <ScrollView ref={scroller} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: T.accentSoft, borderRadius: 16, padding: 14 }}>
          <Txt w="sb" size={13} color={T.accent}>THE SCENE</Txt>
          <Txt size={13.5} style={{ marginTop: 4 }}>{scene.setup}</Txt>
          <Txt size={12} color={T.muted} style={{ marginTop: 6 }}>Reply in {L.name}. Type, or tap the mic and speak. Your tutor gently corrects mistakes.</Txt>
          {noVoice ? <Txt w="sb" size={12} style={{ marginTop: 6 }}>{missingVoiceText(L.name)}</Txt> : null}
        </View>

        {msgs.map((m, k) => m.role === 'tutor' ? (
          <View key={k} style={{ alignSelf: 'flex-start', maxWidth: '86%', gap: 4 }}>
            <Pressable onPress={() => say(m.text)} onLongPress={() => setShowEn((s) => ({ ...s, [k]: !s[k] }))} accessibilityRole="button" accessibilityLabel={`Tutor: ${m.text}. Translation: ${m.en}`}
              style={[{ backgroundColor: T.surface, borderRadius: 18, borderBottomLeftRadius: 4, padding: 12, gap: 6 }, !T.dark && shadow]}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <Icon name="speaker" size={16} color={T.accent} />
                <View style={{ flexShrink: 1 }}>
                  <Txt w="sb" size={15}>{m.text}</Txt>
                  {showRoman && m.roman ? <Txt size={12.5} color={T.accent} style={{ marginTop: 2 }}>{m.roman}</Txt> : null}
                </View>
              </View>
              {showEn[k] ? <Txt size={12.5} color={T.muted}>{m.en}</Txt> : null}
            </Pressable>
            <Pressable onPress={() => setShowEn((s) => ({ ...s, [k]: !s[k] }))} hitSlop={6}>
              <Txt w="sb" size={11.5} color={T.accent}>{showEn[k] ? 'Hide translation' : 'Show translation'}</Txt>
            </Pressable>
          </View>
        ) : (
          <View key={k} style={{ alignSelf: 'flex-end', maxWidth: '86%', gap: 6, alignItems: 'flex-end' }}>
            <View style={{ backgroundColor: T.accent, borderRadius: 18, borderBottomRightRadius: 4, padding: 12 }}>
              <Txt w="sb" size={15} color="#fff">{m.text}</Txt>
            </View>
            {m.correction ? (
              <View style={{ backgroundColor: T.yellowSoft, borderRadius: 12, padding: 10, gap: 2 }} accessibilityLabel={`Correction: ${m.correction.fixed}. ${m.correction.note}`}>
                <Txt w="b" size={13}>✏️ {m.correction.fixed}</Txt>
                <Txt size={12} color={T.muted}>{m.correction.note}</Txt>
              </View>
            ) : null}
          </View>
        ))}

        {busy ? <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><ActivityIndicator color={T.accent} /><Txt size={13} color={T.muted}>Tutor is typing…</Txt></View> : null}
        {err ? (
          <View accessibilityRole="alert" style={{ backgroundColor: T.badSoft, borderRadius: 14, padding: 14, gap: 10 }}>
            <Txt w="sb" size={13} color={T.bad}>{errorText}</Txt>
            {err !== 'no-url' ? <View style={{ flexDirection: 'row' }}><Button title="Try again" variant="ghost" onPress={() => turn(msgs)} /></View> : null}
          </View>
        ) : null}
        {done ? (
          <View style={{ backgroundColor: T.goodSoft, borderRadius: 16, padding: 16, gap: 8, alignItems: 'center' }}>
            <Txt w="xb" size={18} color={T.good}>Scene complete! +15 XP</Txt>
            <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}><Button title="Finish" variant="good" onPress={onClose} /></View>
          </View>
        ) : null}
      </ScrollView>

      {!done ? (
        <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 + insets.bottom, gap: 8, borderTopWidth: 1, borderTopColor: T.line, backgroundColor: T.surface }}>
          {sugg.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
              {sugg.map((s, k) => (
                <Pressable key={k} onPress={() => setText(s.text)} accessibilityRole="button" accessibilityLabel={`Suggestion: ${s.text}, meaning ${s.en}`}
                  style={{ backgroundColor: T.soft, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, maxWidth: 240 }}>
                  <Txt w="sb" size={13}>{s.text}</Txt>
                  {showRoman && s.roman ? <Txt size={11} color={T.accent} numberOfLines={1}>{s.roman}</Txt> : null}
                  <Txt size={11} color={T.muted} numberOfLines={1}>{s.en}</Txt>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            {canScore ? (
              <Pressable onPress={onMic} accessibilityRole="button" accessibilityLabel={mic ? 'Stop listening' : 'Speak your reply'}
                style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: mic ? T.bad : T.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="mic" size={22} color={mic ? '#fff' : T.accent} />
              </Pressable>
            ) : null}
            <TextInput value={text} onChangeText={setText} placeholder={`Reply in ${L.name}…`} placeholderTextColor={T.muted} multiline
              onSubmitEditing={() => send()} blurOnSubmit accessibilityLabel="Your reply"
              style={{ flex: 1, fontFamily: F.r, fontSize: 15, color: T.ink, backgroundColor: T.soft, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, maxHeight: 110, outlineStyle: 'none' }} />
            <Pressable onPress={() => send()} disabled={!text.trim() || busy} accessibilityRole="button" accessibilityLabel="Send"
              style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: text.trim() && !busy ? T.accent : T.line, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chev" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
