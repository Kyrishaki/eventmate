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
  createWorkspace: (name: string, currency: string, isCollab?: boolean, description?: string) => Workspace;
  resetWorkspaces: () => void;
  setSyncState: (state: SyncState) => void;
  setUnsyncedOrdersCount: (count: number) => void;
}

const defaultWorkspaces: Workspace[] = [
  {
    id: 'ws-default',
    name: 'Gian hàng của tôi',
    slug: 'gian-hang-chinh',
    owner_id: 'user-owner',
    currency: 'VND',
    description: 'Không gian quản lý bán hàng và sự kiện chính',
    is_collab: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: defaultWorkspaces,
      activeWorkspace: defaultWorkspaces[0],
      syncState: 'online',
      unsyncedOrdersCount: 0,
      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      createWorkspace: (name, currency = 'VND', isCollab = false, description = '') => {
        const newWs: Workspace = {
          id: `ws-${Date.now()}`,
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          owner_id: 'user-artist-demo',
          currency,
          is_collab: isCollab,
          description: description || (isCollab ? 'Dự án Collab / Gian hàng hợp tác' : 'Không gian làm việc riêng'),
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
    }
  )
);
