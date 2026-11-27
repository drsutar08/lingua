import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Flag, IconButton, IconTile, Txt } from './components';
import { Icon } from './icons';
import { Boy, Girl, Globe } from './illustrations';
import { shadow, tint, useT } from './theme';
import { useReducedMotion } from './prefs';

const PAGES = [
  {
    key: 'learn',
    title: ['Learn Languages,', 'Open Worlds. 🌎'],
    sub: 'Fun, interactive and effective language learning for everyone.',
    hero: HeroLearn,
    features: [['book', 'accentSoft', tint.purple, 'Interactive Lessons', 'Learn with fun & engaging lessons.']],
  },
  {
    key: 'speak',
    title: ['Practice', 'Speaking. 🎙️'],
    sub: 'Hear native audio, repeat it out loud and build real confidence.',
    hero: HeroSpeak,
    features: [['headphones', 'redSoft', tint.red, 'Practice Speaking', 'Improve your pronunciation and speak with confidence.']],
  },
  {
    key: 'grow',
    title: ['Grow a Little', 'Every Day. 🏆'],
    sub: 'Small daily wins add up. Watch your progress climb.',
    hero: HeroGrow,
    features: [
      ['target', 'greenSoft', tint.green, 'Track Progress', 'Set goals and track your daily progress.'],
      ['star', 'yellowSoft', tint.yellow, 'Earn Rewards', 'Complete lessons and earn exciting badges.'],
    ],
  },
];

