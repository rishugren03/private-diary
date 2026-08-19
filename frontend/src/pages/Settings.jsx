import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../contexts/DiaryContext';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';
import { User, Download, LogOut, Shield, Sun, Moon, Clock, Palette, KeyRound, Trash2, AlertTriangle } from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const { user, logout, changePassword, deleteAccount } = useAuth();
  const { entries } = useDiary();
  const { mode, setMode, activeTheme } = useTheme();
  const [exporting, setExporting] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const entryCount = Object.keys(entries).length;

  const exportJSON = async () => {
    setExporting(true);
    const all = Object.values(entries);
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `memoria-export-${format(new Date(), 'yyyy-MM-dd')}.json`);
    setExporting(false);
  };

  const exportMarkdown = async () => {
    setExporting(true);
    const all = Object.values(entries);
    all.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    let md = `# My Diary\nExported on ${format(new Date(), 'MMMM d, yyyy')}\n\n---\n\n`;
    for (const e of all) {
      md += `## ${e.date}\n`;
      if (e.thoughts) {
        for (const t of e.thoughts) {
          if (t.time) md += `### ${t.time}\n`;
          if (t.mood) md += `**Mood:** ${t.mood}\n\n`;
          if (t.tags?.length) md += `**Tags:** ${t.tags.map(tag => `#${tag}`).join(' ')}\n\n`;
          md += `${t.text || ''}\n\n`;
        }
      }
      md += `---\n\n`;
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.oldPassword === pwForm.newPassword) {
      setPwError('New password must be different from the current password.');
      return;
    }

    setPwLoading(true);
    try {
      await changePassword(pwForm.oldPassword, pwForm.newPassword, entries);
      setPwSuccess('Password changed successfully! All entries re-encrypted with new key.');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
    } catch (err) {
      setPwError(err.response?.data?.error || err.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
    } catch (err) {
      console.error('Delete account error:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

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
          Your password is hashed client-side before authentication — the server never sees your raw password.
          Decrypted entries exist only in memory and are never written to disk.
        </div>
      </section>

      {/* Password Change Section */}
      <section className="settings-section glass-card">
        <div className="settings-section-header">
          <KeyRound size={18} />
          <h2>Change Password</h2>
        </div>
        <p className="settings-export-note">
          Changing your password will re-encrypt all diary entries with a new key derived from the new password.
          This is an atomic operation — either all entries are re-encrypted or none are.
        </p>

        {pwSuccess && <div className="settings-success">{pwSuccess}</div>}

        {!showPasswordChange ? (
          <button className="btn btn-ghost" onClick={() => setShowPasswordChange(true)}>
            Change password
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="settings-pw-form">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter current password"
                value={pwForm.oldPassword}
                onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password <span className="form-label-hint">— min 8 characters</span></label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter new password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Confirm new password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                required
                minLength={8}
              />
            </div>

            {pwError && <div className="form-error">{pwError}</div>}

            <div className="settings-pw-actions">
              <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                {pwLoading ? <span className="spinner" /> : 'Change Password & Re-encrypt'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowPasswordChange(false); setPwError(''); }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="settings-section glass-card">
        <div className="settings-section-header">
          <Download size={18} />
          <h2>Export your data</h2>
        </div>
        <p className="settings-export-note">
          Your data is decrypted in memory and downloaded directly to your device. Nothing is stored on disk.
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
          Signing out clears your in-memory decrypted data. Your encrypted entries remain on the server.
        </p>
        <button className="btn btn-danger" onClick={logout}>
          <LogOut size={15} />
          Sign out
        </button>
      </section>

      {/* Delete Account Section */}
      <section className="settings-section glass-card settings-danger-zone">
        <div className="settings-section-header">
          <Trash2 size={18} />
          <h2>Delete Account</h2>
        </div>
        <p className="settings-export-note">
          This will permanently delete your account and all diary entries from the server. This action cannot be undone.
          We recommend exporting your data first.
        </p>

        {!showDeleteConfirm ? (
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={15} />
            Delete my account
          </button>
        ) : (
          <div className="settings-delete-confirm">
            <div className="settings-delete-warning">
              <AlertTriangle size={18} />
              <span>Type <strong>DELETE</strong> to confirm permanent account deletion.</span>
            </div>
            <input
              type="text"
              className="form-input"
              placeholder='Type "DELETE" to confirm'
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            <div className="settings-pw-actions">
              <button
                className="btn btn-danger"
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                onClick={handleDeleteAccount}
              >
                {deleteLoading ? <span className="spinner" /> : 'Permanently Delete Everything'}
              </button>
              <button className="btn btn-ghost" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
