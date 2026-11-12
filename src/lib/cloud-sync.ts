'use client';

import { createClient } from '@/lib/supabase/client';
import { useDataStore, DataStoreState } from '@/stores/data-store';
import { useOrdersStore } from '@/stores/orders-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Order } from '@/types/database';

export interface CloudCatalogPayload {
  events?: DataStoreState['events'];
  booths?: DataStoreState['booths'];
  categories?: DataStoreState['categories'];
  products?: DataStoreState['products'];
  variants?: DataStoreState['variants'];
  allocations?: DataStoreState['allocations'];
}

export interface CloudSyncSnapshot {
  workspace_id: string;
  catalog_data: CloudCatalogPayload;
  orders_data: Order[];
  updated_at: string;
  updated_by?: string;
}

const DEFAULT_WORKSPACE_ID = 'ws-hac-cam-studio';
const SYNC_CHANNEL_NAME = 'eventmate_cloud_sync_channel';

// Unique client identifier per browser session to prevent echo loops
function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem('eventmate_client_sync_id');
  if (!id) {
    id = `client-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    sessionStorage.setItem('eventmate_client_sync_id', id);
  }
  return id;
}

let isInitialized = false;
let syncChannel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;
let saveDebounceTimer: NodeJS.Timeout | null = null;
let isApplyingRemoteUpdate = false;

/**
 * Initializes the two-way Realtime & Cloud sync engine with Supabase.
 */
export function initCloudSync(workspaceId = DEFAULT_WORKSPACE_ID) {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  const clientId = getOrCreateClientId();
  const supabase = createClient();
  const workspaceStore = useWorkspaceStore.getState();

  // 1. Initial hydration: Fetch latest snapshot from Supabase table
  fetchCloudSnapshot(workspaceId);

  // 2. Setup Realtime Channel (Both Database changes & Mesh Broadcast)
  try {
    syncChannel = supabase.channel(SYNC_CHANNEL_NAME, {
      config: { broadcast: { self: false } },
    });

    // Layer A: Listen for database changes on public.app_sync_state
    syncChannel.on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'app_sync_state',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload: any) => {
        if (payload?.new && payload.new.updated_by !== clientId) {
          applyCloudSnapshot(payload.new as CloudSyncSnapshot);
        }
      }
    );

    // Layer B: Realtime Mesh Broadcast for zero-latency cross-device sync (< 100ms)
    syncChannel.on(
      'broadcast' as any,
      { event: 'CATALOG_UPDATE' },
      ({ payload }: { payload: { clientId: string; catalog: CloudCatalogPayload } }) => {
        if (payload && payload.clientId !== clientId) {
          applyCatalogDelta(payload.catalog);
        }
      }
    );

    syncChannel.on(
      'broadcast' as any,
      { event: 'ORDER_UPSERT' },
      ({ payload }: { payload: { clientId: string; order: Order } }) => {
        if (payload && payload.clientId !== clientId) {
          applyOrderUpsert(payload.order);
        }
      }
    );

    syncChannel.on(
      'broadcast' as any,
      { event: 'REQUEST_CATALOG_SYNC' },
      ({ payload }: { payload: { clientId: string } }) => {
        if (payload && payload.clientId !== clientId) {
          // Send our current catalog to the requesting new peer
          broadcastFullState();
        }
      }
    );

    syncChannel.on(
      'broadcast' as any,
      { event: 'FULL_STATE_ANNOUNCE' },
      ({ payload }: { payload: { clientId: string; snapshot: CloudSyncSnapshot } }) => {
        if (payload && payload.clientId !== clientId) {
          applyCloudSnapshot(payload.snapshot);
        }
      }
    );

    syncChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        workspaceStore.setSyncState('synced');
        // Announce our presence to request current catalog from any existing active peer
        syncChannel?.send({
          type: 'broadcast',
          event: 'REQUEST_CATALOG_SYNC',
          payload: { clientId },
        });
      } else if (status === 'CHANNEL_ERROR') {
        workspaceStore.setSyncState('pending');
      }
    });
  } catch (err) {
    console.warn('[CloudSync] Realtime channel subscription fallback:', err);
  }

  // 3. Setup Zustand auto-sync subscribers: Any local edits automatically sync to cloud & peers
  setupStoreSubscribers(workspaceId);
}

/**
 * Automatically listens to Zustand store changes and pushes deltas to peers & cloud
 */
function setupStoreSubscribers(workspaceId: string) {
  // Listen to useDataStore (Products, Variants, Categories, Events, Booths, Allocations)
  useDataStore.subscribe((state, prevState) => {
    if (isApplyingRemoteUpdate) return;

    const hasCatalogChanged =
      state.products !== prevState.products ||
      state.variants !== prevState.variants ||
      state.categories !== prevState.categories ||
      state.allocations !== prevState.allocations ||
      state.events !== prevState.events ||
      state.booths !== prevState.booths;

    if (hasCatalogChanged) {
      syncCatalogChange(
        {
          products: state.products,
          variants: state.variants,
          categories: state.categories,
          allocations: state.allocations,
          events: state.events,
          booths: state.booths,
        },
        workspaceId
      );
    }
  });

  // Listen to useOrdersStore (Orders)
  useOrdersStore.subscribe((state, prevState) => {
    if (isApplyingRemoteUpdate) return;

    if (state.orders !== prevState.orders && state.orders.length > 0) {
      const newest = state.orders[0];
      if (newest && (!prevState.orders[0] || newest.id !== prevState.orders[0].id)) {
        syncOrderCreated(newest, workspaceId);
      }
    }
  });
}

/**
 * Fetch latest snapshot from Supabase table
 */
export async function fetchCloudSnapshot(workspaceId = DEFAULT_WORKSPACE_ID): Promise<boolean> {
  const workspaceStore = useWorkspaceStore.getState();
  workspaceStore.setSyncState('syncing');

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_sync_state')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (error) {
      console.warn('[CloudSync] Cloud table not accessible or RLS active. Falling back to realtime mesh:', error.message);
      workspaceStore.setSyncState('online');
      return false;
    }

    if (data) {
      const uatResetCutoffIso = '2026-11-12T16:41:00.000Z';
      const remoteUpdatedAt = typeof data.updated_at === 'string' ? data.updated_at : '';
      if (!remoteUpdatedAt || remoteUpdatedAt < uatResetCutoffIso) {
        // Pre-UAT stale snapshot in cloud: overwrite with clean local slate instead of restoring demo data
        await pushFullStateToCloud(workspaceId);
        workspaceStore.setSyncState('synced');
        return true;
      }
      applyCloudSnapshot(data as CloudSyncSnapshot);
      workspaceStore.setSyncState('synced');
      return true;
    } else {
      // First time initialization: Push local catalog to cloud table
      await pushFullStateToCloud(workspaceId);
      workspaceStore.setSyncState('synced');
      return true;
    }
  } catch (err) {
    console.warn('[CloudSync] Error fetching snapshot:', err);
    workspaceStore.setSyncState('online');
    return false;
  }
}

/**
 * Apply cloud snapshot into local Zustand stores
 */
export function applyCloudSnapshot(snapshot: CloudSyncSnapshot) {
  if (!snapshot) return;
  isApplyingRemoteUpdate = true;

  try {
    const { catalog_data, orders_data } = snapshot;
    if (catalog_data) {
      applyCatalogDelta(catalog_data);
    }

    if (orders_data && Array.isArray(orders_data)) {
      const ordersStore = useOrdersStore.getState();
      const currentOrders = ordersStore.orders;
      const existingIds = new Set(currentOrders.map((o) => o.id));

      const merged = [...currentOrders];
      for (const remoteOrder of orders_data) {
        if (!existingIds.has(remoteOrder.id)) {
          merged.unshift(remoteOrder);
          existingIds.add(remoteOrder.id);
        } else {
          // Update if status changed
          const idx = merged.findIndex((o) => o.id === remoteOrder.id);
          if (idx !== -1 && merged[idx].order_status !== remoteOrder.order_status) {
            merged[idx] = remoteOrder;
          }
        }
      }
      useOrdersStore.setState({ orders: merged });
    }
  } finally {
    setTimeout(() => {
      isApplyingRemoteUpdate = false;
    }, 100);
  }
}

/**
 * Merge partial catalog updates into useDataStore
 */
export function applyCatalogDelta(delta: CloudCatalogPayload) {
  isApplyingRemoteUpdate = true;
  try {
    const dataStore = useDataStore.getState();
    const updates: Partial<DataStoreState> = {};

    if (delta.products && delta.products.length > 0) {
      const mergedMap = new Map<string, any>();
      delta.products.forEach((p) => mergedMap.set(p.id, p));
      dataStore.products.forEach((p) => {
        if (!mergedMap.has(p.id)) mergedMap.set(p.id, p);
      });
      updates.products = Array.from(mergedMap.values());
    }

    if (delta.variants && delta.variants.length > 0) {
      const mergedMap = new Map<string, any>();
      delta.variants.forEach((v) => mergedMap.set(v.id, v));
      dataStore.variants.forEach((v) => {
        if (!mergedMap.has(v.id)) mergedMap.set(v.id, v);
      });
      updates.variants = Array.from(mergedMap.values());
    }

    if (delta.categories && delta.categories.length > 0) {
      const mergedMap = new Map<string, any>();
      delta.categories.forEach((c) => mergedMap.set(c.id, c));
      dataStore.categories.forEach((c) => {
        if (!mergedMap.has(c.id)) mergedMap.set(c.id, c);
      });
      updates.categories = Array.from(mergedMap.values());
    }

    if (delta.events && delta.events.length > 0) {
      const mergedMap = new Map<string, any>();
      delta.events.forEach((e) => mergedMap.set(e.id, e));
      dataStore.events.forEach((e) => {
        if (!mergedMap.has(e.id)) mergedMap.set(e.id, e);
      });
      updates.events = Array.from(mergedMap.values());
    }

    if (delta.booths && delta.booths.length > 0) {
      const mergedMap = new Map<string, any>();
      delta.booths.forEach((b) => mergedMap.set(b.id, b));
      dataStore.booths.forEach((b) => {
        if (!mergedMap.has(b.id)) mergedMap.set(b.id, b);
      });
      updates.booths = Array.from(mergedMap.values());
    }

    if (delta.allocations && delta.allocations.length > 0) {
      const mergedMap = new Map<string, any>();
      delta.allocations.forEach((a) => mergedMap.set(`${a.booth_id}::${a.variant_id}`, a));
      dataStore.allocations.forEach((a) => {
        const key = `${a.booth_id}::${a.variant_id}`;
        if (!mergedMap.has(key)) mergedMap.set(key, a);
      });
      updates.allocations = Array.from(mergedMap.values());
    }

    useDataStore.setState(updates);
  } finally {
    setTimeout(() => {
      isApplyingRemoteUpdate = false;
    }, 100);
  }
}

/**
 * Apply single order upsert into useOrdersStore
 */
export function applyOrderUpsert(order: Order) {
  if (!order || !order.id) return;
  isApplyingRemoteUpdate = true;
  try {
    const ordersStore = useOrdersStore.getState();
    const currentOrders = ordersStore.orders;
    const idx = currentOrders.findIndex((o) => o.id === order.id);

    if (idx !== -1) {
      const updated = [...currentOrders];
      updated[idx] = order;
      useOrdersStore.setState({ orders: updated });
    } else {
      useOrdersStore.setState({ orders: [order, ...currentOrders] });
    }
  } finally {
    setTimeout(() => {
      isApplyingRemoteUpdate = false;
    }, 100);
  }
}

/**
 * Broadcast full state to peer nodes on demand
 */
export function broadcastFullState(workspaceId = DEFAULT_WORKSPACE_ID) {
  if (!syncChannel) return;
  const clientId = getOrCreateClientId();
  const dataStore = useDataStore.getState();
  const ordersStore = useOrdersStore.getState();

  const snapshot: CloudSyncSnapshot = {
    workspace_id: workspaceId,
    catalog_data: {
      events: dataStore.events,
      booths: dataStore.booths,
      categories: dataStore.categories,
      products: dataStore.products,
      variants: dataStore.variants,
      allocations: dataStore.allocations,
    },
    orders_data: ordersStore.orders,
    updated_at: new Date().toISOString(),
    updated_by: clientId,
  };

  syncChannel.send({
    type: 'broadcast',
    event: 'FULL_STATE_ANNOUNCE',
    payload: { clientId, snapshot },
  });
}

/**
 * Triggers a catalog sync to Supabase & peer devices (Debounced to prevent network flood)
 */
export function syncCatalogChange(delta?: CloudCatalogPayload, workspaceId = DEFAULT_WORKSPACE_ID) {
  const clientId = getOrCreateClientId();

  // 1. Instant Realtime broadcast to connected peers (< 100ms)
  if (syncChannel && delta) {
    syncChannel.send({
      type: 'broadcast',
      event: 'CATALOG_UPDATE',
      payload: { clientId, catalog: delta },
    });
  }

  // 2. Debounced persistence to Supabase app_sync_state table
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    pushFullStateToCloud(workspaceId);
  }, 400);
}

/**
 * Triggers an order sync to Supabase & peer devices
 */
export function syncOrderCreated(order: Order, workspaceId = DEFAULT_WORKSPACE_ID) {
  const clientId = getOrCreateClientId();

  // 1. Instant broadcast to peers
  if (syncChannel && order) {
    syncChannel.send({
      type: 'broadcast',
      event: 'ORDER_UPSERT',
      payload: { clientId, order },
    });
  }

  // 2. Debounced persistence to Supabase
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    pushFullStateToCloud(workspaceId);
  }, 300);
}

/**
 * Push entire local snapshot into Supabase table
 */
export async function pushFullStateToCloud(workspaceId = DEFAULT_WORKSPACE_ID): Promise<boolean> {
  const clientId = getOrCreateClientId();
  const dataStore = useDataStore.getState();
  const ordersStore = useOrdersStore.getState();
  const workspaceStore = useWorkspaceStore.getState();

  const snapshot: CloudSyncSnapshot = {
    workspace_id: workspaceId,
    catalog_data: {
      events: dataStore.events,
      booths: dataStore.booths,
      categories: dataStore.categories,
      products: dataStore.products,
      variants: dataStore.variants,
      allocations: dataStore.allocations,
    },
    orders_data: ordersStore.orders,
    updated_at: new Date().toISOString(),
    updated_by: clientId,
  };

  try {
    const supabase = createClient();
    const { error } = await supabase.from('app_sync_state').upsert(snapshot, {
      onConflict: 'workspace_id',
    });

    if (error) {
      console.warn('[CloudSync] Upsert to app_sync_state skipped (run migration SQL to enable table storage):', error.message);
      return false;
    }

    workspaceStore.setSyncState('synced');
    return true;
  } catch (err) {
    console.warn('[CloudSync] Error saving to cloud:', err);
    return false;
  }
}
