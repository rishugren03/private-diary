import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, KeyRound } from 'lucide-react';
import './UnlockModal.css';

export default function UnlockModal() {
  const { user, unlock, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password) return;
    setError('');
    setLoading(true);
    try {
      await unlock(password);
    } catch (err) {
      console.error(err);
      if (err?.message?.includes('Session expired')) {
        setError(err.message);
      } else {
        setError('Incorrect password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unlock-overlay">
      <div className="unlock-card glass-card fade-in">
        <div className="unlock-icon-badge">
          <Lock size={28} />
        </div>
        <h2 className="unlock-title">Unlock Your Diary</h2>
        <p className="unlock-sub">
          Welcome back, <strong>{user?.displayName || user?.email}</strong>! Enter your password to derive your zero-knowledge encryption key.
        </p>

        {error && <div className="unlock-error">{error}</div>}

        <form onSubmit={handleUnlock} className="unlock-form">
          <div className="form-group">
            <label className="form-label">Master Password</label>
            <div className="unlock-input-wrapper">
              <KeyRound size={16} className="unlock-input-icon" />
              <input
                type="password"
                className="form-input unlock-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary unlock-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Unlock Diary'}
          </button>
        </form>

        <button className="unlock-logout-btn" onClick={logout}>
          Sign out instead
        </button>
      </div>
    </div>
  );
}
