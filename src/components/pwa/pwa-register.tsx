'use client';

import * as React from 'react';
import { useOrdersStore } from '@/stores/orders-store';

export function PwaRegister() {
  React.useEffect(() => {
    // 1. Register Service Worker for true Offline capability
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('HikaruStore Offline Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('HikaruStore Service Worker registration failed:', err);
          });
      });
    }

    // 2. Global Offline / Online Auto-Sync Listener
    const handleOnline = async () => {
      console.log('Network status: Back ONLINE. Triggering auto-sync...');
      try {
        const { orders, syncPendingOrders } = useOrdersStore.getState();
        const pendingCount = orders.filter((o) => o.sync_status === 'pending_sync').length;
        if (pendingCount > 0) {
          const res = await syncPendingOrders();
          if (res.successCount > 0) {
            console.log(`Auto-synced ${res.successCount} pending offline orders to server.`);
          }
        }
      } catch (e) {
        console.warn('Error during auto-sync:', e);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}
