import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Modal, Platform, Pressable, View, useColorScheme } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useNetInfo } from '@react-native-community/netinfo';
import { useFonts } from 'expo-font';
// Import each weight on its own so only these files are bundled (the package index pulls in every weight)
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari/400Regular';
import { NotoSansDevanagari_700Bold } from '@expo-google-fonts/noto-sans-devanagari/700Bold';
import { installWebFonts } from './src/fonts';

import { ThemeCtx, dark, light, useT } from './src/theme';
import { PrefsProvider, usePrefs } from './src/prefs';
import { StoreProvider, UICtx, useStore } from './src/store';
import { Txt } from './src/components';
import { Icon } from './src/icons';
import LearnScreen from './src/screens/LearnScreen';
import AddLanguage from './src/AddLanguage';
import { TabBar } from './src/ui';
import PracticeScreen from './src/screens/PracticeScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LessonScreen from './src/LessonScreen';
import CourseMap from './src/CourseMap';
import TutorScreen from './src/TutorScreen';
import Setup from './src/Setup';
import Celebration from './src/Celebration';
import Sheets from './src/Sheets';
import Splash from './src/Splash';
import Onboarding from './src/Onboarding';
import AuthScreen from './src/AuthScreen';
import { AuthProvider, useAuth } from './src/auth';
import { LANGS, TOTAL_LESSONS, dayKey, PER_UNIT } from './src/data';
import { heartsNow } from './src/game';
import { configureFx } from './src/fx';
import { scheduleReminders } from './src/reminders';

// Keep the native splash up until fonts and saved data are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});
installWebFonts(); // web: Noto Sans JP / SC / KR from Google Fonts

// [key, label, icon, screen]
const TABS = [
  ['learn', 'Learn', 'home', LearnScreen],
  ['practice', 'Practice', 'practice', PracticeScreen],
  ['progress', 'Progress', 'progress', ProgressScreen],
  ['profile', 'Profile', 'profile', ProfileScreen],
];

// Full-screen modal that keeps theme + safe areas
function FullModal({ visible, onClose, children }) {
  const T = useT();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaProvider>
        <ThemeCtx.Provider value={T}>{visible ? children : null}</ThemeCtx.Provider>
      </SafeAreaProvider>
    </Modal>
  );
}

