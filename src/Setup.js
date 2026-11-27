import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Flag, IconButton, Txt } from './components';
import { Icon } from './icons';
import { Girl } from './illustrations';
import { LANGS } from './data';
import { useStore, useUI } from './store';
import { useAuth } from './auth';
import { shadow, useT } from './theme';

const GOALS = [
  [10, 'Casual', '10 words a day · about 5 min'],
  [20, 'Regular', '20 words a day · about 10 min'],
  [30, 'Serious', '30 words a day · about 15 min'],
  [50, 'Intense', '50 words a day · about 20 min'],
];

// First run after sign-up: choose a language, a daily goal, and a starting point
export default function Setup() {
  const T = useT();
  const insets = useSafeAreaInsets();
  const { S, addCourse, setGoal, setGender } = useStore();
  const ui = useUI();
  const [step, setStep] = useState(0);
  const { signOut } = useAuth();
  // Android back button goes to the previous step
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (step > 0) { setStep(step - 1); return true; } return false; });
    return () => sub.remove();
  }, [step]);
  const [lang, setLang] = useState(null);
  const [goal, setG] = useState(S.goal || 20);
  const [gender, setGen] = useState(S.gender || null);

  const Choice = ({ on, onPress, children, label }) => (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={label}
      style={[{ backgroundColor: T.surface, borderRadius: 18, padding: 16, borderWidth: 2, borderColor: on ? T.accent : 'transparent' }, !T.dark && shadow]}>
      {children}
    </Pressable>
  );

  const titles = ['What do you want to learn?', 'How should we address you?', 'Pick a daily goal', `How much ${lang ? LANGS[lang].name : ''} do you know?`];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
        {step ? <IconButton name="back" label="Back" onPress={() => setStep(step - 1)} /> : <IconButton name="back" label="Back to log in" onPress={signOut} />}
        <View style={{ flex: 1, flexDirection: 'row', gap: 6 }} accessibilityLabel={`Step ${step + 1} of 4`}>
          {[0, 1, 2, 3].map((k) => <View key={k} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: k <= step ? T.accent : T.line }} />)}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: T.accentSoft, overflow: 'hidden', alignItems: 'center' }}>
            <View style={{ marginTop: -6 }}><Girl size={80} /></View>
          </View>
          <Txt w="xb" size={22} style={{ flex: 1 }} accessibilityRole="header">{titles[step]}</Txt>
        </View>

        {step === 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {Object.keys(LANGS).map((id) => (
              <View key={id} style={{ width: '48.4%' }}>
                <Choice on={lang === id} onPress={() => setLang(id)} label={LANGS[id].name}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Flag id={id} size={34} />
                    <View style={{ flex: 1 }}>
                      <Txt w="b" size={14}>{LANGS[id].name}</Txt>
                      <Txt size={11.5} color={T.muted}>{LANGS[id].learners} learners</Txt>
                    </View>
                  </View>
                </Choice>
              </View>
            ))}
          </View>
        ) : null}

        {step === 1 ? (
          <>
            <Txt size={13.5} color={T.muted}>Some languages, like Hindi, French, Russian and Arabic, use different words depending on who is speaking. We only use this to teach you the right forms.</Txt>
            {[['f', 'Female', 'For example, Hindi “मैं काम करती हूँ”'], ['m', 'Male', 'For example, Hindi “मैं काम करता हूँ”'], ['x', 'Prefer not to say', 'We’ll use the masculine forms most textbooks start with']].map(([k, name, desc]) => (
              <Choice key={k} on={gender === k} onPress={() => setGen(k)} label={name}>
                <Txt w="b" size={15}>{name}</Txt>
                <Txt size={12.5} color={T.muted} style={{ marginTop: 2 }}>{desc}</Txt>
              </Choice>
            ))}
            <Txt size={12} color={T.muted}>You can change this later in Settings.</Txt>
          </>
        ) : null}

        {step === 2 ? GOALS.map(([n, name, desc]) => (
          <Choice key={n} on={goal === n} onPress={() => setG(n)} label={`${name}, ${desc}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="target" size={24} color={goal === n ? T.accent : T.muted} />
              <View style={{ flex: 1 }}>
                <Txt w="b" size={15}>{name}</Txt>
                <Txt size={12.5} color={T.muted}>{desc}</Txt>
              </View>
            </View>
          </Choice>
        )) : null}

        {step === 3 ? (
          <>
            <Choice on={false} onPress={() => { setGoal(goal); setGender(gender); addCourse(lang, 0); ui.toast(`Welcome to ${LANGS[lang].course}!`); }} label="I'm new, start from scratch">
              <Txt w="b" size={16}>🌱  I’m new to {LANGS[lang].name}</Txt>
              <Txt size={13} color={T.muted} style={{ marginTop: 4 }}>Start from Unit 1: Greetings.</Txt>
            </Choice>
            <Choice on={false} onPress={() => { setGoal(goal); setGender(gender); ui.startPlacement(lang); }} label="I know some, take the placement test">
              <Txt w="b" size={16}>🚀  I know some already</Txt>
              <Txt size={13} color={T.muted} style={{ marginTop: 4 }}>Take a 2-minute placement test and skip what you know.</Txt>
            </Choice>
          </>
        ) : null}
      </ScrollView>

      {step < 3 ? (
        <View style={{ flexDirection: 'row', padding: 20, paddingBottom: 20 + insets.bottom }}>
          <Button title="Continue" disabled={(step === 0 && !lang) || (step === 1 && !gender)} onPress={() => { if (step === 1) setGender(gender); setStep(step + 1); }} />
        </View>
      ) : null}
    </View>
  );
}
