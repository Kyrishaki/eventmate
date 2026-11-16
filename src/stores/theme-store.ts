import { create } from 'zustand';

export type ThemeMode = 'dark';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'dark';
  setTheme: (theme?: string) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

function applyThemeToDocument() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', 'dark');
  root.classList.add('dark');
}

export const useThemeStore = create<ThemeState>(() => ({
  theme: 'dark',
  resolvedTheme: 'dark',

  initTheme: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('eventmate-theme', 'dark');
    } catch {
      // ignore
    }
    applyThemeToDocument();
  },

  setTheme: () => {
    applyThemeToDocument();
  },

  toggleTheme: () => {
    applyThemeToDocument();
  },
}));
