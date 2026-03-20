import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ShoppingListPage from './components/ShoppingListPage';
import TrashPage from './components/TrashPage';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';

// Toast component
function Toast({ toasts }) {
  const { theme } = useTheme();
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? theme.danger : t.type === 'success' ? theme.success : theme.surface,
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 10,
          boxShadow: theme.shadowLg,
          fontSize: 14,
          fontWeight: 500,
          animation: 'fadeInUp 0.2s ease',
          whiteSpace: 'nowrap',
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export const ToastContext = React.createContext(null);

export default function App() {
  const { theme, isDark } = useTheme();
  const { user, loading } = useAuth();
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: theme.bg }}>
        <div style={{ color: theme.primary, fontSize: 24 }}>⏳ Laden...</div>
      </div>
    );
  }

  return (
    <ToastContext.Provider value={showToast}>
      <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, transition: 'background 0.2s, color 0.2s' }}>
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 3px; }
          * { scrollbar-width: thin; scrollbar-color: ${theme.border} transparent; }
        `}</style>
        {user ? (
          <>
            <Navbar />
            <div style={{ paddingTop: 64 }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shopping" element={<ShoppingListPage />} />
                <Route path="/trash" element={<TrashPage />} />
                {user.role === 'admin' && <Route path="/admin" element={<AdminPage />} />}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="*" element={<LoginPage />} />
          </Routes>
        )}
        <Toast toasts={toasts} />
      </div>
    </ToastContext.Provider>
  );
}
