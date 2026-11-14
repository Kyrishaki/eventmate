import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  resolvedTheme: 'dark',

  initTheme: () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('eventmate-theme') as ThemeMode | null;
    const initialTheme: ThemeMode = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark';
    const resolved: 'light' | 'dark' =
      initialTheme === 'system' ? getSystemTheme() : initialTheme;

    applyThemeToDocument(resolved);
    set({ theme: initialTheme, resolvedTheme: resolved });

    // Listen to system theme changes if set to 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (get().theme === 'system') {
        const sysResolved = getSystemTheme();
        applyThemeToDocument(sysResolved);
        set({ resolvedTheme: sysResolved });
      }
    };

    mediaQuery.removeEventListener('change', handleChange);
    mediaQuery.addEventListener('change', handleChange);
  },

  setTheme: (newTheme: ThemeMode) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('eventmate-theme', newTheme);
    const resolved: 'light' | 'dark' =
      newTheme === 'system' ? getSystemTheme() : newTheme;

    applyThemeToDocument(resolved);
    set({ theme: newTheme, resolvedTheme: resolved });
  },

  toggleTheme: () => {
    const { resolvedTheme, setTheme } = get();
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  },
}));