function Shell() {
  const T = useT();
  const insets = useSafeAreaInsets();
  const { S, notice, clearNotice, addCourse, dismissCelebrate, focusCourse } = useStore();
  const { prefs } = usePrefs();
  const net = useNetInfo();
  const [tab, setTab] = useState('learn');
  const [addLang, setAddLang] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [map, setMap] = useState(null);
  const [tutor, setTutor] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);
  const SRef = useRef(S);
  SRef.current = S;

  const toast = useCallback((msg, ms = 2400) => {
    clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), ms);
  }, []);

  // Back navigation: a stack of what was opened (tab switches and full-screen pages).
  // The on-screen back arrows, Android's back button and the browser's back button all walk it.
  const WEB = Platform.OS === 'web' && typeof window !== 'undefined';
  const stack = useRef([]);
  const ignorePop = useRef(0);
  const tabRef = useRef(tab);
  tabRef.current = tab;  const push = (e) => {
    stack.current.push(e);
    if (stack.current.length > 60) stack.current.shift();
    if (WEB) window.history.pushState({ lingua: true }, '');
  };
  const undo = (e) => {
    if (e.type === 'tab') { tabRef.current = e.from; setTab(e.from); }
    else if (e.type === 'map') setMap(null);
    else if (e.type === 'lesson') setLesson(null);
    else if (e.type === 'tutor') setTutor(null);
    else if (e.type === 'addlang') setAddLang(false);
  };
  // A page closed by its own button: drop its entry, and the matching browser history entry
  const close = (type) => {
    const i = stack.current.map((e) => e.type).lastIndexOf(type);
    if (i >= 0) {
      stack.current.splice(i, 1);
      if (WEB) { ignorePop.current++; window.history.back(); }
    }
    undo({ type });
  };
  // Go back one step. fromBrowser: the browser already moved its history.
  const back = (fromBrowser) => {
    const e = stack.current.pop();
    if (!e) return false;
    if (!fromBrowser && WEB) { ignorePop.current++; window.history.back(); }
    undo(e);
    return true;
  };

  const ui = useMemo(() => {
    const open = (l) => { push({ type: 'lesson' }); setLesson({ ...l, key: Date.now() }); };
    // Lessons cost hearts. With none left, show the hearts sheet instead.
    const gated = (l) => {
      if (heartsNow(SRef.current.hearts).n <= 0) return setSheet({ name: 'hearts' });
      open(l);
    };
    return {
      go: (t0) => {
        if (t0 === 'explore') { push({ type: 'addlang' }); setAddLang(true); return; }
        const t = t0 === 'home' ? 'learn' : t0;
        setSheet(null);
        if (stack.current.some((e) => e.type === 'map')) close('map');
        if (t !== tabRef.current) { push({ type: 'tab', from: tabRef.current }); tabRef.current = t; setTab(t); }
      },
      back: () => { if (!back(false)) { tabRef.current = 'learn'; setTab('learn'); } },
      openAddLanguage: () => { push({ type: 'addlang' }); setAddLang(true); },
      toast,
      // Settings now live on the Profile tab
      openSheet: (name, arg) => {
        if (name === 'settings') {
          if (tabRef.current !== 'profile') { push({ type: 'tab', from: tabRef.current }); tabRef.current = 'profile'; setTab('profile'); }
          return;
        }
        setSheet({ name, arg });
      },
      // The learning path is on the Learn tab: switch to that course there
      openMap: (id) => {
        focusCourse(id);
        if (tabRef.current !== 'learn') { push({ type: 'tab', from: tabRef.current }); tabRef.current = 'learn'; setTab('learn'); }
      },
      openTutor: (id, scene) => { push({ type: 'tutor' }); setTutor({ id, scene, key: Date.now() }); },
      startCourseLesson: (id, idx) => gated({ id, idx, unit: Math.floor(idx / PER_UNIT), variant: idx % PER_UNIT }),
      continueCourse: (id) => {
        const c = SRef.current.courses.find((x) => x.id === id);
        const idx = Math.min(c?.done || 0, TOTAL_LESSONS - 1);
        gated({ id, idx, unit: Math.floor(idx / PER_UNIT), variant: idx % PER_UNIT });
      },
      startDrill: (id, mode, title, unit) => gated({ id, mode, title, unit }),
      startReview: (all = false) => open({ mode: 'review', all }),
      startPlacement: (id) => open({ id, mode: 'placement' }),
    };
  }, [toast]);

  // Android back button: step back; on Home with nothing to undo, let Android leave the app
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => back(false));
    return () => sub.remove();
  }, []);
  // Browser back button
  useEffect(() => {
    if (!WEB) return;
    const onPop = () => {
      if (ignorePop.current > 0) { ignorePop.current--; return; }
      back(true);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Streak freeze used / streak lost on opening the app
  useEffect(() => {
    if (notice) { toast(notice, 4200); clearNotice(); }
  }, [notice]);

  // Keep reminders in step with the current streak and settings
  const practicedToday = S?.lastDay === dayKey(0);
  useEffect(() => {
    if (!S) return;
    scheduleReminders({ ...prefs.reminder, streak: S.streak, practicedToday, course: S.courses[0] && LANGS[S.courses[0].id].name });
  }, [prefs.reminder, S?.streak, practicedToday]);

  if (!S) return <View style={{ flex: 1, backgroundColor: T.bg }} />;

  const lessonModal = (
    <FullModal visible={!!lesson} onClose={() => close('lesson')}>
      {lesson ? (
        <LessonScreen key={lesson.key} {...{ id: lesson.id, idx: lesson.idx, mode: lesson.mode, title: lesson.title, unit: lesson.unit, variant: lesson.variant, all: lesson.all }}
          onClose={(res) => {
            const l = lesson;
            close('lesson');
            if (res?.placement != null) {
              addCourse(l.id, res.placement * PER_UNIT);
              toast(res.placement ? `You start at Unit ${res.placement + 1}` : 'You start at Unit 1');
            } else if (res?.saved) toast('Progress saved');
          }} />
      ) : null}
    </FullModal>
  );

  // New learners pick a language before anything else
  if (!S.courses.length) {
    return (
      <UICtx.Provider value={ui}>
        <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top }}>
          <StatusBar style={T.dark ? 'light' : 'dark'} />
          <Setup />
        </View>
        {lessonModal}
      </UICtx.Provider>
    );
  }

  const Screen = (TABS.find((t) => t[0] === tab) || TABS[0])[3];
  const offline = net.isConnected === false;
  const celebrate = !lesson && !tutor && S.celebrate.length ? S.celebrate[0] : null;

  return (
    <UICtx.Provider value={ui}>
      <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top }}>
        <StatusBar style={T.dark ? 'light' : 'dark'} />
        {offline ? (
          <View accessibilityRole="alert" style={{ backgroundColor: T.yellowSoft, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Icon name="drop" size={14} />
            <Txt w="sb" size={12} style={{ flex: 1 }}>You’re offline. Lessons and review still work; speech scoring and the AI tutor need a connection.</Txt>
          </View>
        ) : null}
        <View style={{ flex: 1 }}><Screen /></View>

        <TabBar tabs={TABS} tab={tab} onTab={(k) => ui.go(k)} bottom={Math.max(12, insets.bottom + 6)} />

        {toastMsg ? (
          <View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: 'absolute', left: 0, right: 0, bottom: 96 + insets.bottom, alignItems: 'center' }}>
            <View style={{ backgroundColor: T.ink, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, maxWidth: '90%' }}>
              <Txt w="sb" size={13} color={T.surface} numberOfLines={2} style={{ textAlign: 'center' }}>{toastMsg}</Txt>
            </View>
          </View>
        ) : null}
      </View>

      <FullModal visible={addLang} onClose={() => close('addlang')}>
        <AddLanguage onClose={() => close('addlang')} />
      </FullModal>
      <FullModal visible={!!map} onClose={() => close('map')}>
        <CourseMap id={map} onClose={() => close('map')} />
      </FullModal>
      {lessonModal}
      <FullModal visible={!!tutor} onClose={() => close('tutor')}>
        {tutor ? <TutorScreen key={tutor.key} id={tutor.id} scene={tutor.scene} onClose={() => close('tutor')} /> : null}
      </FullModal>

      {sheet ? <Sheets name={sheet.name} arg={sheet.arg} onClose={() => setSheet(null)} /> : null}
      {celebrate ? <Celebration item={celebrate} onDone={dismissCelebrate} /> : null}
    </UICtx.Provider>
  );
}

