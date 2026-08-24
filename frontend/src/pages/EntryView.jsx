import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useDiary } from '../contexts/DiaryContext';
import MoodPicker from '../components/MoodPicker';
import TagInput from '../components/TagInput';
import ThoughtCard from '../components/ThoughtCard';
import { ArrowLeft, Trash2, Plus, Sparkles } from 'lucide-react';
import './EntryView.css';

export default function EntryView() {
  const { date } = useParams();
  const navigate = useNavigate();
  const { entries, loadEntry, addThought, updateThought, deleteThought, deleteEntry } = useDiary();

  const [text, setText] = useState('');
  const [mood, setMood] = useState(null);
  const [tags, setTags] = useState([]);
  const [adding, setAdding] = useState(false);
  const [fetching, setFetching] = useState(false);

  // If this date's entry isn't in memory yet, fetch it from the server
  useEffect(() => {
    if (!entries[date]) {
      setFetching(true);
      loadEntry(date).finally(() => setFetching(false));
    }
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const entry = entries[date];
  const thoughts = entry?.thoughts || [];


  const handleAddThought = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    setAdding(true);
    try {
      await addThought(date, { text: text.trim(), mood, tags });
      setText('');
      setMood(null);
      setTags([]);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete all entries for this date? This cannot be undone.')) return;
    await deleteEntry(date);
    navigate('/calendar');
  };

  let displayDate = date;
  try { displayDate = format(parseISO(date), 'EEEE, MMMM d, yyyy'); } catch {}

  return (
    <div className="entry-page">
      <div className="entry-header">
        <button className="btn btn-ghost icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="entry-date">{displayDate}</h1>
        <div className="entry-actions">
          <button className="btn btn-danger" onClick={handleDeleteAll}>
            <Trash2 size={15} /> Delete Day
          </button>
        </div>
      </div>

      {/* Add thought card for this date */}
      <div className="composer-card glass-card">
        <div className="composer-header">
          <Sparkles size={15} className="composer-sparkle" />
          <span className="composer-title">Add an entry to this day</span>
        </div>
        <textarea
          className="composer-textarea"
          placeholder="Write an entry for this day..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
        />
        <div className="composer-toolbar">
          <div className="composer-meta">
            <MoodPicker value={mood} onChange={setMood} />
            <TagInput value={tags} onChange={setTags} />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAddThought}
            disabled={!text.trim() || adding}
          >
            <Plus size={16} /> Add Entry
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="timeline-section">
        <h2 className="timeline-heading">Diary Entries ({thoughts.length})</h2>
        {fetching ? (
          <div className="timeline-empty glass-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="spinner" />
            <span>Loading entries…</span>
          </div>
        ) : thoughts.length === 0 ? (
          <div className="timeline-empty glass-card">
            No entries recorded for this date.
          </div>
        ) : (
          <div className="timeline-list">
            {thoughts.map((t) => (
              <ThoughtCard
                key={t.id}
                thought={t}
                onUpdate={(id, updated) => updateThought(date, id, updated)}
                onDelete={(id) => deleteThought(date, id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
