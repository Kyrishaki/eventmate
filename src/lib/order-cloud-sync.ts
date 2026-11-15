import { createClient } from '@/lib/supabase/client';
import type { Order } from '@/types/database';

// JSONB reorders object keys; compare content, excluding local delivery metadata.
export function orderContent(value: unknown): string {
  function normalize(item: unknown): unknown {
    if (Array.isArray(item)) return item.map(normalize);
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item)
      .filter(([key]) => !['sync_status', 'is_offline_only', 'sync_attempts', 'last_sync_error'].includes(key))
      .sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, normalize(entry)]));
    return item;
  }
  return JSON.stringify(normalize(value));
}

/** Persist one version of one order; never write catalog_data. */
export async function saveOrderToCloud(order: Order): Promise<boolean> {
  if (!order.id || !order.idempotency_key || !order.workspace_id || !order.updated_at) return false;
  if (!Number.isFinite(Date.parse(order.updated_at))) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  const client = createClient();
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await client.from('app_sync_state')
      .select('orders_data,updated_at').eq('workspace_id', order.workspace_id).maybeSingle();
    if (error || !data || !Array.isArray(data.orders_data)) return false;
    const orders = data.orders_data as Order[];
    const existing = orders.find((item) => item.id === order.id || item.idempotency_key === order.idempotency_key);
    if (existing) {
      if (existing.id !== order.id || existing.idempotency_key !== order.idempotency_key) return false;
      if (existing.updated_at === order.updated_at) return orderContent(existing) === orderContent(order);
      if (Date.parse(existing.updated_at) >= Date.parse(order.updated_at)) return false;
      if (['cancelled', 'refunded'].includes(existing.order_status || '') && !['cancelled', 'refunded'].includes(order.order_status || '')) return false;
    }
    const confirmed = { ...order, sync_status: 'synced' as const };
    const next = existing ? orders.map((item) => item.id === order.id ? confirmed : item) : [...orders, confirmed];
    const { data: saved, error: writeError } = await client.from('app_sync_state')
      .update({ orders_data: next, updated_at: new Date(Math.max(Date.now(), Date.parse(data.updated_at) + 1)).toISOString() })
      .eq('workspace_id', order.workspace_id).eq('updated_at', data.updated_at).select('workspace_id');
    if (writeError) return false;
    if (saved?.length) return true;
  }
  return false;
}