// Native splash -> animated splash -> intro (first launch) -> log in / sign up -> app
function Root({ fontsLoaded }) {
  const T = useT();
  const auth = useAuth();
  const { prefs, ready: prefsReady } = usePrefs();
  const ready = fontsLoaded && prefsReady && auth.ready;
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  useEffect(() => { configureFx({ sound: prefs.sound, haptics: prefs.haptics }); }, [prefs.sound, prefs.haptics]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: '#7B61F0' }} />;
  let page;
  if (!auth.onboarded) page = <Onboarding onDone={() => auth.setOnboarded(true)} />;
  else if (!auth.user) page = <AuthScreen />;
  else page = <StoreProvider key={auth.user} user={auth.user}><Shell /></StoreProvider>;
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {page}
      {!splashDone ? <Splash onDone={() => setSplashDone(true)} /> : null}
    </View>
  );
}

function Themed({ children }) {
  const scheme = useColorScheme();
  const { prefs } = usePrefs();
  const mode = prefs.theme === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : prefs.theme;
  return <ThemeCtx.Provider value={mode === 'dark' ? dark : light}>{children}</ThemeCtx.Provider>;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_700Bold,
  });
  return (
    <SafeAreaProvider>
      <PrefsProvider>
        <Themed>
          <AuthProvider>
            <Root fontsLoaded={fontsLoaded} />
          </AuthProvider>
        </Themed>
      </PrefsProvider>
    </SafeAreaProvider>
  );
}
