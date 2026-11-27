// Shared building blocks for the modern layout: headers, panels, pills, progress ring, tab bar.
import React from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Txt } from './components';
import { Icon } from './icons';
import { soft, useT } from './theme';

// Space scale used across screens
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, gutter: 18 };

// Screen title row: optional left control, big title, optional subtitle, right slot
export function ScreenHeader({ title, sub, left, right }) {
  const T = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {left ? <View style={{ marginLeft: -10 }}>{left}</View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt w="xb" size={26} accessibilityRole="header" style={{ letterSpacing: -0.4 }}>{title}</Txt>
        {sub ? <Txt size={13} color={T.muted} style={{ marginTop: 2 }}>{sub}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

// A flat card: thin border, very soft shadow in light mode
export function Panel({ children, style, onPress, accessibilityLabel }) {
  const T = useT();
  const base = [{ backgroundColor: T.surface, borderRadius: 22, borderWidth: 1, borderColor: T.line }, !T.dark && soft, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}>
      {children}
    </Pressable>
  );
}

// Small rounded stat chip (streak, hearts, XP)
export function Pill({ icon, iconColor, children, onPress, label }) {
  const T = useT();
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={label}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.surface, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 11, borderWidth: 1, borderColor: T.line }, pressed && { opacity: 0.8 }]}>
      {icon ? <Icon name={icon} size={16} color={iconColor} /> : null}
      {typeof children === 'string' || typeof children === 'number' ? <Txt w="b" size={13.5}>{children}</Txt> : children}
    </Pressable>
  );
}

// Circular progress
export function Ring({ size = 56, stroke = 6, pct = 0, color, track, children }) {
  const T = useT();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track || T.line} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color || T.accent} strokeWidth={stroke} fill="none"
          strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - p / 100)} strokeLinecap="round" />
      </Svg>
      {children}
    </View>
  );
}

// Section title with optional action link
export function SectionTitle({ title, sub, action, onAction }) {
  const T = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
      <View style={{ flex: 1 }}>
        <Txt w="b" size={17}>{title}</Txt>
        {sub ? <Txt size={12.5} color={T.muted} style={{ marginTop: 2 }}>{sub}</Txt> : null}
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Txt w="sb" size={13} color={T.accent}>{action}</Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

// A settings-style row inside a Panel
export function Row({ icon, iconBg, iconColor, title, sub, right, onPress, first }) {
  const T = useT();
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={title}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderTopWidth: first ? 0 : 1, borderTopColor: T.line }, pressed && onPress && { backgroundColor: T.soft }]}>
      {icon ? (
        <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: iconBg || T.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} color={iconColor || T.accent} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt w="sb" size={14.5}>{title}</Txt>
        {sub ? <Txt size={12} color={T.muted} style={{ marginTop: 1 }}>{sub}</Txt> : null}
      </View>
      {right !== undefined ? right : onPress ? <Icon name="chev" size={17} color={T.muted} /> : null}
    </Pressable>
  );
}

// Floating tab bar with a highlighted active tab
export function TabBar({ tabs, tab, onTab, bottom }) {
  const T = useT();
  return (
    <View style={[{ position: 'absolute', left: 14, right: 14, bottom, flexDirection: 'row', backgroundColor: T.surface, borderRadius: 26, padding: 6, borderWidth: 1, borderColor: T.line },
      { shadowColor: '#2A1A80', shadowOpacity: T.dark ? 0.4 : 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 }]}>
      {tabs.map(([k, label, icon]) => {
        const on = tab === k;
        return (
          <Pressable key={k} onPress={() => onTab(k)} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} accessibilityLabel={label}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 20, backgroundColor: on ? T.accentSoft : 'transparent', gap: 3 }}>
            <Icon name={icon} size={21} color={on ? T.accent : T.muted} />
            <Txt w={on ? 'b' : 'm'} size={11} color={on ? T.accent : T.muted}>{label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

// Bottom padding so content clears the floating tab bar
export const TAB_SPACE = 104;
