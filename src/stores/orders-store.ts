import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderItem, PaymentMethod, PaymentStatus, SyncStatus } from '@/types/database';
import { localDb, LocalOrder, SyncQueueItem } from '@/lib/db';
import { useDataStore } from './data-store';

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  price: number;
  quantity: number;
  maxAvailable: number;
  imageUrl?: string | null;
}

export interface BankConfig {
  bankId: string; // e.g. "MB", "VCB", "ACB", "TCB", "VPB"
  accountNo: string;
  accountName: string;
}

interface OrdersStoreState {
  orders: Order[];
  cart: CartItem[];
  discountAmount: number;
  activeBankConfig: BankConfig;

  // Cart actions
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  clearOrders: () => void;
  setDiscountAmount: (amount: number) => void;
  setBankConfig: (config: BankConfig) => void;

  // Order submission
  submitOrder: (params: {
    workspaceId: string;
    eventId: string;
    boothId: string;
    cashierId: string;
    paymentMethod: PaymentMethod;
    notes?: string;
    isOnline: boolean;
  }) => Promise<Order>;

  // Sync actions
  syncPendingOrders: () => Promise<{ successCount: number; failCount: number }>;
  retryOrderSync: (orderId: string) => Promise<boolean>;
  mergeCollabOrders: (incomingOrders: Order[]) => void;
}

