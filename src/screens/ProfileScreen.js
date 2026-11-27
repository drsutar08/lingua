import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Txt } from '../components';
import { Girl } from '../illustrations';
import { useStore, useUI } from '../store';
import { SettingsBody } from '../Sheets';
import { Panel, Row, ScreenHeader, SectionTitle } from '../ui';
import { tint, useT } from '../theme';
import { screen } from './styles';

// Profile: account, library, and every setting on one page
export default function ProfileScreen() {
  const T = useT();
  const { S } = useStore();
  const ui = useUI();
  const stats = [['Courses', S.courses.length], ['Lessons', S.lessons], ['Words', S.wordsTotal], ['Streak', S.streak]];

  return (
    <ScrollView contentContainerStyle={screen.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Profile" />

      <Panel style={{ padding: 18, gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, borderColor: T.accent2, padding: 2 }}>
            <View style={{ flex: 1, borderRadius: 34, backgroundColor: T.accentSoft, overflow: 'hidden', alignItems: 'center' }}>
              <View style={{ marginTop: -9 }}><Girl size={84} /></View>
            </View>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt w="xb" size={19}>{S.name}</Txt>
            <Txt size={12.5} color={T.muted} numberOfLines={1}>{S.email}</Txt>
            <Pressable onPress={() => ui.openSheet('profile')} accessibilityRole="button"
              style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: T.accentSoft, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12 }}>
              <Txt w="b" size={12} color={T.accent}>Edit profile</Txt>
            </Pressable>
          </View>
        </View>
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: T.line, paddingTop: 14 }}>
          {stats.map(([l, v], k) => (
            <View key={l} style={{ flex: 1, alignItems: 'center', borderLeftWidth: k ? 1 : 0, borderLeftColor: T.line }}>
              <Txt w="xb" size={18}>{v}</Txt>
              <Txt size={11} color={T.muted}>{l}</Txt>
            </View>
          ))}
        </View>
      </Panel>

      <View style={{ gap: 12 }}>
        <SectionTitle title="Library" />
        <Panel>
          <Row first icon="book" iconBg={T.accentSoft} iconColor={tint.purple} title="My vocabulary" sub={`${S.vocab.length} words and phrases`} onPress={() => ui.openSheet('vocab')} />
          <Row icon="save" iconBg={T.blueSoft} iconColor={tint.blue} title="Saved lessons" onPress={() => ui.openSheet('saved')} />
          <Row icon="star" iconBg={T.yellowSoft} iconColor={tint.yellow} title="Achievements" onPress={() => ui.openSheet('achievements')} />
        </Panel>
      </View>

      <View style={{ gap: 12 }}>
        <SectionTitle title="Settings" />
        <Panel style={{ padding: 16, gap: 14 }}>
          <SettingsBody />
        </Panel>
      </View>
    </ScrollView>
  );
}
