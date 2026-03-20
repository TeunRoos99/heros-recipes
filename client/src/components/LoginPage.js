import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

export default function LoginPage() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { username: form.username, password: form.password }
        : { username: form.username, email: form.email, password: form.password };
      const data = await api(path, { method: 'POST', body });
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1.5px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: theme.surface,
        borderRadius: 16,
        padding: 36,
        width: '100%',
        maxWidth: 420,
        boxShadow: theme.shadowLg,
        border: `1px solid ${theme.border}`,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🍳</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
            Hero's Recipes
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: 14 }}>
            {mode === 'login' ? 'Welkom terug! Log in om door te gaan.' : 'Maak een account aan.'}
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', background: theme.bg, borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.15s',
                background: mode === m ? theme.surface : 'transparent',
                color: mode === m ? theme.primary : theme.textSecondary,
                boxShadow: mode === m ? theme.shadow : 'none',
              }}
            >
              {m === 'login' ? 'Inloggen' : 'Registreren'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 6 }}>
                Gebruikersnaam
              </label>
              <input
                style={inputStyle}
                type="text"
                placeholder="gebruikersnaam"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                autoFocus
              />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 6 }}>
                  E-mail (optioneel)
                </label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="jouw@email.nl"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 6 }}>
                Wachtwoord
              </label>
              <input
                style={inputStyle}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <div style={{
                background: `${theme.danger}20`,
                border: `1px solid ${theme.danger}50`,
                borderRadius: 8,
                padding: '10px 12px',
                color: theme.danger,
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? theme.border : theme.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                marginTop: 4,
              }}
            >
              {loading ? 'Bezig...' : mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
            </button>
          </div>
        </form>

        {mode === 'login' && (
          <p style={{ textAlign: 'center', fontSize: 12, color: theme.textSecondary, marginTop: 20 }}>
            Standaard admin: <strong>admin</strong> / <strong>admin123</strong>
          </p>
        )}
      </div>
    </div>
  );
}
