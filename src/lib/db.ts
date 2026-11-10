import Dexie, { type Table } from 'dexie';
import {
  Workspace,
  EventItem,
  Booth,
  Product,
  ProductVariant,
  InventoryAllocation,
  Order,
  OrderItem,
  SyncStatus,
} from '@/types/database';

export interface LocalOrder extends Order {
  is_offline_only: boolean;
  sync_attempts: number;
  last_sync_error?: string | null;
}

export interface SyncQueueItem {
  id: string;
  order_id: string;
  action: 'create_order' | 'update_stock';
  payload: Record<string, unknown>;
  idempotency_key: string;
  status: SyncStatus;
  retry_count: number;
  created_at: string;
  last_attempt_at?: string;
  error?: string | null;
}

export class EventMateLocalDatabase extends Dexie {
  workspaces!: Table<Workspace, string>;
  events!: Table<EventItem, string>;
  booths!: Table<Booth, string>;
  products!: Table<Product, string>;
  variants!: Table<ProductVariant, string>;
  allocations!: Table<InventoryAllocation, string>;
  localOrders!: Table<LocalOrder, string>;
  orderItems!: Table<OrderItem, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('EventMateOfflineDB');
    this.version(1).stores({
      workspaces: 'id, slug',
      events: 'id, workspace_id, status, start_date',
      booths: 'id, workspace_id, event_id, code',
      products: 'id, workspace_id, category_id, is_active',
      variants: 'id, workspace_id, product_id, sku, barcode',
      allocations: 'id, workspace_id, event_id, booth_id, variant_id',
      localOrders: 'id, workspace_id, event_id, booth_id, sync_status, idempotency_key, offline_created_at',
      orderItems: 'id, order_id, workspace_id, variant_id',
      syncQueue: 'id, order_id, idempotency_key, status, created_at',
    });
  }
}

export const localDb = new EventMateLocalDatabase();
