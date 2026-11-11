import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Order,
  OrderItem,
  PaymentMethod,
  PaymentStatus,
  SyncStatus,
  WorkspaceRole,
  AuditActorRole,
} from '@/types/database';
import { localDb, LocalOrder, SyncQueueItem } from '@/lib/db';
import { useDataStore } from './data-store';
import { logActivity } from './audit-store';
import { useShiftStore } from './shift-store';
import { isTestEvent, isTestOrder, getEffectiveOrderStatus } from '@/lib/test-data-filter';

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
  autoCheckEnabled?: boolean;
  provider?: 'sepay' | 'casso' | 'webhook_only';
  apiToken?: string;
  voiceAnnouncement?: boolean;
}

export const DEFAULT_BANK_CONFIG: BankConfig = {
  bankId: 'MB',
  accountNo: '0988776655',
  accountName: 'NGUYEN VAN TUAN - HIKARUSTORE',
  autoCheckEnabled: true,
  provider: 'sepay',
  apiToken: '4TCBKUQD7M0WLPWZAAJCHUVC7EVJFB0NXM5GVGDL18SKUEPZBHYIM3JKOXLLJTFC',
  voiceAnnouncement: true,
};

export interface OrderLifecycleResult {
  ok: boolean;
  error?: string;
  order?: Order;
  restoredUnits?: number;
}

function restoreOrderStockToAllocations(order: Order): number {
  const items = order.items || [];
  if (items.length === 0) return 0;

  let restoredUnits = 0;
  const remainingByVariant = new Map<string, number>();

  items.forEach((it) => {
    const qty = Math.max(0, it.quantity || 0);
    if (qty > 0) {
      remainingByVariant.set(it.variant_id, (remainingByVariant.get(it.variant_id) || 0) + qty);
    }
  });

  const currentAllocations = useDataStore.getState().allocations;
  const nowIso = new Date().toISOString();

  // Pass 1: Match exact booth + variant
  const afterBoothPass = currentAllocations.map((alloc) => {
    if (alloc.booth_id !== order.booth_id) return alloc;
    const toRestore = remainingByVariant.get(alloc.variant_id) || 0;
    if (toRestore <= 0) return alloc;
    const actualRestore = Math.min(alloc.sold_quantity, toRestore);
    remainingByVariant.set(alloc.variant_id, toRestore - actualRestore);
    restoredUnits += actualRestore;
    return {
      ...alloc,
      sold_quantity: Math.max(0, alloc.sold_quantity - actualRestore),
      updated_at: nowIso,
    };
  });

  // Pass 2: Fallback across matching event allocations if booth mismatch occurred
  const updatedAllocations = afterBoothPass.map((alloc) => {
    if (alloc.event_id !== order.event_id) return alloc;
    const toRestore = remainingByVariant.get(alloc.variant_id) || 0;
    if (toRestore <= 0) return alloc;
    const actualRestore = Math.min(alloc.sold_quantity, toRestore);
    if (actualRestore <= 0) return alloc;
    remainingByVariant.set(alloc.variant_id, toRestore - actualRestore);
    restoredUnits += actualRestore;
    return {
      ...alloc,
      sold_quantity: Math.max(0, alloc.sold_quantity - actualRestore),
      updated_at: nowIso,
    };
  });

  useDataStore.setState({ allocations: updatedAllocations });
  return restoredUnits;
}

function syncOrderToLocalDb(orderId: string, updates: Partial<LocalOrder>) {
  if (typeof window === 'undefined' || !localDb) return;
  localDb.localOrders.update(orderId, updates).catch((err) => {
    console.warn('Could not update offline localDb order:', err);
  });
}

