import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderItem, PaymentMethod, PaymentStatus, SyncStatus } from '@/types/database';
import { localDb, LocalOrder, SyncQueueItem } from '@/lib/db';
import { useDataStore } from './data-store';
import { logActivity } from './audit-store';
import { isTestEvent, isTestOrder } from '@/lib/test-data-filter';

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

export const DEFAULT_BANK_CONFIG: BankConfig = {
  bankId: 'MB',
  accountNo: '0988776655',
  accountName: 'NGUYEN VAN TUAN - HIKARUSTORE',
};

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
    tenderedAmount?: number;
    changeAmount?: number;
    notes?: string;
    isOnline: boolean;
  }) => Promise<Order>;

  // Sync actions
  syncPendingOrders: () => Promise<{ successCount: number; failCount: number }>;
  retryOrderSync: (orderId: string) => Promise<boolean>;
  hydrateOfflineDb: () => Promise<void>;
  mergeCollabOrders: (incomingOrders: Order[]) => void;
  clearTestOrders: () => void;
}

// Initial completed orders attributed to Test Event (as shown in dashboard screenshot)
const sampleInitialOrders: Order[] = [
  {
    id: 'ord-test-4748',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-test-pos',
    booth_id: 'booth-test-1',
    cashier_id: 'user-artist-demo',
    order_number: 'EM-4748',
    subtotal_amount: 10500000,
    discount_amount: 0,
    final_amount: 10500000,
    payment_method: 'cash',
    payment_status: 'completed',
    sync_status: 'synced',
    idempotency_key: 'idem-ord-test-4748',
    notes: 'Đơn hàng thử nghiệm máy bán hàng POS (30 món)',
    is_test: true,
    offline_created_at: '2026-11-10T20:27:00.000Z',
    created_at: '2026-11-10T20:27:00.000Z',
    updated_at: '2026-11-10T20:27:00.000Z',
    items: [
      {
        id: 'item-test-4748-1',
        order_id: 'ord-test-4748',
        workspace_id: 'ws-hac-cam-studio',
        variant_id: 'var-tshirt-s',
        quantity: 30,
        unit_price: 350000,
        total_price: 10500000,
        created_at: '2026-11-10T20:27:00.000Z',
      },
    ],
  },
  {
    id: 'ord-test-9089',
    workspace_id: 'ws-hac-cam-studio',
    event_id: 'evt-test-pos',
    booth_id: 'booth-test-1',
    cashier_id: 'user-artist-demo',
    order_number: 'EM-9089',
    subtotal_amount: 350000,
    discount_amount: 0,
    final_amount: 350000,
    payment_method: 'cash',
    payment_status: 'completed',
    sync_status: 'synced',
    idempotency_key: 'idem-ord-test-9089',
    notes: 'Đơn hàng thử nghiệm máy bán hàng POS (1 món)',
    is_test: true,
    offline_created_at: '2026-11-10T20:25:00.000Z',
    created_at: '2026-11-10T20:25:00.000Z',
    updated_at: '2026-11-10T20:25:00.000Z',
    items: [
      {
        id: 'item-test-9089-1',
        order_id: 'ord-test-9089',
        workspace_id: 'ws-hac-cam-studio',
        variant_id: 'var-tshirt-s',
        quantity: 1,
        unit_price: 350000,
        total_price: 350000,
        created_at: '2026-11-10T20:25:00.000Z',
      },
    ],
  },
];

