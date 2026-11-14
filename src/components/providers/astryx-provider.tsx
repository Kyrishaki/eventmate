'use client';

import * as React from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { themes, defaultThemeSlug } from '../../astryx-themes';
import { useThemeStore } from '@/stores/theme-store';

interface AstryxProviderProps {
  children: React.ReactNode;
}

export function AstryxProvider({ children }: AstryxProviderProps) {
  const { theme, initTheme } = useThemeStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    initTheme();
    setMounted(true);
  }, [initTheme]);

  // Keep SSR and client hydration smooth
  const activeMode = mounted ? theme : 'dark';

  return (
    <Theme theme={themes[defaultThemeSlug]} mode={activeMode}>
      {children}
    </Theme>
  );
}
