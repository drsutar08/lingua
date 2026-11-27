import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Flag, IconButton, PBar, Txt } from './components';
import { Icon } from './icons';
import { useStore, useUI } from './store';
import { DEMO, useAuth } from './auth';
import { usePrefs } from './prefs';
import { LANGS, coursePct } from './data';
import TipCard from './TipCard';
import { ACHIEVEMENTS, MAX_FREEZES, MAX_HEARTS, dueCards, heartsNow } from './game';
import { remindersSupported, requestPermission } from './reminders';
import { tutorUrl } from './TutorScreen';
import { F, useT } from './theme';

function Sheet({ title, onClose, children, scroll }) {
  const T = useT();
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: T.scrim }} onPress={onClose} accessibilityLabel="Close" />
        <View accessibilityViewIsModal style={{ backgroundColor: T.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 24 + insets.bottom, maxHeight: '85%', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt w="b" size={18} accessibilityRole="header">{title}</Txt>
            <IconButton name="close" label="Close" onPress={onClose} />
          </View>
          {scroll ? <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 6 }} keyboardShouldPersistTaps="handled">{children}</ScrollView> : children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Chips({ options, value, onChange, label }) {
  const T = useT();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map(([v, text]) => {
        const on = value === v;
        return (
          <Pressable key={String(v)} onPress={() => onChange(v)} accessibilityRole="radio" accessibilityState={{ selected: on }}
            style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: on ? T.accent : T.line, backgroundColor: on ? T.accentSoft : 'transparent' }}>
            <Txt w="sb" size={13} color={on ? T.accent : T.ink}>{text}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function Row({ label, sub, value, onChange }) {
  const T = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Txt w="sb">{label}</Txt>
        {sub ? <Txt size={12} color={T.muted} style={{ marginTop: 2 }}>{sub}</Txt> : null}
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label}
        trackColor={{ false: T.line, true: T.accent }} thumbColor="#fff" activeThumbColor="#fff" ios_backgroundColor={T.line} />
    </View>
  );
}

const pad = (n) => String(n).padStart(2, '0');
const fmtTime = (h, m) => `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;

export function SettingsBody({ onClose = () => {} }) {
  const T = useT();
  const { S, setGoal, setGender, reset } = useStore();
  const { setOnboarded, signOut } = useAuth();
  const { prefs, set, osReduceMotion } = usePrefs();
  const ui = useUI();
  const [confirm, setConfirm] = useState(false);
  const [url, setUrl] = useState(prefs.tutorUrl);
  const [token, setToken] = useState(prefs.tutorToken || '');
  const r = prefs.reminder;
  const setReminder = async (patch) => {
    const next = { ...r, ...patch };
    if (patch.on) {
      const ok = await requestPermission();
      if (!ok) return ui.toast('Allow notifications in your phone settings to get reminders');
    }
    set('reminder', next);
    if (patch.on) ui.toast(`Daily reminder set for ${fmtTime(next.h, next.m)}`);
  };
  const step = (mins) => {
    const t = (r.h * 60 + r.m + mins + 1440) % 1440;
    setReminder({ h: Math.floor(t / 60), m: t % 60 });
  };
  const Step = ({ label, onPress, a11y }) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y}
      style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: T.soft, alignItems: 'center', justifyContent: 'center' }}>
      <Txt w="b" size={18}>{label}</Txt>
    </Pressable>
  );

  return (
    <>
      <Txt w="sb">Appearance</Txt>
      <Chips label="Appearance" value={prefs.theme} onChange={(v) => set('theme', v)} options={[['light', 'Light'], ['dark', 'Dark'], ['system', 'System']]} />

      <Txt w="sb" style={{ marginTop: 6 }}>Daily word goal</Txt>
      <Chips label="Daily word goal" value={S.goal} onChange={(n) => { setGoal(n); ui.toast(`Daily goal set to ${n} words`); }}
        options={[10, 20, 30, 50].map((n) => [n, `${n} words`])} />

      <Row label="Pronunciation guide" sub="Romaji, pinyin and romanized Korean and Hindi under each phrase" value={prefs.showRoman !== false} onChange={(v) => set('showRoman', v)} />

      <Txt w="sb" style={{ marginTop: 6 }}>Word forms</Txt>
      <Txt size={12.5} color={T.muted}>Hindi, French, Portuguese, Korean, Russian and Arabic change some words depending on who is speaking.</Txt>
      <Chips label="Word forms" value={S.gender === 'f' ? 'f' : 'm'} onChange={(g) => { setGender(g); ui.toast(g === 'f' ? 'Using feminine forms' : 'Using masculine forms'); }}
        options={[['f', 'Feminine'], ['m', 'Masculine']]} />

      <Txt w="sb" style={{ marginTop: 6 }}>Daily reminder</Txt>
      {remindersSupported ? (
        <>
          <Row label="Remind me to practise" sub={r.on ? `Every day at ${fmtTime(r.h, r.m)}, skipped once you’ve practised` : 'Off'} value={r.on} onChange={(v) => setReminder({ on: v })} />
          {r.on ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Step label="−" onPress={() => step(-30)} a11y="30 minutes earlier" />
              <Txt w="xb" size={18} style={{ minWidth: 100, textAlign: 'center' }} accessibilityLabel={`Reminder time ${fmtTime(r.h, r.m)}`}>{fmtTime(r.h, r.m)}</Txt>
              <Step label="+" onPress={() => step(30)} a11y="30 minutes later" />
            </View>
          ) : null}
        </>
      ) : (
        <Txt size={13} color={T.muted}>Reminders work in the phone app. Browsers don’t support scheduled notifications here.</Txt>
      )}

      <Txt w="sb" style={{ marginTop: 6 }}>Sound & feel</Txt>
      <Row label="Sound effects" value={prefs.sound} onChange={(v) => set('sound', v)} />
      <Row label="Haptic feedback" sub={Platform.OS === 'web' ? 'Phones only' : null} value={prefs.haptics} onChange={(v) => set('haptics', v)} />

      <Txt w="sb" style={{ marginTop: 6 }}>Accessibility</Txt>
      <Txt size={13} color={T.muted}>Text size</Txt>
      <Chips label="Text size" value={prefs.textScale} onChange={(v) => set('textScale', v)} options={[[0.9, 'Small'], [1, 'Default'], [1.15, 'Large'], [1.3, 'Extra large']]} />
      <Row label="Reduce motion" sub={osReduceMotion ? 'On in your device settings' : 'Turns off animations and confetti'} value={prefs.reduceMotion || osReduceMotion} onChange={(v) => set('reduceMotion', v)} />

      <Txt w="sb" style={{ marginTop: 6 }}>AI tutor server</Txt>
      <Txt size={12.5} color={T.muted}>Conversation practice talks to the tutor server in the project’s server folder. {Platform.OS === 'web' ? 'Leave empty to use http://localhost:8787.' : 'Use your computer’s address, for example http://192.168.1.20:8787.'}</Txt>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput value={url} onChangeText={setUrl} placeholder={tutorUrl({ tutorUrl: '' }) || 'http://192.168.1.20:8787'} placeholderTextColor={T.muted}
          autoCapitalize="none" autoCorrect={false} keyboardType="url" accessibilityLabel="AI tutor server address"
          style={{ flex: 1, fontFamily: F.r, fontSize: 14, color: T.ink, backgroundColor: T.soft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, outlineStyle: 'none' }} />
        <Pressable onPress={() => { set('tutorUrl', url.trim()); set('tutorToken', token.trim()); ui.toast('Tutor settings saved'); }} accessibilityRole="button"
          style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: T.accent }}>
          <Txt w="b" size={13} color="#fff">Save</Txt>
        </Pressable>
      </View>
      <TextInput value={token} onChangeText={setToken} placeholder="Access token (only if the server needs one)" placeholderTextColor={T.muted}
        secureTextEntry autoCapitalize="none" autoCorrect={false} accessibilityLabel="AI tutor access token"
        style={{ fontFamily: F.r, fontSize: 14, color: T.ink, backgroundColor: T.soft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, outlineStyle: 'none' }} />

      <Txt w="sb" style={{ marginTop: 6 }}>Welcome tour</Txt>
      <View style={{ flexDirection: 'row' }}><Button title="Replay intro" variant="ghost" onPress={() => { onClose(); setOnboarded(false); }} /></View>
      <Txt w="sb" style={{ marginTop: 6 }}>Account</Txt>
      <Txt size={13} color={T.muted}>Signed in as {S.email}</Txt>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Change password" variant="ghost" onPress={() => { onClose(); setTimeout(() => ui.openSheet('password'), 50); }} />
        <Button title="Log out" variant="ghost" onPress={() => { onClose(); signOut(); }} />
      </View>
      <DeleteAccount email={S.email} onDone={onClose} />
      <Txt w="sb" style={{ marginTop: 6 }}>Reset progress</Txt>
      {confirm ? (
        <>
          <Txt size={13.5} color={T.muted}>This puts courses, XP and vocabulary back to the start. Continue?</Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Keep progress" variant="ghost" onPress={() => setConfirm(false)} />
            <Button title="Reset" variant="bad" onPress={() => { reset(); onClose(); ui.go('home'); ui.toast('Progress reset'); }} />
          </View>
        </>
      ) : (
        <View style={{ flexDirection: 'row' }}><Button title="Reset progress" variant="ghost" onPress={() => setConfirm(true)} /></View>
      )}
    </>
  );
}

function Settings({ onClose }) {
  return <Sheet title="Settings" onClose={onClose} scroll><SettingsBody onClose={onClose} /></Sheet>;
}

function PasswordInput({ value, onChangeText, label, placeholder }) {
  const T = useT();
  return (
    <TextInput value={value} onChangeText={onChangeText} secureTextEntry placeholder={placeholder} placeholderTextColor={T.muted}
      autoCapitalize="none" autoCorrect={false} accessibilityLabel={label}
      style={{ fontFamily: F.r, fontSize: 15, color: T.ink, backgroundColor: T.soft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, outlineStyle: 'none' }} />
  );
}

// Required by the App Store for apps that let people create an account
function DeleteAccount({ email, onDone }) {
  const T = useT();
  const { deleteAccount } = useAuth();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!open) return <View style={{ flexDirection: 'row' }}><Button title="Delete account" variant="ghost" onPress={() => setOpen(true)} /></View>;
  return (
    <View style={{ backgroundColor: T.badSoft, borderRadius: 14, padding: 14, gap: 10 }}>
      <Txt w="b" color={T.bad}>Delete your account?</Txt>
      <Txt size={13}>This permanently removes {email} and all of its progress from this device. It can’t be undone.</Txt>
      {email === DEMO.email ? <Txt size={12} color={T.muted}>The demo account is recreated with sample data the next time the app starts.</Txt> : null}
      <PasswordInput value={pw} onChangeText={setPw} label="Password to confirm deletion" placeholder="Enter your password to confirm" />
      {err ? <Txt w="sb" size={13} color={T.bad}>{err}</Txt> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Cancel" variant="ghost" onPress={() => { setOpen(false); setPw(''); setErr(null); }} />
        <Button title={busy ? 'Deleting…' : 'Delete forever'} variant="bad" disabled={!pw || busy} onPress={async () => {
          setBusy(true); setErr(null);
          try { await deleteAccount(pw); onDone(); } catch (e) { setErr(e.message); setBusy(false); }
        }} />
      </View>
    </View>
  );
}

function ChangePassword({ onClose }) {
  const T = useT();
  const { changePassword } = useAuth();
  const ui = useUI();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (next !== again) return setErr('The new passwords don’t match.');
    setBusy(true); setErr(null);
    try { await changePassword(cur, next); onClose(); ui.toast('Password changed'); } catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <Sheet title="Change password" onClose={onClose}>
      <PasswordInput value={cur} onChangeText={setCur} label="Current password" placeholder="Current password" />
      <PasswordInput value={next} onChangeText={setNext} label="New password" placeholder="New password (at least 8 characters)" />
      <PasswordInput value={again} onChangeText={setAgain} label="Repeat new password" placeholder="Repeat new password" />
      {err ? <Txt w="sb" size={13} color={T.bad}>{err}</Txt> : null}
      <View style={{ flexDirection: 'row' }}><Button title={busy ? 'Saving…' : 'Change password'} disabled={!cur || !next || !again || busy} onPress={save} /></View>
    </Sheet>
  );
}

function Languages({ onClose }) {
  const T = useT();
  const { S, focusCourse } = useStore();
  const ui = useUI();
  return (
    <Sheet title="Your languages" onClose={onClose} scroll>
      {S.courses.map((c, i) => (
        <Pressable key={c.id} onPress={() => { focusCourse(c.id); onClose(); ui.go('learn'); }} accessibilityRole="button" accessibilityState={{ selected: i === 0 }}
          style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: i === 0 ? 2 : 1, borderColor: i === 0 ? T.accent : T.line, backgroundColor: i === 0 ? T.accentSoft : T.surface }, pressed && { opacity: 0.85 }]}>
          <Flag id={c.id} size={38} />
          <View style={{ flex: 1, gap: 6 }}>
            <Txt w="b" size={14.5}>{LANGS[c.id].course}</Txt>
            <PBar pct={coursePct(c)} height={5} />
          </View>
          <Txt w="b" size={12.5} color={i === 0 ? T.accent : T.muted}>{coursePct(c)}%</Txt>
        </Pressable>
      ))}
      <View style={{ flexDirection: 'row' }}><Button title="+  Add a language" variant="ghost" onPress={() => { onClose(); setTimeout(() => ui.openAddLanguage(), 50); }} /></View>
    </Sheet>
  );
}

function Tip({ arg, onClose }) {
  return (
    <Sheet title="Grammar tip" onClose={onClose} scroll>
      <TipCard lang={arg.id} unit={arg.unit} onDone={onClose} />
    </Sheet>
  );
}

function useTick(ms = 1000) {
  const [, setN] = useState(0);
  useEffect(() => { const t = setInterval(() => setN((n) => n + 1), ms); return () => clearInterval(t); }, [ms]);
}

function Hearts({ onClose }) {
  const T = useT();
  const { S } = useStore();
  const ui = useUI();
  useTick();
  const h = heartsNow(S.hearts);
  const due = dueCards(S).length;
  const left = h.next ? `${Math.floor(h.next / 60000)}:${pad(Math.floor((h.next % 60000) / 1000))}` : null;
  return (
    <Sheet title="Hearts" onClose={onClose}>
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }} accessibilityLabel={`${h.n} of ${MAX_HEARTS} hearts`}>
        {Array.from({ length: MAX_HEARTS }, (_, k) => <Icon key={k} name="heart" size={34} color={k < h.n ? T.bad : T.line} />)}
      </View>
      <Txt w="b" size={16} style={{ textAlign: 'center' }}>{h.n === MAX_HEARTS ? 'Your hearts are full' : h.n === 0 ? 'You’re out of hearts' : `${h.n} of ${MAX_HEARTS} hearts`}</Txt>
      {left ? <Txt color={T.muted} style={{ textAlign: 'center' }}>Next heart in {left}</Txt> : null}
      <Txt size={13} color={T.muted}>Each mistake in a lesson costs a heart. Hearts refill one every 30 minutes. Review sessions are free and earn a heart back.</Txt>
      {h.n < MAX_HEARTS ? (
        <View style={{ flexDirection: 'row' }}>
          <Button title={due ? `Review ${due} words · +1 heart` : 'Practise old words · +1 heart'} onPress={() => { onClose(); ui.startReview(!due); }} />
        </View>
      ) : null}
    </Sheet>
  );
}

function Streak({ onClose }) {
  const T = useT();
  const { S } = useStore();
  return (
    <Sheet title="Your streak" onClose={onClose}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Icon name="flame" size={54} />
        <Txt w="xb" size={30}>{S.streak} day{S.streak === 1 ? '' : 's'}</Txt>
        <Txt color={T.muted}>Longest: {S.stats.maxStreak || S.streak} days</Txt>
      </View>
      <View style={{ backgroundColor: T.blueSoft, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Icon name="drop" size={28} color="#4B6BF0" />
        <View style={{ flex: 1 }}>
          <Txt w="b">Streak freezes: {S.freezes || 0} / {MAX_FREEZES}</Txt>
          <Txt size={12.5} color={T.muted} style={{ marginTop: 2 }}>A freeze is used automatically if you miss a day. Earn one every 7 days of streak, or by finishing all daily quests.</Txt>
        </View>
      </View>
    </Sheet>
  );
}

function AddCourse({ id, onClose }) {
  const T = useT();
  const { addCourse } = useStore();
  const ui = useUI();
  const L = LANGS[id];
  return (
    <Sheet title={`Add ${L.name}`} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Flag id={id} size={44} />
        <View style={{ flex: 1 }}>
          <Txt w="b" size={16}>{L.course}</Txt>
          <Txt size={12.5} color={T.muted}>{L.learners} learners</Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}><Button title="Start from Unit 1" onPress={() => { addCourse(id, 0); onClose(); ui.toast(`${L.course} added`); }} /></View>
      <View style={{ flexDirection: 'row' }}><Button title="I know some · placement test" variant="ghost" onPress={() => { onClose(); ui.startPlacement(id); }} /></View>
    </Sheet>
  );
}

export function Badge({ a, earned, size = 58 }) {
  return (
    <LinearGradient colors={earned ? a.colors : ['#B9B6CC', '#8E8AA6']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', opacity: earned ? 1 : 0.5 }}>
      <Icon name={a.icon} size={size * 0.42} color="#fff" />
    </LinearGradient>
  );
}

function Achievements({ onClose }) {
  const T = useT();
  const { S } = useStore();
  const n = ACHIEVEMENTS.filter((a) => S.earned[a.id]).length;
  return (
    <Sheet title={`Achievements · ${n} / ${ACHIEVEMENTS.length}`} onClose={onClose} scroll>
      {ACHIEVEMENTS.map((a) => {
        const [cur, goal] = a.prog(S);
        const got = !!S.earned[a.id];
        return (
          <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }} accessible accessibilityLabel={`${a.label}. ${a.desc}. ${got ? 'Earned' : `${Math.min(cur, goal)} of ${goal}`}`}>
            <Badge a={a} earned={got} size={50} />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt w="b">{a.label}</Txt>
              <Txt size={12} color={T.muted}>{a.desc}</Txt>
              {got ? <Txt w="sb" size={12} color={T.good}>Earned {S.earned[a.id]}</Txt>
                   : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><PBar pct={(Math.min(cur, goal) / goal) * 100} style={{ flex: 1 }} /><Txt size={11.5} color={T.muted}>{Math.min(cur, goal)}/{goal}</Txt></View>}
            </View>
          </View>
        );
      })}
    </Sheet>
  );
}

function ListSheet({ title, sub, rows, onClose }) {
  const T = useT();
  return (
    <Sheet title={title} onClose={onClose}>
      {sub ? <Txt size={13.5} color={T.muted}>{sub}</Txt> : null}
      <ScrollView>
        {rows.map(([a, b], i) => (
          <View key={`${a}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: T.line }}>
            <Txt style={{ flexShrink: 1 }}>{a}</Txt>
            <Txt color={T.muted} style={{ textAlign: 'right', flexShrink: 1 }}>{b}</Txt>
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

