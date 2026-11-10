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
}

export interface UserAccount {
  id: string;
  username: string;
  email?: string;
  password: string;
  fullName: string;
  role: WorkspaceRole;
  createdAt: string;
}

// Pre-configured Primary Admin Accounts as requested
export const MASTER_ACCOUNTS: UserAccount[] = [
  {
    id: 'admin-tuan',
    username: 'Tuanadminvippro666',
    email: 'tuanadmin@eventmate.app',
    password: 'Tu@n1121314151',
    fullName: 'Tuấn Admin VIP Pro',
    role: 'owner',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'admin-hkt',
    username: 'HKT87@123',
    email: 'hkt87@eventmate.app',
    password: 'HKT@997804',
    fullName: 'HKT Super Admin',
    role: 'owner',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  accounts: UserAccount[];

  // Auth actions
  login: (identifier: string, password: string) => { success: boolean; message?: string };
  loginAsGuest: () => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;

  // Staff Account Management (Admin only)
  createStaffAccount: (data: {
    username: string;
    password: string;
    fullName: string;
    role: WorkspaceRole;
    email?: string;
  }) => { success: boolean; message?: string };
  deleteStaffAccount: (accountId: string) => void;

  // Permission guards
  canEditData: () => boolean;
  canManageTeam: () => boolean;
  canManageInventory: () => boolean;
  isViewerOnly: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // NEW VISITORS START WITH NO ACTIVE SESSION (user is null, isAuthenticated is false)
      user: null,
      isAuthenticated: false,
      accounts: MASTER_ACCOUNTS,

      login: (identifier: string, password: string) => {
        const cleanId = identifier.trim().toLowerCase();
        const { accounts } = get();

        // Check in current accounts registry
        const found = accounts.find(
          (acc) =>
            acc.username.toLowerCase() === cleanId ||
            (acc.email && acc.email.toLowerCase() === cleanId)
        );

        if (!found) {
          return { success: false, message: 'Tên đăng nhập hoặc email không tồn tại trong hệ thống.' };
        }

        if (found.password !== password) {
          return { success: false, message: 'Mật khẩu không chính xác.' };
        }

        // Set authenticated user
        const authUser: AuthUser = {
          id: found.id,
          username: found.username,
          email: found.email,
          fullName: found.fullName,
          role: found.role,
        };

        set({
          user: authUser,
          isAuthenticated: true,
        });

        return { success: true };
      },

      loginAsGuest: () => {
        const guestUser: AuthUser = {
          id: 'guest-visitor',
          username: 'guest',
          fullName: 'Khách xem (Chỉ đọc)',
          role: 'viewer',
        };

        set({
          user: guestUser,
          isAuthenticated: true,
        });
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      logout: () => set({ user: null, isAuthenticated: false }),

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
          password: data.password,
          fullName: data.fullName.trim() || cleanUsername,
          role: data.role,
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
        return role === 'owner' || role === 'admin' || role === 'manager';
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
          role === 'inventory_staff'
        );
      },

      isViewerOnly: () => {
        const role = get().user?.role;
        return !role || role === 'viewer';
      },
    }),
    {
      name: 'eventmate_auth_state_v4',
    }
  )
);

// Permission helper functions
export function canEditData(role?: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'admin' || role === 'manager';
}

export function canManageTeam(role?: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageInventory(role?: WorkspaceRole | null): boolean {
  return role === 'owner' || role === 'admin' || role === 'manager' || role === 'inventory_staff';
}

export function isViewerOnly(role?: WorkspaceRole | null): boolean {
  return !role || role === 'viewer';
}
