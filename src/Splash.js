import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Txt } from './components';
import { Globe } from './illustrations';
import { useReducedMotion } from './prefs';

// Animated splash. It starts with the same look as the native splash
// (purple background, white tile with a purple globe) so the hand-off is seamless.
export default function Splash({ onDone }) {
  const still = useReducedMotion();
  const tile = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (still) { tile.setValue(1); text.setValue(1); spin.setValue(1); }
    const anim = still ? Animated.sequence([Animated.delay(600), Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true })]) : Animated.sequence([
      Animated.parallel([
        Animated.spring(tile, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(text, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(700),
      Animated.timing(fade, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => finished && onDone());
    return () => anim.stop();
  }, []);

  const scale = tile.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] });
  const rise = text.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, zIndex: 10 }]}>
      <StatusBar style="light" />
      <LinearGradient colors={['#A08CF8', '#7B61F0', '#5B43D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
        <View style={[styles.blob, { top: -90, right: -70, width: 260, height: 260 }]} />
        <View style={[styles.blob, { bottom: -60, left: -80, width: 220, height: 220, opacity: 0.07 }]} />

        <Animated.View style={[styles.tile, { transform: [{ scale }] }]}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Globe size={78} color="#7B61F0" width={1.6} />
          </Animated.View>
        </Animated.View>

        <Animated.View style={{ alignItems: 'center', opacity: text, transform: [{ translateY: rise }], marginTop: 26 }}>
          <Txt w="xb" size={38} color="#fff" style={{ letterSpacing: -0.5 }}>Lingua</Txt>
          <Txt w="m" size={15} color="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>Learn. Speak. Connect.</Txt>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tile: {
    width: 128, height: 128, borderRadius: 34, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2A1A80', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10,
  },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff', opacity: 0.1 },
});
