import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useDiary } from '../contexts/DiaryContext';
import { normalizeEntry } from '../lib/entryUtils';
import { SearchIcon, Clock } from 'lucide-react';
import './Search.css';

export default function Search() {
  const [query, setQuery] = useState('');
  const [matchingThoughts, setMatchingThoughts] = useState([]);
  const navigate = useNavigate();
  const { entries } = useDiary();

  // Convert in-memory entries to an array for searching
  const allEntries = useMemo(() => {
    return Object.values(entries).map((e) => ({
      ...e,
      ...normalizeEntry(e),
    }));
  }, [entries]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = query.trim().toLowerCase();

      // Filter entries by query (search in-memory, not IndexedDB)
      let filtered = allEntries;
      if (q) {
        filtered = allEntries.filter((entry) => {
          const norm = normalizeEntry(entry);
          return norm.thoughts?.some(
            (t) =>
              t.text?.toLowerCase().includes(q) ||
              t.tags?.some((tag) => tag.toLowerCase().includes(q))
          );
        });
      }

      // Extract individual thoughts that match the query
      const thoughtsList = [];
      for (const entry of filtered) {
        let dateDisplay = entry.date;
        try { dateDisplay = format(parseISO(entry.date), 'MMMM d, yyyy'); } catch {}

        for (const t of entry.thoughts || []) {
          const textMatch = !q || t.text?.toLowerCase().includes(q);
          const tagMatch = !q || t.tags?.some((tag) => tag.toLowerCase().includes(q));
          if (textMatch || tagMatch) {
            thoughtsList.push({
              date: entry.date,
              dateDisplay,
              ...t,
            });
          }
        }
      }

      // Sort newest date & time first
      thoughtsList.sort((a, b) => b.date.localeCompare(a.date));
      setMatchingThoughts(thoughtsList);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, allEntries]);

  const highlight = (str) => {
    if (!query.trim() || !str) return str;
    const parts = str.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((p, i) =>
      p.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="search-highlight">{p}</mark>
        : p
    );
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1 className="search-title">Search thoughts</h1>
        <p className="search-sub">Searched in-memory across all your loaded thoughts — 100% private, nothing on disk.</p>
      </div>

      <div className="search-input-wrapper glass-card">
        <SearchIcon size={18} className="search-icon" />
        <input
          id="search-input"
          className="search-input"
          placeholder="Search thoughts, keywords, #tags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="search-results">
        {matchingThoughts.length === 0 && (
          <div className="search-empty">
            {query ? 'No thoughts match your search.' : 'No thoughts logged yet.'}
          </div>
        )}
        {matchingThoughts.map((thought) => (
          <div
            key={`${thought.date}-${thought.id}`}
            className="search-card glass-card"
            onClick={() => navigate(`/entry/${thought.date}`)}
          >
            <div className="search-card-header">
              <span className="search-card-date">{thought.dateDisplay}</span>
              <span className="search-card-time"><Clock size={12} /> {thought.time}</span>
              {thought.mood && <span className="search-card-mood">{thought.mood}</span>}
            </div>
            <p className="search-card-preview">{highlight(thought.text)}</p>
            {thought.tags?.length > 0 && (
              <div className="search-card-tags">
                {thought.tags.map((t) => (
                  <span key={t} className="tag">#{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
