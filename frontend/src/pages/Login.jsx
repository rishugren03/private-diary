import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.email, form.password, form.displayName);
      } else {
        await login(form.email, form.password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="bg-decoration" />

      {/* Left panel */}
      <div className="login-left">
        <div className="login-logo">
          <BookOpen size={28} />
          <span>Memoria</span>
        </div>
        <div className="login-hero">
          <h1 className="login-headline">
            Your private<br />
            <em>digital memory.</em>
          </h1>
          <p className="login-sub">
            Write freely. Your entries are encrypted in your browser before they ever reach our servers.
            Not even we can read what you write.
          </p>
          <div className="login-features">
            {[
              { icon: Lock, text: 'End-to-end encrypted with AES-256-GCM' },
              { icon: Sparkles, text: 'Client-side search — server never sees keywords' },
              { icon: BookOpen, text: 'Calendar, mood tracking & infinite history' },
            ].map(({ icon: Icon, text }) => (
              <div className="login-feature" key={text}>
                <Icon size={16} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="login-quote">
          <em>"The database administrator can dump the entire database and still learn absolutely nothing about what you wrote."</em>
        </p>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-card glass-card">
          <div className="login-card-header">
            <h2>{isRegister ? 'Create your diary' : 'Welcome back'}</h2>
            <p className="text-muted">
              {isRegister
                ? 'Your key is derived from your password. Keep it safe.'
                : 'Your encryption key will be derived from your password.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Name (optional)</label>
                <input
                  id="displayName"
                  className="form-input"
                  placeholder="What should we call you?"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Password
                {isRegister && <span className="form-label-hint"> — min 8 characters</span>}
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPass(!showPass)}
                  aria-label="Toggle password"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="spinner" /> : (isRegister ? 'Create diary' : 'Open my diary')}
            </button>
          </form>

          <div className="login-switch">
            <span>{isRegister ? 'Already have a diary?' : "Don't have one yet?"}</span>
            <button
              className="link-btn"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
            >
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </div>

          {isRegister && (
            <div className="login-warning">
              <Lock size={13} />
              <span>
                <strong>Important:</strong> If you forget your password, your diary cannot be recovered.
                Your password IS your decryption key.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
