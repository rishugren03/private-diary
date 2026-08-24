import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { deriveKey, hashPasswordForAuth, createKeyVerifier, verifyKey, encrypt, decrypt } from '../lib/crypto';
import { clearLocalDB } from '../lib/localDb';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('diary_user')); } catch { return null; }
  });
  const [encKey, setEncKey] = useState(null); // AES-GCM CryptoKey — memory only, non-extractable
  const [keyLoading, setKeyLoading] = useState(false); // no async restore needed anymore

  const login = useCallback(async (email, password) => {
    // SECURITY: Hash password client-side — server never sees the raw password
    const authHash = await hashPasswordForAuth(password);
    const { data } = await api.post('/auth/login', { email, password: authHash });
    localStorage.setItem('diary_token', data.token);
    localStorage.setItem('diary_user', JSON.stringify(data.user));
    setUser(data.user);

    // Derive AES key from raw password + server salt (key never leaves browser)
    const key = await deriveKey(password, data.user.keySalt);
    setEncKey(key);

    // Store encrypted sentinel so future unlock() calls can verify the password
    try {
      const verifier = await createKeyVerifier(key);
      localStorage.setItem('diary_key_verifier', verifier);
    } catch (e) {
      console.warn('Key verifier creation warning:', e);
    }

    return data.user;
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    // SECURITY: Hash password client-side — server never sees the raw password
    const authHash = await hashPasswordForAuth(password);
    const { data } = await api.post('/auth/register', { email, password: authHash, displayName });
    localStorage.setItem('diary_token', data.token);
    localStorage.setItem('diary_user', JSON.stringify(data.user));
    setUser(data.user);

    const key = await deriveKey(password, data.user.keySalt);
    setEncKey(key);

    // Store encrypted sentinel so future unlock() calls can verify the password
    try {
      const verifier = await createKeyVerifier(key);
      localStorage.setItem('diary_key_verifier', verifier);
    } catch (e) {
      console.warn('Key verifier creation warning:', e);
    }

    return data.user;
  }, []);

  // Unlock helper if encKey is missing (e.g. after page refresh — key is memory-only now)
  const unlock = useCallback(async (password) => {
    if (!user || !user.keySalt) throw new Error('No user session found');

    const key = await deriveKey(password, user.keySalt);

    // SECURITY: verify the derived key against the stored sentinel before accepting it.
    // If no verifier exists (legacy session before this security fix), force a full
    // re-login so a proper verifier is created — never blindly trust any password.
    const verifier = localStorage.getItem('diary_key_verifier');
    if (!verifier) {
      // Clear stale session data and require the user to log in properly
      localStorage.removeItem('diary_token');
      localStorage.removeItem('diary_user');
      setUser(null);
      setEncKey(null);
      await clearLocalDB();
      throw new Error('Session expired. Please log in again to re-establish your encryption key.');
    }

    // This will throw (DOMException) if the password is wrong — preventing access
    await verifyKey(key, verifier);

    setEncKey(key);
    return key;
  }, [user]);

  // Change password: fetch & re-encrypt all user data (entries, books, chapters) with a new key
  const changePassword = useCallback(async (oldPassword, newPassword) => {
    if (!user || !encKey) throw new Error('Not authenticated');

    // 1. Compute auth hashes
    const oldAuthHash = await hashPasswordForAuth(oldPassword);
    const newAuthHash = await hashPasswordForAuth(newPassword);

    // 2. Fetch and decrypt all existing data with current encKey
    // a) Entries
    const { data: rawEntries } = await api.get('/entries');
    const decryptedEntries = [];
    for (const e of rawEntries) {
      try {
        const plaintext = await decrypt(encKey, e.iv, e.encryptedData);
        decryptedEntries.push({ date: e.date, plaintext });
      } catch (err) {
        console.warn(`Failed to decrypt entry ${e.date} during password change:`, err);
      }
    }

    // b) Books & Chapters
    const { data: rawBooks } = await api.get('/books');
    const decryptedBooks = [];
    const decryptedChapters = [];

    for (const b of rawBooks) {
      try {
        const bookPlaintext = await decrypt(encKey, b.iv, b.encryptedData);
        decryptedBooks.push({ id: b._id, plaintext: bookPlaintext });

        const { data: rawChapters } = await api.get(`/books/${b._id}/chapters`);
        for (const ch of rawChapters) {
          try {
            const chPlaintext = await decrypt(encKey, ch.iv, ch.encryptedData);
            decryptedChapters.push({ id: ch._id, plaintext: chPlaintext });
          } catch (err) {
            console.warn(`Failed to decrypt chapter ${ch._id} during password change:`, err);
          }
        }
      } catch (err) {
        console.warn(`Failed to decrypt book ${b._id} during password change:`, err);
      }
    }

    // 3. Generate new salt and derive new encryption key
    const newSaltArray = crypto.getRandomValues(new Uint8Array(32));
    const newKeySalt = btoa(String.fromCharCode(...newSaltArray));
    const newKey = await deriveKey(newPassword, newKeySalt);

    // 4. Re-encrypt all decrypted items with newKey
    const reEncryptedEntries = [];
    for (const item of decryptedEntries) {
      const { iv, ciphertext: encryptedData } = await encrypt(newKey, item.plaintext);
      reEncryptedEntries.push({ date: item.date, iv, encryptedData });
    }

    const reEncryptedBooks = [];
    for (const item of decryptedBooks) {
      const { iv, ciphertext: encryptedData } = await encrypt(newKey, item.plaintext);
      reEncryptedBooks.push({ id: item.id, iv, encryptedData });
    }

    const reEncryptedChapters = [];
    for (const item of decryptedChapters) {
      const { iv, ciphertext: encryptedData } = await encrypt(newKey, item.plaintext);
      reEncryptedChapters.push({ id: item.id, iv, encryptedData });
    }

    // 5. Send re-encrypted payloads to server in one atomic request
    const { data } = await api.post('/auth/change-password', {
      oldAuthHash,
      newAuthHash,
      newKeySalt,
      entries: reEncryptedEntries,
      books: reEncryptedBooks,
      chapters: reEncryptedChapters,
    });

    // 6. Update local storage & state
    localStorage.setItem('diary_token', data.token);
    const updatedUser = { ...user, keySalt: newKeySalt };
    localStorage.setItem('diary_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setEncKey(newKey);

    // 7. Update key verifier for unlock modal
    const verifier = await createKeyVerifier(newKey);
    localStorage.setItem('diary_key_verifier', verifier);

    return updatedUser;
  }, [user, encKey]);

  // Delete account and all data
  const deleteAccount = useCallback(async () => {
    await api.delete('/auth/account');
    localStorage.removeItem('diary_token');
    localStorage.removeItem('diary_user');
    localStorage.removeItem('diary_key_verifier');
    setUser(null);
    setEncKey(null);
    await clearLocalDB();
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('diary_token');
    localStorage.removeItem('diary_user');
    localStorage.removeItem('diary_key_verifier');
    setUser(null);
    setEncKey(null);
    await clearLocalDB();
  }, []);

  return (
    <AuthContext.Provider value={{ user, encKey, keyLoading, login, register, unlock, logout, changePassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
