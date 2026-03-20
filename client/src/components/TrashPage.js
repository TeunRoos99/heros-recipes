import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import { ToastContext } from '../App';

export default function TrashPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const showToast = useContext(ToastContext);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTrash(); }, []);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const data = await api('/recipes/trash');
      setRecipes(data.recipes);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const restore = async (recipe) => {
    try {
      await api(`/recipes/${recipe.id}/restore`, { method: 'POST' });
      setRecipes(rs => rs.filter(r => r.id !== recipe.id));
      showToast('Recept hersteld!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const permanentDelete = async (recipe) => {
    if (!window.confirm(`"${recipe.title}" definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
    try {
      await api(`/recipes/${recipe.id}/permanent`, { method: 'DELETE' });
      setRecipes(rs => rs.filter(r => r.id !== recipe.id));
      showToast('Recept definitief verwijderd', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>🗑</span>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text }}>Prullenbak</h1>
          <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
            Verwijderde recepten kunnen hier worden hersteld.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: theme.textSecondary }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          Laden...
        </div>
      ) : recipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: theme.surface, borderRadius: 14, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: theme.text, marginBottom: 6 }}>Prullenbak is leeg</div>
          <div style={{ fontSize: 14, color: theme.textSecondary }}>Verwijderde recepten verschijnen hier</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recipes.map(recipe => (
            <div key={recipe.id} style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: theme.text }}>{recipe.title}</div>
                <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 3 }}>
                  {recipe.category && <span>{recipe.category} · </span>}
                  door {recipe.author}
                  {recipe.deleted_at && <span> · Verwijderd op {formatDate(recipe.deleted_at)}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => restore(recipe)}
                  style={{ padding: '7px 14px', background: `${theme.success}15`, border: `1px solid ${theme.success}40`, borderRadius: 8, color: theme.success, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Herstellen
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => permanentDelete(recipe)}
                    style={{ padding: '7px 14px', background: `${theme.danger}15`, border: `1px solid ${theme.danger}40`, borderRadius: 8, color: theme.danger, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Definitief verwijderen
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
