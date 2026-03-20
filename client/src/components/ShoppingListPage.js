import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api';
import { ToastContext } from '../App';

export default function ShoppingListPage() {
  const { theme } = useTheme();
  const showToast = useContext(ToastContext);
  const [lists, setLists] = useState([]);
  const [activeList, setActiveList] = useState(null);
  const [items, setItems] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showListPanel, setShowListPanel] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    if (activeList) fetchItems(activeList.id);
    else setItems([]);
  }, [activeList]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const data = await api('/shopping/lists');
      setLists(data.lists);
      if (data.lists.length > 0 && !activeList) {
        setActiveList(data.lists[0]);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (listId) => {
    try {
      const data = await api(`/shopping/lists/${listId}/items`);
      setItems(data.items);
    } catch {}
  };

  const createList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const data = await api('/shopping/lists', { method: 'POST', body: { name: newListName.trim() } });
      setLists(ls => [data.list, ...ls]);
      setActiveList(data.list);
      setNewListName('');
      if (isMobile) setShowListPanel(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteList = async (list) => {
    if (!window.confirm(`Lijst "${list.name}" verwijderen?`)) return;
    try {
      await api(`/shopping/lists/${list.id}`, { method: 'DELETE' });
      const remaining = lists.filter(l => l.id !== list.id);
      setLists(remaining);
      if (activeList?.id === list.id) {
        setActiveList(remaining[0] || null);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeList) return;
    try {
      const data = await api(`/shopping/lists/${activeList.id}/items`, {
        method: 'POST',
        body: { name: newItemName.trim(), amount: newItemAmount ? parseFloat(newItemAmount) : null, unit: newItemUnit },
      });
      setItems(is => [...is, ...data.items]);
      setNewItemName('');
      setNewItemAmount('');
      setNewItemUnit('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggleItem = async (item) => {
    try {
      const data = await api(`/shopping/lists/${activeList.id}/items/${item.id}`, {
        method: 'PUT',
        body: { checked: !item.checked },
      });
      setItems(is => is.map(i => i.id === item.id ? data.item : i));
    } catch {}
  };

  const deleteItem = async (item) => {
    try {
      await api(`/shopping/lists/${activeList.id}/items/${item.id}`, { method: 'DELETE' });
      setItems(is => is.filter(i => i.id !== item.id));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const clearChecked = async () => {
    const checked = items.filter(i => i.checked);
    for (const item of checked) {
      try {
        await api(`/shopping/lists/${activeList.id}/items/${item.id}`, { method: 'DELETE' });
      } catch {}
    }
    setItems(is => is.filter(i => !i.checked));
    showToast('Afgevinkte items verwijderd', 'success');
  };

  const inputStyle = {
    padding: '10px 12px',
    borderRadius: 8,
    border: `1.5px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontSize: 16,
    outline: 'none',
    fontFamily: 'inherit',
  };

  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '12px' : '24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, marginBottom: 20 }}>
        Boodschappenlijst
      </h1>

      <div style={{ display: isMobile ? 'block' : 'flex', gap: 20 }}>
        {/* List sidebar */}
        {(!isMobile || showListPanel) && (
          <div style={{ width: isMobile ? '100%' : 260, flexShrink: 0, marginBottom: isMobile ? 16 : 0 }}>
            <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${theme.border}`, fontWeight: 700, fontSize: 14, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Mijn lijsten
              </div>

              {/* Create new list form */}
              <form onSubmit={createList} style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, display: 'flex', gap: 6 }}>
                <input
                  style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: 14 }}
                  placeholder="Nieuwe lijst..."
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                />
                <button type="submit" style={{ padding: '8px 12px', background: theme.primary, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>+</button>
              </form>

              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: theme.textSecondary, fontSize: 13 }}>Laden...</div>
              ) : lists.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: theme.textSecondary, fontSize: 13 }}>Geen lijsten. Maak er een aan!</div>
              ) : (
                <div>
                  {lists.map(list => (
                    <div
                      key={list.id}
                      onClick={() => { setActiveList(list); if (isMobile) setShowListPanel(false); }}
                      style={{
                        padding: '11px 14px',
                        borderBottom: `1px solid ${theme.border}`,
                        background: activeList?.id === list.id ? `${theme.primary}10` : 'transparent',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: activeList?.id === list.id ? 600 : 400, color: activeList?.id === list.id ? theme.primary : theme.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {list.name}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteList(list); }}
                        style={{ background: 'transparent', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: 16, padding: '0 0 0 8px', flexShrink: 0 }}
                      >🗑</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active list items */}
        {(!isMobile || !showListPanel) && (
          <div style={{ flex: 1 }}>
            {isMobile && (
              <button
                onClick={() => setShowListPanel(true)}
                style={{ marginBottom: 12, padding: '8px 14px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                ← Lijsten
              </button>
            )}

            {!activeList ? (
              <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 6 }}>Geen lijst geselecteerd</div>
                <div style={{ fontSize: 13, color: theme.textSecondary }}>Maak een lijst aan of selecteer er een</div>
              </div>
            ) : (
              <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                {/* List header */}
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{activeList.name}</h2>
                    {totalCount > 0 && (
                      <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                        {checkedCount} van {totalCount} afgevinkt
                      </div>
                    )}
                  </div>
                  {/* Progress bar */}
                  {totalCount > 0 && (
                    <div style={{ flex: 1, maxWidth: 120 }}>
                      <div style={{ height: 6, background: theme.border, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(checkedCount / totalCount) * 100}%`, background: theme.success, borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}
                  {checkedCount > 0 && (
                    <button
                      onClick={clearChecked}
                      style={{ padding: '6px 12px', background: `${theme.danger}15`, border: `1px solid ${theme.danger}40`, borderRadius: 8, color: theme.danger, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      Verwijder afgevinkte
                    </button>
                  )}
                </div>

                {/* Items */}
                <div>
                  {items.length === 0 ? (
                    <div style={{ padding: 30, textAlign: 'center', color: theme.textSecondary, fontSize: 13 }}>
                      Geen items. Voeg iets toe!
                    </div>
                  ) : (
                    items.map(item => (
                      <div
                        key={item.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: `1px solid ${theme.border}`,
                          display: 'flex', alignItems: 'center', gap: 10,
                          background: item.checked ? `${theme.success}08` : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!item.checked}
                          onChange={() => toggleItem(item)}
                          style={{ width: 18, height: 18, accentColor: theme.success, cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span style={{ flex: 1, fontSize: 14, color: item.checked ? theme.textSecondary : theme.text, textDecoration: item.checked ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                          {item.amount && <strong>{item.amount} {item.unit} </strong>}
                          {item.name}
                        </span>
                        <button
                          onClick={() => deleteItem(item)}
                          style={{ background: 'transparent', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: 16, padding: '0 4px', opacity: 0.6 }}
                        >×</button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add item form */}
                <form onSubmit={addItem} style={{ padding: 12, borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <input
                    style={{ ...inputStyle, width: 72, fontSize: 14, padding: '8px 10px', flexShrink: 0 }}
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Aantal"
                    value={newItemAmount}
                    onChange={e => setNewItemAmount(e.target.value)}
                  />
                  <input
                    style={{ ...inputStyle, width: 68, fontSize: 14, padding: '8px 10px', flexShrink: 0 }}
                    placeholder="Eenheid"
                    value={newItemUnit}
                    onChange={e => setNewItemUnit(e.target.value)}
                  />
                  <input
                    style={{ ...inputStyle, flex: 1, minWidth: 120, fontSize: 14, padding: '8px 10px' }}
                    placeholder="Item toevoegen..."
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    style={{ padding: '8px 14px', background: theme.primary, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15, flexShrink: 0 }}
                  >+</button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
