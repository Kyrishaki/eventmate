import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PreorderReservation, PaymentMethod, AuditActorRole } from '@/types/database';
import { useDataStore } from './data-store';
import { useOrdersStore } from './orders-store';
import { logActivity } from './audit-store';

// Default pre-orders start empty (0 virtual pre-orders until user/guest creates them)
const INITIAL_PREORDERS: PreorderReservation[] = [];

interface FulfillPreorderParams {
  preorderId: string;
  proofImageUrl: string;
  cashierName: string;
  cashierNotes?: string;
  paymentMethod?: PaymentMethod;
}

export interface CancelPreorderParams {
  preorderId: string;
  reason: string;
  actorName?: string;
  actorRole?: string;
}

interface PreorderStoreState {
  preorders: PreorderReservation[];

  // Pickup fulfillment with MANDATORY photo proof
  fulfillPreorder: (params: FulfillPreorderParams) => { success: boolean; message?: string };

  // Create new reservation
  createPreorder: (data: Omit<PreorderReservation, 'id' | 'code' | 'created_at' | 'updated_at'>) => PreorderReservation;

  // Cancel / Reject reservation and release held stock back to available warehouse
  cancelPreorder: (params: string | CancelPreorderParams) => { success: boolean; message?: string };

  // Reset demo
  resetDefaultPreorders: () => void;
}

