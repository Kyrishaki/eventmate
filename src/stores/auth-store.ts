import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkspaceRole } from '@/types/database';

export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  fullName: string;
  role: WorkspaceRole;
  avatarUrl?: string | null;
  collabPartnerName?: string;
  collabBoothId?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  email?: string;
  password: string;
  fullName: string;
  role: WorkspaceRole;
  collabPartnerName?: string;
  collabBoothId?: string;
  createdAt: string;
}

function secureHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

// Pre-configured Primary Admin & Demo Accounts (hashed credentials to prevent plaintext exposure)
export const MASTER_ACCOUNTS: UserAccount[] = [
  {
    id: 'admin-tuan',
    username: 'Tuanadminvippro666',
    email: 'tuanadmin@eventmate.app',
    password: 'hash:558f1e4a',
    fullName: 'Tuấn Admin VIP Pro',
    role: 'owner',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'admin-hkt',
    username: 'HKT87@123',
    email: 'hkt87@eventmate.app',
    password: 'hash:1a7415b5',
    fullName: 'HKT Super Admin',
    role: 'owner',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

interface AuthState {
  user: AuthUser | null;
  previousUser: AuthUser | null;
  isGuestPreview: boolean;
  isAuthenticated: boolean;
  accounts: UserAccount[];

  // Auth actions
  login: (identifier: string, password: string) => { success: boolean; message?: string };
  loginAsGuest: () => void;
  enterGuestPreview: () => void;
  exitGuestPreview: () => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;

  // Staff Account Management (Admin only)
  createStaffAccount: (data: {
    username: string;
    password: string;
    fullName: string;
    role: WorkspaceRole;
    email?: string;
    collabPartnerName?: string;
    collabBoothId?: string;
  }) => { success: boolean; message?: string };
  deleteStaffAccount: (accountId: string) => void;

  // Permission guards
  canEditData: () => boolean;
  canManageTeam: () => boolean;
  canManageInventory: () => boolean;
  isCollabPartner: () => boolean;
  isViewerOnly: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // NEW VISITORS START WITH NO ACTIVE SESSION (user is null, isAuthenticated is false)
      user: null,
      previousUser: null,
      isGuestPreview: false,
      isAuthenticated: false,
      accounts: MASTER_ACCOUNTS,

      login: (identifier: string, password: string) => {
        const cleanId = identifier.trim().toLowerCase();
        const { accounts } = get();

        const found = accounts.find(
          (acc) =>
            acc.username.toLowerCase() === cleanId ||
            (acc.email && acc.email.toLowerCase() === cleanId)
        );

        if (!found) {
          return { success: false, message: 'Tên đăng nhập hoặc email không tồn tại trong hệ thống.' };
        }

        const inputHash = `hash:${secureHash(password)}`;
        const isMatch = found.password.startsWith('hash:')
          ? found.password === inputHash
          : found.password === password || found.password === inputHash;

        if (!isMatch) {
          return { success: false, message: 'Mật khẩu không chính xác.' };
        }

        // Set authenticated user
        const authUser: AuthUser = {
          id: found.id,
          username: found.username,
          email: found.email,
          fullName: found.fullName,
          role: found.role,
          collabPartnerName: found.collabPartnerName,
          collabBoothId: found.collabBoothId,
        };

        set({
          user: authUser,
          isAuthenticated: true,
        });

        return { success: true };
      },

      loginAsGuest: () => {
        const current = get().user;
        const guestUser: AuthUser = {
          id: 'guest-visitor',
          username: 'guest',
          fullName: 'Khách xem (Chỉ đọc)',
          role: 'viewer',
        };

        set({
          previousUser: current && current.role !== 'viewer' ? current : get().previousUser,
          user: guestUser,
          isAuthenticated: true,
          isGuestPreview: true,
        });
      },

      enterGuestPreview: () => {
        const current = get().user;
        const guestUser: AuthUser = {
          id: 'guest-visitor',
          username: 'guest',
          fullName: 'Khách xem (Chỉ đọc)',
          role: 'viewer',
        };

        set({
          previousUser: current && current.role !== 'viewer' ? current : get().previousUser,
          user: guestUser,
          isAuthenticated: true,
          isGuestPreview: true,
        });
      },

      exitGuestPreview: () => {
        const prev = get().previousUser;
        if (prev && prev.role !== 'viewer') {
          set({
            user: prev,
            isAuthenticated: true,
            isGuestPreview: false,
            previousUser: null,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isGuestPreview: false,
            previousUser: null,
          });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user, isGuestPreview: false }),

      logout: () => set({ user: null, isAuthenticated: false, isGuestPreview: false, previousUser: null }),

      createStaffAccount: (data) => {
        const cleanUsername = data.username.trim();
        if (!cleanUsername) {
          return { success: false, message: 'Tên đăng nhập không được để trống.' };
        }
        if (!data.password || data.password.length < 6) {
          return { success: false, message: 'Mật khẩu phải từ 6 ký tự trở lên.' };
        }

        const { accounts } = get();
        const exists = accounts.some(
          (a) => a.username.toLowerCase() === cleanUsername.toLowerCase()
        );

        if (exists) {
          return { success: false, message: `Tên đăng nhập "${cleanUsername}" đã được sử dụng.` };
        }

        const newAccount: UserAccount = {
          id: `staff-${Date.now()}`,
          username: cleanUsername,
          email: data.email?.trim() || `${cleanUsername.toLowerCase()}@eventmate.local`,
          password: `hash:${secureHash(data.password)}`,
          fullName: data.fullName.trim() || cleanUsername,
          role: data.role,
          collabPartnerName: data.collabPartnerName?.trim() || undefined,
          collabBoothId: data.collabBoothId?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        set({ accounts: [newAccount, ...accounts] });
        return { success: true };
      },

      deleteStaffAccount: (accountId) => {
        // Prevent deleting master admin accounts
        if (accountId === 'admin-tuan' || accountId === 'admin-hkt') {
          alert('Không thể xóa tài khoản Quản trị viên chính.');
          return;
        }
        const { accounts } = get();
        set({ accounts: accounts.filter((a) => a.id !== accountId) });
      },

      canEditData: () => {
        const role = get().user?.role;
        return role === 'owner' || role === 'admin' || role === 'manager' || role === 'collab_partner';
      },

      canManageTeam: () => {
        const role = get().user?.role;
        return role === 'owner' || role === 'admin';
      },

      canManageInventory: () => {
        const role = get().user?.role;
        return (
          role === 'owner' ||
          role === 'admin' ||
          role === 'manager' ||
          role === 'inventory_staff' ||
          role === 'collab_partner'
        );
      },

      isCollabPartner: () => {
        return get().user?.role === 'collab_partner';
      },

      isViewerOnly: () => {
        const role = get().user?.role;
        return !role || role === 'viewer';
      },
    }),
    {
      name: 'eventmate_auth_state_v5',
      onRehydrateStorage: () => (state) => {
        const masterIds = new Set(MASTER_ACCOUNTS.map((m) => m.id));
        if (typeof window !== 'undefined') {
          try {
            const legacyRaw = localStorage.getItem('eventmate_auth_state_v4');
            if (legacyRaw && state && !state.user) {
              const legacyParsed = JSON.parse(legacyRaw);
              const legacyUser = legacyParsed?.state?.user;
              if (legacyUser && masterIds.has(legacyUser.id)) {
                state.user = legacyUser;
                state.isAuthenticated = true;
              }
            }
            localStorage.removeItem('eventmate_auth_state_v4');
          } catch {
            // ignore
          }
        }
        if (!state) return;
        // Keep only valid accounts and ensure the 2 primary Admin accounts are always up-to-date
        state.accounts = state.accounts.filter((a) => a.id !== 'collab-genz');
        MASTER_ACCOUNTS.forEach((master) => {
          const idx = state.accounts.findIndex(
            (a) => a.id === master.id || a.username.toLowerCase() === master.username.toLowerCase()
          );
          if (idx >= 0) {
            state.accounts[idx] = {
              ...state.accounts[idx],
              password: master.password,
              role: master.role,
              collabPartnerName: master.collabPartnerName || state.accounts[idx].collabPartnerName,
              collabBoothId: master.collabBoothId || state.accounts[idx].collabBoothId,
            };
          } else {
            state.accounts.push(master);
          }
        });
      },
    }
  )
);

