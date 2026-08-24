import { createContext, useContext, useState, useCallback } from 'react';
import { encrypt, decrypt } from '../lib/crypto';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const BookContext = createContext(null);

export function BookProvider({ children }) {
  const { encKey } = useAuth();
  
  // books: array of { id, title, description, updatedAt, ... }
  const [books, setBooks] = useState([]);
  const [booksLoaded, setBooksLoaded] = useState(false);
  
  // currentBookChapters: array of { id, title, content, order, updatedAt, ... }
  const [currentBookChapters, setCurrentBookChapters] = useState([]);
  const [currentBookId, setCurrentBookId] = useState(null);

  const loadBooks = useCallback(async () => {
    if (!encKey) return;
    try {
      const { data } = await api.get('/books');
      const decryptedBooks = [];
      for (const b of data) {
        try {
          const plaintext = await decrypt(encKey, b.iv, b.encryptedData);
          const parsed = JSON.parse(plaintext);
          decryptedBooks.push({ id: b._id, ...parsed, updatedAt: b.updatedAt });
        } catch {
          // skip on decrypt err
        }
      }
      setBooks(decryptedBooks);
      setBooksLoaded(true);
    } catch (err) {
      console.error('loadBooks error:', err);
    }
  }, [encKey]);

  const loadBookChapters = useCallback(async (bookId) => {
    if (!encKey) return;
    try {
      const { data } = await api.get(`/books/${bookId}/chapters`);
      const decryptedChapters = [];
      for (const ch of data) {
        try {
          const plaintext = await decrypt(encKey, ch.iv, ch.encryptedData);
          const parsed = JSON.parse(plaintext);
          decryptedChapters.push({ id: ch._id, order: ch.order, ...parsed, updatedAt: ch.updatedAt });
        } catch {
          // skip err
        }
      }
      setCurrentBookChapters(decryptedChapters);
      setCurrentBookId(bookId);
    } catch (err) {
      console.error('loadBookChapters error:', err);
    }
  }, [encKey]);

  const createBook = useCallback(async ({ title, description }) => {
    if (!encKey) throw new Error('No encryption key');
    const payload = JSON.stringify({ title, description });
    const { iv, ciphertext: encryptedData } = await encrypt(encKey, payload);
    const { data } = await api.post('/books', { iv, encryptedData });
    const newBook = { id: data._id, title, description, updatedAt: data.updatedAt };
    setBooks(prev => [newBook, ...prev]);
    return newBook;
  }, [encKey]);

  const updateBook = useCallback(async (bookId, { title, description }) => {
    if (!encKey) throw new Error('No encryption key');
    const payload = JSON.stringify({ title, description });
    const { iv, ciphertext: encryptedData } = await encrypt(encKey, payload);
    const { data } = await api.put(`/books/${bookId}`, { iv, encryptedData });
    const updatedBook = { id: data._id, title, description, updatedAt: data.updatedAt };
    setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));
    return updatedBook;
  }, [encKey]);

  const deleteBook = useCallback(async (bookId) => {
    await api.delete(`/books/${bookId}`);
    setBooks(prev => prev.filter(b => b.id !== bookId));
    if (currentBookId === bookId) {
      setCurrentBookChapters([]);
      setCurrentBookId(null);
    }
  }, [currentBookId]);

  const createChapter = useCallback(async (bookId, { title, content, order }) => {
    if (!encKey) throw new Error('No encryption key');
    const payload = JSON.stringify({ title, content });
    const { iv, ciphertext: encryptedData } = await encrypt(encKey, payload);
    const { data } = await api.post(`/books/${bookId}/chapters`, { iv, encryptedData, order });
    const newChapter = { id: data._id, title, content, order, updatedAt: data.updatedAt };
    if (currentBookId === bookId) {
      setCurrentBookChapters(prev => [...prev, newChapter].sort((a,b) => a.order - b.order));
    }
    return newChapter;
  }, [encKey, currentBookId]);

  const updateChapter = useCallback(async (bookId, chapterId, { title, content, order }) => {
    if (!encKey) throw new Error('No encryption key');
    const payload = JSON.stringify({ title, content });
    const { iv, ciphertext: encryptedData } = await encrypt(encKey, payload);
    const { data } = await api.put(`/books/${bookId}/chapters/${chapterId}`, { iv, encryptedData, order });
    const updatedChapter = { id: data._id, title, content, order, updatedAt: data.updatedAt };
    if (currentBookId === bookId) {
      setCurrentBookChapters(prev => prev.map(ch => ch.id === chapterId ? updatedChapter : ch).sort((a,b) => a.order - b.order));
    }
    return updatedChapter;
  }, [encKey, currentBookId]);

  const deleteChapter = useCallback(async (bookId, chapterId) => {
    await api.delete(`/books/${bookId}/chapters/${chapterId}`);
    if (currentBookId === bookId) {
      setCurrentBookChapters(prev => prev.filter(ch => ch.id !== chapterId));
    }
  }, [currentBookId]);

  return (
    <BookContext.Provider
      value={{
        books,
        booksLoaded,
        loadBooks,
        createBook,
        updateBook,
        deleteBook,
        currentBookId,
        currentBookChapters,
        loadBookChapters,
        createChapter,
        updateChapter,
        deleteChapter
      }}
    >
      {children}
    </BookContext.Provider>
  );
}

export const useBook = () => {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error('useBook must be used within BookProvider');
  return ctx;
};
