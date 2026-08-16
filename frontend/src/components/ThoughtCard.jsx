import { useState } from 'react';
import MoodPicker from './MoodPicker';
import TagInput from './TagInput';
import { Clock, Edit2, Trash2, Check, X } from 'lucide-react';
import './ThoughtCard.css';

export default function ThoughtCard({ thought, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(thought.text);
  const [mood, setMood] = useState(thought.mood);
  const [tags, setTags] = useState(thought.tags || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onUpdate(thought.id, { text, mood, tags });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setText(thought.text);
    setMood(thought.mood);
    setTags(thought.tags || []);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="thought-card editing glass-card">
        <div className="thought-card-header">
          <span className="thought-time"><Clock size={12} /> {thought.time}</span>
          <div className="thought-edit-actions">
            <button className="btn btn-ghost icon-btn small" onClick={handleCancel} title="Cancel">
              <X size={14} />
            </button>
            <button className="btn btn-primary small" onClick={handleSave} disabled={saving}>
              <Check size={14} /> Save
            </button>
          </div>
        </div>

        <div className="thought-edit-body">
          <textarea
            className="thought-edit-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="thought-edit-row">
            <MoodPicker value={mood} onChange={setMood} />
          </div>
          <div className="thought-edit-row">
            <TagInput value={tags} onChange={setTags} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="thought-card glass-card">
      <div className="thought-card-header">
        <div className="thought-time-wrapper">
          <Clock size={13} className="thought-clock-icon" />
          <span className="thought-time">{thought.time}</span>
          {thought.mood && <span className="thought-mood">{thought.mood}</span>}
        </div>
        <div className="thought-card-actions">
          <button className="btn-icon-subtle" onClick={() => setIsEditing(true)} title="Edit thought">
            <Edit2 size={13} />
          </button>
          <button className="btn-icon-subtle danger" onClick={() => onDelete(thought.id)} title="Delete thought">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="thought-card-body">
        <p className="thought-text">{thought.text}</p>
      </div>

      {thought.tags?.length > 0 && (
        <div className="thought-card-tags">
          {thought.tags.map((t) => (
            <span key={t} className="tag">#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
