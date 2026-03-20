import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import { ToastContext } from '../App';

export default function RecipeDetail({ recipe: initialRecipe, onClose, onEdit, onDelete }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const showToast = useContext(ToastContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [recipe, setRecipe] = useState(initialRecipe);
  const [scaledServings, setScaledServings] = useState(initialRecipe.servings || 1);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState('');
  const [newListName, setNewListName] = useState('');
  const [shoppingMultiplier, setShoppingMultiplier] = useState(1);
  const [addingToList, setAddingToList] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Fetch full recipe
    api(`/recipes/${initialRecipe.id}`).then(d => {
      setRecipe(d.recipe);
      setScaledServings(d.recipe.servings || 1);
    }).catch(() => {});
  }, [initialRecipe.id]);

  const isOwner = user && (user.id === recipe.user_id || user.role === 'admin');
  const baseServings = recipe.servings || 1;
  const scale = scaledServings / baseServings;

  const scaleAmount = (amount) => {
    if (!amount) return '';
    const scaled = amount * scale;
    if (Number.isInteger(scaled)) return scaled.toString();
    return parseFloat(scaled.toFixed(2)).toString();
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/recipes/${recipe.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link gekopieerd!', 'success');
    } catch {
      showToast('Kon link niet kopiëren', 'error');
    }
  };

  const openShoppingModal = async () => {
    try {
      const data = await api('/shopping/lists');
      setLists(data.lists);
      setSelectedList(data.lists[0]?.id || '');
    } catch {}
    setShowShoppingModal(true);
  };

  const addToShoppingList = async () => {
    if (!selectedList && !newListName.trim()) {
      showToast('Selecteer een lijst of maak een nieuwe aan', 'error'); return;
    }
    setAddingToList(true);
    try {
      let listId = selectedList;
      if (!selectedList && newListName.trim()) {
        const d = await api('/shopping/lists', { method: 'POST', body: { name: newListName.trim() } });
        listId = d.list.id;
      }
      const data = await api(`/shopping/lists/${listId}/add-recipe`, {
        method: 'POST',
        body: { recipe_id: recipe.id, servings_multiplier: shoppingMultiplier },
      });
      showToast(`${data.added} ingrediënten toegevoegd aan boodschappenlijst!`, 'success');
      setShowShoppingModal(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAddingToList(false);
    }
  };

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 2000,
    ...(isMobile ? { background: theme.bg, overflow: 'auto', display: 'flex', flexDirection: 'column' } : {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      background: 'rgba(0,0,0,0.5)',
    }),
  };

  const panelStyle = isMobile ? {
    flex: 1, background: theme.bg, overflow: 'auto',
  } : {
    background: theme.surface,
    borderRadius: 16,
    width: '100%', maxWidth: 700,
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: theme.shadowLg,
    border: `1px solid ${theme.border}`,
  };

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: 8,
    border: `1.5px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontSize: 16,
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <>
      <div style={overlayStyle} onClick={isMobile ? undefined : (e) => e.target === e.currentTarget && onClose()}>
        <div style={panelStyle}>
          {/* Header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: isMobile ? theme.bg : theme.surface,
            borderBottom: `1px solid ${theme.border}`,
            padding: '16px 20px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>{recipe.title}</h1>
              <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                door {recipe.author}
                {recipe.category && <span> · {recipe.category}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 22, color: theme.textSecondary, padding: 4, lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>

          <div style={{ padding: 20 }}>
            {/* Meta */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              {recipe.prep_time && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: theme.surfaceHover, borderRadius: 10, padding: '8px 14px', minWidth: 80 }}>
                  <span style={{ fontSize: 18 }}>🥄</span>
                  <span style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 600, marginTop: 2 }}>VOORBEREIDING</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{recipe.prep_time} min</span>
                </div>
              )}
              {recipe.cook_time && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: theme.surfaceHover, borderRadius: 10, padding: '8px 14px', minWidth: 80 }}>
                  <span style={{ fontSize: 18 }}>🔥</span>
                  <span style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 600, marginTop: 2 }}>KOOKTIJD</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{recipe.cook_time} min</span>
                </div>
              )}
              {totalTime > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: theme.surfaceHover, borderRadius: 10, padding: '8px 14px', minWidth: 80 }}>
                  <span style={{ fontSize: 18 }}>⏱</span>
                  <span style={{ fontSize: 11, color: theme.textSecondary, fontWeight: 600, marginTop: 2 }}>TOTAAL</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{totalTime} min</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {recipe.tags.map(t => (
                  <span key={t} style={{ background: `${theme.primary}15`, color: theme.primary, border: `1px solid ${theme.primary}30`, borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>#{t}</span>
                ))}
              </div>
            )}

            {/* Description */}
            {recipe.description && (
              <p style={{ color: theme.textSecondary, fontSize: 15, lineHeight: 1.6, marginBottom: 20, padding: 14, background: theme.surfaceHover, borderRadius: 10, borderLeft: `3px solid ${theme.primary}` }}>
                {recipe.description}
              </p>
            )}

            {/* Portion scaling */}
            <div style={{ background: theme.surfaceHover, borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>Porties:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setScaledServings(s => Math.max(1, s - 1))}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                >−</button>
                <span style={{ fontSize: 18, fontWeight: 700, color: theme.primary, minWidth: 28, textAlign: 'center' }}>{scaledServings}</span>
                <button
                  onClick={() => setScaledServings(s => s + 1)}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                >+</button>
              </div>
              {scale !== 1 && (
                <span style={{ fontSize: 12, color: theme.textSecondary }}>
                  (origineel: {baseServings} {baseServings === 1 ? 'portie' : 'porties'})
                </span>
              )}
            </div>

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🛒</span> Ingrediënten
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recipe.ingredients.map(ing => (
                    <label key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: checkedIngredients[ing.id] ? `${theme.success}10` : theme.surfaceHover, cursor: 'pointer', transition: 'background 0.15s' }}>
                      <input
                        type="checkbox"
                        checked={!!checkedIngredients[ing.id]}
                        onChange={() => setCheckedIngredients(c => ({ ...c, [ing.id]: !c[ing.id] }))}
                        style={{ width: 16, height: 16, accentColor: theme.success, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 14, color: checkedIngredients[ing.id] ? theme.textSecondary : theme.text, textDecoration: checkedIngredients[ing.id] ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                        {scaleAmount(ing.amount) && <strong>{scaleAmount(ing.amount)} {ing.unit} </strong>}
                        {ing.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Steps */}
            {recipe.steps && recipe.steps.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📋</span> Bereidingswijze
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recipe.steps.map((step, i) => (
                    <div key={step.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: theme.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: 15, color: theme.text, lineHeight: 1.6, flex: 1, paddingTop: 4 }}>{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
              <button
                onClick={openShoppingModal}
                style={{ flex: 1, minWidth: 140, padding: '10px 16px', background: `${theme.success}15`, border: `1px solid ${theme.success}40`, borderRadius: 10, color: theme.success, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                🛒 Naar boodschappenlijst
              </button>
              {recipe.is_public && (
                <button
                  onClick={handleShare}
                  style={{ flex: 1, minWidth: 120, padding: '10px 16px', background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  🔗 Link kopiëren
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={() => onEdit(recipe)}
                    style={{ flex: 1, minWidth: 100, padding: '10px 16px', background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Bewerken
                  </button>
                  <button
                    onClick={() => onDelete(recipe)}
                    style={{ flex: 1, minWidth: 110, padding: '10px 16px', background: `${theme.danger}15`, border: `1px solid ${theme.danger}40`, borderRadius: 10, color: theme.danger, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Verwijderen
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shopping list modal */}
      {showShoppingModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.6)' }}>
          <div style={{ background: theme.surface, borderRadius: 14, padding: 24, width: '100%', maxWidth: 380, boxShadow: theme.shadowLg, border: `1px solid ${theme.border}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Toevoegen aan boodschappenlijst</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6 }}>Kies een lijst</label>
              <select
                style={{ ...inputStyle, width: '100%' }}
                value={selectedList}
                onChange={e => setSelectedList(e.target.value)}
              >
                {lists.length === 0 && <option value="">Geen lijsten beschikbaar</option>}
                {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6 }}>Of maak een nieuwe lijst</label>
              <input
                style={{ ...inputStyle, width: '100%' }}
                placeholder="Naam nieuwe lijst..."
                value={newListName}
                onChange={e => { setNewListName(e.target.value); if (e.target.value) setSelectedList(''); }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: theme.textSecondary, marginBottom: 6 }}>Portie vermenigvuldiger</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setShoppingMultiplier(m => Math.max(0.5, parseFloat((m - 0.5).toFixed(1))))} style={{ width: 32, height: 32, borderRadius: '50%', background: theme.surfaceHover, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 18, cursor: 'pointer' }}>−</button>
                <span style={{ fontSize: 16, fontWeight: 700, color: theme.primary, minWidth: 32, textAlign: 'center' }}>{shoppingMultiplier}x</span>
                <button onClick={() => setShoppingMultiplier(m => parseFloat((m + 0.5).toFixed(1)))} style={{ width: 32, height: 32, borderRadius: '50%', background: theme.surfaceHover, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 18, cursor: 'pointer' }}>+</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowShoppingModal(false)} style={{ flex: 1, padding: '10px', background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuleren</button>
              <button onClick={addToShoppingList} disabled={addingToList} style={{ flex: 2, padding: '10px', background: theme.success, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: addingToList ? 'not-allowed' : 'pointer' }}>
                {addingToList ? 'Bezig...' : 'Toevoegen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