export const usePreorderStore = create<PreorderStoreState>()(
  persist(
    (set, get) => ({
      preorders: INITIAL_PREORDERS,

      fulfillPreorder: (params) => {
        const { preorderId, proofImageUrl, cashierName, cashierNotes, paymentMethod } = params;

        // CRITICAL CHECK: Proof photo MUST be provided
        if (!proofImageUrl || !proofImageUrl.trim()) {
          return {
            success: false,
            message: 'BẮT BUỘC: Bạn phải chụp lại ảnh minh chứng nhận hàng trước khi xác nhận!',
          };
        }

        const { preorders } = get();
        const preorder = preorders.find((p) => p.id === preorderId);

        if (!preorder) {
          return { success: false, message: 'Không tìm thấy đơn đặt trước này.' };
        }

        if (preorder.status === 'picked_up') {
          return { success: false, message: 'Đơn này đã được xác nhận nhận hàng trước đó.' };
        }

        const nowIso = new Date().toISOString();

        // 1. Update status in preorder store
        const updatedPreorders = preorders.map((p) => {
          if (p.id === preorderId) {
            return {
              ...p,
              status: 'picked_up' as const,
              proof_image_url: proofImageUrl,
              picked_up_at: nowIso,
              picked_up_by: cashierName || 'Thu ngân quầy',
              notes: cashierNotes ? `${p.notes ? `${p.notes} | ` : ''}${cashierNotes}` : p.notes,
              updated_at: nowIso,
            };
          }
          return p;
        });

        set({ preorders: updatedPreorders });

        // 2. Decrement held stock and increment sold stock in data-store
        try {
          const dataStore = useDataStore.getState();
          const variants = dataStore.variants;
          const allocations = dataStore.allocations;

          // For each item in the preorder, reduce reserved/online held stock
          const updatedVariants = variants.map((v) => {
            const item = preorder.items.find((i) => i.variant_id === v.id);
            if (item) {
              if (preorder.preorder_type === 'vip_hold') {
                return {
                  ...v,
                  reserved_quantity: Math.max(0, (v.reserved_quantity || 0) - item.quantity),
                  updated_at: nowIso,
                };
              } else {
                return {
                  ...v,
                  online_preorder_quantity: Math.max(0, (v.online_preorder_quantity || 0) - item.quantity),
                  updated_at: nowIso,
                };
              }
            }
            return v;
          });

          // Increment sold quantity in allocations
          const updatedAllocations = allocations.map((alloc) => {
            const item = preorder.items.find((i) => i.variant_id === alloc.variant_id);
            if (item) {
              return {
                ...alloc,
                sold_quantity: alloc.sold_quantity + item.quantity,
                updated_at: nowIso,
              };
            }
            return alloc;
          });

          useDataStore.setState({
            variants: updatedVariants,
            allocations: updatedAllocations,
          });
        } catch (dataErr) {
          console.warn('Error adjusting inventory upon preorder pickup:', dataErr);
        }

        // 3. Create completed Order record with proof photo attached
        try {
          const ordersStore = useOrdersStore.getState();
          const orderId = `ord-pickup-${Date.now()}`;
          const orderNumber = `PU-${preorder.code.replace(/[^0-9]/g, '') || Date.now().toString().slice(-4)}`;

          const newOrder = {
            id: orderId,
            workspace_id: preorder.workspace_id,
            event_id: preorder.event_id || 'evt-hobby-horizon-2026',
            booth_id: preorder.booth_id || 'booth-a',
            cashier_id: cashierName || 'Thu ngân quầy',
            order_number: orderNumber,
            subtotal_amount: preorder.total_amount,
            discount_amount: 0,
            final_amount: preorder.total_amount,
            payment_method: paymentMethod || 'qr_manual',
            payment_status: 'completed' as const,
            sync_status: 'synced' as const,
            idempotency_key: `idem-${orderId}`,
            order_type: 'preorder_pickup' as const,
            proof_image_url: proofImageUrl,
            customer_name: preorder.customer_name,
            customer_phone: preorder.customer_phone,
            notes: `Trả hàng đặt trước #${preorder.code} cho khách ${preorder.customer_name}. Đã xác nhận kèm ảnh minh chứng.`,
            offline_created_at: nowIso,
            created_at: nowIso,
            updated_at: nowIso,
            items: preorder.items.map((i, idx) => ({
              id: `item-${orderId}-${idx}`,
              order_id: orderId,
              workspace_id: preorder.workspace_id,
              variant_id: i.variant_id,
              quantity: i.quantity,
              unit_price: i.unit_price,
              total_price: i.unit_price * i.quantity,
              created_at: nowIso,
            })),
          };

          ordersStore.orders = [newOrder, ...ordersStore.orders];
          useOrdersStore.setState({ orders: [newOrder, ...ordersStore.orders] });
        } catch (orderErr) {
          console.warn('Error creating completed order for preorder pickup:', orderErr);
        }

        // 4. Record Audit Log for Admin tracing
        logActivity({
          actor_name: cashierName || 'Thu ngân POS',
          actor_role: 'cashier',
          action_type: 'order_create',
          entity_type: 'order',
          entity_name: `Đơn Trả hàng #${preorder.code}`,
          description: `Thu ngân đã xác nhận trả hàng đặt trước #${preorder.code} cho khách "${preorder.customer_name}" (${preorder.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}) với ẢNH MINH CHỨNG đính kèm. Đã xuất kho thành công.`,
          changes: [
            { field: 'proof_photo', field_label: 'Minh chứng ảnh', new_value: 'Đã đính kèm ảnh chụp nhận hàng' },
            { field: 'status', field_label: 'Trạng thái', old_value: 'pending_pickup', new_value: 'picked_up' },
          ],
        });

        return { success: true };
      },

      createPreorder: (data) => {
        const id = `pre-${Date.now()}`;
        const prefix = data.preorder_type === 'vip_hold' ? 'PRE' : 'ONL';
        const code = `${prefix}-${Date.now().toString().slice(-4)}`;
        const nowIso = new Date().toISOString();

        const newPreorder: PreorderReservation = {
          ...data,
          id,
          code,
          created_at: nowIso,
          updated_at: nowIso,
        };

        const { preorders } = get();
        set({ preorders: [newPreorder, ...preorders] });
        return newPreorder;
      },

      cancelPreorder: (params) => {
        const preorderId = typeof params === 'string' ? params : params.preorderId;
        const reason = typeof params === 'string' ? 'Khách hoặc thu ngân hủy giữ chỗ' : params.reason;
        const actorName = typeof params === 'string' ? 'Thu ngân quầy' : params.actorName || 'Thu ngân quầy';
        const actorRole = (typeof params === 'string' ? 'cashier' : params.actorRole || 'cashier') as AuditActorRole;

        const { preorders } = get();
        const preorder = preorders.find((p) => p.id === preorderId);

        if (!preorder) {
          return { success: false, message: 'Không tìm thấy đơn đặt trước.' };
        }

        if (preorder.status === 'cancelled') {
          return { success: false, message: 'Đơn đặt trước này đã bị từ chối / hủy trước đó.' };
        }

        const wasPending = preorder.status === 'pending_pickup';
        const nowIso = new Date().toISOString();

        // 1. Update preorder status
        const updatedPreorders = preorders.map((p) => {
          if (p.id === preorderId) {
            return {
              ...p,
              status: 'cancelled' as const,
              cancelled_at: nowIso,
              cancelled_by: actorName,
              cancellation_reason: reason,
              notes: p.notes ? `${p.notes} | [ĐÃ TỪ CHỐI/HỦY: ${reason}]` : `[ĐÃ TỪ CHỐI/HỦY: ${reason}]`,
              updated_at: nowIso,
            };
          }
          return p;
        });

        set({ preorders: updatedPreorders });

        // 2. Release reserved stock back into available warehouse!
        if (wasPending) {
          try {
            const dataStore = useDataStore.getState();
            const variants = dataStore.variants;

            const updatedVariants = variants.map((v) => {
              const item = preorder.items.find((i) => i.variant_id === v.id);
              if (item) {
                if (preorder.preorder_type === 'vip_hold') {
                  return {
                    ...v,
                    reserved_quantity: Math.max(0, (v.reserved_quantity || 0) - item.quantity),
                    updated_at: nowIso,
                  };
                } else {
                  return {
                    ...v,
                    online_preorder_quantity: Math.max(0, (v.online_preorder_quantity || 0) - item.quantity),
                    updated_at: nowIso,
                  };
                }
              }
              return v;
            });

            useDataStore.setState({ variants: updatedVariants });
          } catch (err) {
            console.warn('Error releasing inventory upon preorder cancellation:', err);
          }
        }

        // 3. Record Audit Log for tracking
        logActivity({
          actor_name: actorName,
          actor_role: actorRole,
          action_type: 'stock_adjust',
          entity_type: 'order',
          entity_name: `Từ chối đơn #${preorder.code}`,
          booth_name: preorder.booth_id,
          description: `Thu ngân/Quản lý đã từ chối trả hàng / hủy giữ chỗ đơn #${preorder.code} của khách "${preorder.customer_name}". Lý do: "${reason}". Đã hoàn trả lại ${preorder.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')} về kho khả dụng.`,
          changes: [
            { field: 'status', field_label: 'Trạng thái', old_value: preorder.status, new_value: 'cancelled' },
            { field: 'cancellation_reason', field_label: 'Lý do từ chối', new_value: reason },
          ],
        });

        return { success: true };
      },

      resetDefaultPreorders: () => {
        set({ preorders: INITIAL_PREORDERS });
      },
    }),
    {
      name: 'eventmate_preorders_v4',
      onRehydrateStorage: () => () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('eventmate_preorders_v1');
            localStorage.removeItem('eventmate_preorders_v2');
            localStorage.removeItem('eventmate_preorders_v3');
          } catch {
            // ignore
          }
        }
      },
    }
  )
);
