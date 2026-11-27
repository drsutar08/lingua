import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flag, PBar, Txt } from '../components';
import { Icon } from '../icons';
import { Girl } from '../illustrations';
import { PathUnits } from '../CourseMap';
import { LANGS, TOTAL_LESSONS, WORDS, coursePct, lessonName } from '../data';
import { QUEST_XP, dueCards, heartsNow, questDef } from '../game';
import { useStore, useUI } from '../store';
import { Panel, Pill, Ring, SectionTitle } from '../ui';
import { shadow, tint, useT } from '../theme';
import { screen } from './styles';

// "Hello" in the course language for the welcome card's speech bubble (Unit 1's first word)
function greeting(id) {
  const w = (WORDS[id] && WORDS[id][0] && WORDS[id][0][0]) || 'hello';
  const word = w.charAt(0).toLocaleUpperCase() + w.slice(1);
  return id === 'es' ? `¡${word}!` : `${word}!`;
}

// Learn tab: language switcher, today's progress, current unit, and the learning path
export default function LearnScreen() {
  const T = useT();
  const { S } = useStore();
  const ui = useUI();
  const [questsOpen, setQuestsOpen] = useState(false);
  const c = S.courses[0];
  const L = LANGS[c.id];
  const pct = coursePct(c);
  const finished = c.done >= TOTAL_LESSONS;
  const hearts = heartsNow(S.hearts).n;
  const due = dueCards(S).length;
  const goalPct = Math.min(100, Math.round((S.goalWords / S.goal) * 100));
  const questsDone = S.quests.list.filter((q) => q.done).length;

  return (
    <ScrollView contentContainerStyle={screen.content} showsVerticalScrollIndicator={false}>
      {/* Top bar: course switcher + streak + hearts */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={() => ui.openSheet('languages')} accessibilityRole="button" accessibilityLabel={`${L.name} course. Switch or add a language`}
          style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.surface, borderRadius: 99, borderWidth: 1, borderColor: T.line, paddingVertical: 5, paddingLeft: 5, paddingRight: 12 }, pressed && { opacity: 0.85 }]}>
          <Flag id={c.id} size={28} />
          <Txt w="b" size={14}>{L.name}</Txt>
          <View style={{ transform: [{ rotate: '90deg' }] }}><Icon name="chev" size={14} color={T.muted} /></View>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pill icon="flame" onPress={() => ui.openSheet('streak')} label={`${S.streak} day streak, ${S.freezes || 0} streak freezes`}>
          <Txt w="b" size={13.5}>{S.streak}</Txt>
          {S.freezes ? <><Icon name="drop" size={12} color="#4B6BF0" /><Txt w="b" size={12} color="#4B6BF0">{S.freezes}</Txt></> : null}
        </Pill>
        <Pill icon="heart" iconColor={T.bad} onPress={() => ui.openSheet('hearts')} label={`${hearts} hearts`}>{hearts}</Pill>
      </View>

      <View>
        <Txt w="xb" size={26} accessibilityRole="header" style={{ letterSpacing: -0.4 }}>Hello, {S.name.split(' ')[0]}! 👋</Txt>
        <Txt size={13.5} color={T.muted} style={{ marginTop: 2 }}>Ready for today’s lesson?</Txt>
      </View>

      {/* Current unit, with the mascot from the design */}
      <View style={{ marginTop: 6 }}>
        <LinearGradient colors={[T.accent2, T.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 26, padding: 20, minHeight: 176, overflow: 'hidden' }}>
          <View pointerEvents="none" style={{ position: 'absolute', right: -40, top: -50, width: 190, height: 190, borderRadius: 95, backgroundColor: '#fff', opacity: 0.1 }} />
          <View style={{ position: 'absolute', right: -2, bottom: 0 }} pointerEvents="none"><Girl size={140} /></View>
          <Txt w="sb" size={11.5} color="rgba(255,255,255,0.85)" style={{ letterSpacing: 0.6 }}>{finished ? 'COURSE COMPLETE' : 'UP NEXT'}</Txt>
          <Txt w="xb" size={19} color="#fff" style={{ marginTop: 6, maxWidth: '60%' }}>{finished ? L.course : lessonName(c.done)}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, maxWidth: '58%' }}>
            <View style={{ flex: 1, height: 6, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
              <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#fff', borderRadius: 9 }} />
            </View>
            <Txt w="sb" size={12} color="#fff">{pct}%</Txt>
          </View>
          <Pressable onPress={() => ui.continueCourse(c.id)} accessibilityRole="button"
            style={({ pressed }) => [{ marginTop: 16, alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 11, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }, pressed && { opacity: 0.85 }]}>
            <Txt w="b" size={14} color="#5B43D6">{finished ? 'Practise again' : 'Continue learning'}</Txt>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#7B61F0', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chev" size={13} color="#fff" />
            </View>
          </Pressable>
        </LinearGradient>
        <View pointerEvents="none" style={{ position: 'absolute', right: 8, top: -14, alignItems: 'flex-end' }}>
          <View style={[{ backgroundColor: '#9B86FA', borderRadius: 18, borderWidth: 3, borderColor: T.bg, paddingVertical: 7, paddingHorizontal: 14 }, !T.dark && shadow]}>
            <Txt w="b" size={15} color="#fff">{greeting(c.id)}</Txt>
          </View>
          <View style={{ width: 12, height: 12, backgroundColor: '#9B86FA', transform: [{ rotate: '45deg' }], marginTop: -8, marginRight: 34, borderRightWidth: 3, borderBottomWidth: 3, borderColor: T.bg }} />
        </View>
      </View>

      {/* Today: goal, quests, review */}
      <Panel style={{ padding: 6 }}>
        <View style={{ flexDirection: 'row' }}>
          <Pressable onPress={() => ui.go('profile')} accessibilityRole="button" accessibilityLabel={`Daily goal: ${S.goalWords} of ${S.goal} words`}
            style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12 }}>
            <Ring size={48} stroke={5} pct={goalPct}><Icon name="target" size={18} color={T.accent} /></Ring>
            <Txt w="b" size={13}>{S.goalWords}/{S.goal}</Txt>
            <Txt size={11} color={T.muted}>words today</Txt>
          </Pressable>
          <View style={{ width: 1, backgroundColor: T.line, marginVertical: 12 }} />
          <Pressable onPress={() => setQuestsOpen(!questsOpen)} accessibilityRole="button" accessibilityState={{ expanded: questsOpen }} accessibilityLabel={`Daily quests: ${questsDone} of 3 done`}
            style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12 }}>
            <Ring size={48} stroke={5} pct={(questsDone / 3) * 100} color={tint.yellow}><Icon name="gift" size={20} /></Ring>
            <Txt w="b" size={13}>{questsDone}/3</Txt>
            <Txt size={11} color={T.muted}>quests</Txt>
          </Pressable>
          <View style={{ width: 1, backgroundColor: T.line, marginVertical: 12 }} />
          <Pressable onPress={() => ui.startReview(!due)} accessibilityRole="button" accessibilityLabel={due ? `Review ${due} words` : 'Practise old words'}
            style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: due ? T.goodSoft : T.soft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="vocab" size={20} color={due ? T.good : T.muted} />
            </View>
            <Txt w="b" size={13} color={due ? T.good : T.ink}>{due || 'Done'}</Txt>
            <Txt size={11} color={T.muted}>{due ? 'to review' : 'review'}</Txt>
          </Pressable>
        </View>
        {questsOpen ? (
          <View style={{ borderTopWidth: 1, borderTopColor: T.line, paddingHorizontal: 10, paddingBottom: 6 }}>
            {S.quests.list.map((q) => {
              const d = questDef(q.id);
              return (
                <View key={q.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }} accessible accessibilityLabel={`${d.label}: ${q.prog} of ${d.goal}`}>
                  <Icon name={q.done ? 'check' : d.icon} size={17} color={q.done ? T.good : tint.yellow} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt w="sb" size={13}>{d.label}</Txt>
                    <PBar pct={(q.prog / d.goal) * 100} height={5} />
                  </View>
                  <Txt w="b" size={11.5} color={q.done ? T.good : T.muted}>+{QUEST_XP} XP</Txt>
                </View>
              );
            })}
          </View>
        ) : null}
      </Panel>

      {/* Learning path */}
      <SectionTitle title="Your path" sub={`${L.course} · ${Math.min(c.done, TOTAL_LESSONS)} of ${TOTAL_LESSONS} lessons`} />
      <PathUnits id={c.id} course={c}
        onStart={(idx) => ui.startCourseLesson(c.id, idx)}
        onLocked={() => ui.toast('Finish the lessons before this one to unlock it')}
        onTip={(unit) => ui.openSheet('tip', { id: c.id, unit })} />
      <Pressable onPress={() => ui.startPlacement(c.id)} accessibilityRole="button"
        style={{ alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: T.line }}>
        <Txt w="sb" size={13} color={T.accent}>Know some already? Take the placement test</Txt>
      </Pressable>
    </ScrollView>
  );
}
