import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TipCard from './TipCard';
import { tipFor } from './guides';
import { Flag, IconButton, PBar, Txt } from './components';
import { Icon } from './icons';
import { LANGS, PER_UNIT, TOTAL_LESSONS, UNITS, VARIANTS, coursePct } from './data';
import { useStore, useUI } from './store';
import { useReducedMotion } from './prefs';
import { shadow, useT } from './theme';

const UNIT_COLORS = [
  ['#9B86FA', '#7B61F0'], ['#FFB36B', '#F08A24'], ['#5ED3A6', '#1FA874'], ['#7FA6FF', '#4B6BF0'],
  ['#FF8FA6', '#E5486A'], ['#C59BFF', '#9A5CF0'], ['#6BD2E8', '#1E9CB8'], ['#FFC94D', '#E39B0B'],
];
const OFFSETS = [0, 64, 0, -64]; // zig-zag path

function Node({ state, icon, label, onPress, color }) {
  const T = useT();
  const still = useReducedMotion();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'current' || still) return;
    const loop = Animated.loop(Animated.timing(a, { toValue: 1, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [state, still]);
  const size = state === 'current' ? 78 : 66;
  const bg = state === 'locked' ? T.line : color[1];
  return (
    <View style={{ alignItems: 'center' }}>
      {state === 'current' ? (
        <View style={[{ backgroundColor: T.surface, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1.5, borderColor: color[1] }, !T.dark && shadow]}>
          <Txt w="xb" size={12} color={color[1]}>START</Txt>
        </View>
      ) : null}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {state === 'current' && !still ? (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size + 22, height: size + 22, borderRadius: 99, borderWidth: 3, borderColor: color[1],
            opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }), transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.2] }) }] }} />
        ) : null}
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}${state === 'done' ? ', completed' : state === 'locked' ? ', locked' : ', start'}`}
          style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
            borderBottomWidth: 6, borderBottomColor: state === 'locked' ? T.soft : 'rgba(0,0,0,0.18)' }, pressed && { transform: [{ translateY: 3 }] }]}>
          <Icon name={state === 'locked' ? 'lock' : state === 'done' ? 'check' : icon} size={state === 'current' ? 32 : 26} color={state === 'locked' ? T.muted : '#fff'} />
        </Pressable>
      </View>
      <Txt w="sb" size={12} color={state === 'locked' ? T.muted : T.ink} style={{ marginTop: 6 }}>{label}</Txt>
    </View>
  );
}

// The units and lesson nodes of a course. Used inline on the Learn tab.
// onUnitLayout(unitIndex, y) reports where each unit sits, so the screen can scroll to the current one.
export function PathUnits({ id, course, onStart, onLocked, onTip, onUnitLayout }) {
  const T = useT();
  // Only the current unit starts open; done and locked units show as a compact row
  const current = Math.min(UNITS.length - 1, Math.floor(course.done / PER_UNIT));
  const [open, setOpen] = useState({ [current]: true });
  useEffect(() => { setOpen({ [current]: true }); }, [id, current]);
  return (
    <View style={{ gap: 16 }}>
      {UNITS.map((u, ui_) => {
        const color = UNIT_COLORS[ui_ % UNIT_COLORS.length];
        const first = ui_ * PER_UNIT;
        const doneHere = Math.max(0, Math.min(PER_UNIT, course.done - first));
        const locked = course.done < first;
        return (
          <View key={u.key} style={{ gap: 16 }} onLayout={(e) => onUnitLayout?.(ui_, e.nativeEvent.layout.y)}>
            <Pressable onPress={() => setOpen((o) => ({ ...o, [ui_]: !o[ui_] }))} accessibilityRole="button" accessibilityState={{ expanded: !!open[ui_] }}
              accessibilityLabel={`Unit ${ui_ + 1}, ${u.title}, ${doneHere} of ${PER_UNIT} lessons${locked ? ', locked' : ''}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LinearGradient colors={locked ? [T.line, T.line] : color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={locked ? 'lock' : u.icon} size={21} color={locked ? T.muted : '#fff'} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Txt w="sb" size={11.5} color={locked ? T.muted : color[1]} style={{ letterSpacing: 0.6 }}>UNIT {ui_ + 1} · {doneHere}/{PER_UNIT}</Txt>
                <Txt w="xb" size={17} color={locked ? T.muted : T.ink}>{u.title}</Txt>
              </View>
              {!locked && tipFor(id, ui_) ? (
                <Pressable onPress={() => onTip(ui_)} accessibilityRole="button" accessibilityLabel={`Grammar tip for unit ${ui_ + 1}`}
                  style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.surface, borderRadius: 99, borderWidth: 1, borderColor: T.line, paddingVertical: 7, paddingHorizontal: 11 }, pressed && { opacity: 0.8 }]}>
                  <Icon name="grammar" size={15} color={color[1]} />
                  <Txt w="b" size={12.5} color={color[1]}>Tip</Txt>
                </Pressable>
              ) : null}
              {doneHere === PER_UNIT ? <Icon name="check" size={18} color={T.good} /> : null}
              <View style={{ transform: [{ rotate: open[ui_] ? '90deg' : '0deg' }] }}><Icon name="chev" size={16} color={T.muted} /></View>
            </Pressable>
            {open[ui_] ? VARIANTS.map((v, k) => {
              const idx = first + k;
              const state = idx < course.done ? 'done' : idx === course.done ? 'current' : 'locked';
              return (
                <View key={v.key} style={{ alignItems: 'center', transform: [{ translateX: OFFSETS[(idx + ui_) % OFFSETS.length] }] }}>
                  <Node state={state} icon={v.icon} label={v.title} color={color} onPress={() => (state === 'locked' ? onLocked() : onStart(idx))} />
                </View>
              );
            }) : null}
            {ui_ < UNITS.length - 1 ? <View style={{ height: 1, backgroundColor: T.line, marginTop: 4 }} /> : null}
          </View>
        );
      })}
      {course.done >= TOTAL_LESSONS ? (
        <View style={{ alignItems: 'center', padding: 20, gap: 6 }}>
          <Icon name="star" size={40} color="#F5A524" />
          <Txt w="xb" size={18}>Course complete!</Txt>
          <Txt color={T.muted} style={{ textAlign: 'center' }}>Keep your words fresh with daily review, or try conversation practice.</Txt>
        </View>
      ) : null}
    </View>
  );
}

