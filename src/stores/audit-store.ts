import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { AuditLogEntry, AuditActionType, AuditActorRole } from '@/types/database';

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

interface AuditStoreState {
  logs: AuditLogEntry[];
  addLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  deleteLog: (logId: string) => void;
  markLogRolledBack: (logId: string, actorName: string) => void;
  clearLogs: () => void;
  resetToDefaultLogs: () => void;
}

const safeAuditStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Ignore storage quota errors for audit logs so user actions never crash
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

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
        // Keep the latest 250 audit logs to preserve storage
        const updated = [newEntry, ...currentLogs].slice(0, 250);
        set({ logs: updated });
      },

      deleteLog: (logId: string) => {
        const { logs } = get();
        set({ logs: logs.filter((l) => l.id !== logId) });
      },

      markLogRolledBack: (logId: string, actorName: string) => {
        const { logs } = get();
        const nowIso = new Date().toISOString();
        const updated = logs.map((l) =>
          l.id === logId
            ? {
                ...l,
                is_rolled_back: true,
                rolled_back_at: nowIso,
                rolled_back_by: actorName,
              }
            : l
        );
        set({ logs: updated });
      },

      clearLogs: () => {
        set({ logs: [] });
      },

      resetToDefaultLogs: () => {
        set({ logs: INITIAL_AUDIT_LOGS });
      },
    }),
    {
      name: 'eventmate_audit_logs_v3',
      storage: createJSONStorage(() => safeAuditStorage),
      onRehydrateStorage: () => () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('eventmate_audit_logs_v1');
            localStorage.removeItem('eventmate_audit_logs_v2');
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
