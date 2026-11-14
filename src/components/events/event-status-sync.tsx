'use client';

import * as React from 'react';
import { useDataStore } from '@/stores/data-store';

export function EventStatusSync() {
  const refreshEventStatuses = useDataStore((state) => state.refreshEventStatuses);

  React.useEffect(() => {
    const refresh = () => refreshEventStatuses();
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [refreshEventStatuses]);

  return null;
}
