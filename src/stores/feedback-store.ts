import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logActivity } from './audit-store';
import { AuditActorRole } from '@/types/database';

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

const initialSampleFeedback: FeedbackItem[] = [];

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
          actor_role: (data.reporter_role as AuditActorRole) || 'cashier',
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
      name: 'eventmate_feedback_v2',
      onRehydrateStorage: () => () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('eventmate_feedback_v1');
          } catch {
            // ignore
          }
        }
      },
    }
  )
);
