import './MoodPicker.css';

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😄', label: 'Excited' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
];

export default function MoodPicker({ value, onChange }) {
  return (
    <div className="mood-picker" role="group" aria-label="Select mood">
      {MOODS.map(({ emoji, label }) => (
        <button
          key={emoji}
          className={`mood-btn ${value === emoji ? 'selected' : ''}`}
          onClick={() => onChange(value === emoji ? null : emoji)}
          title={label}
          type="button"
          aria-pressed={value === emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