function EditProfile({ onClose }) {
  const T = useT();
  const { S, saveProfile } = useStore();
  const { rename } = useAuth();
  const ui = useUI();
  const [name, setName] = useState(S.name);
  const input = { fontFamily: F.r, fontSize: 15, color: T.ink, backgroundColor: T.soft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 };
  return (
    <Sheet title="Edit profile" onClose={onClose}>
      <Txt size={13} color={T.muted}>Name</Txt>
      <TextInput value={name} onChangeText={setName} style={input} accessibilityLabel="Name" />
      <Txt size={13} color={T.muted}>Email</Txt>
      <TextInput value={S.email} editable={false} style={[input, { color: T.muted }]} accessibilityLabel="Email (used to log in)" />
      <Txt size={12} color={T.muted}>Your email is your login and can’t be changed here.</Txt>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <Button title="Save" onPress={() => {
          if (!name.trim()) return ui.toast('Enter a name to save');
          saveProfile(name.trim()); rename(name.trim()); onClose(); ui.toast('Profile saved');
        }} />
      </View>
    </Sheet>
  );
}

export default function Sheets({ name, arg, onClose }) {
  const { S } = useStore();
  if (name === 'settings') return <Settings onClose={onClose} />;
  if (name === 'profile') return <EditProfile onClose={onClose} />;
  if (name === 'password') return <ChangePassword onClose={onClose} />;
  if (name === 'languages') return <Languages onClose={onClose} />;
  if (name === 'tip') return <Tip arg={arg} onClose={onClose} />;
  if (name === 'hearts') return <Hearts onClose={onClose} />;
  if (name === 'streak') return <Streak onClose={onClose} />;
  if (name === 'addCourse') return <AddCourse id={arg} onClose={onClose} />;
  if (name === 'achievements') return <Achievements onClose={onClose} />;
  if (name === 'vocab') return <ListSheet title="My vocabulary" sub={`${S.vocab.length} saved words and phrases`} rows={S.vocab} onClose={onClose} />;
  if (name === 'saved') return <ListSheet title="Saved lessons" rows={S.saved.map((s) => [s, 'Saved'])} onClose={onClose} />;
  return null;
}