function validateAdminOrderLifecycle(
  orders: Order[],
  orderId: string,
  reason: string,
  actorRole?: WorkspaceRole | null
): { ok: true; target: Order; cleanReason: string } | { ok: false; error: string } {
  if (actorRole !== 'owner' && actorRole !== 'admin') {
    return {
      ok: false,
      error: 'Phân quyền từ chối: Chỉ Chủ sở hữu (Owner) hoặc Quản trị viên (Admin) mới được hủy đơn hoặc hoàn tiền.',
    };
  }
  const target = orders.find((o) => o.id === orderId);
  if (!target) {
    return { ok: false, error: 'Không tìm thấy đơn hàng cần xử lý.' };
  }
  const effectiveStatus = getEffectiveOrderStatus(target);
  if (effectiveStatus === 'cancelled') {
    return { ok: false, error: 'Đơn hàng này đã bị hủy trước đó.' };
  }
  if (effectiveStatus === 'refunded') {
    return { ok: false, error: 'Đơn hàng này đã được lập biên bản hoàn tiền trước đó.' };
  }
  const cleanReason = reason.trim();
  if (!cleanReason) {
    return { ok: false, error: 'Vui lòng ghi rõ lý do để lưu vết kiểm toán (Audit Trail).' };
  }
  return { ok: true, target, cleanReason };
}

interface OrdersStoreState {
  orders: Order[];
  cart: CartItem[];
  discountAmount: number;
  activeBankConfig: BankConfig;
  sandboxCleared?: boolean;

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

  // Order Lifecycle (RBAC: Owner / Admin only - NO Hard Delete!)
  cancelOrder: (params: {
    orderId: string;
    reason: string;
    actorName: string;
    actorRole?: WorkspaceRole | null;
    actorUsername?: string;
  }) => OrderLifecycleResult;
  refundOrder: (params: {
    orderId: string;
    reason: string;
    refundAmount?: number;
    restockItems?: boolean;
    actorName: string;
    actorRole?: WorkspaceRole | null;
    actorUsername?: string;
  }) => OrderLifecycleResult;

  // Sandbox / Test Data Management (Settings only, Owner / Admin)
  clearTestOrders: (actor?: { actorName: string; actorRole?: WorkspaceRole | null }) => void;
  restoreSampleTestOrders: () => void;
}

