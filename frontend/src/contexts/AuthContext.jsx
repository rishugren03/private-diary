import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { deriveKey, exportKeyB64, importKeyB64 } from '../lib/crypto';
import { clearLocalDB } from '../lib/localDb';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('diary_user')); } catch { return null; }
  });
  const [encKey, setEncKey] = useState(null); // AES-GCM CryptoKey — preserved in sessionStorage
  const [keyLoading, setKeyLoading] = useState(true);

  // Restore encryption key from sessionStorage on initial page load / F5 refresh
  useEffect(() => {
    async function restoreKey() {
      try {
        const cachedB64 = sessionStorage.getItem('diary_enc_key');
        if (cachedB64) {
          const key = await importKeyB64(cachedB64);
          setEncKey(key);
        }
      } catch (err) {
        console.warn('Failed to restore cached session key:', err);
      } finally {
        setKeyLoading(false);
      }
    }
    restoreKey();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('diary_token', data.token);
    localStorage.setItem('diary_user', JSON.stringify(data.user));
    setUser(data.user);

    // Derive AES key from password + server salt
    const key = await deriveKey(password, data.user.keySalt);
    setEncKey(key);

    // Cache key in sessionStorage so F5 browser refresh never loses key state
    try {
      const b64 = await exportKeyB64(key);
      sessionStorage.setItem('diary_enc_key', b64);
    } catch (e) {
      console.warn('Session key export warning:', e);
    }

    return data.user;
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    const { data } = await api.post('/auth/register', { email, password, displayName });
    localStorage.setItem('diary_token', data.token);
    localStorage.setItem('diary_user', JSON.stringify(data.user));
    setUser(data.user);

    const key = await deriveKey(password, data.user.keySalt);
    setEncKey(key);

    try {
      const b64 = await exportKeyB64(key);
      sessionStorage.setItem('diary_enc_key', b64);
    } catch (e) {
      console.warn('Session key export warning:', e);
    }

    return data.user;
  }, []);

  // Unlock helper if encKey is missing on a fresh tab session
  const unlock = useCallback(async (password) => {
    if (!user || !user.keySalt) throw new Error('No user session found');
    const key = await deriveKey(password, user.keySalt);
    setEncKey(key);
    try {
      const b64 = await exportKeyB64(key);
      sessionStorage.setItem('diary_enc_key', b64);
    } catch (e) {
      console.warn('Session key export warning:', e);
    }
    return key;
  }, [user]);

  const logout = useCallback(async () => {
    localStorage.removeItem('diary_token');
    localStorage.removeItem('diary_user');
    sessionStorage.removeItem('diary_enc_key');
    setUser(null);
    setEncKey(null);
    await clearLocalDB();
  }, []);

  return (
    <AuthContext.Provider value={{ user, encKey, keyLoading, login, register, unlock, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