// Permission helper functions
export function canEditData(role?: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'admin' || role === 'manager' || role === 'collab_partner';
}

export function canManageTeam(role?: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Strict RBAC for order lifecycle mutations (Cancel/Void, Refund/Return):
 * ONLY Owner and Admin roles are permitted. Cashiers, Managers, Staff, Collab, Viewers cannot cancel or refund orders.
 */
export function canManageOrderLifecycle(role?: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Strict RBAC for sandbox / test data management & cleanup (in Settings):
 * ONLY Owner and Admin roles are permitted.
 */
export function canManageSandboxData(role?: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageInventory(role?: WorkspaceRole | null): boolean {
  return (
    role === 'owner' ||
    role === 'admin' ||
    role === 'manager' ||
    role === 'inventory_staff' ||
    role === 'collab_partner'
  );
}

export function isCollabPartner(role?: WorkspaceRole | null): boolean {
  return role === 'collab_partner';
}

export function isViewerOnly(role?: WorkspaceRole | null): boolean {
  return !role || role === 'viewer';
}

/**
 * Checks whether a user can edit/manage a product.
 * - Master Admin / Owner / Manager: full access across all products.
 * - Collab Partner: strictly can ONLY manage their own brand products (prod.collab_partner matches user.collabPartnerName).
 *   Master warehouse goods of Admin are strictly read-only.
 */
export function canManageProduct(
  user: AuthUser | null,
  productCollabPartner?: string | null
): boolean {
  if (!user) return false;
  if (user.role === 'owner' || user.role === 'admin' || user.role === 'manager') return true;
  if (user.role === 'collab_partner') {
    if (!productCollabPartner || !user.collabPartnerName) return false;
    return productCollabPartner.trim().toLowerCase() === user.collabPartnerName.trim().toLowerCase();
  }
  return false;
}