export default function CourseMap({ id, onClose }) {
  const T = useT();
  const insets = useSafeAreaInsets();
  const { S } = useStore();
  const ui = useUI();
  const [msg, setMsg] = useState(null);
  const [tip, setTip] = useState(null); // unit index of the open grammar tip
  const course = S.courses.find((c) => c.id === id) || { id, done: 0 };
  const L = LANGS[id];

  // Close this modal first so the lesson modal can open cleanly on iOS
  const go = (fn) => { onClose(); setTimeout(fn, 350); };
  const tap = (idx) => {
    if (idx > course.done) return setMsg('Finish the lessons before this one to unlock it.');
    go(() => ui.startCourseLesson(id, idx));
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
        <IconButton name="back" label="Back" onPress={onClose} />
        <Flag id={id} size={30} />
        <View style={{ flex: 1 }}>
          <Txt w="b" size={16} accessibilityRole="header">{L.course}</Txt>
          <Txt size={12} color={T.muted}>{Math.min(course.done, TOTAL_LESSONS)} of {TOTAL_LESSONS} lessons · {coursePct(course)}%</Txt>
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}><PBar pct={coursePct(course)} height={7} /></View>
      {msg ? (
        <Pressable onPress={() => setMsg(null)} accessibilityLiveRegion="polite" style={{ marginHorizontal: 16, backgroundColor: T.yellowSoft, borderRadius: 12, padding: 12 }}>
          <Txt w="sb" size={13}>{msg}</Txt>
        </Pressable>
      ) : null}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 + insets.bottom, gap: 18 }} showsVerticalScrollIndicator={false}>
        {UNITS.map((u, ui_) => {
          const color = UNIT_COLORS[ui_ % UNIT_COLORS.length];
          const first = ui_ * PER_UNIT;
          const doneHere = Math.max(0, Math.min(PER_UNIT, course.done - first));
          const locked = course.done < first;
          return (
            <View key={u.key} style={{ gap: 16 }}>
              <LinearGradient colors={locked ? [T.line, T.line] : color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Txt w="sb" size={12} color={locked ? T.muted : 'rgba(255,255,255,0.9)'}>UNIT {ui_ + 1}</Txt>
                  <Txt w="xb" size={18} color={locked ? T.muted : '#fff'}>{u.title}</Txt>
                  <Txt size={12} color={locked ? T.muted : 'rgba(255,255,255,0.9)'} style={{ marginTop: 2 }}>{doneHere} / {PER_UNIT} lessons</Txt>
                </View>
                {!locked && tipFor(id, ui_) ? (
                  <Pressable onPress={() => setTip(ui_)} accessibilityRole="button" accessibilityLabel={`Grammar tip for unit ${ui_ + 1}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 }}>
                    <Icon name="grammar" size={16} color="#fff" />
                    <Txt w="b" size={12.5} color="#fff">Tip</Txt>
                  </Pressable>
                ) : null}
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: locked ? T.soft : 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={locked ? 'lock' : u.icon} size={22} color={locked ? T.muted : '#fff'} />
                </View>
              </LinearGradient>
              {VARIANTS.map((v, k) => {
                const idx = first + k;
                const state = idx < course.done ? 'done' : idx === course.done ? 'current' : 'locked';
                return (
                  <View key={v.key} style={{ alignItems: 'center', transform: [{ translateX: OFFSETS[(idx + ui_) % OFFSETS.length] }] }}>
                    <Node state={state} icon={v.icon} label={v.title} color={color} onPress={() => tap(idx)} />
                  </View>
                );
              })}
            </View>
          );
        })}
        {course.done >= TOTAL_LESSONS ? (
          <View style={{ alignItems: 'center', padding: 20, gap: 6 }}>
            <Icon name="star" size={40} color="#F5A524" />
            <Txt w="xb" size={18}>Course complete!</Txt>
            <Txt color={T.muted} style={{ textAlign: 'center' }}>Keep your words fresh with daily review, or try conversation practice.</Txt>
          </View>
        ) : null}
        <Pressable onPress={() => go(() => ui.startPlacement(id))} accessibilityRole="button"
          style={{ alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: T.line }}>
          <Txt w="sb" size={13} color={T.accent}>Know some already? Take the placement test</Txt>
        </Pressable>
      </ScrollView>

      {tip != null ? (
        <View accessibilityViewIsModal style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: T.scrim, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setTip(null)} accessibilityLabel="Close tip" />
          <View style={{ backgroundColor: T.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 24 + insets.bottom, maxHeight: '85%' }}>
            <ScrollView><TipCard lang={id} unit={tip} onDone={() => setTip(null)} /></ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}
