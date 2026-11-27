import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Txt } from '../components';
import { Icon } from '../icons';
import { LANGS, SCENES, UNITS, unitOf } from '../data';
import { dueCards } from '../game';
import { useStore, useUI } from '../store';
import { Panel, ScreenHeader, SectionTitle } from '../ui';
import { tint, useT } from '../theme';
import { screen } from './styles';

export default function PracticeScreen() {
  const T = useT();
  const { S } = useStore();
  const ui = useUI();
  const c = S.courses[0];
  const id = c.id;
  const due = dueCards(S).length;
  const reached = unitOf(c);
  const drills = [
    ['vocab', 'vocab', T.accentSoft, tint.purple, 'Vocabulary', 'Match & recall'],
    ['listen', 'headphones', T.redSoft, tint.red, 'Listening', 'Dictation'],
    ['speak', 'micsm', T.greenSoft, tint.green, 'Speaking', 'Get a score'],
    ['grammar', 'grammar', T.yellowSoft, tint.yellow, 'Grammar', 'Build sentences'],
  ];

  return (
    <ScrollView contentContainerStyle={screen.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Practice" sub={`From ${LANGS[id].course}`} />

      {/* Spaced review */}
      <Pressable onPress={() => ui.startReview(!due)} accessibilityRole="button" accessibilityLabel={due ? `Spaced review, ${due} words due` : 'Practise old words'}
        style={({ pressed }) => [pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
        <LinearGradient colors={['#5ED3A6', '#1FA874']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, overflow: 'hidden' }}>
          <View pointerEvents="none" style={{ position: 'absolute', right: -30, top: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: '#fff', opacity: 0.12 }} />
          <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
            <Txt w="xb" size={22} color="#fff">{due || '✓'}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt w="sb" size={11.5} color="rgba(255,255,255,0.9)" style={{ letterSpacing: 0.6 }}>SPACED REVIEW</Txt>
            <Txt w="xb" size={18} color="#fff" style={{ marginTop: 2 }}>{due ? `${due} word${due === 1 ? '' : 's'} due now` : 'All caught up'}</Txt>
            <Txt size={12.5} color="rgba(255,255,255,0.9)" style={{ marginTop: 2 }}>{due ? 'Free, and earns a heart back' : 'Practise old words anyway'}</Txt>
          </View>
          <Icon name="chev" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>

      {/* Skill drills */}
      <View style={{ gap: 12 }}>
        <SectionTitle title="Skill drills" sub={`Unit ${reached + 1} · ${UNITS[reached].title} · a heart per mistake`} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {drills.map(([mode, icon, bg, color, title, desc]) => (
            <View key={mode} style={{ width: '47.8%' }}>
              <Panel onPress={() => ui.startDrill(id, mode)} accessibilityLabel={`${title}. ${desc}`} style={{ padding: 16, gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={icon} size={22} color={color} />
                </View>
                <View>
                  <Txt w="b" size={15}>{title}</Txt>
                  <Txt size={12} color={T.muted} style={{ marginTop: 2 }}>{desc}</Txt>
                </View>
              </Panel>
            </View>
          ))}
        </View>
      </View>

      {/* AI conversations */}
      <View style={{ gap: 12 }}>
        <SectionTitle title="Conversations" sub="Role-play with an AI tutor that gently corrects you" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 18 }} style={{ marginHorizontal: -18, paddingHorizontal: 18 }}>
          {SCENES.map((sc) => {
            const locked = sc.unit > reached;
            return (
              <Panel key={sc.title} onPress={locked ? () => ui.toast(`Reach Unit ${sc.unit + 1} to unlock this scene`) : () => ui.openTutor(id, sc)}
                accessibilityLabel={`${sc.title}${locked ? ', locked' : ''}`} style={{ width: 210, padding: 16, gap: 10, opacity: locked ? 0.55 : 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: T.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={locked ? 'lock' : 'practice'} size={19} color={tint.blue} />
                  </View>
                  <Txt w="sb" size={11} color={T.muted}>UNIT {sc.unit + 1}</Txt>
                </View>
                <Txt w="b" size={14.5}>{sc.title}</Txt>
                <Txt size={12} color={T.muted} numberOfLines={3}>{locked ? `Unlocks at Unit ${sc.unit + 1}` : sc.setup}</Txt>
              </Panel>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
}
