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
    description: 'Không gian quản lý tour diễn cá nhân của ban nhạc Hạc Cầm',
    is_collab: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ws-collab-monsoon',
    name: 'Collab: Hạc Cầm x The Cassette @ Monsoon Fest',
    slug: 'collab-monsoon-fest',
    owner_id: 'user-artist-demo',
    currency: 'VND',
    description: 'Gian hàng hợp tác liên danh tại Lễ hội Âm nhạc Monsoon',
    is_collab: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ws-comiccon-popup',
    name: 'Gian hàng Pop-up @ Manga Comic Con',
    slug: 'manga-comic-con-2026',
    owner_id: 'user-artist-demo',
    currency: 'VND',
    description: 'Gian hàng merchandise tại hội chợ triển lãm',
    is_collab: true,
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
      setSyncState: (syncState) => set({ syncState }),
      setUnsyncedOrdersCount: (unsyncedOrdersCount) => set({ unsyncedOrdersCount }),
    }),
    {
      name: 'eventmate_workspace_state',
    }
  )
);
