import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Txt } from './components';
import { Icon } from './icons';
import { ACHIEVEMENTS } from './game';
import { useReducedMotion } from './prefs';
import { fx } from './fx';
import { useT } from './theme';

const CONFETTI = ['#7B61F0', '#FFC53D', '#FF6E8A', '#1FA874', '#4B6BF0', '#FF9A5A'];

function Confetti() {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    x: Math.random() * width, delay: Math.random() * 400, dur: 1600 + Math.random() * 1200,
    size: 6 + Math.random() * 8, color: CONFETTI[i % CONFETTI.length], spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
    v: new Animated.Value(0),
  })), [width]);
  useEffect(() => {
    const anims = pieces.map((p) => Animated.timing(p.v, { toValue: 1, duration: p.dur, delay: p.delay, easing: Easing.in(Easing.quad), useNativeDriver: true }));
    Animated.parallel(anims).start();
    return () => anims.forEach((a) => a.stop());
  }, [pieces]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: p.x, top: -20, width: p.size, height: p.size * 0.6, borderRadius: 2, backgroundColor: p.color,
          transform: [
            { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
            { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
          ],
        }} />
      ))}
    </View>
  );
}

function content(item) {
  if (item.type === 'badge') {
    const a = ACHIEVEMENTS.find((x) => x.id === item.id);
    return { kicker: 'Achievement unlocked', title: a.label, body: a.desc, icon: a.icon, colors: a.colors };
  }
  if (item.type === 'level') return { kicker: 'Level up!', title: `Level ${item.level}`, body: 'Your XP is adding up. Keep going!', icon: 'bolt', colors: ['#FDE68A', '#D97706'] };
  if (item.type === 'freeze') return { kicker: `${item.streak}-day streak!`, title: 'Streak freeze earned', body: 'If you miss a day, a freeze keeps your streak safe.', icon: 'drop', colors: ['#7DD3FC', '#2563EB'] };
  return {
    kicker: 'Daily quests complete',
    title: item.reward === 'freeze' ? '+1 streak freeze' : '+20 bonus XP',
    body: item.reward === 'freeze' ? 'Nice work today. Your streak has extra protection.' : 'You already hold the most freezes, so here is bonus XP.',
    icon: 'gift', colors: ['#C4B5FD', '#7C3AED'],
  };
}

// Shown over the app when you earn a badge, level up, or finish all daily quests
export default function Celebration({ item, onDone }) {
  const T = useT();
  const still = useReducedMotion();
  const pop = useRef(new Animated.Value(still ? 1 : 0)).current;
  const c = content(item);
  useEffect(() => {
    fx.celebrate();
    if (!still) Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: T.scrim, alignItems: 'center', justifyContent: 'center', padding: 28, zIndex: 20 }]}
      accessibilityViewIsModal accessibilityLiveRegion="assertive">
      {!still ? <Confetti /> : null}
      <Animated.View style={{ width: '100%', maxWidth: 360, backgroundColor: T.surface, borderRadius: 28, padding: 24, alignItems: 'center', gap: 10, transform: [{ scale: pop }] }}>
        <LinearGradient colors={c.colors} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
          style={{ width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: T.accentSoft }}>
          <Icon name={c.icon} size={50} color="#fff" />
        </LinearGradient>
        <Txt w="sb" size={13} color={T.accent} style={{ marginTop: 6 }}>{c.kicker.toUpperCase()}</Txt>
        <Txt w="xb" size={24} style={{ textAlign: 'center' }} accessibilityRole="header">{c.title}</Txt>
        <Txt size={14} color={T.muted} style={{ textAlign: 'center' }}>{c.body}</Txt>
        <View style={{ flexDirection: 'row', alignSelf: 'stretch', marginTop: 10 }}><Button title="Awesome!" onPress={onDone} /></View>
      </Animated.View>
    </View>
  );
}
