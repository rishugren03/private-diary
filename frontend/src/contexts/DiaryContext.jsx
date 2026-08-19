import { createContext, useContext, useState, useCallback } from 'react';
import { encrypt, decrypt } from '../lib/crypto';
import { normalizeEntry } from '../lib/entryUtils';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const DiaryContext = createContext(null);

export function DiaryProvider({ children }) {
  const { encKey } = useAuth();
  // Map of date (YYYY-MM-DD) → normalized entry object { thoughts: [...], date, updatedAt }
  // SECURITY: Decrypted entries are kept in memory ONLY — never persisted to disk/IndexedDB
  const [entries, setEntries] = useState({});
  const [loaded, setLoaded] = useState(false);

  // Load all entries from server, decrypt, keep in memory only
  const loadAllEntries = useCallback(async () => {
    if (!encKey) return;
    try {
      const { data } = await api.get('/entries');
      const decrypted = {};
      for (const e of data) {
        try {
          const plaintext = await decrypt(encKey, e.iv, e.encryptedData);
          const parsed = JSON.parse(plaintext);
          const normalized = normalizeEntry(parsed);
          decrypted[e.date] = { ...normalized, date: e.date, updatedAt: e.updatedAt };
        } catch {
          // Skip entries we can't decrypt
        }
      }
      setEntries(decrypted);
      setLoaded(true);
    } catch (err) {
      console.error('loadAllEntries error:', err);
    }
  }, [encKey]);

  // Load (or refresh) a single date's entry from the server
  const loadEntry = useCallback(async (date) => {
    if (!encKey) return null;
    try {
      const { data } = await api.get(`/entries/${date}`);
      if (!data || !data.iv) return null; // no entry for this date
      const plaintext = await decrypt(encKey, data.iv, data.encryptedData);
      const parsed = JSON.parse(plaintext);
      const normalized = normalizeEntry(parsed);
      const entry = { ...normalized, date, updatedAt: data.updatedAt };
      setEntries((prev) => ({ ...prev, [date]: entry }));
      return entry;
    } catch (err) {
      // 404 = no entry for this date, anything else is a real error
      if (err?.response?.status !== 404) {
        console.error('loadEntry error:', err);
      }
      return null;
    }
  }, [encKey]);

  // Internal helper to persist a date's thoughts array to server
  const _persistDayThoughts = useCallback(async (date, thoughts) => {
    if (!encKey) throw new Error('No encryption key');
    const payload = JSON.stringify({ thoughts });
    const { iv, ciphertext: encryptedData } = await encrypt(encKey, payload);
    await api.put(`/entries/${date}`, { iv, encryptedData });

    const entry = { date, thoughts, updatedAt: new Date().toISOString() };
    setEntries((prev) => ({ ...prev, [date]: entry }));
    return entry;
  }, [encKey]);

  // Add a new thought to a specific date
  const addThought = useCallback(async (date, { text, mood, tags }) => {
    const currentEntry = entries[date] ? normalizeEntry(entries[date]) : { thoughts: [] };
    const now = new Date();
    const newThought = {
      id: `thought-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
      mood: mood || null,
      tags: tags || [],
      createdAt: now.toISOString(),
    };

    const updatedThoughts = [newThought, ...currentEntry.thoughts];
    return await _persistDayThoughts(date, updatedThoughts);
  }, [entries, _persistDayThoughts]);

  // Update an existing thought by ID
  const updateThought = useCallback(async (date, thoughtId, { text, mood, tags }) => {
    const currentEntry = entries[date] ? normalizeEntry(entries[date]) : { thoughts: [] };
    const updatedThoughts = currentEntry.thoughts.map((t) =>
      t.id === thoughtId ? { ...t, text, mood, tags, updatedAt: new Date().toISOString() } : t
    );
    return await _persistDayThoughts(date, updatedThoughts);
  }, [entries, _persistDayThoughts]);

  // Delete a specific thought by ID
  const deleteThought = useCallback(async (date, thoughtId) => {
    const currentEntry = entries[date] ? normalizeEntry(entries[date]) : { thoughts: [] };
    const updatedThoughts = currentEntry.thoughts.filter((t) => t.id !== thoughtId);
    if (updatedThoughts.length === 0) {
      await api.delete(`/entries/${date}`);
      setEntries((prev) => {
        const next = { ...prev };
        delete next[date];
        return next;
      });
    } else {
      await _persistDayThoughts(date, updatedThoughts);
    }
  }, [entries, _persistDayThoughts]);

  // Delete all thoughts for a date
  const deleteEntry = useCallback(async (date) => {
    await api.delete(`/entries/${date}`);
    setEntries((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  }, []);

  return (
    <DiaryContext.Provider
      value={{
        entries,
        loaded,
        loadAllEntries,
        loadEntry,
        addThought,
        updateThought,
        deleteThought,
        deleteEntry,
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
}

export const useDiary = () => {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary must be used within DiaryProvider');
  return ctx;
};
