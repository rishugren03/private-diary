import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../contexts/DiaryContext';
import { useTheme } from '../contexts/ThemeContext';
import { getAllEntriesLocal } from '../lib/localDb';
import { format, parseISO } from 'date-fns';
import { User, Download, LogOut, Shield, Sun, Moon, Clock, Palette } from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const { user, logout } = useAuth();
  const { entries } = useDiary();
  const { mode, setMode, activeTheme } = useTheme();
  const [exporting, setExporting] = useState(false);

  const entryCount = Object.keys(entries).length;

  const exportJSON = async () => {
    setExporting(true);
    const all = await getAllEntriesLocal();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `memoria-export-${format(new Date(), 'yyyy-MM-dd')}.json`);
    setExporting(false);
  };

  const exportMarkdown = async () => {
    setExporting(true);
    const all = await getAllEntriesLocal();
    all.sort((a, b) => a.date.localeCompare(b.date));
    let md = `# My Diary\nExported on ${format(new Date(), 'MMMM d, yyyy')}\n\n---\n\n`;
    for (const e of all) {
      let dateStr = e.date;
      try { dateStr = format(parseISO(e.date), 'MMMM d, yyyy'); } catch {}
      md += `## ${dateStr}\n`;
      if (e.mood) md += `**Mood:** ${e.mood}\n\n`;
      if (e.tags?.length) md += `**Tags:** ${e.tags.map(t => `#${t}`).join(' ')}\n\n`;
      md += `${e.text || ''}\n\n---\n\n`;
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    downloadBlob(blob, `memoria-export-${format(new Date(), 'yyyy-MM-dd')}.md`);
    setExporting(false);
  };

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="settings-page">
      <h1 className="settings-title">Settings</h1>

      <section className="settings-section glass-card">
        <div className="settings-section-header">
          <Palette size={18} />
          <h2>Appearance & Theme</h2>
        </div>
        <p className="settings-export-note">
          Automatically adjusts theme based on time of day (6 AM – 6 PM: Light Parchment, 6 PM – 6 AM: Night Espresso).
        </p>
        <div className="theme-options">
          <button
            className={`theme-option-btn ${mode === 'auto' ? 'active' : ''}`}
            onClick={() => setMode('auto')}
          >
            <Clock size={16} />
            <div className="theme-option-text">
              <span className="theme-option-title">Auto Day/Night</span>
              <span className="theme-option-desc">Current: {activeTheme === 'dark' ? 'Night Mode' : 'Day Mode'}</span>
            </div>
          </button>

          <button
            className={`theme-option-btn ${mode === 'light' ? 'active' : ''}`}
            onClick={() => setMode('light')}
          >
            <Sun size={16} />
            <div className="theme-option-text">
              <span className="theme-option-title">Vintage Paper</span>
              <span className="theme-option-desc">Light Sepia</span>
            </div>
          </button>

          <button
            className={`theme-option-btn ${mode === 'dark' ? 'active' : ''}`}
            onClick={() => setMode('dark')}
          >
            <Moon size={16} />
            <div className="theme-option-text">
              <span className="theme-option-title">Espresso Night</span>
              <span className="theme-option-desc">Dark Amber</span>
            </div>
          </button>
        </div>
      </section>

      <section className="settings-section glass-card">
        <div className="settings-section-header">
          <User size={18} />
          <h2>Account</h2>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Email</div>
            <div className="settings-value">{user?.email}</div>
          </div>
        </div>
        {user?.displayName && (
          <div className="settings-row">
            <div>
              <div className="settings-label">Name</div>
              <div className="settings-value">{user.displayName}</div>
            </div>
          </div>
        )}
        <div className="settings-row">
          <div>
            <div className="settings-label">Total entries</div>
            <div className="settings-value">{entryCount}</div>
          </div>
        </div>
      </section>

      <section className="settings-section glass-card">
        <div className="settings-section-header">
          <Shield size={18} />
          <h2>Privacy</h2>
        </div>
        <div className="settings-privacy-note">
          Your diary entries are encrypted with AES-256-GCM before leaving your browser.
          Your encryption key is derived from your password using PBKDF2 (310,000 iterations).
          The server stores only ciphertext — it cannot read your entries.
        </div>
      </section>

      <section className="settings-section glass-card">
        <div className="settings-section-header">
          <Download size={18} />
          <h2>Export your data</h2>
        </div>
        <p className="settings-export-note">
          Your data is decrypted locally and downloaded directly to your device.
        </p>
        <div className="settings-export-buttons">
          <button className="btn btn-ghost" onClick={exportJSON} disabled={exporting}>
            Export as JSON
          </button>
          <button className="btn btn-ghost" onClick={exportMarkdown} disabled={exporting}>
            Export as Markdown
          </button>
        </div>
      </section>

      <section className="settings-section glass-card">
        <div className="settings-section-header">
          <LogOut size={18} />
          <h2>Sign out</h2>
        </div>
        <p className="settings-export-note">
          Signing out clears your local decrypted cache. Your encrypted entries remain on the server.
        </p>
        <button className="btn btn-danger" onClick={logout}>
          <LogOut size={15} />
          Sign out
        </button>
      </section>
    </div>
  );
}
