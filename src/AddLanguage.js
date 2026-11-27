import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Flag, IconButton, Txt } from './components';
import { Icon } from './icons';
import { LANGS, TOTAL_LESSONS, UNITS } from './data';
import { useStore, useUI } from './store';
import { Panel, SectionTitle } from './ui';
import { F, useT } from './theme';

// Full-screen "Add a language" page (opened from the language switcher on Learn)
export default function AddLanguage({ onClose }) {
  const T = useT();
  const insets = useSafeAreaInsets();
  const { S, addCourse, focusCourse } = useStore();
  const ui = useUI();
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const [pick, setPick] = useState(null);

  const learners = (id) => parseFloat(LANGS[id].learners);
  const sorted = Object.keys(LANGS).sort((a, b) => learners(b) - learners(a));
  const query = q.trim().toLowerCase();
  const matches = sorted.filter((id) => LANGS[id].name.toLowerCase().includes(query));
  const ids = query || all ? matches : matches.slice(0, 6);
  // Close this page first so the next screen can open cleanly
  const then = (fn) => { onClose(); setTimeout(fn, 350); };

  const choose = (id) => {
    if (S.courses.some((c) => c.id === id)) { focusCourse(id); onClose(); ui.go('learn'); return; }
    setPick(id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6 }}>
        <IconButton name="back" label="Back" onPress={onClose} />
        <Txt w="xb" size={22} accessibilityRole="header">Add a language</Txt>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 6, paddingBottom: 40 + insets.bottom, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.line, paddingHorizontal: 14 }}>
          <Icon name="search" size={18} color={T.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search 16 languages" placeholderTextColor={T.muted}
            style={{ flex: 1, fontFamily: F.r, fontSize: 15, color: T.ink, paddingVertical: 13, paddingHorizontal: 10, outlineStyle: 'none' }} accessibilityLabel="Search languages" />
        </View>

        <SectionTitle title={query ? 'Search results' : all ? `All languages (${sorted.length})` : 'Popular languages'}
          action={query ? null : all ? 'Show less' : 'View all'} onAction={() => setAll(!all)} />
        {ids.length === 0 ? (
          <Txt size={13} color={T.muted} style={{ textAlign: 'center', padding: 18 }}>No languages match “{q}”.</Txt>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {ids.map((id) => {
              const has = S.courses.some((c) => c.id === id);
              const on = pick === id;
              return (
                <View key={id} style={{ width: '48.4%' }}>
                  <Panel onPress={() => choose(id)} accessibilityLabel={`${LANGS[id].name}${has ? ', in your courses' : `, ${LANGS[id].learners} learners`}`}
                    style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 }, on && { borderColor: T.accent, borderWidth: 2 }]}>
                    <Flag id={id} size={34} />
                    <View style={{ flex: 1 }}>
                      <Txt w="b" size={14}>{LANGS[id].name}</Txt>
                      {has ? <Txt w="sb" size={11.5} color={T.good}>In your courses</Txt>
                           : <Txt size={11.5} color={T.muted}>{LANGS[id].learners} learners</Txt>}
                    </View>
                  </Panel>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {pick ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: T.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 20 + insets.bottom, gap: 12, borderTopWidth: 1, borderColor: T.line }}
          accessibilityViewIsModal>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Flag id={pick} size={42} />
            <View style={{ flex: 1 }}>
              <Txt w="xb" size={18}>{LANGS[pick].course}</Txt>
              <Txt size={12.5} color={T.muted}>{UNITS.length} units · {TOTAL_LESSONS} lessons · {LANGS[pick].learners} learners</Txt>
            </View>
            <IconButton name="close" label="Close" onPress={() => setPick(null)} />
          </View>
          <View style={{ flexDirection: 'row' }}><Button title="Start from Unit 1" onPress={() => { const id = pick; addCourse(id, 0); then(() => { ui.go('learn'); ui.toast(`${LANGS[id].course} added`); }); }} /></View>
          <View style={{ flexDirection: 'row' }}><Button title="I know some · placement test" variant="ghost" onPress={() => { const id = pick; then(() => ui.startPlacement(id)); }} /></View>
        </View>
      ) : null}
    </View>
  );
}
