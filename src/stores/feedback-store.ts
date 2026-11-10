import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logActivity } from './audit-store';

export type FeedbackType = 'bug' | 'feature' | 'ux' | 'other';
export type FeedbackSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

export interface FeedbackItem {
  id: string;
  workspace_id?: string;
  type: FeedbackType;
  title: string;
  description: string;
  module: string;
  severity: FeedbackSeverity;
  status: FeedbackStatus;
  screenshot_url?: string | null;
  page_url?: string;
  device_info?: {
    browser?: string;
    os?: string;
    screen?: string;
    user_agent?: string;
  };
  reporter_name?: string;
  reporter_role?: string;
  reporter_email?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

interface FeedbackStoreState {
  items: FeedbackItem[];
  submitFeedback: (data: Omit<FeedbackItem, 'id' | 'status' | 'created_at' | 'updated_at'>) => FeedbackItem;
  updateStatus: (id: string, status: FeedbackStatus, adminNotes?: string) => void;
  updateAdminNotes: (id: string, notes: string) => void;
  deleteFeedback: (id: string) => void;
  clearAllFeedback: () => void;
}

// Sample initial feedback for instant realistic demonstration
const initialSampleFeedback: FeedbackItem[] = [
  {
    id: 'fb-001',
    type: 'bug',
    title: 'F5 trang POS quầy bán bị reset làm báo hết hàng',
    description: 'Khi bán hàng tại quầy và ấn F5 tải lại trang, mã quầy được chọn bị trống dẫn tới hàng báo hết hàng. Cần lưu quầy vào bộ nhớ trình duyệt để tải lại không bị mất.',
    module: 'POS Bán hàng',
    severity: 'critical',
    status: 'resolved',
    page_url: 'https://eventmate-wheat-psi.vercel.app/pos',
    reporter_name: 'Thu ngân Quầy A (Long)',
    reporter_role: 'cashier',
    admin_notes: 'Đã fix thành công: Lưu selectedBoothId và selectedEventId vào localStorage kèm cơ chế tự khôi phục dữ liệu.',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'fb-002',
    type: 'feature',
    title: 'Hỗ trợ tính tiền thối tự động khi khách trả tiền mặt',
    description: 'Khách hay đưa 500k hoặc 1 triệu cho các đơn 350k, thu ngân cần ô nhập nhanh số tiền khách đưa để máy tự tính tiền cần thối lại tránh nhầm lẫn trong lúc đông khách.',
    module: 'Thanh toán & Đơn hàng',
    severity: 'high',
    status: 'resolved',
    page_url: 'https://eventmate-wheat-psi.vercel.app/pos',
    reporter_name: 'Alex Rivera (Tour Lead)',
    reporter_role: 'manager',
    admin_notes: 'Đã thêm modal thanh toán tiền mặt với các nút gợi ý tiền 100k, 200k, 500k và tự động tính tiền thối kèm cảnh báo thiếu tiền.',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'fb-003',
    type: 'feature',
    title: 'Cho phép chụp ảnh sản phẩm bằng điện thoại để up lên',
    description: 'Đối tác mang hàng đến tại sự kiện muốn chụp ngay ảnh thật của sản phẩm từ camera điện thoại để đưa vào quầy bán thay vì phải copy link ảnh trên mạng.',
    module: 'Sản phẩm & Biến thể',
    severity: 'medium',
    status: 'resolved',
    page_url: 'https://eventmate-wheat-psi.vercel.app/dashboard/products',
    reporter_name: 'Trần Bảo Minh',
    reporter_role: 'admin',
    admin_notes: 'Đã tích hợp camera capture và thư viện ảnh từ điện thoại có nén ảnh tự động bằng HTML5 Canvas siêu nhẹ.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'fb-004',
    type: 'ux',
    title: 'Thêm giao diện Tối (Dark Mode) khi bán hàng ban đêm',
    description: 'Các buổi concert biểu diễn ban đêm sân khấu rất tối, ánh sáng trắng của màn hình POS gây chói mắt thu ngân. Mong có nút đổi sang Dark Mode.',
    module: 'Giao diện & Hiển thị',
    severity: 'medium',
    status: 'resolved',
    page_url: 'https://eventmate-wheat-psi.vercel.app/dashboard',
    reporter_name: 'Lê Thu Trang',
    reporter_role: 'cashier',
    admin_notes: 'Đã hoàn thiện hệ thống theme Sáng / Tối đồng bộ cho cả Dashboard, POS và Cổng Collab.',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'fb-005',
    type: 'feature',
    title: 'Góp ý: Xuất báo cáo doanh thu ra file Excel / PDF cuối ngày',
    description: 'Cần có nút tải xuống file bảng tính Excel để đối soát doanh thu từng nhân viên ca sáng và ca chiều sau khi bế mạc sự kiện.',
    module: 'Báo cáo & Thống kê',
    severity: 'medium',
    status: 'in_progress',
    page_url: 'https://eventmate-wheat-psi.vercel.app/dashboard/analytics',
    reporter_name: 'Tuấn Admin VIP Pro',
    reporter_role: 'owner',
    admin_notes: 'Đang lên kế hoạch phát triển cho bản cập nhật tiếp theo.',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const useFeedbackStore = create<FeedbackStoreState>()(
  persist(
    (set, get) => ({
      items: initialSampleFeedback,

      submitFeedback: (data) => {
        const newItem: FeedbackItem = {
          ...data,
          id: `fb-${Date.now()}`,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set({ items: [newItem, ...get().items] });

        // Log to audit log
        logActivity({
          actor_name: data.reporter_name || 'Người dùng / Thu ngân',
          actor_role: (data.reporter_role as any) || 'cashier',
          action_type: 'create',
          entity_type: 'system',
          entity_name: data.title,
          description: `Gửi ${data.type === 'bug' ? 'báo cáo lỗi' : 'góp ý cải thiện'}: "${data.title}" (${data.module}).`,
        });

        return newItem;
      },

      updateStatus: (id, status, adminNotes) => {
        set({
          items: get().items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  admin_notes: adminNotes !== undefined ? adminNotes : item.admin_notes,
                  updated_at: new Date().toISOString(),
                }
              : item
          ),
        });
      },

      updateAdminNotes: (id, notes) => {
        set({
          items: get().items.map((item) =>
            item.id === id
              ? { ...item, admin_notes: notes, updated_at: new Date().toISOString() }
              : item
          ),
        });
      },

      deleteFeedback: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      clearAllFeedback: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'eventmate_feedback_v1',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.items || state.items.length === 0) {
          state.items = initialSampleFeedback;
        }
      },
    }
  )
);
