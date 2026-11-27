import React from 'react';
import { Pressable, View } from 'react-native';
import { speak } from './audio';
import { Button, Txt } from './components';
import { Icon } from './icons';
import { LANGS, UNITS } from './data';
import { romanOf, tipFor } from './guides';
import { usePrefs } from './prefs';
import { shadow, useT } from './theme';

const LTR = { writingDirection: 'ltr', textAlign: 'left' };

// A unit's grammar tip: shown before the unit's Learn lesson and from the learning path
export default function TipCard({ lang, unit, action = 'Got it', onDone }) {
  const T = useT();
  const { prefs } = usePrefs();
  const tip = tipFor(lang, unit);
  if (!tip) return null;
  const roman = prefs.showRoman !== false ? romanOf(lang, tip.example) : null;
  const say = () => speak(lang, LANGS[lang].voice, tip.example);
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: T.yellowSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="grammar" size={22} color="#E89A0C" />
        </View>
        <Txt w="sb" size={12.5} color={T.muted}>GRAMMAR TIP · UNIT {unit + 1}: {UNITS[unit].title.toUpperCase()}</Txt>
      </View>
      {/* Explanations are English with words of the course language mixed in: keep them left to right,
          or a tip that starts with an Arabic word would flip the whole sentence */}
      <Txt w="xb" size={22} accessibilityRole="header" dir="ltr" style={LTR}>{tip.title}</Txt>
      <Txt size={15} dir="ltr" style={[LTR, { lineHeight: 23 }]}>{tip.body}</Txt>
      <Pressable onPress={say} accessibilityRole="button" accessibilityLabel={`Example: ${tip.example}. ${tip.meaning}. Tap to hear it.`}
        style={[{ backgroundColor: T.surface, borderRadius: 16, padding: 14, gap: 4, borderWidth: 1.5, borderColor: T.accentSoft }, !T.dark && shadow]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="speaker" size={18} color={T.accent} />
          <Txt w="b" size={17} style={{ flexShrink: 1 }}>{tip.example}</Txt>
        </View>
        {roman ? <Txt size={13} color={T.accent} dir="ltr" style={[LTR, { marginLeft: 26 }]}>{roman}</Txt> : null}
        <Txt size={13} color={T.muted} dir="ltr" style={[LTR, { marginLeft: 26 }]}>{tip.meaning}</Txt>
      </Pressable>
      {onDone ? <View style={{ flexDirection: 'row' }}><Button title={action} onPress={onDone} /></View> : null}
    </View>
  );
}
