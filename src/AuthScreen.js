import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Txt } from './components';
import { Icon } from './icons';
import { Girl, Globe } from './illustrations';
import { DEMO, useAuth, validEmail } from './auth';
import { F, shadow, useT } from './theme';

function Field({ icon, label, value, onChangeText, secure, error, inputRef, ...p }) {
  const T = useT();
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Txt w="sb" size={13}>{label}</Txt>
      <View style={[{
        flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.surface, borderRadius: 14, paddingHorizontal: 14,
        borderWidth: 1.5, borderColor: error ? T.bad : focus ? T.accent : T.line,
      }]}>
        <Icon name={icon} size={18} color={focus ? T.accent : T.muted} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !show}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholderTextColor={T.muted}
          accessibilityLabel={label}
          style={{ flex: 1, fontFamily: F.r, fontSize: 15, color: T.ink, paddingVertical: 13, outlineStyle: 'none' }}
          {...p}
        />
        {secure ? (
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={10} accessibilityLabel={show ? 'Hide password' : 'Show password'}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={19} color={T.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Txt size={12} color={T.bad}>{error}</Txt> : null}
    </View>
  );
}

export default function AuthScreen() {
  const T = useT();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // login | signup
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errs, setErrs] = useState({});
  const [formErr, setFormErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef(null);
  const passRef = useRef(null);
  const signup = mode === 'signup';

  const switchMode = () => {
    setMode(signup ? 'login' : 'signup');
    setErrs({}); setFormErr(null);
  };

  const submit = async () => {
    const e = {};
    if (signup && !name.trim()) e.name = 'Enter your name.';
    if (!validEmail(email)) e.email = 'Enter a valid email address.';
    if (signup ? password.length < 8 : !password) e.password = signup ? 'Use at least 8 characters.' : 'Enter your password.';
    setErrs(e); setFormErr(null);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      if (signup) await signUp(name, email, password);
      else await signIn(email, password);
    } catch (err) {
      setFormErr(err.message);
      setBusy(false);
    }
  };

  // Android back button: from sign up, return to log in
  useEffect(() => {
    if (!signup) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { switchMode(); return true; });
    return () => sub.remove();
  }, [signup]);

  const useDemo = () => {
    setMode('login'); setErrs({}); setFormErr(null);
    setEmail(DEMO.email); setPassword(DEMO.password);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar style={T.dark ? 'light' : 'dark'} />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, gap: 18, flexGrow: 1 }}>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {signup ? <View style={{ marginLeft: -10 }}><IconButton name="back" label="Back to log in" onPress={switchMode} /></View> : null}
          <LinearGradient colors={[T.accent2, T.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={24} color="#fff" width={1.7} />
          </LinearGradient>
          <View>
            <Txt w="xb" size={21}>Lingua</Txt>
            <Txt size={11.5} color={T.muted}>Learn. Speak. Connect.</Txt>
          </View>
        </View>

        <LinearGradient colors={[T.accent2, T.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, paddingLeft: 20, paddingTop: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', overflow: 'hidden', minHeight: 150 }}>
          <View style={{ position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: '#fff', opacity: 0.12 }} />
          <View style={{ flex: 1, paddingBottom: 20 }}>
            <Txt w="xb" size={23} color="#fff">{signup ? 'Create your account' : 'Welcome back!'}</Txt>
            <Txt size={13.5} color="rgba(255,255,255,0.88)" style={{ marginTop: 6, lineHeight: 19 }}>
              {signup ? 'Start your first lesson in under a minute.' : 'Log in to keep your streak going.'}
            </Txt>
          </View>
          <Girl size={118} />
        </LinearGradient>

        <View style={{ gap: 14 }}>
          {signup ? (
            <Field icon="user" label="Name" value={name} onChangeText={setName} error={errs.name} placeholder="Your name"
              autoComplete="name" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />
          ) : null}
          <Field icon="mail" label="Email" value={email} onChangeText={setEmail} error={errs.email} placeholder="you@example.com" inputRef={emailRef}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" returnKeyType="next"
            onSubmitEditing={() => passRef.current?.focus()} />
          <Field icon="lock" label="Password" value={password} onChangeText={setPassword} error={errs.password} secure inputRef={passRef}
            placeholder={signup ? 'At least 8 characters' : 'Your password'} autoCapitalize="none" autoCorrect={false}
            autoComplete={signup ? 'new-password' : 'current-password'} returnKeyType="go" onSubmitEditing={submit} />
        </View>

        {formErr ? (
          <View style={{ backgroundColor: T.badSoft, borderRadius: 12, padding: 12 }}>
            <Txt w="sb" size={13} color={T.bad}>{formErr}</Txt>
          </View>
        ) : null}

        <Pressable onPress={busy ? undefined : submit} accessibilityRole="button" style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
          <LinearGradient colors={[T.accent2, T.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}>
            {busy ? <ActivityIndicator color="#fff" /> : <Txt w="b" size={15.5} color="#fff">{signup ? 'Create account' : 'Log in'}</Txt>}
          </LinearGradient>
        </Pressable>

        {!signup ? (
          <Pressable onPress={useDemo} accessibilityRole="button"
            style={({ pressed }) => [{ backgroundColor: T.surface, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: T.accentSoft }, !T.dark && shadow, pressed && { opacity: 0.85 }]}>
            <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: T.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="star" size={18} color={T.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt w="b" size={13.5}>Try the demo account</Txt>
              <Txt size={12} color={T.muted}>{DEMO.email} · {DEMO.password}</Txt>
            </View>
            <Icon name="chev" size={16} color={T.muted} />
          </Pressable>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 'auto', paddingTop: 6 }}>
          <Txt size={14} color={T.muted}>{signup ? 'Already have an account?' : 'New to Lingua?'}</Txt>
          <Pressable onPress={switchMode} hitSlop={8} accessibilityRole="button">
            <Txt w="b" size={14} color={T.accent}>{signup ? 'Log in' : 'Sign up'}</Txt>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
