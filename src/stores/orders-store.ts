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
import { useDataStore, reconcileAllocationsWithOrders } from './data-store';
import { logActivity } from './audit-store';
import { useShiftStore } from './shift-store';
import { isTestEvent, isTestOrder, getEffectiveOrderStatus } from '@/lib/test-data-filter';

let checkoutInProgress = false;
let syncingOrders: Promise<{ successCount: number; failCount: number }> | null = null;

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
  offlineQrImageUrl?: string | null;
}

export function normalizeVietQrBankId(bankId?: string | null): string {
  const clean = (bankId || '').trim().toUpperCase();
  if (!clean || clean === 'CTG' || clean === 'VIETINBANK' || clean === '970415') {
    return 'ICB';
  }
  return clean;
}

/** Human-readable bank name; keep the normalized ID for VietQR requests. */
export function getBankDisplayName(bankId?: string | null): string {
  const normalized = normalizeVietQrBankId(bankId);
  return normalized === 'ICB' ? 'VietinBank' : normalized;
}

export const DEFAULT_BANK_CONFIG: BankConfig = {
  bankId: 'ICB',
  accountNo: '109876880260',
  accountName: 'NGUYEN BAO THUONG',
  autoCheckEnabled: false,
  provider: 'webhook_only',
  voiceAnnouncement: false,
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
  const allowedRoles: (WorkspaceRole | undefined | null)[] = ['owner', 'admin', 'manager', 'cashier'];
  if (!actorRole || !allowedRoles.includes(actorRole)) {
    return {
      ok: false,
      error: 'Phân quyền từ chối: Chỉ Quản trị viên, Quản lý hoặc Thu ngân tại quầy mới được hủy đơn hoặc hoàn tiền.',
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
    proofImageUrl?: string | null;
    orderNumber?: string;
  }) => Promise<Order>;

  // Payment proof verification
  setOrderProofVerified: (orderId: string, verified: boolean, verifiedBy?: string) => void;

  // Sync actions
  syncPendingOrders: () => Promise<{ successCount: number; failCount: number }>;
  retryOrderSync: (orderId: string) => Promise<boolean>;
  hydrateOfflineDb: () => Promise<void>;
  mergeCollabOrders: (incomingOrders: Order[]) => void;

  // Order Lifecycle (RBAC: Owner / Admin only - NO Hard Delete!)
  cancelOrder: (params: {
    orderId: string;
    reason: string;
    isTest?: boolean;
    actorName: string;
    actorRole?: WorkspaceRole | null;
    actorUsername?: string;
  }) => OrderLifecycleResult;
  refundOrder: (params: {
    orderId: string;
    reason: string;
    isTest?: boolean;
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

      setBankConfig: (config) => {
        const normalizedConfig: BankConfig = {
          ...config,
          bankId: normalizeVietQrBankId(config.bankId),
        };
        set({ activeBankConfig: normalizedConfig });
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('eventmate_shared_bank_config', JSON.stringify(normalizedConfig));
            const bc = new BroadcastChannel('eventmate_bank_sync');
            bc.postMessage({ type: 'BANK_CONFIG_UPDATED', config: normalizedConfig });
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
        proofImageUrl,
        orderNumber: customOrderNumber,
      }) => {
        if (checkoutInProgress) throw new Error('Đơn hàng đang được xử lý.');
        checkoutInProgress = true;
        try {
        const { cart, discountAmount } = get();
        if (cart.length === 0) throw new Error('Giỏ hàng trống');

        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const finalAmount = Math.max(0, subtotal - discountAmount);

        const orderId = `ord-${crypto.randomUUID()}`;
        const orderNumber = customOrderNumber || `HKTS-${Date.now().toString().slice(-4)}`;
        const idempotencyKey = `idem-${orderId}-${Math.random().toString(36).substring(2, 8)}`;
        const nowIso = new Date().toISOString();

        const syncStatus: SyncStatus = 'pending_sync';

        const orderItems: OrderItem[] = cart.map((c, idx) => ({
          id: `${orderId}-item-${idx}`,
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
          proof_image_url: proofImageUrl || null,
          proof_verified: false,
          tendered_amount: tenderedAmount !== undefined ? tenderedAmount : (paymentMethod === 'cash' ? finalAmount : null),
          change_amount: changeAmount !== undefined ? changeAmount : (paymentMethod === 'cash' ? 0 : null),
          is_test: isTestEvent(eventId) || boothId === 'booth-test-1',
          offline_created_at: nowIso,
          created_at: nowIso,
          updated_at: nowIso,
          items: orderItems,
        };

        // Validate before any durable write or stock mutation.
        const requested = new Map<string, number>();
        for (const item of cart) {
          if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.price) || item.price < 0) {
            throw new Error('Số lượng hoặc giá sản phẩm không hợp lệ.');
          }
          requested.set(item.variantId, (requested.get(item.variantId) || 0) + item.quantity);
        }
        if (!Number.isFinite(discountAmount) || discountAmount < 0 || discountAmount > subtotal) {
          throw new Error('Số tiền giảm giá không hợp lệ.');
        }
        for (const [variantId, quantity] of requested) {
          const allocation = useDataStore.getState().allocations.find((a) => a.workspace_id === workspaceId && a.booth_id === boothId && a.variant_id === variantId);
          if (!allocation || allocation.allocated_quantity - allocation.sold_quantity < quantity) {
            throw new Error('Tồn kho đã thay đổi hoặc không đủ. Vui lòng kiểm tra lại giỏ hàng.');
          }
        }

        // 2. Persist locally to Dexie IndexedDB
        try {
          if (typeof window !== 'undefined' && localDb) {
            await localDb.transaction('rw', localDb.localOrders, localDb.orderItems, localDb.syncQueue, async () => {
            await localDb.localOrders.put({
              ...newOrder,
              is_offline_only: !isOnline,
              sync_attempts: isOnline ? 1 : 0,
            });

            for (const item of orderItems) {
              await localDb.orderItems.put(item);
            }

            {
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
            });
          }
        } catch (dexieErr) {
          console.warn('Dexie storage error:', dexieErr);
          throw new Error('Không lưu được đơn trên thiết bị. Giỏ hàng vẫn được giữ lại.');
        }

        // Only publish stock/order changes after the durable local transaction succeeds.
        useDataStore.setState((state) => ({ allocations: state.allocations.map((allocation) => {
          const quantity = requested.get(allocation.variant_id);
          return allocation.workspace_id === workspaceId && allocation.booth_id === boothId && quantity
            ? { ...allocation, sold_quantity: allocation.sold_quantity + quantity, updated_at: nowIso }
            : allocation;
        }) }));

        // 3. Update orders in zustand store and clear cart
        const updatedOrders = [newOrder, ...get().orders];
        set({
          orders: updatedOrders,
          cart: [],
          discountAmount: 0,
        });
        reconcileAllocationsWithOrders(updatedOrders);

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
        } finally { checkoutInProgress = false; }
      },

      setOrderProofVerified: (orderId: string, verified: boolean, verifiedBy?: string) => {
        const { orders } = get();
        const nowIso = new Date().toISOString();
        const updated = orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                sync_status: 'pending_sync' as const,
                proof_verified: verified,
                proof_verified_at: verified ? nowIso : null,
                proof_verified_by: verified ? verifiedBy || 'Admin' : null,
                updated_at: nowIso,
              }
            : o
        );
        set({ orders: updated });
      },

      syncPendingOrders: async () => {
        if (syncingOrders) return syncingOrders;
        syncingOrders = (async () => {
          const { saveOrderToCloud } = await import('@/lib/order-cloud-sync');
          let successCount = 0;
          const attempted = new Set<string>();
          // Drain new revisions added while an earlier network request was running.
          while (true) {
            const order = get().orders.find((o) => o.sync_status === 'pending_sync' && !attempted.has(`${o.id}:${o.updated_at}`));
            if (!order) break;
            attempted.add(`${order.id}:${order.updated_at}`);
            try {
              await localDb.localOrders.put({ ...order, is_offline_only: true, sync_attempts: 0 });
              if (!await saveOrderToCloud(order)) continue;
              if (get().orders.find((item) => item.id === order.id)?.updated_at !== order.updated_at) continue;
              await localDb.transaction('rw', localDb.localOrders, localDb.syncQueue, async () => {
                const local = await localDb.localOrders.get(order.id);
                if (local?.updated_at !== order.updated_at) return;
                await localDb.localOrders.update(order.id, { sync_status: 'synced', is_offline_only: false });
                await localDb.syncQueue.where('order_id').equals(order.id).delete();
              });
              set((state) => ({ orders: state.orders.map((item) => item.id === order.id && item.updated_at === order.updated_at ? { ...item, sync_status: 'synced' as SyncStatus } : item) }));
              successCount++;
            } catch (error) { console.warn('Order remains pending:', error); }
          }
          return { successCount, failCount: get().orders.filter((o) => o.sync_status === 'pending_sync').length };
        })();
        try { return await syncingOrders; } finally { syncingOrders = null; }
      },

      hydrateOfflineDb: async () => {
        try {
          if (typeof window !== 'undefined' && localDb) {
            const dbOrders = await localDb.localOrders.toArray();
            if (dbOrders && dbOrders.length > 0) {
              const { orders } = get();
              const merged = new Map(orders.map((o) => [o.id, o]));
              for (const order of dbOrders) {
                const existing = merged.get(order.id);
                if (!existing || Date.parse(order.updated_at) > Date.parse(existing.updated_at)) merged.set(order.id, order);
              }
              const finalOrders = [...merged.values()];
              set({ orders: finalOrders });
              reconcileAllocationsWithOrders(finalOrders);
            }
          }
        } catch (e) {
          console.warn('Error hydrating from offline localDb:', e);
        }
      },

      retryOrderSync: async (orderId: string) => {
        await get().syncPendingOrders();
        return get().orders.find((order) => order.id === orderId)?.sync_status === 'synced';
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

      cancelOrder: ({ orderId, reason, isTest, actorName, actorRole, actorUsername }) => {
        const { orders } = get();
        const validation = validateAdminOrderLifecycle(orders, orderId, reason, actorRole);
        if (!validation.ok) {
          return { ok: false, error: validation.error };
        }

        const { target, cleanReason } = validation;
        const nowIso = new Date().toISOString();
        const restoredUnits = restoreOrderStockToAllocations(target);
        const isTargetTest =
          Boolean(isTest) ||
          target.is_test === true ||
          cleanReason.toLowerCase().includes('test') ||
          cleanReason.toLowerCase().includes('thử nghiệm');

        const updatedOrder: Order = {
          ...target,
          is_test: isTargetTest,
          sync_status: 'pending_sync',
          order_status: 'cancelled',
          cancelled_at: nowIso,
          cancelled_by: actorName,
          cancelled_by_role: actorRole || 'admin',
          cancellation_reason: cleanReason,
          updated_at: nowIso,
        };

        const updatedOrdersList = orders.map((o) => (o.id === orderId ? updatedOrder : o));
        set({
          orders: updatedOrdersList,
        });
        reconcileAllocationsWithOrders(updatedOrdersList);

        syncOrderToLocalDb(orderId, {
          is_test: isTargetTest,
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
        isTest,
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
        const recordSuffix = target.order_number.replace(/^(HKTS|EM)-?/i, '') || String(Date.now()).slice(-4);
        const refundRecordNumber = `RF-${recordSuffix}`;
        const isTargetTest =
          Boolean(isTest) ||
          target.is_test === true ||
          cleanReason.toLowerCase().includes('test') ||
          cleanReason.toLowerCase().includes('thử nghiệm');

        const updatedOrder: Order = {
          ...target,
          is_test: isTargetTest,
          sync_status: 'pending_sync',
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

        const updatedOrdersList = orders.map((o) => (o.id === orderId ? updatedOrder : o));
        set({
          orders: updatedOrdersList,
        });
        reconcileAllocationsWithOrders(updatedOrdersList);

        syncOrderToLocalDb(orderId, {
          is_test: isTargetTest,
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
      name: 'eventmate_orders_state_v6',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!Array.isArray(state.orders)) {
          state.orders = [];
        } else {
          state.orders = state.orders.map((o) =>
            o.order_status
              ? o
              : {
                  ...o,
                  order_status: o.payment_status === 'refunded' ? 'refunded' : 'completed',
                }
          );
        }
        // Ensure activeBankConfig has valid values & valid VietQR bank code (CTG -> ICB)
        try {
          if (typeof window !== 'undefined') {
            if (state.activeBankConfig?.accountNo === '0988776655') {
              state.activeBankConfig = DEFAULT_BANK_CONFIG;
              localStorage.removeItem('eventmate_shared_bank_config');
            }
            const savedBank = localStorage.getItem('eventmate_shared_bank_config');
            if (savedBank) {
              const parsed = JSON.parse(savedBank);
              if (parsed?.bankId && parsed?.accountNo && parsed.accountNo !== '0988776655') {
                const fixedBank = {
                  ...DEFAULT_BANK_CONFIG,
                  ...parsed,
                  bankId: normalizeVietQrBankId(parsed.bankId),
                  apiToken: parsed.apiToken || DEFAULT_BANK_CONFIG.apiToken,
                };
                state.activeBankConfig = fixedBank;
                if (parsed.bankId !== fixedBank.bankId) {
                  localStorage.setItem('eventmate_shared_bank_config', JSON.stringify(fixedBank));
                }
              } else {
                state.activeBankConfig = DEFAULT_BANK_CONFIG;
              }
            } else if (!state.activeBankConfig || !state.activeBankConfig.accountNo || state.activeBankConfig.accountNo === '0988776655') {
              state.activeBankConfig = DEFAULT_BANK_CONFIG;
            } else {
              state.activeBankConfig = {
                ...state.activeBankConfig,
                bankId: normalizeVietQrBankId(state.activeBankConfig.bankId),
                apiToken: state.activeBankConfig.apiToken || DEFAULT_BANK_CONFIG.apiToken,
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
