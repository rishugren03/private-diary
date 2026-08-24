import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBook } from '../contexts/BookContext';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import './BookWorkspace.css';

export default function BookWorkspace() {
  const { id: bookId } = useParams();
  const navigate = useNavigate();
  const { books, booksLoaded, loadBooks, loadBookChapters, currentBookChapters, currentBookId, createChapter, updateChapter, deleteChapter } = useBook();
  
  const [activeChapterId, setActiveChapterId] = useState(null);
  
  // Editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!booksLoaded) loadBooks();
  }, [booksLoaded, loadBooks]);

  useEffect(() => {
    if (bookId && currentBookId !== bookId) {
      loadBookChapters(bookId);
    }
  }, [bookId, currentBookId, loadBookChapters]);

  const currentBook = books.find(b => b.id === bookId);

  // Switch active chapter
  useEffect(() => {
    if (activeChapterId) {
      const ch = currentBookChapters.find(c => c.id === activeChapterId);
      if (ch) {
        setTitle(ch.title);
        setContent(ch.content);
      }
    } else {
      setTitle('');
      setContent('');
    }
  }, [activeChapterId, currentBookChapters]);

  // Try to load first chapter automatically if none selected
  useEffect(() => {
    if (currentBookChapters.length > 0 && !activeChapterId) {
      setActiveChapterId(currentBookChapters[0].id);
    }
  }, [currentBookChapters, activeChapterId]);

  const handleAddNewChapter = async () => {
    const newOrder = currentBookChapters.length > 0 
      ? Math.max(...currentBookChapters.map(c => c.order)) + 1 
      : 0;
    try {
      const ch = await createChapter(bookId, { title: 'Untitled Chapter', content: '', order: newOrder });
      setActiveChapterId(ch.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!activeChapterId) return;
    setIsSaving(true);
    try {
      const ch = currentBookChapters.find(c => c.id === activeChapterId);
      await updateChapter(bookId, activeChapterId, { title, content, order: ch.order });
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!activeChapterId) return;
    if (confirm('Are you sure you want to burn this chapter? It cannot be recovered.')) {
      await deleteChapter(bookId, activeChapterId);
      setActiveChapterId(null);
    }
  };

  if (!currentBook) return <div className="workspace-loading spinner" />;

  return (
    <div className="workspace-container">
      {/* Sidebar for Chapters */}
      <aside className="workspace-sidebar glass-card">
        <div className="workspace-sidebar-header">
          <button className="btn btn-ghost workspace-back" onClick={() => navigate('/books')}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="workspace-book-title">{currentBook.title}</div>
        </div>
        
        <div className="chapter-list">
          <div className="chapter-list-header">
            <h3>Chapters</h3>
            <button className="btn-icon" onClick={handleAddNewChapter} title="Add Chapter">
              <Plus size={16} />
            </button>
          </div>
          {currentBookChapters.map((ch, idx) => (
            <button 
              key={ch.id} 
              className={`chapter-item ${activeChapterId === ch.id ? 'active' : ''}`}
              onClick={() => setActiveChapterId(ch.id)}
            >
              <span className="chapter-number">{idx + 1}.</span>
              <span className="chapter-name">{ch.title || 'Untitled'}</span>
            </button>
          ))}
          {currentBookChapters.length === 0 && (
            <div className="empty-chapters">Write your first chapter...</div>
          )}
        </div>
      </aside>

      {/* Main Editor */}
      <main className="workspace-editor ruled-page">
        {activeChapterId ? (
          <div className="editor-content fade-in">
            <div className="editor-toolbar">
              <input 
                className="editor-title-input" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Chapter Title..."
                onBlur={handleSave}
              />
              <div className="editor-actions">
                <button className="btn btn-ghost" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <span className="spinner" style={{width: 14, height: 14}} /> : <Save size={16} />} 
                  {isSaving ? 'Saving' : 'Save'}
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <textarea 
              className="editor-textarea" 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="Begin your story here..."
              spellCheck="false"
            />
          </div>
        ) : (
          <div className="workspace-empty">
            Select or create a chapter to begin writing.
          </div>
        )}
      </main>
    </div>
  );
}
