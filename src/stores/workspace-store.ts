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

const defaultWorkspaces: Workspace[] = [
  {
    id: 'ws-hac-cam-studio',
    name: 'HikaruStore',
    slug: 'hikarustore',
    owner_id: 'user-artist-demo',
    currency: 'VND',
    description: 'Chuyên phân phối Keychain, Standee, Figure Anime & Game Limbus Company tại các kỳ lễ hội Hobby Horizon',
    is_collab: false,
    owner_name: 'Nguyễn Văn Tuấn',
    phone: '0988.776.655',
    email: 'contact@hikarustore.vn',
    address: 'Gian Hàng HikaruStore, Khu Artist Alley SECC, Q.7, TP. Hồ Chí Minh',
    social_link: 'https://zalo.me/0988776655',
    slogan: 'Chuyên cung cấp Keychain, Standee & Figure Anime - Game Limbus Company chính hãng',
    bank_name: 'ICB',
    bank_account_no: '109876880260',
    bank_account_name: 'NGUYEN BAO THUONG',
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
          owner_id: 'user-artist-demo',
          currency,
          is_collab: isCollab,
          description: description || (isCollab ? 'Dự án Collab / Gian hàng hợp tác' : 'Không gian làm việc riêng'),
          owner_name: get().activeWorkspace?.owner_name || 'Nguyễn Văn Tuấn',
          phone: get().activeWorkspace?.phone || '0988.776.655',
          email: get().activeWorkspace?.email || 'contact@hikarustore.vn',
          address: get().activeWorkspace?.address || 'Khu phức hợp Sự kiện, Q.1, TP. Hồ Chí Minh',
          social_link: get().activeWorkspace?.social_link || 'https://zalo.me/0988776655',
          slogan: get().activeWorkspace?.slogan || 'Chuyên cung cấp merchandise & phụ kiện concert anime chính hãng',
          bank_name: get().activeWorkspace?.bank_name || 'MB',
          bank_account_no: get().activeWorkspace?.bank_account_no || '0988776655',
          bank_account_name: get().activeWorkspace?.bank_account_name || 'NGUYEN VAN TUAN',
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
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Migrate legacy ws-default to ws-hac-cam-studio so workspace data always matches inventory
        if (state.activeWorkspace?.id === 'ws-default') {
          state.activeWorkspace = {
            ...state.activeWorkspace,
            id: 'ws-hac-cam-studio',
          };
        }
        if (state.workspaces) {
          state.workspaces = state.workspaces.map((w) =>
            w.id === 'ws-default' ? { ...w, id: 'ws-hac-cam-studio' } : w
          );
        }
        // Ensure default store profile details are populated if missing or old
        const defaultProfile = defaultWorkspaces[0];
        if (state.activeWorkspace) {
          state.activeWorkspace = {
            ...defaultProfile,
            ...state.activeWorkspace,
            name: state.activeWorkspace.name === 'Gian hàng của tôi' ? defaultProfile.name : state.activeWorkspace.name,
            owner_name: state.activeWorkspace.owner_name || defaultProfile.owner_name,
            phone: state.activeWorkspace.phone || defaultProfile.phone,
            email: state.activeWorkspace.email || defaultProfile.email,
            address: state.activeWorkspace.address || defaultProfile.address,
            social_link: state.activeWorkspace.social_link || defaultProfile.social_link,
            slogan: state.activeWorkspace.slogan || defaultProfile.slogan,
            bank_name: state.activeWorkspace.bank_account_no === '0988776655' ? defaultProfile.bank_name : (state.activeWorkspace.bank_name || defaultProfile.bank_name),
            bank_account_no: state.activeWorkspace.bank_account_no === '0988776655' ? defaultProfile.bank_account_no : (state.activeWorkspace.bank_account_no || defaultProfile.bank_account_no),
            bank_account_name: state.activeWorkspace.bank_account_no === '0988776655' ? defaultProfile.bank_account_name : (state.activeWorkspace.bank_account_name || defaultProfile.bank_account_name),
          };
        }
      },
    }
  )
);
