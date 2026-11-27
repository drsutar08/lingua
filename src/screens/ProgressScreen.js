import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGrad, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { PBar, Txt } from '../components';
import { Panel, Ring, ScreenHeader, SectionTitle } from '../ui';
import { Icon } from '../icons';
import { weekXP } from '../data';
import { useStore, useUI } from '../store';
import { ACHIEVEMENTS, levelOf, questDef } from '../game';
import { Badge } from '../Sheets';
import { F, tint, useT } from '../theme';
import { screen } from './styles';

function XPChart({ week }) {
  const T = useT();
  const [W, setW] = useState(300);
  const H = 150, top = 30, bot = 120, left = 16, right = W - 16;
  const vals = week.filter((p) => p.v !== null);
  const max = Math.max(60, ...vals.map((p) => p.v)) * 1.1;
  const x = (i) => left + (i * (right - left)) / 6;
  const y = (v) => bot - (v / max) * (bot - top);
  const pts = vals.map((p, i) => [x(i), y(p.v)]);

  let d = '';
  pts.forEach((p, i) => {
    if (!i) { d = `M${p[0]},${p[1]}`; return; }
    const p0 = pts[i - 2] || pts[i - 1], p1 = pts[i - 1], p3 = pts[i + 1] || p;
    const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6];
    const c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p[0]},${p[1]}`;
  });
  const last = pts[pts.length - 1];
  const lastV = vals[vals.length - 1].v;
  const area = pts.length > 1 ? `${d} L${last[0]},${bot} L${pts[0][0]},${bot} Z` : '';
  const lx = Math.min(Math.max(last[0], 30), W - 30);

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Svg width={W} height={H}>
        <Defs>
          <SvgGrad id="ga" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={T.accent} stopOpacity={0.28} />
            <Stop offset="1" stopColor={T.accent} stopOpacity={0} />
          </SvgGrad>
        </Defs>
        {[0, 1, 2].map((k) => {
          const yy = top + (k * (bot - top)) / 2;
          return <Line key={k} x1={left} x2={right} y1={yy} y2={yy} stroke={T.line} strokeDasharray="3 4" />;
        })}
        {area ? <Path d={area} fill="url(#ga)" /> : null}
        <Path d={d} fill="none" stroke={T.accent} strokeWidth={2.6} strokeLinecap="round" />
        {pts.map((p, i) => {
          const end = i === pts.length - 1;
          return <Circle key={i} cx={p[0]} cy={p[1]} r={end ? 5 : 3} fill={end ? T.surface : T.accent} stroke={T.accent} strokeWidth={2} />;
        })}
        <Rect x={lx - 22} y={last[1] - 27} width={44} height={19} rx={6} fill={T.accent} />
        <SvgText x={lx} y={last[1] - 14} textAnchor="middle" fontSize={10} fontWeight="700" fill={T.onAccent}>{`${lastV} XP`}</SvgText>
        {week.map((p, i) => (
          <SvgText key={p.d} x={x(i)} y={H - 6} textAnchor="middle" fontSize={10} fontWeight={p.today ? '700' : '500'} fill={p.today ? T.accent : T.muted}>{p.d}</SvgText>
        ))}
      </Svg>
    </View>
  );
}

export default function ProgressScreen() {
  const T = useT();
  const { S } = useStore();
  const ui = useUI();
  const week = weekXP(S);
  const wk = week.reduce((s, p) => s + (p.v || 0), 0);
  const lv = levelOf(S.totalXp || 0);
  const earned = ACHIEVEMENTS.filter((a) => S.earned[a.id]).length;

  return (
    <ScrollView contentContainerStyle={screen.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Progress" sub="Your learning at a glance" />

      {/* Level */}
      <LinearGradient colors={['#FFB347', '#F0821F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', right: -30, top: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: '#fff', opacity: 0.12 }} />
        <Ring size={68} stroke={6} pct={(lv.into / lv.span) * 100} color="#fff" track="rgba(255,255,255,0.3)">
          <Txt w="xb" size={24} color="#fff">{lv.level}</Txt>
        </Ring>
        <View style={{ flex: 1 }}>
          <Txt w="sb" size={11.5} color="rgba(255,255,255,0.9)" style={{ letterSpacing: 0.6 }}>LEVEL {lv.level}</Txt>
          <Txt w="xb" size={20} color="#fff">{S.totalXp} XP</Txt>
          <Txt size={12.5} color="rgba(255,255,255,0.92)" style={{ marginTop: 2 }}>{lv.span - lv.into} XP to level {lv.level + 1}</Txt>
        </View>
      </LinearGradient>

      {/* Streak week */}
      <Panel style={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="flame" size={26} />
          <View style={{ flex: 1 }}>
            <Txt w="xb" size={18}>{S.streak}-day streak</Txt>
            <Txt size={12} color={T.muted}>Longest {S.stats.maxStreak || S.streak} days · {S.freezes || 0} freeze{S.freezes === 1 ? '' : 's'}</Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {week.map((d) => {
            const did = d.v > 0;
            return (
              <View key={d.d} style={{ alignItems: 'center', gap: 6 }} accessible accessibilityLabel={`${d.d}: ${d.v == null ? 'coming up' : did ? 'practised' : 'not practised'}`}>
                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: did ? '#FFF1E4' : T.soft, borderWidth: d.today ? 2 : 0, borderColor: T.accent }}>
                  {did ? <Icon name="flame" size={17} /> : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.line }} />}
                </View>
                <Txt w={d.today ? 'b' : 'm'} size={11} color={d.today ? T.accent : T.muted}>{d.d}</Txt>
              </View>
            );
          })}
        </View>
      </Panel>

      {/* XP this week */}
      <Panel style={{ padding: 16, paddingBottom: 8 }}>
        <Txt size={12} color={T.muted}>XP this week</Txt>
        <Txt w="xb" size={26} style={{ marginTop: 2 }}>{wk} <Txt w="sb" size={13} color={T.muted}>XP</Txt></Txt>
        <XPChart week={week} />
      </Panel>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[['book', 'Lessons', S.lessons, T.accentSoft, tint.purple], ['vocab', 'Words', S.wordsTotal, T.greenSoft, tint.green], ['star', 'Reviews', S.stats.reviews, T.yellowSoft, tint.yellow]].map(([icon, label, v, bg, color]) => (
          <Panel key={label} style={{ flex: 1, padding: 14, gap: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icon} size={17} color={color} />
            </View>
            <View>
              <Txt w="xb" size={19}>{v}</Txt>
              <Txt size={11.5} color={T.muted}>{label}</Txt>
            </View>
          </Panel>
        ))}
      </View>

      {/* Daily quests */}
      <View style={{ gap: 12 }}>
        <SectionTitle title="Daily quests" sub={S.quests.chest ? 'All done today. Reward collected!' : 'Finish all three for a reward'} />
        <Panel>
          {S.quests.list.map((q, k) => {
            const d = questDef(q.id);
            return (
              <View key={q.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: k ? 1 : 0, borderTopColor: T.line }}
                accessible accessibilityLabel={`${d.label}: ${q.prog} of ${d.goal}${q.done ? ', complete' : ''}`}>
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: q.done ? T.goodSoft : T.yellowSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={q.done ? 'check' : d.icon} size={18} color={q.done ? T.good : tint.yellow} />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Txt w="sb" size={13.5}>{d.label}</Txt>
                  <PBar pct={(q.prog / d.goal) * 100} />
                </View>
                <Txt w="b" size={12} color={q.done ? T.good : T.muted}>{q.prog}/{d.goal}</Txt>
              </View>
            );
          })}
        </Panel>
      </View>

      {/* Badges */}
      <View style={{ gap: 12 }}>
        <SectionTitle title="Achievements" sub={`${earned} of ${ACHIEVEMENTS.length} earned`} action="Details" onAction={() => ui.openSheet('achievements')} />
        <Panel style={{ paddingVertical: 16, paddingHorizontal: 8, flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 }}>
          {ACHIEVEMENTS.map((a) => {
            const ok = !!S.earned[a.id];
            return (
              <View key={a.id} style={{ width: '20%', alignItems: 'center', gap: 6, paddingHorizontal: 2 }} accessible accessibilityLabel={`${a.label}${ok ? ', earned' : ', not earned yet'}`}>
                <Badge a={a} earned={ok} size={46} />
                <Txt w="m" size={10.5} color={ok ? T.ink : T.muted} style={{ textAlign: 'center', lineHeight: 15 }}>{a.label}</Txt>
              </View>
            );
          })}
        </Panel>
      </View>
    </ScrollView>
  );
}
