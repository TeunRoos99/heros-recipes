import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api';
import { ToastContext } from '../App';

export default function AdminPage() {
  const { theme } = useTheme();
  const showToast = useContext(ToastContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api('/users');
      setUsers(data.users);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { showToast('Gebruikersnaam en wachtwoord zijn verplicht', 'error'); return; }
    setCreating(true);
    try {
      const data = await api('/users', { method: 'POST', body: form });
      setUsers(us => [data.user, ...us]);
      setForm({ username: '', email: '', password: '', role: 'user' });
      setShowForm(false);
      showToast('Gebruiker aangemaakt!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Gebruiker "${user.username}" verwijderen?`)) return;
    try {
      await api(`/users/${user.id}`, { method: 'DELETE' });
      setUsers(us => us.map(u => u.id === user.id ? { ...u, deleted_at: new Date().toISOString() } : u));
      showToast('Gebruiker verwijderd', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const restoreUser = async (user) => {
    try {
      await api(`/users/${user.id}/restore`, { method: 'POST' });
      setUsers(us => us.map(u => u.id === user.id ? { ...u, deleted_at: null } : u));
      showToast('Gebruiker hersteld!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1.5px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontSize: 16,
    outline: 'none',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: theme.textSecondary,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>⚙️</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text }}>Beheer</h1>
            <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>Gebruikersbeheer</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ padding: '9px 18px', background: theme.primary, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          + Nieuwe gebruiker
        </button>
      </div>

      {/* Create user form */}
      {showForm && (
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, padding: 20, marginBottom: 20, animation: 'slideDown 0.2s ease' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Nieuwe gebruiker aanmaken</h3>
          <form onSubmit={createUser}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Gebruikersnaam *</label>
                <input style={inputStyle} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="gebruikersnaam" required />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@voorbeeld.nl" />
              </div>
              <div>
                <label style={labelStyle}>Wachtwoord *</label>
                <input style={inputStyle} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="wachtwoord" required />
              </div>
              <div>
                <label style={labelStyle}>Rol</label>
                <select style={inputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="user">Gebruiker</option>
                  <option value="admin">Beheerder</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Annuleren</button>
              <button type="submit" disabled={creating} style={{ padding: '9px 16px', background: theme.primary, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer' }}>
                {creating ? 'Bezig...' : 'Gebruiker aanmaken'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: theme.textSecondary }}>Laden...</div>
      ) : (
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, fontWeight: 700, fontSize: 13, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {users.length} gebruikers
          </div>
          {users.map((user, i) => (
            <div key={user.id} style={{
              padding: '14px 16px',
              borderBottom: i < users.length - 1 ? `1px solid ${theme.border}` : 'none',
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              background: user.deleted_at ? `${theme.danger}05` : 'transparent',
            }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: user.role === 'admin' ? `${theme.primary}20` : theme.surfaceHover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {user.role === 'admin' ? '👑' : '👤'}
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: user.deleted_at ? theme.textSecondary : theme.text, textDecoration: user.deleted_at ? 'line-through' : 'none' }}>
                  {user.username}
                  {user.deleted_at && <span style={{ marginLeft: 6, fontSize: 11, background: `${theme.danger}20`, color: theme.danger, padding: '1px 6px', borderRadius: 20, fontWeight: 500, textDecoration: 'none' }}>Verwijderd</span>}
                </div>
                <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                  {user.email && <span>{user.email} · </span>}
                  <span style={{ color: user.role === 'admin' ? theme.primary : theme.textSecondary, fontWeight: user.role === 'admin' ? 600 : 400 }}>
                    {user.role === 'admin' ? 'Beheerder' : 'Gebruiker'}
                  </span>
                  <span> · Aangemaakt: {formatDate(user.created_at)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {user.deleted_at ? (
                  <button
                    onClick={() => restoreUser(user)}
                    style={{ padding: '6px 12px', background: `${theme.success}15`, border: `1px solid ${theme.success}40`, borderRadius: 8, color: theme.success, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Herstellen
                  </button>
                ) : (
                  <button
                    onClick={() => deleteUser(user)}
                    style={{ padding: '6px 12px', background: `${theme.danger}15`, border: `1px solid ${theme.danger}40`, borderRadius: 8, color: theme.danger, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Verwijderen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
