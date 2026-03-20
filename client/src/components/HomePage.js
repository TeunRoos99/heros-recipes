import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import { ToastContext } from '../App';
import RecipeCard from './RecipeCard';
import RecipeForm from './RecipeForm';
import RecipeDetail from './RecipeDetail';

const CATEGORIES = ['Ontbijt', 'Lunch', 'Diner', 'Snack', 'Dessert', 'Drank', 'Overig'];

export default function HomePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const showToast = useContext(ToastContext);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [myOnly, setMyOnly] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editRecipe, setEditRecipe] = useState(null);
  const [viewRecipe, setViewRecipe] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showExportImport, setShowExportImport] = useState(false);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (tagFilter) params.set('tag', tagFilter);
      if (myOnly) params.set('my', 'true');
      const data = await api(`/recipes?${params.toString()}`);
      setRecipes(data.recipes);
      // Collect all unique tags
      const tags = new Set();
      data.recipes.forEach(r => r.tags?.forEach(t => tags.add(t)));
      setAllTags([...tags].sort());
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, category, tagFilter, myOnly, showToast]);

  useEffect(() => {
    const timer = setTimeout(fetchRecipes, 300);
    return () => clearTimeout(timer);
  }, [fetchRecipes]);

  const handleDelete = async (recipe) => {
    if (!window.confirm(`"${recipe.title}" naar de prullenbak?`)) return;
    try {
      await api(`/recipes/${recipe.id}`, { method: 'DELETE' });
      showToast('Recept verwijderd', 'success');
      setViewRecipe(null);
      fetchRecipes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleExport = async () => {
    try {
      const data = await api('/recipes/export', { method: 'POST' });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heros-recipes-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Recepten geëxporteerd!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importText);
      const recipes = parsed.recipes || parsed;
      if (!Array.isArray(recipes)) throw new Error('Ongeldig formaat');
      const data = await api('/recipes/import', { method: 'POST', body: { recipes } });
      showToast(data.message, 'success');
      setImportText('');
      setShowExportImport(false);
      fetchRecipes();
    } catch (err) {
      showToast(err.message === 'Ongeldig formaat' ? err.message : 'Ongeldige JSON', 'error');
    }
  };

  const inputStyle = {
    padding: '10px 14px',
    borderRadius: 10,
    border: `1.5px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    fontSize: 16,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  };

  const gridCols = isMobile ? '1fr' : window.innerWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px' : '24px 24px' }}>
      {/* Search bar */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textSecondary, pointerEvents: 'none' }}>🔍</span>
        <input
          style={{ ...inputStyle, width: '100%', paddingLeft: 42 }}
          placeholder="Zoek recepten..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          style={{ ...inputStyle, padding: '8px 12px' }}
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">Alle categorieën</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={() => setMyOnly(m => !m)}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: `1.5px solid ${myOnly ? theme.primary : theme.border}`,
            background: myOnly ? `${theme.primary}15` : theme.surface,
            color: myOnly ? theme.primary : theme.text,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {myOnly ? '✓ Mijn recepten' : 'Mijn recepten'}
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setShowExportImport(s => !s)}
          style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${theme.border}`, background: theme.surface, color: theme.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Import / Export
        </button>
      </div>

      {/* Tag pills */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {allTags.map(t => (
            <span
              key={t}
              onClick={() => setTagFilter(tf => tf === t ? '' : t)}
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                border: `1px solid ${tagFilter === t ? theme.primary : theme.border}`,
                background: tagFilter === t ? `${theme.primary}15` : theme.surface,
                color: tagFilter === t ? theme.primary : theme.textSecondary,
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Export/Import panel */}
      {showExportImport && (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 20, animation: 'slideDown 0.2s ease' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button onClick={handleExport} style={{ padding: '9px 16px', background: theme.primary, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Exporteer als JSON
            </button>
            <span style={{ fontSize: 13, color: theme.textSecondary, alignSelf: 'center' }}>of importeer:</span>
          </div>
          <textarea
            style={{ ...inputStyle, width: '100%', minHeight: 100, resize: 'vertical', fontSize: 12 }}
            placeholder='Plak geëxporteerde JSON hier...'
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleImport} disabled={!importText.trim()} style={{ padding: '8px 16px', background: theme.success, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: importText.trim() ? 'pointer' : 'not-allowed' }}>
              Importeer
            </button>
            <button onClick={() => { setShowExportImport(false); setImportText(''); }} style={{ padding: '8px 16px', background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Sluiten
            </button>
          </div>
        </div>
      )}

      {/* Recipe grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: theme.textSecondary }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div>Recepten laden...</div>
        </div>
      ) : recipes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: theme.textSecondary }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍽</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: theme.text, marginBottom: 8 }}>Geen recepten gevonden</div>
          <div style={{ fontSize: 14 }}>Voeg je eerste recept toe via de + knop</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 16 }}>
          {recipes.map(r => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onClick={setViewRecipe}
              onEdit={(r) => { setEditRecipe(r); setShowForm(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Floating add button */}
      <button
        onClick={() => { setEditRecipe(null); setShowForm(true); }}
        style={{
          position: 'fixed',
          bottom: isMobile ? 20 : 28,
          right: isMobile ? 16 : 28,
          width: 56, height: 56,
          borderRadius: '50%',
          background: theme.primary,
          border: 'none',
          color: '#fff',
          fontSize: 28,
          cursor: 'pointer',
          boxShadow: `0 4px 16px ${theme.primary}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          zIndex: 500,
        }}
        title="Recept toevoegen"
      >
        +
      </button>

      {/* Modals */}
      {showForm && (
        <RecipeForm
          recipe={editRecipe}
          onClose={() => { setShowForm(false); setEditRecipe(null); }}
          onSave={() => { setShowForm(false); setEditRecipe(null); fetchRecipes(); }}
        />
      )}

      {viewRecipe && (
        <RecipeDetail
          recipe={viewRecipe}
          onClose={() => setViewRecipe(null)}
          onEdit={(r) => { setViewRecipe(null); setEditRecipe(r); setShowForm(true); }}
          onDelete={(r) => { setViewRecipe(null); handleDelete(r); }}
        />
      )}
    </div>
  );
}
