'use client';

import { create } from 'zustand';
import { CartItem } from './orders-store';
import { InventoryAllocation } from '@/types/database';
import { useDataStore } from './data-store';
import { createClient } from '@/lib/supabase/client';

export type RemoteCartItem = { variantId: string; quantity: number };

export interface RemoteCartHold {
  clientId: string;
  boothId: string;
  items: RemoteCartItem[];
  updatedAt: number;
}

interface RealtimeCartSyncState {
  clientId: string;
  remoteHolds: Record<string, RemoteCartHold>; // key: clientId
  initSync: () => void;
  broadcastMyCart: (boothId: string, cart: CartItem[]) => void;
  broadcastOrderCompleted: (boothId: string, orderId: string, updatedAllocations: InventoryAllocation[]) => void;
  getRemoteHeldQty: (boothId: string, variantId: string) => number;
}

// Generate unique ID per browser tab / window session
function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem('eventmate_pos_client_id');
  if (!id) {
    id = `pos-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    sessionStorage.setItem('eventmate_pos_client_id', id);
  }
  return id;
}

const BROADCAST_CHANNEL_NAME = 'eventmate_pos_stock_channel';

interface IncomingSyncPayload {
  type: string;
  clientId: string;
  boothId?: string;
  items?: RemoteCartItem[];
  orderId?: string;
  allocations?: InventoryAllocation[];
  timestamp?: number;
}

export const useRealtimeCartSync = create<RealtimeCartSyncState>((set, get) => {
  let broadcastChannel: BroadcastChannel | null = null;
  let supabaseChannel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;
  let isInitialized = false;

  return {
    clientId: typeof window !== 'undefined' ? getOrCreateClientId() : 'server',
    remoteHolds: {},

    initSync: () => {
      if (typeof window === 'undefined' || isInitialized) return;
      isInitialized = true;

      const myClientId = get().clientId;

      // 1. Setup local BroadcastChannel (Zero-latency inter-tab communication)
      if ('BroadcastChannel' in window) {
        broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        broadcastChannel.onmessage = (event) => {
          handleIncomingMessage(event.data);
        };
      }

      // 2. Setup Supabase Realtime Broadcast for multi-device communication
      try {
        const supabase = createClient();
        supabaseChannel = supabase.channel('eventmate_pos_live_stock', {
          config: { broadcast: { self: false } },
        });

        supabaseChannel
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on('broadcast' as any, { event: 'cart_update' }, (payload: { payload?: IncomingSyncPayload }) => {
            if (payload.payload && payload.payload.clientId !== myClientId) {
              handleIncomingMessage(payload.payload);
            }
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .on('broadcast' as any, { event: 'order_completed' }, (payload: { payload?: IncomingSyncPayload }) => {
            if (payload.payload && payload.payload.clientId !== myClientId) {
              handleIncomingMessage(payload.payload);
            }
          })
          .subscribe();
      } catch (err) {
        // Fallback gracefully to local BroadcastChannel
        console.warn('[RealtimeSync] Supabase broadcast fallback to BroadcastChannel', err);
      }

      // Handle message from any channel
      function handleIncomingMessage(data: IncomingSyncPayload | null | undefined) {
        if (!data || data.clientId === myClientId) return;

        if (data.type === 'CART_UPDATE') {
          set((state) => {
            const next = { ...state.remoteHolds };
            if (!data.items || data.items.length === 0) {
              delete next[data.clientId];
            } else {
              next[data.clientId] = {
                clientId: data.clientId,
                boothId: data.boothId || '',
                items: data.items,
                updatedAt: Date.now(),
              };
            }
            return { remoteHolds: next };
          });
        }

        if (data.type === 'ORDER_COMPLETED') {
          // 1. Remove the cart hold from this client
          set((state) => {
            const next = { ...state.remoteHolds };
            delete next[data.clientId];
            return { remoteHolds: next };
          });

          // 2. Synchronize newly updated allocations into data-store immediately
          const incomingAllocations = data.allocations;
          if (incomingAllocations && Array.isArray(incomingAllocations)) {
            const dataStore = useDataStore.getState();
            const currentAllocations = dataStore.allocations;
            const updated = currentAllocations.map((alloc) => {
              const matched = incomingAllocations.find((a: InventoryAllocation) => a.id === alloc.id);
              return matched ? matched : alloc;
            });
            dataStore.setAllocations(updated);
          }
        }
      }

      // Periodic cleanup of stale remote holds (> 15 minutes inactive)
      setInterval(() => {
        const now = Date.now();
        const MAX_HOLD_AGE = 15 * 60 * 1000;
        set((state) => {
          let changed = false;
          const next = { ...state.remoteHolds };
          Object.keys(next).forEach((cId) => {
            if (now - next[cId].updatedAt > MAX_HOLD_AGE) {
              delete next[cId];
              changed = true;
            }
          });
          return changed ? { remoteHolds: next } : state;
        });
      }, 30000);
    },

    broadcastMyCart: (boothId: string, cart: CartItem[]) => {
      const myClientId = get().clientId;
      const payload = {
        type: 'CART_UPDATE',
        clientId: myClientId,
        boothId,
        items: cart.map((c) => ({ variantId: c.variantId, quantity: c.quantity })),
        timestamp: Date.now(),
      };

      // Broadcast via local channel
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage(payload);
        } catch {}
      }

      // Broadcast via Supabase Realtime
      if (supabaseChannel) {
        try {
          supabaseChannel.send({
            type: 'broadcast',
            event: 'cart_update',
            payload,
          });
        } catch {}
      }
    },

    broadcastOrderCompleted: (boothId: string, orderId: string, updatedAllocations: InventoryAllocation[]) => {
      const myClientId = get().clientId;
      const payload = {
        type: 'ORDER_COMPLETED',
        clientId: myClientId,
        boothId,
        orderId,
        allocations: updatedAllocations,
        timestamp: Date.now(),
      };

      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage(payload);
        } catch {}
      }

      if (supabaseChannel) {
        try {
          supabaseChannel.send({
            type: 'broadcast',
            event: 'order_completed',
            payload,
          });
        } catch {}
      }
    },

    getRemoteHeldQty: (boothId: string, variantId: string) => {
      const { remoteHolds } = get();
      let total = 0;
      Object.values(remoteHolds).forEach((hold) => {
        if (hold.boothId === boothId) {
          const item = hold.items.find((i) => i.variantId === variantId);
          if (item) {
            total += item.quantity;
          }
        }
      });
      return total;
    },
  };
});
