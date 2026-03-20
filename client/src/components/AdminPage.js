import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import { ToastContext } from '../App';

export default function AdminPage() {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const showToast = useContext(ToastContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);

  // Categories state
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [showCatSection, setShowCatSection] = useState(false);

  useEffect(() => { fetchUsers(); fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const data = await api('/categories');
      setCategories(data.categories || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setCatLoading(true);
    try {
      const data = await api('/categories', { method: 'POST', body: { name: newCategory.trim() } });
      setCategories(cs => [...cs, data.category]);
      setNewCategory('');
      showToast(`Categorie "${data.category.name}" toegevoegd!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCatLoading(false);
    }
  };

  const deleteCategory = async (cat) => {
    if (!window.confirm(`Categorie "${cat.name}" verwijderen? Bestaande recepten behouden deze categorie nog wel.`)) return;
    try {
      await api(`/categories/${cat.id}`, { method: 'DELETE' });
      setCategories(cs => cs.filter(c => c.id !== cat.id));
      showToast('Categorie verwijderd', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

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

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      showToast('Nieuwe wachtwoorden komen niet overeen', 'error');
      return;
    }
    setPwLoading(true);
    try {
      await api('/auth/password', { method: 'PUT', body: { current_password: pwForm.current_password, new_password: pwForm.new_password } });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPwForm(false);
      showToast('Wachtwoord gewijzigd!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPwLoading(false);
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

  const toggleRole = async (user) => {
    const toRole = user.role === 'admin' ? 'gebruiker' : 'beheerder';
    if (!window.confirm(`"${user.username}" promoveren tot ${toRole}?`)) return;
    try {
      const data = await api(`/users/${user.id}/role`, { method: 'PUT' });
      setUsers(us => us.map(u => u.id === user.id ? data.user : u));
      showToast(`${user.username} is nu ${toRole}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const permanentDelete = async (user) => {
    if (!window.confirm(`"${user.username}" definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    try {
      await api(`/users/${user.id}/permanent`, { method: 'DELETE' });
      setUsers(us => us.filter(u => u.id !== user.id));
      showToast('Gebruiker definitief verwijderd', 'success');
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

  const btnSmall = (color, bg) => ({
    padding: '6px 12px',
    background: bg || `${color}15`,
    border: `1px solid ${color}40`,
    borderRadius: 8,
    color: color,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setShowCatSection(s => !s); setShowPwForm(false); setShowForm(false); }}
            style={{ padding: '9px 18px', background: showCatSection ? `${theme.primary}15` : theme.surfaceHover, border: `1px solid ${showCatSection ? theme.primary : theme.border}`, borderRadius: 10, color: showCatSection ? theme.primary : theme.text, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            🏷️ Categorieën
          </button>
          <button
            onClick={() => { setShowPwForm(s => !s); setShowForm(false); setShowCatSection(false); }}
            style={{ padding: '9px 18px', background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            🔑 Mijn wachtwoord
          </button>
          <button
            onClick={() => { setShowForm(s => !s); setShowPwForm(false); setShowCatSection(false); }}
            style={{ padding: '9px 18px', background: theme.primary, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            + Nieuwe gebruiker
          </button>
        </div>
      </div>

      {/* Categories management */}
      {showCatSection && (
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, padding: 20, marginBottom: 20, animation: 'slideDown 0.2s ease' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>Categorieën beheren</h3>
          <p style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>Categorieën die beschikbaar zijn bij het aanmaken van recepten.</p>

          {/* Add new category */}
          <form onSubmit={addCategory} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Nieuwe categorie naam..."
            />
            <button
              type="submit"
              disabled={catLoading || !newCategory.trim()}
              style={{ padding: '10px 18px', background: theme.primary, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: catLoading || !newCategory.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: !newCategory.trim() ? 0.5 : 1 }}
            >
              + Toevoegen
            </button>
          </form>

          {/* Category list */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(cat => (
              <div key={cat.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: theme.surfaceHover,
                border: `1px solid ${theme.border}`,
                borderRadius: 20,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 500,
                color: theme.text,
              }}>
                <span>{cat.name}</span>
                <button
                  onClick={() => deleteCategory(cat)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, fontSize: 16, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center' }}
                  title="Verwijderen"
                >×</button>
              </div>
            ))}
            {categories.length === 0 && (
              <p style={{ fontSize: 13, color: theme.textSecondary }}>Geen categorieën gevonden.</p>
            )}
          </div>
        </div>
      )}

      {/* Change own password form */}
      {showPwForm && (
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, padding: 20, marginBottom: 20, animation: 'slideDown 0.2s ease' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>Wachtwoord wijzigen</h3>
          <p style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>Wijzig het wachtwoord van <strong>{currentUser?.username}</strong></p>
          <form onSubmit={changePassword}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Huidig wachtwoord *</label>
                <input style={inputStyle} type="password" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} placeholder="••••••••" required />
              </div>
              <div>
                <label style={labelStyle}>Nieuw wachtwoord *</label>
                <input style={inputStyle} type="password" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} placeholder="min. 6 tekens" required />
              </div>
              <div>
                <label style={labelStyle}>Bevestig nieuw wachtwoord *</label>
                <input
                  style={{ ...inputStyle, borderColor: pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password ? theme.danger : theme.border }}
                  type="password"
                  value={pwForm.confirm_password}
                  onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                  placeholder="herhaal nieuw wachtwoord"
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowPwForm(false)} style={{ padding: '9px 16px', background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Annuleren</button>
              <button type="submit" disabled={pwLoading} style={{ padding: '9px 16px', background: theme.primary, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: pwLoading ? 'not-allowed' : 'pointer' }}>
                {pwLoading ? 'Bezig...' : 'Wachtwoord opslaan'}
              </button>
            </div>
          </form>
        </div>
      )}

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
                  {user.id === currentUser?.id && (
                    <span style={{ marginLeft: 6, fontSize: 11, background: `${theme.primary}20`, color: theme.primary, padding: '1px 6px', borderRadius: 20, fontWeight: 500, textDecoration: 'none' }}>Jij</span>
                  )}
                  {user.deleted_at && (
                    <span style={{ marginLeft: 6, fontSize: 11, background: `${theme.danger}20`, color: theme.danger, padding: '1px 6px', borderRadius: 20, fontWeight: 500, textDecoration: 'none' }}>Verwijderd</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                  {user.email && <span>{user.email} · </span>}
                  <span style={{ color: user.role === 'admin' ? theme.primary : theme.textSecondary, fontWeight: user.role === 'admin' ? 600 : 400 }}>
                    {user.role === 'admin' ? 'Beheerder' : 'Gebruiker'}
                  </span>
                  <span> · Aangemaakt: {formatDate(user.created_at)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                {user.deleted_at ? (
                  <>
                    <button onClick={() => restoreUser(user)} style={btnSmall(theme.success)}>
                      Herstellen
                    </button>
                    <button onClick={() => permanentDelete(user)} style={btnSmall(theme.danger)}>
                      Definitief verwijderen
                    </button>
                  </>
                ) : (
                  <>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => toggleRole(user)}
                        title={user.role === 'admin' ? 'Degraderen naar gebruiker' : 'Promoveren tot beheerder'}
                        style={btnSmall(user.role === 'admin' ? theme.textSecondary : theme.primary)}
                      >
                        {user.role === 'admin' ? '👤 Degraderen' : '👑 Promoveren'}
                      </button>
                    )}
                    {user.id !== currentUser?.id && (
                      <button onClick={() => deleteUser(user)} style={btnSmall(theme.danger)}>
                        Verwijderen
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