export const useOrdersStore = create<OrdersStoreState>()(
  persist(
    (set, get) => ({
      orders: sampleInitialOrders,
      cart: [],
      discountAmount: 0,
      activeBankConfig: DEFAULT_BANK_CONFIG,

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
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('eventmate_shared_bank_config', JSON.stringify(activeBankConfig));
            const bc = new BroadcastChannel('eventmate_bank_sync');
            bc.postMessage({ type: 'BANK_CONFIG_UPDATED', config: activeBankConfig });
            bc.close();
          } catch (e) {
            console.warn('Bank config broadcast error:', e);
          }
        }
      },

      submitOrder: async ({
        workspaceId,
        eventId,
        boothId,
        cashierId,
        paymentMethod,
        tenderedAmount,
        changeAmount,
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
          tendered_amount: tenderedAmount !== undefined ? tenderedAmount : (paymentMethod === 'cash' ? finalAmount : null),
          change_amount: changeAmount !== undefined ? changeAmount : (paymentMethod === 'cash' ? 0 : null),
          is_test: isTestEvent(eventId) || boothId === 'booth-test-1',
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

        // Broadcast order completion and updated stock to other cashiers in real time
        if (typeof window !== 'undefined') {
          try {
            const { useRealtimeCartSync } = await import('./realtime-cart-sync');
            useRealtimeCartSync.getState().broadcastOrderCompleted(boothId, orderId, updatedAllocations);
          } catch (e) {}
        }

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

        // 4. Record Audit Log for Admin tracing
        logActivity({
          actor_name: `Thu ngân (${cashierId || 'POS'})`,
          actor_role: 'cashier',
          action_type: 'order_create',
          entity_type: 'order',
          entity_name: `Đơn #${orderNumber}`,
          description: `Thu ngân tạo đơn hàng #${orderNumber} thành công (${cart.map((c) => `${c.quantity}x ${c.productName}`).join(', ')}). Tổng tiền: ${finalAmount.toLocaleString('vi-VN')} VND qua ${paymentMethod === 'cash' ? `Tiền mặt (Khách đưa: ${(newOrder.tendered_amount || finalAmount).toLocaleString('vi-VN')} đ, Thối lại: ${(newOrder.change_amount || 0).toLocaleString('vi-VN')} đ)` : 'VietQR'}.`,
          changes: [
            { field: 'final_amount', field_label: 'Doanh thu', new_value: `${finalAmount.toLocaleString('vi-VN')} VND` },
            { field: 'payment_method', field_label: 'Hình thức', new_value: paymentMethod },
          ],
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
            for (const p of pending) {
              await localDb.localOrders.update(p.id, { sync_status: 'synced', is_offline_only: false });
            }
            await localDb.syncQueue.clear();
          }
        } catch (e) {
          console.warn('Error clearing sync queue in localDb:', e);
        }

        return { successCount: pending.length, failCount: 0 };
      },

      hydrateOfflineDb: async () => {
        try {
          if (typeof window !== 'undefined' && localDb) {
            const dbOrders = await localDb.localOrders.toArray();
            if (dbOrders && dbOrders.length > 0) {
              const { orders } = get();
              const existingIds = new Set(orders.map((o) => o.id));
              const missing = dbOrders.filter((o) => !existingIds.has(o.id));
              if (missing.length > 0) {
                set({ orders: [...missing, ...orders] });
              }
            }
          }
        } catch (e) {
          console.warn('Error hydrating from offline localDb:', e);
        }
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

      clearTestOrders: () => {
        const { orders } = get();
        set({ orders: orders.filter((o) => !isTestOrder(o)) });
        try {
          useDataStore.getState().resetTestAllocations();
        } catch (e) {
          console.warn('Could not reset test allocations:', e);
        }
      },
    }),
    {
      name: 'eventmate_orders_state_v3',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.orders || state.orders.length === 0) {
          state.orders = sampleInitialOrders;
          return;
        }

        // Reassign EM-4748, EM-9089 or legacy test orders to evt-test-pos and booth-test-1, and tag is_test: true
        state.orders = state.orders.map((o) => {
          if (o.order_number === 'EM-4748' || o.order_number === 'EM-9089' || o.event_id === 'evt-test-pos') {
            return {
              ...o,
              event_id: 'evt-test-pos',
              booth_id: o.booth_id || 'booth-test-1',
              is_test: true,
            };
          }
          return o;
        });

        // Ensure sample test orders EM-4748 and EM-9089 are present
        const has4748 = state.orders.some((o) => o.order_number === 'EM-4748');
        const has9089 = state.orders.some((o) => o.order_number === 'EM-9089');
        if (!has4748 || !has9089) {
          const missing = sampleInitialOrders.filter(
            (so) => !state.orders.some((o) => o.order_number === so.order_number)
          );
          state.orders = [...missing, ...state.orders];
        }
        // Ensure activeBankConfig has valid values
        try {
          if (typeof window !== 'undefined') {
            const savedBank = localStorage.getItem('eventmate_shared_bank_config');
            if (savedBank) {
              const parsed = JSON.parse(savedBank);
              if (parsed?.bankId && parsed?.accountNo) {
                state.activeBankConfig = parsed;
              }
            } else if (!state.activeBankConfig || !state.activeBankConfig.accountNo) {
              state.activeBankConfig = DEFAULT_BANK_CONFIG;
            }
          }
        } catch (e) {}
      },
    }
  )
);

// Listen to cross-window, cross-tab bank config updates so all roles (Cashier, Staff, Admin) sync immediately
if (typeof window !== 'undefined') {
  try {
    const bankChannel = new BroadcastChannel('eventmate_bank_sync');
    bankChannel.onmessage = (event) => {
      if (event.data?.type === 'BANK_CONFIG_UPDATED' && event.data.config) {
        useOrdersStore.setState({ activeBankConfig: event.data.config });
      }
    };
  } catch (e) {}

  window.addEventListener('storage', (e) => {
    if (e.key === 'eventmate_shared_bank_config' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.bankId && parsed?.accountNo) {
          useOrdersStore.setState({ activeBankConfig: parsed });
        }
      } catch (err) {}
    }
  });
}
