import React, { createContext, useContext, useState, useEffect } from 'react';

const lightTheme = {
  bg: '#faf9f6',
  surface: '#ffffff',
  surfaceHover: '#f5f4f1',
  border: '#e5e3dd',
  text: '#1c1917',
  textSecondary: '#78716c',
  primary: '#ea580c',
  primaryHover: '#c2410c',
  danger: '#dc2626',
  success: '#16a34a',
  shadow: '0 2px 8px rgba(0,0,0,0.08)',
  shadowLg: '0 8px 24px rgba(0,0,0,0.12)',
};

const darkTheme = {
  bg: '#1c1917',
  surface: '#292524',
  surfaceHover: '#3c3330',
  border: '#44403c',
  text: '#fafaf9',
  textSecondary: '#a8a29e',
  primary: '#f97316',
  primaryHover: '#ea580c',
  danger: '#ef4444',
  success: '#22c55e',
  shadow: '0 2px 8px rgba(0,0,0,0.3)',
  shadowLg: '0 8px 24px rgba(0,0,0,0.4)',
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.body.style.backgroundColor = isDark ? darkTheme.bg : lightTheme.bg;
    document.body.style.color = isDark ? darkTheme.text : lightTheme.text;
  }, [isDark]);

  const toggle = () => setIsDark(d => !d);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
