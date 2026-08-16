import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../contexts/DiaryContext';
import { BookOpen, CalendarDays, Search, Settings, LogOut, PenLine } from 'lucide-react';
import { format } from 'date-fns';
import './Sidebar.css';

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { entries } = useDiary();
  const navigate = useNavigate();

  // "On this day" — thoughts from same month-day in previous years
  const todayMMDD = TODAY.slice(5);
  const pastThoughts = [];

  Object.values(entries).forEach((e) => {
    if (e.date !== TODAY && e.date?.slice(5) === todayMMDD) {
      const yr = e.date.slice(0, 4);
      (e.thoughts || []).forEach((t) => {
        pastThoughts.push({ date: e.date, year: yr, ...t });
      });
    }
  });

  pastThoughts.sort((a, b) => b.date.localeCompare(a.date));
  const onThisDay = pastThoughts.slice(0, 2);

  const navItems = [
    { to: '/', icon: PenLine, label: "Today's Stream", end: true },
    { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <BookOpen size={22} />
        <span>Memoria</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {onThisDay.length > 0 && (
        <div className="on-this-day">
          <div className="otd-title">On this day…</div>
          {onThisDay.map((t) => (
            <div
              key={`${t.date}-${t.id}`}
              className="otd-card"
              onClick={() => navigate(`/entry/${t.date}`)}
            >
              <span className="otd-year">{t.year} • {t.time}</span>
              <p className="otd-preview">{t.text?.slice(0, 80)}{t.text?.length > 80 ? '…' : ''}</p>
              {t.mood && <span className="otd-mood">{t.mood}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.displayName || 'You'}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
