import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import './TagInput.css';

export default function TagInput({ value = [], onChange }) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  const addTag = (raw) => {
    const tag = raw.trim().replace(/^#/, '').toLowerCase();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInputVal('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag) => onChange(value.filter((t) => t !== tag));

  return (
    <div className="tag-input" onClick={() => inputRef.current?.focus()}>
      {value.map((tag) => (
        <span key={tag} className="tag">
          #{tag}
          <button
            className="tag-remove"
            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
            type="button"
            aria-label={`Remove #${tag}`}
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="tag-text-input"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputVal.trim() && addTag(inputVal)}
        placeholder={value.length === 0 ? 'Add tags (Enter or comma)' : ''}
      />
    </div>
  );
}
