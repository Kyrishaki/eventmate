'use client';

import * as React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useThemeStore, ThemeMode } from '@/stores/theme-store';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => {};
function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme, initTheme } = useThemeStore();
  const mounted = useMounted();

  React.useEffect(() => {
    initTheme();
  }, [initTheme]);

  if (!mounted) {
    return (
      <div
        className={cn(
          'w-8 h-8 rounded-lg border border-border bg-surface opacity-40 shrink-0',
          className
        )}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Chuyển sang Giao diện Sáng (Light mode)' : 'Chuyển sang Giao diện Tối (Dark mode)'}
      aria-label="Toggle theme"
      className={cn(
        'p-1.5 rounded-lg border border-border dark:border-border bg-surface dark:bg-surface text-muted hover:text-foreground dark:hover:text-foreground hover:bg-surface-hover dark:hover:bg-surface-hover transition-all flex items-center justify-center shrink-0 shadow-2xs cursor-pointer',
        className
      )}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-gold-text transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-red-600 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}

export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme, initTheme } = useThemeStore();
  const mounted = useMounted();

  React.useEffect(() => {
    initTheme();
  }, [initTheme]);

  if (!mounted) return null;

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Sáng', icon: <Sun className="w-3.5 h-3.5" /> },
    { mode: 'dark', label: 'Tối', icon: <Moon className="w-3.5 h-3.5" /> },
    { mode: 'system', label: 'Tự động', icon: <Laptop className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border dark:border-border bg-surface dark:bg-surface p-0.5 text-xs text-muted',
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.mode}
          type="button"
          onClick={() => setTheme(opt.mode)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer text-xs',
            theme === opt.mode
              ? 'bg-primary text-primary-foreground shadow-2xs'
              : 'text-muted hover:text-foreground hover:bg-surface-hover dark:hover:bg-surface-hover'
          )}
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
