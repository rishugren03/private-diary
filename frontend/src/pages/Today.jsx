import { useState } from 'react';
import { format } from 'date-fns';
import { useDiary } from '../contexts/DiaryContext';
import { useAuth } from '../contexts/AuthContext';
import MoodPicker from '../components/MoodPicker';
import TagInput from '../components/TagInput';
import ThoughtCard from '../components/ThoughtCard';
import { Plus, Sparkles, MessageSquare } from 'lucide-react';
import './Today.css';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const TODAY_DISPLAY = format(new Date(), 'EEEE, MMMM d, yyyy');

export default function Today() {
  const { entries, addThought, updateThought, deleteThought } = useDiary();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [mood, setMood] = useState(null);
  const [tags, setTags] = useState([]);
  const [adding, setAdding] = useState(false);

  const todayEntry = entries[TODAY];
  const thoughts = todayEntry?.thoughts || [];

  const handleAddThought = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    setAdding(true);
    try {
      await addThought(TODAY, { text: text.trim(), mood, tags });
      setText('');
      setMood(null);
      setTags([]);
    } catch (err) {
      console.error('handleAddThought error:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleAddThought(e);
    }
  };

  const greeting = getGreeting();
  const name = user?.displayName || 'there';

  return (
    <div className="today-page">
      {/* Header */}
      <div className="today-header">
        <div>
          <p className="today-greeting">{greeting}, {name} 👋</p>
          <h1 className="today-date">{TODAY_DISPLAY}</h1>
        </div>
        <div className="today-thought-badge">
          <MessageSquare size={14} />
          <span>{thoughts.length} {thoughts.length === 1 ? 'entry' : 'entries'} logged today</span>
        </div>
      </div>

      {/* Quick Composer Card */}
      <div className="composer-card glass-card">
        <div className="composer-header">
          <Sparkles size={15} className="composer-sparkle" />
          <span className="composer-title">Today's Diary Entry</span>
          <span className="composer-hint">Press Cmd + Enter to save</span>
        </div>

        <textarea
          className="composer-textarea"
          placeholder="Dear diary, what happened today? Write your entry..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={6}
          autoFocus
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

            {adding ? (
              <span className="spinner" />
            ) : (
              <>
                <Plus size={16} /> Add Entry
              </>
            )}
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="timeline-section">
        <h2 className="timeline-heading">Today's Entries</h2>

        {thoughts.length === 0 ? (
          <div className="timeline-empty glass-card">
            <p>No entries logged yet today.</p>
            <span>Write an entry above and hit <strong>Add Entry</strong> to save it to today's diary.</span>
          </div>
        ) : (
          <div className="timeline-list">
            {thoughts.map((thought) => (
              <ThoughtCard
                key={thought.id}
                thought={thought}
                onUpdate={(id, updated) => updateThought(TODAY, id, updated)}
                onDelete={(id) => deleteThought(TODAY, id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