// Initial sample completed orders for realistic history
const sampleInitialOrders: Order[] = [
  {
    id: 'ord-1001',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-hanoi-2026',
    booth_id: 'booth-a',
    cashier_id: 'user-artist-demo',
    order_number: 'EM-2026-0001',
    subtotal_amount: 700000,
    discount_amount: 0,
    final_amount: 700000,
    payment_method: 'qr_manual',
    payment_status: 'completed',
    sync_status: 'synced',
    idempotency_key: 'idem-ord-1001',
    notes: 'Khách thanh toán quét mã VietQR',
    offline_created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    items: [
      {
        id: 'item-1',
        order_id: 'ord-1001',
        workspace_id: 'ws-hac-cam-studio',
        variant_id: 'var-tshirt-m',
        quantity: 2,
        unit_price: 350000,
        total_price: 700000,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: 'ord-1002',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-hanoi-2026',
    booth_id: 'booth-a',
    cashier_id: 'user-artist-demo',
    order_number: 'EM-2026-0002',
    subtotal_amount: 500000,
    discount_amount: 0,
    final_amount: 500000,
    payment_method: 'cash',
    payment_status: 'completed',
    sync_status: 'synced',
    idempotency_key: 'idem-ord-1002',
    notes: 'Tiền mặt khách đưa 500k',
    offline_created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    items: [
      {
        id: 'item-2',
        order_id: 'ord-1002',
        workspace_id: 'ws-hac-cam-studio',
        variant_id: 'var-cap-blk',
        quantity: 1,
        unit_price: 220000,
        total_price: 220000,
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: 'item-3',
        order_id: 'ord-1002',
        workspace_id: 'ws-hac-cam-studio',
        variant_id: 'var-lightstick-rgb',
        quantity: 1,
        unit_price: 280000,
        total_price: 280000,
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ],
  },
];

export const useOrdersStore = create<OrdersStoreState>()(
  persist(
    (set, get) => ({
      orders: [],
      cart: [],
      discountAmount: 0,
      activeBankConfig: {
        bankId: 'MB',
        accountNo: '',
        accountName: '',
      },

      clearOrders: () => set({ orders: [], cart: [] }),

      addToCart: (item) => {
        const { cart } = get();
        const existing = cart.find((c) => c.variantId === item.variantId);

        if (existing) {
          if (existing.quantity >= item.maxAvailable) return; // Prevent exceeding stock
          set({
            cart: cart.map((c) =>
              c.variantId === item.variantId ? { ...c, quantity: c.quantity + 1 } : c
            ),
          });
        } else {
          if (item.maxAvailable <= 0) return;
          set({
            cart: [...cart, { ...item, quantity: 1 }],
          });
        }
      },

      removeFromCart: (variantId) => {
        set({
          cart: get().cart.filter((c) => c.variantId !== variantId),
        });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(variantId);
          return;
        }
        set({
          cart: get().cart.map((c) => {
            if (c.variantId === variantId) {
              const clamped = Math.min(c.maxAvailable, quantity);
              return { ...c, quantity: clamped };
            }
            return c;
          }),
        });
      },

      clearCart: () => {
        set({ cart: [], discountAmount: 0 });
      },

      setDiscountAmount: (discountAmount) => {
        set({ discountAmount: Math.max(0, discountAmount) });
      },

      setBankConfig: (activeBankConfig) => {
        set({ activeBankConfig });
      },

      submitOrder: async ({
        workspaceId,
        eventId,
        boothId,
        cashierId,
        paymentMethod,
        notes,
        isOnline,
      }) => {
        const { cart, discountAmount, orders } = get();
        if (cart.length === 0) throw new Error('Giỏ hàng trống');

        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const finalAmount = Math.max(0, subtotal - discountAmount);

        const orderId = `ord-${Date.now()}`;
        const orderNumber = `EM-${Date.now().toString().slice(-4)}`;
        const idempotencyKey = `idem-${orderId}-${Math.random().toString(36).substring(2, 8)}`;
        const nowIso = new Date().toISOString();

        const syncStatus: SyncStatus = isOnline ? 'synced' : 'pending_sync';

        const orderItems: OrderItem[] = cart.map((c, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          order_id: orderId,
          workspace_id: workspaceId,
          variant_id: c.variantId,
          quantity: c.quantity,
          unit_price: c.price,
          total_price: c.price * c.quantity,
          created_at: nowIso,
        }));

        const newOrder: Order = {
          id: orderId,
          workspace_id: workspaceId,
          event_id: eventId,
          booth_id: boothId,
          cashier_id: cashierId,
          order_number: orderNumber,
          subtotal_amount: subtotal,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          payment_method: paymentMethod,
          payment_status: 'completed',
          sync_status: syncStatus,
          idempotency_key: idempotencyKey,
          notes: notes || null,
          offline_created_at: nowIso,
          created_at: nowIso,
          updated_at: nowIso,
          items: orderItems,
        };

        // 1. Atomically update stock sold_quantity in data-store
        const dataStore = useDataStore.getState();
        const updatedAllocations = dataStore.allocations.map((alloc) => {
          if (alloc.booth_id === boothId) {
            const purchasedItem = cart.find((c) => c.variantId === alloc.variant_id);
            if (purchasedItem) {
              return {
                ...alloc,
                sold_quantity: alloc.sold_quantity + purchasedItem.quantity,
                updated_at: nowIso,
              };
            }
          }
          return alloc;
        });
        useDataStore.setState({ allocations: updatedAllocations });

        // 2. Persist locally to Dexie IndexedDB
        try {
          if (typeof window !== 'undefined' && localDb) {
            await localDb.localOrders.put({
              ...newOrder,
              is_offline_only: !isOnline,
              sync_attempts: isOnline ? 1 : 0,
            });

            for (const item of orderItems) {
              await localDb.orderItems.put(item);
            }

            if (!isOnline) {
              await localDb.syncQueue.put({
                id: `queue-${orderId}`,
                order_id: orderId,
                action: 'create_order',
                payload: { ...newOrder, items: orderItems },
                idempotency_key: idempotencyKey,
                status: 'pending_sync',
                retry_count: 0,
                created_at: nowIso,
              });
            }
          }
        } catch (dexieErr) {
          console.warn('Dexie storage error:', dexieErr);
        }

        // 3. Update orders in zustand store and clear cart
        set({
          orders: [newOrder, ...orders],
          cart: [],
          discountAmount: 0,
        });

        return newOrder;
      },

      syncPendingOrders: async () => {
        const { orders } = get();
        const pending = orders.filter((o) => o.sync_status === 'pending_sync');
        if (pending.length === 0) return { successCount: 0, failCount: 0 };

        // Mark all pending as synced
        const synced = orders.map((o) =>
          o.sync_status === 'pending_sync' ? { ...o, sync_status: 'synced' as SyncStatus } : o
        );

        set({ orders: synced });

        try {
          if (typeof window !== 'undefined' && localDb) {
            await localDb.syncQueue.clear();
          }
        } catch (e) {
          console.warn('Error clearing sync queue:', e);
        }

        return { successCount: pending.length, failCount: 0 };
      },

      retryOrderSync: async (orderId: string) => {
        const { orders } = get();
        set({
          orders: orders.map((o) =>
            o.id === orderId ? { ...o, sync_status: 'synced' as SyncStatus } : o
          ),
        });
        return true;
      },

      mergeCollabOrders: (incomingOrders: Order[]) => {
        const { orders } = get();
        const existingIds = new Set(orders.map((o) => o.id));
        const toAdd = incomingOrders.filter((o) => !existingIds.has(o.id));
        set({ orders: [...toAdd, ...orders] });
      },
    }),
    {
      name: 'eventmate_orders_state_v3',
    }
  )
);
