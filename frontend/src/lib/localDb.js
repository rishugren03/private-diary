/**
 * IndexedDB wrapper for local decrypted entry cache.
 * Used for instant client-side search without hitting the server.
 * Cleared on logout.
 */
import { normalizeEntry } from './entryUtils';

const DB_NAME = 'memoria_local';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'date' });
        store.createIndex('date', 'date', { unique: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function saveEntryLocal(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

export async function getEntryLocal(date) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(date);
    req.onsuccess = () => resolve(req.result ? normalizeEntry(req.result) : null);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllEntriesLocal() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const normalized = (req.result || []).map((e) => ({
        ...e,
        ...normalizeEntry(e),
      }));
      resolve(normalized);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function searchEntriesLocal(query) {
  const all = await getAllEntriesLocal();
  if (!query.trim()) return all;
  const q = query.toLowerCase();

  // Return entries where at least one thought matches text or tags
  return all.filter((entry) => {
    const norm = normalizeEntry(entry);
    return norm.thoughts?.some(
      (t) =>
        t.text?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}

export async function deleteEntryLocal(date) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(date);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

export async function clearLocalDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}
