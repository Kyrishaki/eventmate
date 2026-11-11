import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuditLogEntry, AuditActionType, AuditActorRole } from '@/types/database';

// Pre-seeded realistic audit trail for demonstration & immediate traceability
const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-seed-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), // 8 minutes ago
    actor_name: 'Đối tác: GenZ Studio (Collab)',
    actor_role: 'collab_partner',
    action_type: 'collab_contribute',
    entity_type: 'product',
    entity_name: 'Set Standee & Keychain Hologram Limbus Company x GenZ Studio',
    booth_name: 'Gian Collab C08 — GenZ Studio x Limbus',
    event_name: 'Hobby Horizon 2026 - Anime & Game Festival',
    description: 'Đối tác "GenZ Studio" vừa đóng góp 80 set "Set Standee & Keychain Hologram Limbus Company" vào gian hàng Hobby Horizon. Tự giữ chỗ: 5, Đã đặt online: 15, Phân bổ bán tại quầy: 45.',
    changes: [
      { field: 'price', field_label: 'Giá niêm yết', new_value: '195.000 VND' },
      { field: 'quantity', field_label: 'Tổng kho mang đến', new_value: 80 },
      { field: 'reserved_quantity', field_label: 'Tự giữ trước (VIP)', new_value: 5 },
      { field: 'online_preorder_quantity', field_label: 'Đơn đặt mua online', new_value: 15 },
    ],
  },
  {
    id: 'log-seed-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    actor_name: 'Đối tác: GenZ Studio (Collab)',
    actor_role: 'collab_partner',
    action_type: 'stock_adjust',
    entity_type: 'inventory',
    entity_name: 'Keychain Acrylic 2 Lớp Limbus Company - 12 Sinners',
    booth_name: 'Gian Collab C08 — GenZ Studio x Limbus',
    event_name: 'Hobby Horizon 2026 - Anime & Game Festival',
    description: 'Đối tác "GenZ Studio" bổ sung thêm +10 sản phẩm "Keychain Acrylic 2 Lớp Limbus Company" vào quầy bán chung.',
    changes: [
      { field: 'restock_amount', field_label: 'Số lượng bổ sung', new_value: '+10' },
    ],
  },
  {
    id: 'log-seed-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    actor_name: 'Trần Thị Trợ Lý (Staff)',
    actor_role: 'staff',
    actor_username: 'troly_tranthi',
    action_type: 'preorder_adjust',
    entity_type: 'variant',
    entity_name: 'Figure Chibi Limbus Company - Don Quixote',
    booth_name: 'Gian A12 - HikaruStore Official (Artist Alley)',
    description: 'Nhân viên trợ lý cập nhật số lượng đặt trước cho Hobby Horizon: Giữ riêng VIP 5 hộp, Đơn online: 10 hộp.',
    changes: [
      { field: 'reserved_quantity', field_label: 'Tự giữ trước (VIP)', old_value: 3, new_value: 5 },
      { field: 'online_preorder_quantity', field_label: 'Đơn online', old_value: 10, new_value: 10 },
    ],
  },
  {
    id: 'log-seed-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(), // 1 hour ago
    actor_name: 'Thu ngân Gian A12 (Cashier)',
    actor_role: 'cashier',
    actor_username: 'cashier_a1',
    action_type: 'order_create',
    entity_type: 'order',
    entity_name: 'Đơn hàng #EM-7821',
    booth_name: 'Gian A12 - HikaruStore Official (Artist Alley)',
    description: 'Thu ngân Gian A12 tạo thành công đơn hàng #EM-7821 trị giá 210.000 VND (VietQR). Xuất 1x Standee Vergilius + 1x Keychain Don Quixote.',
    changes: [
      { field: 'final_amount', field_label: 'Giá trị đơn', new_value: '210.000 VND' },
      { field: 'payment_method', field_label: 'Thanh toán', new_value: 'VietQR' },
    ],
  },
  {
    id: 'log-seed-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    actor_name: 'Tuấn Admin VIP Pro (Owner)',
    actor_role: 'owner',
    actor_username: 'Tuanadminvippro666',
    action_type: 'user_create',
    entity_type: 'team_member',
    entity_name: 'Tài khoản thu ngân: cashier_a1',
    description: 'Admin cấp tài khoản mới "cashier_a1" với vai trò "Thu ngân (Cashier)" phục vụ kỳ lễ hội Hobby Horizon 2026.',
    changes: [
      { field: 'role', field_label: 'Vai trò cấp', new_value: 'cashier' },
      { field: 'username', field_label: 'Tên đăng nhập', new_value: 'cashier_a1' },
    ],
  },
  {
    id: 'log-seed-6',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    actor_name: 'Nguyễn Văn Staff (Inventory)',
    actor_role: 'inventory_staff',
    actor_username: 'staff_nguyen',
    action_type: 'stock_adjust',
    entity_type: 'inventory',
    entity_name: 'Standee Sa Bàn 3D Chuyến Xe Mephistopheles',
    booth_name: 'Kho Tổng Trung Tâm',
    description: 'Nhân viên kho điều chỉnh định mức phân bổ: Cấp 18 bộ Standee Sa Bàn Mephistopheles vào Gian A12 (Artist Alley).',
    changes: [
      { field: 'allocated_quantity', field_label: 'Số lượng phân bổ', old_value: 10, new_value: 18 },
    ],
  },
  {
    id: 'log-seed-7',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    actor_name: 'Tuấn Admin VIP Pro (Owner)',
    actor_role: 'owner',
    actor_username: 'Tuanadminvippro666',
    action_type: 'update',
    entity_type: 'product',
    entity_name: 'Standee Acrylic Limbus Company - E.G.O & Walpurgisnacht',
    description: 'Admin cập nhật danh mục sản phẩm mới cho kỳ lễ hội Hobby Horizon 2026.',
    changes: [
      { field: 'price', field_label: 'Giá niêm yết', old_value: '135.000 VND', new_value: '145.000 VND' },
    ],
  },
];

interface AuditStoreState {
  logs: AuditLogEntry[];
  addLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  deleteLog: (logId: string) => void;
  clearLogs: () => void;
  resetToDefaultLogs: () => void;
}

export const useAuditStore = create<AuditStoreState>()(
  persist(
    (set, get) => ({
      logs: INITIAL_AUDIT_LOGS,

      addLog: (entry) => {
        const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const timestamp = entry.timestamp || new Date().toISOString();
        const newEntry: AuditLogEntry = {
          ...entry,
          id,
          timestamp,
        };

        const currentLogs = get().logs || [];
        // Keep the latest 500 audit logs to preserve storage
        const updated = [newEntry, ...currentLogs].slice(0, 500);
        set({ logs: updated });
      },

      deleteLog: (logId: string) => {
        const { logs } = get();
        set({ logs: logs.filter((l) => l.id !== logId) });
      },

      clearLogs: () => {
        set({ logs: [] });
      },

      resetToDefaultLogs: () => {
        set({ logs: INITIAL_AUDIT_LOGS });
      },
    }),
    {
      name: 'eventmate_audit_logs_v2',
      onRehydrateStorage: () => () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('eventmate_audit_logs_v1');
          } catch {
            // ignore
          }
        }
      },
    }
  )
);

/**
 * Global helper to record an activity log from any component or action handler
 */
export function logActivity(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) {
  try {
    useAuditStore.getState().addLog(entry);
  } catch (error) {
    console.error('AuditLog error:', error);
  }
}
