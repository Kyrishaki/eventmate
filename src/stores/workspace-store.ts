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
  setSyncState: (state: SyncState) => void;
  setUnsyncedOrdersCount: (count: number) => void;
}

const defaultWorkspaces: Workspace[] = [
  {
    id: 'ws-hac-cam-studio',
    name: 'Hạc Cầm Studio Tour',
    slug: 'hac-cam-studio',
    owner_id: 'user-artist-demo',
    currency: 'VND',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ws-acoustic-live-2026',
    name: 'Acoustic Tour 2026',
    slug: 'acoustic-tour-2026',
    owner_id: 'user-artist-demo',
    currency: 'VND',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: defaultWorkspaces,
      activeWorkspace: defaultWorkspaces[0],
      syncState: 'online',
      unsyncedOrdersCount: 0,
      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      setSyncState: (syncState) => set({ syncState }),
      setUnsyncedOrdersCount: (unsyncedOrdersCount) => set({ unsyncedOrdersCount }),
    }),
    {
      name: 'eventmate_workspace_state',
    }
  )
);
