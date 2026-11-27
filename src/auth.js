import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { freshState, seed } from './data';

// Local accounts. There is no server: accounts, password hashes and progress live on this device.
// Swap signIn / signUp for calls to your backend (Firebase, Supabase, your own API) when you add one.

export const DEMO = { name: 'Alex Johnson', email: 'demo@lingua.app', password: 'Lingua@123' };

const K = {
  accounts: 'lingua-accounts',
  session: 'lingua-session',
  onboarded: 'lingua-onboarded',
  legacy: 'lingua-app-v1', // progress saved before accounts existed
};
export const dataKey = (email) => `lingua-data:${email}`;

const hash = (salt, password) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
const normEmail = (e) => e.trim().toLowerCase();
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

const AuthCtx = createContext(null);

async function readJSON(key) {
  try { return JSON.parse(await AsyncStorage.getItem(key)); } catch { return null; }
}

async function makeAccount(name, email, password) {
  const salt = Crypto.randomUUID();
  return { name, salt, hash: await hash(salt, password), created: Date.now() };
}

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [onboarded, setOnboardedState] = useState(false);

  useEffect(() => {
    (async () => {
      let accounts = (await readJSON(K.accounts)) || {};
      // Create the demo account the first time the app runs
      if (!accounts[DEMO.email]) {
        accounts[DEMO.email] = await makeAccount(DEMO.name, DEMO.email, DEMO.password);
        await AsyncStorage.setItem(K.accounts, JSON.stringify(accounts));
        if (!(await AsyncStorage.getItem(dataKey(DEMO.email)))) {
          // Keep any progress from before accounts existed, otherwise use the sample data
          const legacy = await readJSON(K.legacy);
          const data = legacy ? { ...legacy, name: legacy.name || DEMO.name, email: DEMO.email } : seed();
          delete data.onboarded;
          await AsyncStorage.setItem(dataKey(DEMO.email), JSON.stringify(data));
          if (legacy?.onboarded) await AsyncStorage.setItem(K.onboarded, '1');
        }
      }
      const session = await AsyncStorage.getItem(K.session);
      setUser(session && accounts[session] ? session : null);
      setOnboardedState((await AsyncStorage.getItem(K.onboarded)) === '1');
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const e = normEmail(email);
    const accounts = (await readJSON(K.accounts)) || {};
    const acc = accounts[e];
    if (!acc || (await hash(acc.salt, password)) !== acc.hash) throw new Error('Email or password is incorrect.');
    await AsyncStorage.setItem(K.session, e);
    setUser(e);
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    const e = normEmail(email);
    const accounts = (await readJSON(K.accounts)) || {};
    if (accounts[e]) throw new Error('An account with this email already exists. Log in instead.');
    accounts[e] = await makeAccount(name.trim(), e, password);
    await AsyncStorage.setItem(K.accounts, JSON.stringify(accounts));
    await AsyncStorage.setItem(dataKey(e), JSON.stringify(freshState(name.trim(), e)));
    await AsyncStorage.setItem(K.session, e);
    setUser(e);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(K.session);
    setUser(null);
  }, []);

  // Check the signed-in account's password (used before sensitive changes)
  const verify = async (accounts, password) => {
    const acc = user && accounts[user];
    if (!acc || (await hash(acc.salt, password)) !== acc.hash) throw new Error('That password is incorrect.');
    return acc;
  };

  const changePassword = useCallback(async (current, next) => {
    const accounts = (await readJSON(K.accounts)) || {};
    const acc = await verify(accounts, current);
    if (next.length < 8) throw new Error('Use at least 8 characters for the new password.');
    acc.salt = Crypto.randomUUID();
    acc.hash = await hash(acc.salt, next);
    await AsyncStorage.setItem(K.accounts, JSON.stringify(accounts));
  }, [user]);

  // Removes the account and all of its progress from this device
  const deleteAccount = useCallback(async (password) => {
    const accounts = (await readJSON(K.accounts)) || {};
    await verify(accounts, password);
    delete accounts[user];
    await AsyncStorage.setItem(K.accounts, JSON.stringify(accounts));
    await AsyncStorage.removeItem(dataKey(user));
    await AsyncStorage.removeItem(K.session);
    setUser(null);
  }, [user]);

  const rename = useCallback(async (name) => {
    const accounts = (await readJSON(K.accounts)) || {};
    if (user && accounts[user]) {
      accounts[user].name = name;
      await AsyncStorage.setItem(K.accounts, JSON.stringify(accounts));
    }
  }, [user]);

  const setOnboarded = useCallback((v) => {
    setOnboardedState(v);
    AsyncStorage.setItem(K.onboarded, v ? '1' : '0').catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ ready, user, onboarded, signIn, signUp, signOut, rename, setOnboarded, changePassword, deleteAccount }),
    [ready, user, onboarded, signIn, signUp, signOut, rename, setOnboarded, changePassword, deleteAccount],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
