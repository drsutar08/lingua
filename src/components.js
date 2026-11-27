import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { usePrefs } from './prefs';
import { scriptStyle } from './fonts';
import { useUI } from './store';

// Plain text inside a Txt (strings and numbers, including nested arrays)
const textOf = (c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : Array.isArray(c) ? c.map(textOf).join('') : '');
import { LinearGradient } from 'expo-linear-gradient';
import { F, shadow, useT } from './theme';
import { Icon } from './icons';

// All app text goes through Txt, so the in-app text-size setting scales everything
export function Txt({ w = 'r', size = 14, color, style, children, ...p }) {
  const T = useT();
  const k = usePrefs().prefs.textScale || 1;
  const flat = StyleSheet.flatten(style) || {};
  const lh = flat.lineHeight ? { lineHeight: flat.lineHeight * k } : null;
  // Japanese, Chinese, Korean and Hindi text switches to a font that has those characters
  const script = scriptStyle(textOf(children), F[w], w === 'sb' || w === 'b' || w === 'xb');
  return <Text maxFontSizeMultiplier={1.6} style={[{ fontFamily: F[w], fontSize: size * k, color: color || T.ink }, style, lh, script]} {...p}>{children}</Text>;
}

export function Card({ style, children, onPress, ...p }) {
  const T = useT();
  const base = [{ backgroundColor: T.surface, borderRadius: 18 }, !T.dark && shadow, style];
  if (!onPress) return <View style={base} {...p}>{children}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [base, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]} {...p}>
      {children}
    </Pressable>
  );
}

export function PBar({ pct, height = 5, style }) {
  const T = useT();
  return (
    <View style={[{ height, backgroundColor: T.line, borderRadius: 9, overflow: 'hidden' }, style]}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: T.accent, borderRadius: 9 }} />
    </View>
  );
}

const STRIPES = {
  es: { dir: 'column', parts: [['#C60B1E', 1], ['#FFC400', 2], ['#C60B1E', 1]] },
  fr: { dir: 'row', parts: [['#0055A4', 1], ['#FFFFFF', 1], ['#EF4135', 1]] },
  de: { dir: 'column', parts: [['#111111', 1], ['#DD0000', 1], ['#FFCE00', 1]] },
  it: { dir: 'row', parts: [['#009246', 1], ['#FFFFFF', 1], ['#CE2B37', 1]] },
  pt: { dir: 'row', parts: [['#046A38', 2], ['#DA291C', 3]] },
  nl: { dir: 'column', parts: [['#AE1C28', 1], ['#FFFFFF', 1], ['#21468B', 1]] },
  hi: { dir: 'column', parts: [['#FF9933', 1], ['#FFFFFF', 1], ['#138808', 1]], dot: '#000080' },
  ru: { dir: 'column', parts: [['#FFFFFF', 1], ['#0039A6', 1], ['#D52B1E', 1]] },
  pl: { dir: 'column', parts: [['#FFFFFF', 1], ['#DC143C', 1]] },
  id: { dir: 'column', parts: [['#CE1126', 1], ['#FFFFFF', 1]] },
};

export function Flag({ id, size = 40 }) {
  const box = { width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.12)' };
  if (id === 'ja')
    return (
      <View style={[box, { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ width: size * 0.5, height: size * 0.5, borderRadius: size, backgroundColor: '#BC002D' }} />
      </View>
    );
  if (id === 'ko')
    return (
      <View style={[box, { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ width: size * 0.5, height: size * 0.5, borderRadius: size, overflow: 'hidden', transform: [{ rotate: '-30deg' }] }}>
          <View style={{ flex: 1, backgroundColor: '#CD2E3A' }} />
          <View style={{ flex: 1, backgroundColor: '#0047A0' }} />
        </View>
      </View>
    );
  if (id === 'sv')
    return (
      <View style={[box, { backgroundColor: '#006AA7' }]}>
        <View style={{ position: 'absolute', left: size * 0.3, top: 0, bottom: 0, width: size * 0.18, backgroundColor: '#FECC00' }} />
        <View style={{ position: 'absolute', top: size * 0.41, left: 0, right: 0, height: size * 0.18, backgroundColor: '#FECC00' }} />
      </View>
    );
  if (id === 'tr')
    return (
      <View style={[box, { backgroundColor: '#E30A17', alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ width: size * 0.46, height: size * 0.46, borderRadius: size, backgroundColor: '#FFFFFF', marginLeft: -size * 0.12 }} />
        <View style={{ position: 'absolute', width: size * 0.37, height: size * 0.37, borderRadius: size, backgroundColor: '#E30A17', left: size * 0.31 }} />
        <View style={{ position: 'absolute', right: size * 0.16 }}><Icon name="star" size={size * 0.24} color="#FFFFFF" /></View>
      </View>
    );
  // Arabic is spoken in many countries, so it gets a language badge instead of one country's flag
  if (id === 'ar')
    return (
      <View style={[box, { backgroundColor: '#0E7C5A', alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: size * 0.5, fontWeight: '700', marginTop: -size * 0.06 }}>ع</Text>
      </View>
    );
  if (id === 'zh')
    return (
      <View style={[box, { backgroundColor: '#EE1C25', paddingLeft: size * 0.16, paddingTop: size * 0.14 }]}>
        <Icon name="star" size={size * 0.42} color="#FFDE00" />
      </View>
    );
  const f = STRIPES[id];
  return (
    <View style={[box, { flexDirection: f.dir }]}>
      {f.parts.map(([c, flex], i) => <View key={i} style={{ flex, backgroundColor: c }} />)}
      {f.dot ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: size * 0.22, height: size * 0.22, borderRadius: size, borderWidth: Math.max(1, size * 0.04), borderColor: f.dot }} />
        </View>
      ) : null}
    </View>
  );
}

export function IconTile({ name, bg, color, size = 52, radius = 16, icon = 22 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={icon} color={color} />
    </View>
  );
}

export function SectionHead({ title, action, onAction, sub }) {
  const T = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <View>
        <Txt w="b" size={16}>{title}</Txt>
        {sub ? <Txt size={12.5} color={T.muted} style={{ marginTop: 2 }}>{sub}</Txt> : null}
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Txt w="sb" size={13} color={T.accent}>{action}</Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', disabled }) {
  const T = useT();
  const textColor = disabled ? T.muted : variant === 'ghost' ? T.ink : T.onAccent;
  const inner = <Txt w="b" size={15.5} color={textColor}>{title}</Txt>;
  const box = { borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' };
  return (
    <Pressable onPress={disabled ? undefined : onPress} accessibilityRole="button" accessibilityState={{ disabled }}
      style={({ pressed }) => [{ flex: 1 }, pressed && !disabled && { opacity: 0.85 }]}>
      {variant === 'primary' && !disabled ? (
        <LinearGradient colors={[T.accent2, T.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={box}>{inner}</LinearGradient>
      ) : (
        <View style={[box, {
          backgroundColor: disabled ? T.line : variant === 'good' ? T.good : variant === 'bad' ? T.bad : T.soft,
        }]}>{inner}</View>
      )}
    </Pressable>
  );
}

// Back arrow for tab screens: returns to the previous screen (or Home)
export function BackButton() {
  const ui = useUI();
  return <IconButton name="back" label="Back" onPress={() => ui.back()} />;
}

export function IconButton({ name, onPress, label, color, size = 22 }) {
  const T = useT();
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={8}
      style={({ pressed }) => [{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, pressed && { backgroundColor: T.accentSoft }]}>
      <Icon name={name} size={size} color={color || T.ink} />
    </Pressable>
  );
}
