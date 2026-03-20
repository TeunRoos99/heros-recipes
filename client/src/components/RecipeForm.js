import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api';
import { ToastContext } from '../App';

export default function RecipeForm({ recipe, onClose, onSave }) {
  const { theme } = useTheme();
  const showToast = useContext(ToastContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch((process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3002') + '/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [form, setForm] = useState({
    title: recipe?.title || '',
    description: recipe?.description || '',
    category: recipe?.category || '',
    prep_time: recipe?.prep_time || '',
    cook_time: recipe?.cook_time || '',
    rest_time: recipe?.rest_time || '',
    servings: recipe?.servings || '',
    is_public: recipe?.is_public || false,
    tags: recipe?.tags || [],
    ingredients: recipe?.ingredients?.length ? recipe.ingredients.map(i => ({ name: i.name, amount: i.amount || '', unit: i.unit || '' })) : [{ name: '', amount: '', unit: '' }],
    steps: recipe?.steps?.length ? recipe.steps.map(s => ({ description: s.description })) : [{ description: '' }],
  });

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1.5px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.15s',
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

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: '', amount: '', unit: '' }] }));
  const removeIngredient = (i) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  const updateIngredient = (i, field, val) => setForm(f => ({ ...f, ingredients: f.ingredients.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing) }));

  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, { description: '' }] }));
  const removeStep = (i) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  const updateStep = (i, val) => setForm(f => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? { description: val } : s) }));

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,/g, '');
      if (t && !form.tags.includes(t)) {
        setForm(f => ({ ...f, tags: [...f.tags, t] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (t) => setForm(f => ({ ...f, tags: f.tags.filter(tag => tag !== t) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { showToast('Titel is verplicht', 'error'); return; }
    setLoading(true);
    try {
      const body = {
        ...form,
        prep_time: form.prep_time ? parseInt(form.prep_time) : null,
        cook_time: form.cook_time ? parseInt(form.cook_time) : null,
        rest_time: form.rest_time ? parseInt(form.rest_time) : null,
        servings: form.servings ? parseInt(form.servings) : null,
        ingredients: form.ingredients.filter(i => i.name.trim()).map(i => ({
          name: i.name,
          amount: i.amount ? parseFloat(i.amount) : null,
          unit: i.unit,
        })),
        steps: form.steps.filter(s => s.description.trim()),
      };
      let data;
      if (recipe?.id) {
        data = await api(`/recipes/${recipe.id}`, { method: 'PUT', body });
      } else {
        data = await api('/recipes', { method: 'POST', body });
      }
      showToast(recipe?.id ? 'Recept bijgewerkt!' : 'Recept aangemaakt!', 'success');
      onSave(data.recipe);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const modalStyle = isMobile ? {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: theme.bg,
    overflow: 'auto',
    display: 'flex', flexDirection: 'column',
  } : {
    position: 'fixed', inset: 0, zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
    background: 'rgba(0,0,0,0.5)',
  };

  const panelStyle = isMobile ? {
    flex: 1, background: theme.bg, padding: 0, display: 'flex', flexDirection: 'column',
  } : {
    background: theme.surface,
    borderRadius: 16,
    width: '100%', maxWidth: 680,
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: theme.shadowLg,
    border: `1px solid ${theme.border}`,
  };

  return (
    <div style={modalStyle} onClick={isMobile ? undefined : (e) => e.target === e.currentTarget && onClose()}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: isMobile ? theme.bg : theme.surface,
          borderBottom: `1px solid ${theme.border}`,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>
            {recipe?.id ? 'Recept bewerken' : 'Nieuw recept'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 22, color: theme.textSecondary, padding: 4, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Titel *</label>
            <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Naam van het recept" required />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Beschrijving</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Korte omschrijving van het recept..." />
          </div>

          {/* Category + times + servings row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            <div>
              <label style={labelStyle}>Categorie</label>
              <input
                style={inputStyle}
                list="category-list"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Kies of typ nieuw..."
              />
              <datalist id="category-list">
                {categories.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label style={labelStyle}>Voorbereidingstijd (min)</label>
              <input style={inputStyle} type="number" min="0" value={form.prep_time} onChange={e => setForm(f => ({ ...f, prep_time: e.target.value }))} placeholder="15" />
            </div>
            <div>
              <label style={labelStyle}>Kooktijd (min)</label>
              <input style={inputStyle} type="number" min="0" value={form.cook_time} onChange={e => setForm(f => ({ ...f, cook_time: e.target.value }))} placeholder="30" />
            </div>
            <div>
              <label style={labelStyle}>Rusttijd (min)</label>
              <input style={inputStyle} type="number" min="0" value={form.rest_time} onChange={e => setForm(f => ({ ...f, rest_time: e.target.value }))} placeholder="60" />
            </div>
            <div>
              <label style={labelStyle}>Porties</label>
              <input style={inputStyle} type="number" min="1" value={form.servings} onChange={e => setForm(f => ({ ...f, servings: e.target.value }))} placeholder="4" />
            </div>
          </div>

          {/* Public toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
              style={{
                width: 44, height: 24,
                borderRadius: 12,
                background: form.is_public ? theme.primary : theme.border,
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: 2, left: form.is_public ? 22 : 2,
                width: 20, height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            <span style={{ fontSize: 14, color: theme.text }}>
              {form.is_public ? 'Openbaar (iedereen kan dit recept zien)' : 'Privé (alleen jij kunt dit zien)'}
            </span>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {form.tags.map(t => (
                <span key={t} style={{
                  background: `${theme.primary}20`,
                  color: theme.primary,
                  border: `1px solid ${theme.primary}40`,
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 12,
                  fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  #{t}
                  <span onClick={() => removeTag(t)} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14, lineHeight: 1 }}>×</span>
                </span>
              ))}
            </div>
            <input
              style={inputStyle}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Typ een tag en druk Enter..."
            />
          </div>

          {/* Ingredients */}
          <div>
            <label style={labelStyle}>Ingrediënten</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.ingredients.map((ing, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: theme.textSecondary, fontSize: 16, cursor: 'grab', userSelect: 'none', flexShrink: 0 }}>⠿</span>
                  <input
                    style={{ ...inputStyle, width: 80, flexShrink: 0 }}
                    value={ing.amount}
                    onChange={e => updateIngredient(i, 'amount', e.target.value)}
                    placeholder="Hoeveelh."
                    type="number"
                    min="0"
                    step="any"
                  />
                  <input
                    style={{ ...inputStyle, width: 70, flexShrink: 0 }}
                    value={ing.unit}
                    onChange={e => updateIngredient(i, 'unit', e.target.value)}
                    placeholder="Eenheid"
                  />
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={ing.name}
                    onChange={e => updateIngredient(i, 'name', e.target.value)}
                    placeholder="Ingrediënt naam"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    style={{ background: `${theme.danger}15`, border: `1px solid ${theme.danger}40`, borderRadius: 8, color: theme.danger, cursor: 'pointer', fontSize: 16, width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >×</button>
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                style={{ padding: '9px', background: theme.surfaceHover, border: `1.5px dashed ${theme.border}`, borderRadius: 8, color: theme.textSecondary, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                + Ingrediënt toevoegen
              </button>
            </div>
          </div>

          {/* Steps */}
          <div>
            <label style={labelStyle}>Bereidingswijze</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: theme.primary,
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                    flexShrink: 0, marginTop: 8,
                  }}>
                    {i + 1}
                  </div>
                  <textarea
                    style={{ ...inputStyle, flex: 1, minHeight: 80, resize: 'vertical' }}
                    value={step.description}
                    onChange={e => updateStep(i, e.target.value)}
                    placeholder={`Stap ${i + 1}...`}
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    style={{ background: `${theme.danger}15`, border: `1px solid ${theme.danger}40`, borderRadius: 8, color: theme.danger, cursor: 'pointer', fontSize: 16, width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 5 }}
                  >×</button>
                </div>
              ))}
              <button
                type="button"
                onClick={addStep}
                style={{ padding: '9px', background: theme.surfaceHover, border: `1.5px dashed ${theme.border}`, borderRadius: 8, color: theme.textSecondary, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                + Stap toevoegen
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, paddingBottom: isMobile ? 32 : 0, position: 'sticky', bottom: 0, background: isMobile ? theme.bg : theme.surface, paddingTop: 16, marginTop: 4, borderTop: `1px solid ${theme.border}`, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '12px', background: theme.surfaceHover, border: `1px solid ${theme.border}`, borderRadius: 10, color: theme.text, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 2, padding: '12px', background: loading ? theme.border : theme.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
            >
              {loading ? 'Opslaan...' : (recipe?.id ? 'Wijzigingen opslaan' : 'Recept aanmaken')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
