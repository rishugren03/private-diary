import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from 'date-fns';
import { useDiary } from '../contexts/DiaryContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarPage.css';

const MOODS = { '😊': '#10b981', '😄': '#6366f1', '😐': '#94a3b8', '😔': '#f59e0b', '😡': '#ef4444', '😴': '#8b5cf6', '🥰': '#ec4899' };

export default function CalendarPage() {
  const { entries } = useDiary();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const prev = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const next = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const goToDay = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    navigate(`/entry/${dateStr}`);
  };

  return (
    <div className="cal-page">
      <div className="cal-header">
        <h1 className="cal-title">{format(currentDate, 'MMMM yyyy')}</h1>
        <div className="cal-nav">
          <button className="btn btn-ghost icon-btn" onClick={prev}><ChevronLeft size={18} /></button>
          <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date())}>Today</button>
          <button className="btn btn-ghost icon-btn" onClick={next}><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="cal-grid-wrapper glass-card">
        <div className="cal-grid cal-day-labels">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="cal-day-label">{d}</div>
          ))}
        </div>

        <div className="cal-grid cal-cells">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="cal-cell empty" />
          ))}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = entries[dateStr];
            const thoughts = entry?.thoughts || [];

            // Primary mood from first thought or null
            const primaryMood = thoughts.find((t) => t.mood)?.mood;
            const moodColor = primaryMood ? (MOODS[primaryMood] || '#6366f1') : null;

            return (
              <div
                key={dateStr}
                className={`cal-cell ${thoughts.length > 0 ? 'has-entry' : ''} ${isToday(day) ? 'today' : ''} ${!isSameMonth(day, currentDate) ? 'other-month' : ''}`}
                onClick={() => goToDay(day)}
                title={thoughts.length > 0 ? `${thoughts.length} entries` : undefined}
              >
                <span className="cal-day-num">{format(day, 'd')}</span>
                {thoughts.length > 0 && (
                  <div className="cal-dots-row">
                    {moodColor && <span className="cal-mood-dot" style={{ background: moodColor }} />}
                    <span className="cal-thought-count">{thoughts.length}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="cal-legend">
        {Object.entries(MOODS).map(([emoji, color]) => (
          <span key={emoji} className="legend-item">
            <span className="cal-mood-dot" style={{ background: color }} />
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
