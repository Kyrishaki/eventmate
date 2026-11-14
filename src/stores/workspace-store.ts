import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace } from '@/types/database';
import { SyncState } from '@/components/ui/sync-status-badge';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  syncState: SyncState;
  unsyncedOrdersCount: number;
  setActiveWorkspace: (workspace: Workspace) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  updateWorkspaceProfile: (updates: Partial<Workspace>) => void;
  createWorkspace: (name: string, currency: string, isCollab?: boolean, description?: string) => Workspace;
  resetWorkspaces: () => void;
  setSyncState: (state: SyncState) => void;
  setUnsyncedOrdersCount: (count: number) => void;
}

// Keep the existing sync workspace identity; no sample profile or commerce data.
const defaultWorkspaces: Workspace[] = [{
  id: 'ws-hac-cam-studio', name: 'Workspace', slug: 'workspace', owner_id: '',
  currency: 'VND', created_at: '', updated_at: '',
}];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: defaultWorkspaces,
      activeWorkspace: defaultWorkspaces[0],
      syncState: 'online',
      unsyncedOrdersCount: 0,
      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      updateWorkspaceProfile: (updates: Partial<Workspace>) => {
        const current = get().activeWorkspace;
        if (!current) return;
        const updated: Workspace = {
          ...current,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        const all = get().workspaces.map((w) => (w.id === updated.id ? updated : w));
        set({
          activeWorkspace: updated,
          workspaces: all,
        });
      },
      createWorkspace: (name, currency = 'VND', isCollab = false, description = '') => {
        const newWs: Workspace = {
          id: `ws-${Date.now()}`,
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          owner_id: '',
          currency,
          is_collab: isCollab,
          description: description || (isCollab ? 'Dự án Collab / Gian hàng hợp tác' : 'Không gian làm việc riêng'),
          owner_name: get().activeWorkspace?.owner_name || '',
          phone: get().activeWorkspace?.phone || '',
          email: get().activeWorkspace?.email || '',
          address: get().activeWorkspace?.address || '',
          social_link: get().activeWorkspace?.social_link || '',
          slogan: get().activeWorkspace?.slogan || '',
          bank_name: get().activeWorkspace?.bank_name || 'MB',
          bank_account_no: get().activeWorkspace?.bank_account_no || '',
          bank_account_name: get().activeWorkspace?.bank_account_name || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const updated = [...get().workspaces, newWs];
        set({
          workspaces: updated,
          activeWorkspace: newWs,
        });
        return newWs;
      },
      resetWorkspaces: () => set({ workspaces: defaultWorkspaces, activeWorkspace: defaultWorkspaces[0] }),
      setSyncState: (syncState) => set({ syncState }),
      setUnsyncedOrdersCount: (unsyncedOrdersCount) => set({ unsyncedOrdersCount }),
    }),
    {
      name: 'eventmate_workspace_state_v3',
      // Keep persisted workspace identity and profile exactly as stored.
    }
  )
);
