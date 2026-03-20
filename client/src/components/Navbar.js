import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { theme, isDark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shopping', label: 'Boodschappenlijst' },
    { to: '/trash', label: 'Prullenbak' },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Beheer' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    padding: '6px 14px',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 14,
    color: isActive(path) ? theme.primary : theme.text,
    background: isActive(path) ? (isDark ? 'rgba(249,115,22,0.15)' : 'rgba(234,88,12,0.1)') : 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'block',
  });

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: isMobile ? 56 : 64,
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
        display: 'flex', alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
        >
          <span style={{ fontSize: isMobile ? 22 : 26 }}>🍳</span>
          <span style={{ fontWeight: 700, fontSize: isMobile ? 16 : 18, color: theme.primary, whiteSpace: 'nowrap' }}>
            Hero's Recipes
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navLinks.map(link => (
              <span key={link.to} style={linkStyle(link.to)} onClick={() => navigate(link.to)}>
                {link.label}
              </span>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            style={{
              background: theme.surfaceHover,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              width: 36, height: 36,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
              color: theme.text,
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            title={isDark ? 'Licht thema' : 'Donker thema'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Desktop: username + logout */}
          {!isMobile && (
            <>
              <span style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>
                {user?.username}
              </span>
              <button
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: theme.text,
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                Uitloggen
              </button>
            </>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                display: 'flex', flexDirection: 'column', gap: 5,
                alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44,
              }}
            >
              <span style={{ display: 'block', width: 22, height: 2, background: theme.text, borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ display: 'block', width: 22, height: 2, background: theme.text, borderRadius: 2, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: 22, height: 2, background: theme.text, borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMobile && menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 998,
              background: 'rgba(0,0,0,0.4)',
              animation: 'fadeIn 0.2s ease',
            }}
          />
          <div style={{
            position: 'fixed', top: 56, right: 0, bottom: 0, width: 260, zIndex: 999,
            background: theme.surface,
            borderLeft: `1px solid ${theme.border}`,
            boxShadow: theme.shadowLg,
            padding: 16,
            display: 'flex', flexDirection: 'column', gap: 4,
            animation: 'slideInRight 0.2s ease',
          }}>
            <div style={{ padding: '12px 14px', color: theme.textSecondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Menu
            </div>
            {navLinks.map(link => (
              <div key={link.to} style={linkStyle(link.to)} onClick={() => navigate(link.to)}>
                {link.label}
              </div>
            ))}
            <div style={{ marginTop: 'auto', borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
              <div style={{ padding: '8px 14px', fontSize: 14, color: theme.textSecondary }}>
                Ingelogd als <strong style={{ color: theme.text }}>{user?.username}</strong>
              </div>
              <div
                onClick={logout}
                style={{ ...linkStyle('/logout'), color: theme.danger }}
              >
                Uitloggen
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
