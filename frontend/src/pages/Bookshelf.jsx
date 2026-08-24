import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBook } from '../contexts/BookContext';
import { Library, Plus, Book, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import './Bookshelf.css';

export default function Bookshelf() {
  const { books, booksLoaded, loadBooks, createBook, deleteBook } = useBook();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    if (!booksLoaded) loadBooks();
  }, [booksLoaded, loadBooks]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const book = await createBook({ title: newTitle, description: newDesc });
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
      navigate(`/books/${book.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBook = async (e, bookId) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to burn this manuscript? All chapters will be lost forever.')) {
      try {
        await deleteBook(bookId);
      } catch (err) {
        console.error('Delete book error:', err);
      }
    }
  };

  return (
    <div className="bookshelf-container fade-in">
      <header className="bookshelf-header">
        <div className="bookshelf-title">
          <Library size={28} className="gold-icon" />
          <h1>My Manuscripts</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
          <Plus size={16} /> New Manuscript
        </button>
      </header>

      {isCreating && (
        <form className="bookshelf-create-form glass-card fade-in" onSubmit={handleCreate}>
          <h3>Bind a New Manuscript</h3>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input 
              className="form-input" 
              placeholder="The Grand Voyage..." 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
              autoFocus
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Prologue / Description</label>
            <textarea 
              className="form-input" 
              placeholder="A few words about this piece..." 
              value={newDesc} 
              onChange={e => setNewDesc(e.target.value)} 
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setIsCreating(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Start Writing</button>
          </div>
        </form>
      )}

      <div className="bookshelf-grid">
        {books.map(book => (
          <div key={book.id} className="book-card leather-bind" onClick={() => navigate(`/books/${book.id}`)}>
            <div className="book-spine" />
            <div className="book-cover">
              <div className="book-cover-header">
                <h2 className="book-title">{book.title}</h2>
                <button 
                  className="book-delete-btn" 
                  onClick={(e) => handleDeleteBook(e, book.id)}
                  title="Burn Manuscript"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="book-desc">{book.description}</p>
              <div className="book-meta">
                <Clock size={12} />
                <span>Last updated: {format(new Date(book.updatedAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        ))}
        {books.length === 0 && !isCreating && booksLoaded && (
          <div className="empty-bookshelf">
            <Book size={48} className="empty-icon" />
            <p>Your library is empty. Bind your first manuscript today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