export default function Onboarding({ onDone }) {
  const T = useT();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const ref = useRef(null);
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;
  const heroH = Math.min(320, Math.max(220, H * 0.36));

  const goTo = (i) => {
    ref.current?.scrollTo({ x: i * W, animated: true });
    setPage(i);
  };
  // Android back button goes to the previous intro page
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (page > 0) { goTo(page - 1); return true; } return false; });
    return () => sub.remove();
  }, [page, W]);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top }}>
      <StatusBar style={T.dark ? 'light' : 'dark'} />

      {/* Top bar: brand + skip */}
      <View style={styles.top}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {page > 0 ? <View style={{ marginLeft: -10 }}><IconButton name="back" label="Previous page" onPress={() => goTo(page - 1)} /></View> : null}
          <LinearGradient colors={[T.accent2, T.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
            <Globe size={22} color="#fff" width={1.7} />
          </LinearGradient>
          <Txt w="xb" size={20}>Lingua</Txt>
        </View>
        {!last ? (
          <Pressable onPress={onDone} hitSlop={12} accessibilityRole="button">
            <Txt w="sb" size={14} color={T.muted}>Skip</Txt>
          </Pressable>
        ) : null}
      </View>

      <Animated.ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W))}
        style={{ flex: 1 }}
      >
        {PAGES.map((p, i) => {
          const range = [(i - 1) * W, i * W, (i + 1) * W];
          const shift = scrollX.interpolate({ inputRange: range, outputRange: [W * 0.35, 0, -W * 0.35], extrapolate: 'clamp' });
          const fade = scrollX.interpolate({ inputRange: range, outputRange: [0, 1, 0], extrapolate: 'clamp' });
          const Hero = p.hero;
          return (
            <View key={p.key} style={{ width: W, paddingHorizontal: 24 }}>
              <Animated.View style={{ height: heroH, opacity: fade, transform: [{ translateX: shift }], alignItems: 'center', justifyContent: 'center' }}>
                <Hero h={heroH} active={page === i} />
              </Animated.View>

              <Animated.View style={{ opacity: fade, marginTop: 8 }}>
                <Txt w="xb" size={30} style={{ letterSpacing: -0.6, lineHeight: 38 }}>{p.title[0]}</Txt>
                <Txt w="xb" size={30} color={T.accent} style={{ letterSpacing: -0.6, lineHeight: 38 }}>{p.title[1]}</Txt>
                <Txt size={15} color={T.muted} style={{ marginTop: 10, lineHeight: 22 }}>{p.sub}</Txt>
                <View style={{ width: 54, height: 3, borderRadius: 3, backgroundColor: T.accent2, marginTop: 16, marginBottom: 18 }} />
                <View style={{ gap: 16 }}>
                  {p.features.map(([icon, bg, color, title, desc]) => (
                    <View key={title} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <IconTile name={icon} bg={T[bg]} color={color} size={56} icon={26} />
                      <View style={{ flex: 1 }}>
                        <Txt w="b" size={15.5}>{title}</Txt>
                        <Txt size={13.5} color={T.muted} style={{ marginTop: 2, lineHeight: 19 }}>{desc}</Txt>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Dots + action */}
      <View style={{ paddingHorizontal: 24, paddingBottom: Math.max(20, insets.bottom + 12), paddingTop: 12, gap: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }} accessibilityLabel={`Page ${page + 1} of ${PAGES.length}`}>
          {PAGES.map((p, i) => {
            const range = [(i - 1) * W, i * W, (i + 1) * W];
            const width = scrollX.interpolate({ inputRange: range, outputRange: [8, 26, 8], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange: range, outputRange: [0.35, 1, 0.35], extrapolate: 'clamp' });
            return (
              <Pressable key={p.key} onPress={() => goTo(i)} hitSlop={8}>
                <Animated.View style={{ height: 8, width, opacity, borderRadius: 4, backgroundColor: T.accent }} />
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Button title={last ? 'Get Started' : 'Next'} onPress={() => (last ? onDone() : goTo(page + 1))} />
        </View>
      </View>
    </View>
  );
}

/* ---------- Heroes ---------- */

function Float({ children, style, delay = 0, active }) {
  const still = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active || still) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 1600, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active]);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  return <Animated.View style={[{ position: 'absolute' }, style, { transform: [{ translateY: y }] }]}>{children}</Animated.View>;
}

function Bubble({ children, color, bg }) {
  const T = useT();
  return (
    <View style={[{ backgroundColor: bg || T.surface, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }, !T.dark && shadow]}>
      {typeof children === 'string' ? <Txt w="b" size={15} color={color}>{children}</Txt> : children}
    </View>
  );
}

function HeroLearn({ h, active }) {
  const T = useT();
  const d = h * 0.88;
  return (
    <View style={{ width: d + 60, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: d, height: d, borderRadius: d / 2, backgroundColor: T.accentSoft }} />
      <View style={{ position: 'absolute', width: d * 0.7, height: d * 0.7, borderRadius: d, backgroundColor: T.dark ? T.soft : '#E4DDFD' }} />
      <View style={{ marginTop: h * 0.06 }}><Girl size={h * 0.66} /></View>
      <Float active={active} style={{ top: h * 0.06, right: 0 }}>
        <Bubble bg={T.accent} color="#fff">¡Hola!</Bubble>
      </Float>
      <Float active={active} delay={300} style={{ top: h * 0.2, left: 4 }}><Bubble><Flag id="fr" size={26} /></Bubble></Float>
      <Float active={active} delay={600} style={{ bottom: h * 0.12, left: 14 }}><Bubble><Flag id="ja" size={26} /></Bubble></Float>
      <Float active={active} delay={900} style={{ bottom: h * 0.18, right: 10 }}><Bubble><Flag id="es" size={26} /></Bubble></Float>
    </View>
  );
}

function HeroSpeak({ h, active }) {
  const T = useT();
  const still = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active || still) return;
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => { loop.stop(); pulse.setValue(0); };
  }, [active]);
  const d = h * 0.78;
  const ring = (k) => ({
    position: 'absolute', width: d * k, height: d * k, borderRadius: d, backgroundColor: T.accent,
  });
  const ps = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.05] });
  const po = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] });
  return (
    <View style={{ width: d + 80, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[ring(1), { opacity: 0.08 }]} />
      <View style={[ring(0.74), { opacity: 0.1 }]} />
      <Animated.View style={[ring(1), { opacity: po, transform: [{ scale: ps }] }]} />
      <LinearGradient colors={[T.accent2, T.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: d * 0.42, height: d * 0.42, borderRadius: d, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="mic" size={d * 0.17} color="#fff" />
      </LinearGradient>
      <Float active={active} style={{ top: h * 0.04, left: 0 }}>
        <Bubble>
          <Icon name="speaker" size={16} color={T.accent} />
          <Txt w="b" size={14}>Good morning!</Txt>
        </Bubble>
      </Float>
      <Float active={active} delay={500} style={{ bottom: h * 0.02, right: 0 }}>
        <View style={{ alignItems: 'center' }}><Boy size={h * 0.34} /></View>
      </Float>
      <Float active={active} delay={800} style={{ bottom: h * 0.16, left: 6 }}>
        <Bubble bg={T.goodSoft}>
          <Icon name="check" size={14} color={T.good} />
          <Txt w="b" size={13} color={T.good}>Great job!</Txt>
        </Bubble>
      </Float>
    </View>
  );
}

function HeroGrow({ h, active }) {
  const T = useT();
  const badges = [
    ['flame', '7 Days', T.redSoft],
    ['star', '+70 XP', T.yellowSoft],
    ['target', 'Goal met', T.greenSoft],
  ];
  return (
    <View style={{ width: '100%', height: h, justifyContent: 'center' }}>
      <LinearGradient colors={['#9A85FF', '#7B61F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 22, paddingBottom: 26, overflow: 'hidden', minHeight: h * 0.56 }}>
        <View style={{ position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: 70, backgroundColor: '#fff', opacity: 0.12 }} />
        <Txt w="xb" size={34} color="rgba(255,255,255,0.75)" style={{ lineHeight: 34 }}>“</Txt>
        <Txt w="m" size={17} color="#fff" style={{ lineHeight: 25, marginTop: 2, paddingRight: 24 }}>
          The best way to predict your future is to create it in another language.
        </Txt>
        <View style={{ position: 'absolute', right: 20, top: 20 }}>
          <Icon name="practice" size={30} color="rgba(255,255,255,0.9)" />
        </View>
      </LinearGradient>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: -18, paddingHorizontal: 10 }}>
        {badges.map(([icon, label, bg], i) => (
          <Float key={label} active={active} delay={i * 250} style={{ position: 'relative', flex: 1 }}>
            <View style={[{ backgroundColor: T.surface, borderRadius: 16, paddingVertical: 10, alignItems: 'center', gap: 6 }, !T.dark && shadow]}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={icon} size={20} color={icon === 'star' ? tint.yellow : tint.green} />
              </View>
              <Txt w="b" size={12.5}>{label}</Txt>
            </View>
          </Float>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 10 },
  logo: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