// Initial completed orders start empty (no virtual/fake orders until user creates them)
const sampleInitialOrders: Order[] = [];

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

      clearTestOrders: (actor) => {
        if (actor?.actorRole && actor.actorRole !== 'owner' && actor.actorRole !== 'admin') {
          return;
        }
        const { orders } = get();
        const removedCount = orders.filter((o) => isTestOrder(o)).length;
        set({
          orders: orders.filter((o) => !isTestOrder(o)),
          sandboxCleared: true,
        });
        try {
          useDataStore.getState().resetTestAllocations();
          if (typeof window !== 'undefined' && localDb) {
            localDb.localOrders
              .toArray()
              .then((rows) => {
                const testIds = rows.filter((r) => isTestOrder(r)).map((r) => r.id);
                if (testIds.length > 0) {
                  return localDb.localOrders.bulkDelete(testIds);
                }
                return undefined;
              })
              .catch(() => {});
          }
          if (actor && removedCount > 0) {
            logActivity({
              actor_name: actor.actorName,
              actor_role: (actor.actorRole as AuditActorRole) || 'admin',
              action_type: 'delete',
              entity_type: 'system',
              entity_name: `Dọn dữ liệu Sandbox (${removedCount} đơn test)`,
              description: `${actor.actorName} đã dọn sạch ${removedCount} đơn hàng thử nghiệm (Sandbox) trong mục Cài đặt.`,
            });
          }
        } catch (e) {
          console.warn('Could not reset test allocations:', e);
        }
      },

      restoreSampleTestOrders: () => {
        const { orders } = get();
        const existingIds = new Set(orders.map((o) => o.order_number));
        const toRestore = sampleInitialOrders.filter((so) => !existingIds.has(so.order_number));
        set({
          orders: [...toRestore, ...orders],
          sandboxCleared: false,
        });
      },

      cancelOrder: ({ orderId, reason, actorName, actorRole, actorUsername }) => {
        const { orders } = get();
        const validation = validateAdminOrderLifecycle(orders, orderId, reason, actorRole);
        if (!validation.ok) {
          return { ok: false, error: validation.error };
        }

        const { target, cleanReason } = validation;
        const nowIso = new Date().toISOString();
        const restoredUnits = restoreOrderStockToAllocations(target);

        const updatedOrder: Order = {
          ...target,
          order_status: 'cancelled',
          cancelled_at: nowIso,
          cancelled_by: actorName,
          cancelled_by_role: actorRole || 'admin',
          cancellation_reason: cleanReason,
          updated_at: nowIso,
        };

        set({
          orders: orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        });

        syncOrderToLocalDb(orderId, {
          order_status: 'cancelled',
          cancelled_at: nowIso,
          cancelled_by: actorName,
          cancelled_by_role: actorRole || 'admin',
          cancellation_reason: cleanReason,
          updated_at: nowIso,
        });

        try {
          useShiftStore.getState().reverseOrderInShift({
            boothId: target.booth_id,
            eventId: target.event_id,
            orderCreatedAt: target.created_at,
            paymentMethod: target.payment_method,
            amount: target.final_amount,
            decrementCount: true,
          });
        } catch (e) {
          console.warn('Could not reverse cancelled order in shift:', e);
        }

        const dataState = useDataStore.getState();
        const booth = dataState.booths.find((b) => b.id === target.booth_id);
        const event = dataState.events.find((e) => e.id === target.event_id);

        logActivity({
          actor_name: actorName,
          actor_role: (actorRole as AuditActorRole) || 'admin',
          actor_username: actorUsername,
          action_type: 'order_cancel',
          entity_type: 'order',
          entity_id: target.id,
          entity_name: `Hủy đơn ${target.order_number}`,
          booth_name: booth?.name,
          event_name: event?.name,
          description: `Hủy đơn hàng #${target.order_number} (${target.final_amount.toLocaleString('vi-VN')} đ). Lý do: "${cleanReason}". Đã tự động hoàn lại ${restoredUnits} món vào tồn kho quầy.`,
          changes: [
            { field: 'order_status', field_label: 'Trạng thái đơn', old_value: 'completed', new_value: 'cancelled' },
            { field: 'cancellation_reason', field_label: 'Lý do hủy', new_value: cleanReason },
            { field: 'restored_units', field_label: 'Hoàn kho tự động', new_value: `+${restoredUnits} món` },
          ],
        });

        return { ok: true, order: updatedOrder, restoredUnits };
      },

      refundOrder: ({
        orderId,
        reason,
        refundAmount,
        restockItems = true,
        actorName,
        actorRole,
        actorUsername,
      }) => {
        const { orders } = get();
        const validation = validateAdminOrderLifecycle(orders, orderId, reason, actorRole);
        if (!validation.ok) {
          return { ok: false, error: validation.error };
        }

        const { target, cleanReason } = validation;
        const resolvedAmount =
          typeof refundAmount === 'number' && refundAmount > 0
            ? Math.min(refundAmount, target.final_amount)
            : target.final_amount;
        const nowIso = new Date().toISOString();
        const restoredUnits = restockItems ? restoreOrderStockToAllocations(target) : 0;
        const recordSuffix = target.order_number.replace(/^EM-?/i, '') || String(Date.now()).slice(-4);
        const refundRecordNumber = `RF-${recordSuffix}`;

        const updatedOrder: Order = {
          ...target,
          payment_status: 'refunded',
          order_status: 'refunded',
          refunded_at: nowIso,
          refunded_by: actorName,
          refunded_by_role: actorRole || 'admin',
          refund_reason: cleanReason,
          refund_amount: resolvedAmount,
          refund_restocked: restockItems,
          refund_record_number: refundRecordNumber,
          updated_at: nowIso,
        };

        set({
          orders: orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        });

        syncOrderToLocalDb(orderId, {
          payment_status: 'refunded',
          order_status: 'refunded',
          refunded_at: nowIso,
          refunded_by: actorName,
          refunded_by_role: actorRole || 'admin',
          refund_reason: cleanReason,
          refund_amount: resolvedAmount,
          refund_restocked: restockItems,
          refund_record_number: refundRecordNumber,
          updated_at: nowIso,
        });

        try {
          useShiftStore.getState().reverseOrderInShift({
            boothId: target.booth_id,
            eventId: target.event_id,
            orderCreatedAt: target.created_at,
            paymentMethod: target.payment_method,
            amount: resolvedAmount,
            decrementCount: false,
          });
        } catch (e) {
          console.warn('Could not reverse refunded order in shift:', e);
        }

        const dataState = useDataStore.getState();
        const booth = dataState.booths.find((b) => b.id === target.booth_id);
        const event = dataState.events.find((e) => e.id === target.event_id);

        logActivity({
          actor_name: actorName,
          actor_role: (actorRole as AuditActorRole) || 'admin',
          actor_username: actorUsername,
          action_type: 'order_refund',
          entity_type: 'order',
          entity_id: target.id,
          entity_name: `Biên bản hoàn tiền ${refundRecordNumber} (${target.order_number})`,
          booth_name: booth?.name,
          event_name: event?.name,
          description: `Lập biên bản hoàn tiền ${refundRecordNumber} cho đơn #${target.order_number}. Số tiền hoàn: ${resolvedAmount.toLocaleString('vi-VN')} đ. Lý do: "${cleanReason}". ${restockItems ? `Đã hoàn kho ${restoredUnits} món.` : 'Không nhập lại kho (hàng lỗi/hỏng).'}`,
          changes: [
            { field: 'order_status', field_label: 'Trạng thái đơn', old_value: 'completed', new_value: 'refunded' },
            { field: 'refund_amount', field_label: 'Số tiền hoàn', new_value: `${resolvedAmount.toLocaleString('vi-VN')} VND` },
            { field: 'refund_reason', field_label: 'Lý do hoàn tiền', new_value: cleanReason },
            { field: 'restocked', field_label: 'Nhập lại kho', new_value: restockItems ? `+${restoredUnits} món` : 'Không hoàn kho' },
          ],
        });

        return { ok: true, order: updatedOrder, restoredUnits };
      },
    }),
    {
      name: 'eventmate_orders_state_v5',
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('eventmate_orders_state_v3');
            localStorage.removeItem('eventmate_orders_state_v4');
          } catch {
            // ignore
          }
        }
        if (!state) return;
        if (!state.orders || state.orders.length === 0) {
          state.orders = state.sandboxCleared ? [] : sampleInitialOrders;
          return;
        }

        // Reassign EM-4748, EM-9089 or legacy test orders to evt-test-pos and booth-test-1, and normalize order_status
        state.orders = state.orders.map((o) => {
          const normalizedStatus = o.order_status || (o.payment_status === 'refunded' ? 'refunded' : 'completed');
          if (o.order_number === 'EM-4748' || o.order_number === 'EM-9089' || o.event_id === 'evt-test-pos') {
            return {
              ...o,
              order_status: normalizedStatus,
              event_id: 'evt-test-pos',
              booth_id: o.booth_id || 'booth-test-1',
              is_test: true,
            };
          }
          return o.order_status ? o : { ...o, order_status: normalizedStatus };
        });

        // Ensure sample test orders EM-4748 and EM-9089 are present unless sandbox was cleared
        if (!state.sandboxCleared) {
          const has4748 = state.orders.some((o) => o.order_number === 'EM-4748');
          const has9089 = state.orders.some((o) => o.order_number === 'EM-9089');
          if (!has4748 || !has9089) {
            const missing = sampleInitialOrders.filter(
              (so) => !state.orders.some((o) => o.order_number === so.order_number)
            );
            state.orders = [...missing, ...state.orders];
          }
        }
        // Ensure activeBankConfig has valid values
        try {
          if (typeof window !== 'undefined') {
            const savedBank = localStorage.getItem('eventmate_shared_bank_config');
            if (savedBank) {
              const parsed = JSON.parse(savedBank);
              if (parsed?.bankId && parsed?.accountNo) {
                state.activeBankConfig = {
                  ...DEFAULT_BANK_CONFIG,
                  ...parsed,
                  apiToken: parsed.apiToken || DEFAULT_BANK_CONFIG.apiToken,
                };
              }
            } else if (!state.activeBankConfig || !state.activeBankConfig.accountNo) {
              state.activeBankConfig = DEFAULT_BANK_CONFIG;
            } else if (!state.activeBankConfig.apiToken) {
              state.activeBankConfig = {
                ...state.activeBankConfig,
                apiToken: DEFAULT_BANK_CONFIG.apiToken,
              };
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
