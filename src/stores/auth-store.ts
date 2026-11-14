import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as React from 'react';
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
  sessionEpoch?: number;
  passwordVersion?: number;
  sessionPassword?: string;
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
  sessionEpoch?: number;
  passwordVersion?: number;
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

// Bảng tài khoản Quản trị & Đối tác mặc định — giữ nguyên tên đăng nhập & mật khẩu, không đảo ngẫu nhiên
export const MASTER_ACCOUNTS: UserAccount[] = [
  {
    id: 'admin-tuan',
    username: 'Tuanadminvippro666',
    email: 'tuanadmin@eventmate.app',
    password: 'Tu@n1121314151',
    passwordVersion: 1,
    sessionEpoch: 1,
    fullName: 'Tuấn Quản Trị Hệ Thống',
    role: 'owner',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'admin-hkt',
    username: 'HKT87@123',
    email: 'hkt87@eventmate.app',
    password: 'HKT@997804',
    passwordVersion: 1,
    sessionEpoch: 1,
    fullName: 'HKT Quản Trị Cấp Cao',
    role: 'owner',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'collab-genz',
    username: 'collab_genz',
    email: 'collab@genzfashion.vn',
    password: 'Collab@123',
    passwordVersion: 1,
    sessionEpoch: 1,
    fullName: 'Đối Tác GenZ Official',
    role: 'collab_partner',
    collabPartnerName: 'GenZ Official',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export function getVietnameseRoleLabel(role?: WorkspaceRole | string | null): string {
  if (!role) return 'Khách xem';
  switch (role) {
    case 'owner':
      return 'Quản trị tối cao';
    case 'admin':
      return 'Quản trị viên';
    case 'manager':
      return 'Quản lý quầy';
    case 'cashier':
      return 'Thu ngân';
    case 'inventory_staff':
      return 'Nhân viên kho';
    case 'collab_partner':
      return 'Đối tác gian hàng';
    case 'viewer':
      return 'Khách xem';
    default:
      return role;
  }
}

/**
 * Helper to get the human-readable password for displaying or copying in the Admin Staff list
 */
export function getDisplayPassword(account?: UserAccount | null): string {
  if (!account) return '';
  if (account.password && !account.password.startsWith('hash:')) {
    return account.password;
  }
  if (account.id === 'admin-tuan' || account.username?.toLowerCase() === 'tuanadminvippro666') {
    return 'Tu@n1121314151';
  }
  if (
    account.id === 'admin-hkt' ||
    account.username?.toLowerCase() === 'hkt87@123' ||
    account.username?.toLowerCase() === 'hkt83@123'
  ) {
    return 'HKT@997804';
  }
  if (account.id === 'collab-genz' || account.username?.toLowerCase() === 'collab_genz') {
    return 'Collab@123';
  }
  return account.password || '';
}

/**
 * Generate a friendly, clear, high-security random password for staff re-use
 * Format: EM@ + 2 letters + 4 digits (e.g. EM@KT7829)
 */
export function generateStaffPassword(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const l1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const l2 = letters.charAt(Math.floor(Math.random() * letters.length));
  const n1 = digits.charAt(Math.floor(Math.random() * digits.length));
  const n2 = digits.charAt(Math.floor(Math.random() * digits.length));
  const n3 = digits.charAt(Math.floor(Math.random() * digits.length));
  const n4 = digits.charAt(Math.floor(Math.random() * digits.length));
  return `EM@${l1}${l2}${n1}${n2}${n3}${n4}`;
}

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
  enterCollabPreview: (partnerName: string, boothId?: string) => void;
  exitCollabPreview: () => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  forceLogoutSession: (accountId: string) => void;

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
  updateAccountCredentials: (data: {
    accountId: string;
    username: string;
    password?: string;
    fullName?: string;
    role?: WorkspaceRole;
    email?: string;
    collabPartnerName?: string;
    collabBoothId?: string;
  }) => { success: boolean; message?: string };
  randomizeAccountCredentials: (data: {
    accountId: string;
    newPassword?: string;
    newFullName?: string;
    newRole?: WorkspaceRole;
  }) => { success: boolean; newPassword?: string; message?: string };
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
        const isMatch =
          found.password === password ||
          found.password === inputHash ||
          (found.password.startsWith('hash:') && found.password === inputHash) ||
          (found.id === 'admin-tuan' && (password === 'Tu@n1121314151' || inputHash === 'hash:558f1e4a')) ||
          (found.id === 'admin-hkt' &&
            (password === 'HKT@997804' || password === 'HKT@998304' || inputHash === 'hash:1a7415b5' || inputHash === 'hash:d36d654f')) ||
          (found.id === 'collab-genz' && (password === 'Collab@123' || inputHash === 'hash:15fb0680'));

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
          sessionEpoch: found.sessionEpoch || Date.now(),
          passwordVersion: found.passwordVersion ?? 1,
          sessionPassword: found.password,
        };

        set({
          user: authUser,
          isAuthenticated: true,
          isGuestPreview: false,
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

      enterCollabPreview: (partnerName: string, boothId?: string) => {
        const current = get().user;
        const cleanPartner = partnerName.trim() || 'Đối tác Collab';
        const cleanSlug = cleanPartner.toLowerCase().replace(/[^a-z0-9]/g, '');
        const collabUser: AuthUser = {
          id: boothId ? `collab-${boothId}` : `collab-${Date.now()}`,
          username: `collab_${cleanSlug || 'user'}`,
          fullName: `Đối tác ${cleanPartner}`,
          role: 'collab_partner',
          collabPartnerName: cleanPartner,
          collabBoothId: boothId,
        };

        set({
          previousUser:
            current && current.role !== 'collab_partner' && current.role !== 'viewer'
              ? current
              : get().previousUser,
          user: collabUser,
          isAuthenticated: true,
          isGuestPreview: false,
        });
      },

      exitCollabPreview: () => {
        const prev = get().previousUser;
        if (prev) {
          set({
            user: prev,
            isAuthenticated: true,
            previousUser: null,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
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
          password: data.password,
          fullName: data.fullName.trim() || cleanUsername,
          role: data.role,
          collabPartnerName: data.collabPartnerName?.trim() || undefined,
          collabBoothId: data.collabBoothId?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        set({ accounts: [newAccount, ...accounts] });
        return { success: true };
      },

      updateAccountCredentials: (data) => {
        const { accounts, user } = get();
        // Permission check
        if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
          return {
            success: false,
            message: 'Phân quyền từ chối: Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa tài khoản và mật khẩu.',
          };
        }

        const cleanUsername = data.username.trim();
        if (!cleanUsername) {
          return { success: false, message: 'Tên đăng nhập không được để trống.' };
        }

        const target = accounts.find((a) => a.id === data.accountId);
        if (!target) {
          return { success: false, message: 'Không tìm thấy tài khoản cần chỉnh sửa.' };
        }

        // Check duplicate username with other accounts
        const isDuplicate = accounts.some(
          (a) => a.id !== data.accountId && a.username.toLowerCase() === cleanUsername.toLowerCase()
        );
        if (isDuplicate) {
          return { success: false, message: `Tên đăng nhập "${cleanUsername}" đã được sử dụng bởi tài khoản khác.` };
        }

        const cleanPassword = data.password?.trim();
        if (cleanPassword !== undefined && cleanPassword.length > 0 && cleanPassword.length < 4) {
          return { success: false, message: 'Mật khẩu phải từ 4 ký tự trở lên.' };
        }

        const cleanFullName = data.fullName !== undefined ? data.fullName.trim() : target.fullName;
        const cleanEmail = data.email !== undefined ? data.email.trim() : target.email;
        const cleanRole = data.role || target.role;

        const isPasswordChanged = !!cleanPassword && cleanPassword !== target.password;
        const newVersion = isPasswordChanged ? (target.passwordVersion ?? 1) + 1 : target.passwordVersion ?? 1;
        const newEpoch = isPasswordChanged ? Date.now() : target.sessionEpoch;

        const updatedAccounts: UserAccount[] = accounts.map((acc) => {
          if (acc.id !== data.accountId) return acc;
          return {
            ...acc,
            username: cleanUsername,
            fullName: cleanFullName || cleanUsername,
            email: cleanEmail,
            role: cleanRole,
            password: cleanPassword ? cleanPassword : acc.password,
            passwordVersion: newVersion,
            sessionEpoch: newEpoch,
            collabPartnerName:
              data.collabPartnerName !== undefined ? data.collabPartnerName.trim() || undefined : acc.collabPartnerName,
            collabBoothId:
              data.collabBoothId !== undefined ? data.collabBoothId.trim() || undefined : acc.collabBoothId,
          };
        });

        const isCurrentSession = user && user.id === data.accountId;

        if (isPasswordChanged) {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            try {
              const bc = new BroadcastChannel('eventmate_auth_events');
              bc.postMessage({
                type: 'FORCE_LOGOUT_ACCOUNT',
                accountId: target.id,
                username: target.username,
                newSessionEpoch: newEpoch,
              });
              bc.close();
            } catch {}
          }

          if (isCurrentSession) {
            set({
              accounts: updatedAccounts,
              user: null,
              isAuthenticated: false,
            });
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login?reason=password_changed';
            }
            return { success: true };
          }
        }

        let updatedUser: AuthUser | null = user;
        if (isCurrentSession) {
          updatedUser = {
            ...user,
            username: cleanUsername,
            fullName: cleanFullName || cleanUsername,
            email: cleanEmail,
            role: cleanRole,
            collabPartnerName:
              data.collabPartnerName !== undefined ? data.collabPartnerName.trim() || undefined : user.collabPartnerName,
            collabBoothId:
              data.collabBoothId !== undefined ? data.collabBoothId.trim() || undefined : user.collabBoothId,
          };
        }

        set({
          accounts: updatedAccounts,
          user: updatedUser,
        });

        return { success: true };
      },

      forceLogoutSession: (accountId: string) => {
        const { user } = get();
        if (user && user.id === accountId) {
          set({ user: null, isAuthenticated: false, previousUser: null });
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login?reason=forced_logout';
          }
        }
      },

      randomizeAccountCredentials: (data) => {
        if (data.accountId === 'admin-tuan' || data.accountId === 'admin-hkt') {
          return {
            success: false,
            message: 'Tài khoản Quản trị viên (Admin) không được phép đảo ngẫu nhiên.',
          };
        }
        const { accounts, user } = get();
        if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
          return {
            success: false,
            message: 'Phân quyền từ chối: Chỉ Quản trị viên (Admin) mới có quyền đảo mật khẩu tài khoản.',
          };
        }

        const target = accounts.find((a) => a.id === data.accountId);
        if (!target) {
          return { success: false, message: 'Không tìm thấy tài khoản cần đảo mật khẩu.' };
        }

        const generatedPassword = data.newPassword?.trim() || generateStaffPassword();
        const newSessionEpoch = Date.now();
        const cleanFullName = data.newFullName?.trim() || target.fullName;
        const cleanRole = data.newRole || target.role;

        const updatedAccounts = accounts.map((acc) => {
          if (acc.id !== data.accountId) return acc;
          return {
            ...acc,
            password: generatedPassword,
            sessionEpoch: newSessionEpoch,
            fullName: cleanFullName,
            role: cleanRole,
          };
        });

        // Broadcast force logout signal to peers and local tabs
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const bc = new BroadcastChannel('eventmate_auth_events');
            bc.postMessage({
              type: 'FORCE_LOGOUT_ACCOUNT',
              accountId: target.id,
              username: target.username,
              newSessionEpoch,
            });
            bc.close();
          } catch {
            // ignore
          }
        }

        // If currently logged in as this account on this machine, log out immediately
        let updatedUser: AuthUser | null = user;
        let shouldLogoutCurrent = false;
        if (user && user.id === data.accountId) {
          shouldLogoutCurrent = true;
          updatedUser = null;
        }

        set({
          accounts: updatedAccounts,
          user: updatedUser,
          isAuthenticated: shouldLogoutCurrent ? false : get().isAuthenticated,
        });

        if (shouldLogoutCurrent && typeof window !== 'undefined') {
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?reason=forced_logout';
          }
        }

        return { success: true, newPassword: generatedPassword };
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
      name: 'eventmate_auth_state_v8',
      onRehydrateStorage: () => (state) => {
        const masterIds = new Set(MASTER_ACCOUNTS.map((m) => m.id));
        if (typeof window !== 'undefined') {
          try {
            const legacyRaw =
              localStorage.getItem('eventmate_auth_state_v8') ||
              localStorage.getItem('eventmate_auth_state_v7') ||
              localStorage.getItem('eventmate_auth_state_v6') ||
              localStorage.getItem('eventmate_auth_state_v5') ||
              localStorage.getItem('eventmate_auth_state_v4');
            if (legacyRaw && state) {
              const legacyParsed = JSON.parse(legacyRaw);
              const legacyUser = legacyParsed?.state?.user;
              if (legacyUser && !state.user && masterIds.has(legacyUser.id)) {
                state.user = {
                  ...legacyUser,
                };
                state.isAuthenticated = true;
              }
              if (legacyParsed?.state?.accounts && Array.isArray(legacyParsed.state.accounts) && legacyParsed.state.accounts.length > 0) {
                state.accounts = legacyParsed.state.accounts;
              }
            }
            localStorage.removeItem('eventmate_auth_state_v7');
            localStorage.removeItem('eventmate_auth_state_v6');
            localStorage.removeItem('eventmate_auth_state_v5');
            localStorage.removeItem('eventmate_auth_state_v4');
          } catch {
            // ignore
          }
        }
        if (!state) return;

        // 1. Chuẩn hóa accounts và bảo đảm tài khoản Quản trị & Đối tác luôn tồn tại với mật khẩu chuẩn
        const accounts: UserAccount[] = (state.accounts || []).map((acc) => {
          let plainPass = acc.password;
          if (plainPass === 'hash:558f1e4a') plainPass = 'Tu@n1121314151';
          if (plainPass === 'hash:1a7415b5' || plainPass === 'hash:d36d654f') plainPass = 'HKT@997804';
          if (plainPass === 'hash:15fb0680') plainPass = 'Collab@123';
          return {
            ...acc,
            password: plainPass,
            passwordVersion: acc.passwordVersion ?? 1,
          };
        });

        MASTER_ACCOUNTS.forEach((master) => {
          const idx = accounts.findIndex(
            (a) =>
              a.id === master.id ||
              a.username.toLowerCase() === master.username.toLowerCase() ||
              (master.id === 'admin-hkt' &&
                (a.id === 'admin-hkt' ||
                  a.username.toLowerCase() === 'hkt87@123' ||
                  a.username.toLowerCase() === 'hkt83@123'))
          );
          if (idx >= 0) {
            accounts[idx] = {
              ...accounts[idx],
              id: master.id,
              username: master.username,
              fullName: accounts[idx].fullName || master.fullName,
              role: master.role,
              password: accounts[idx].password || master.password,
              passwordVersion: accounts[idx].passwordVersion ?? master.passwordVersion ?? 1,
              collabPartnerName: master.collabPartnerName || accounts[idx].collabPartnerName,
              collabBoothId: master.collabBoothId || accounts[idx].collabBoothId,
            };
          } else {
            accounts.push(master);
          }
        });

        state.accounts = accounts;

        // 2. KIỂM TRA PHIÊN ĐĂNG NHẬP KHI TẢI LẠI TRANG (F5):
        //    Giữ nguyên phiên đăng nhập trừ khi mật khẩu tài khoản bị thay đổi!
        if (state.isAuthenticated && state.user) {
          if (state.isGuestPreview || state.user.role === 'viewer') {
            return;
          }

          const matched = accounts.find(
            (a) =>
              a.id === state.user?.id ||
              (state.user?.username && a.username.toLowerCase() === state.user.username.toLowerCase())
          );

          if (!matched) {
            state.user = null;
            state.isAuthenticated = false;
          } else {
            const versionMismatch =
              state.user.passwordVersion !== undefined &&
              matched.passwordVersion !== undefined &&
              state.user.passwordVersion !== matched.passwordVersion;
            const passwordMismatch =
              state.user.sessionPassword !== undefined &&
              matched.password !== undefined &&
              state.user.sessionPassword !== matched.password;

            if (versionMismatch || passwordMismatch) {
              state.user = null;
              state.isAuthenticated = false;
              if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login?reason=password_changed';
              }
            } else {
              // MẬT KHẨU KHÔNG THAY ĐỔI -> GIỮ NGUYÊN PHIÊN ĐĂNG NHẬP
              state.user = {
                ...state.user,
                id: matched.id,
                username: matched.username,
                email: matched.email,
                fullName: matched.fullName,
                role: matched.role,
                collabPartnerName: matched.collabPartnerName,
                collabBoothId: matched.collabBoothId,
                passwordVersion: matched.passwordVersion ?? 1,
                sessionPassword: matched.password,
              };
              state.isAuthenticated = true;
            }
          }
        }
      },
    }
  )
);

// Cross-tab and window session revocation listener via BroadcastChannel
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    const authBc = new BroadcastChannel('eventmate_auth_events');
    authBc.onmessage = (event) => {
      if (event.data?.type === 'FORCE_LOGOUT_ACCOUNT') {
        const { accountId, username } = event.data;
        const current = useAuthStore.getState();
        if (
          current.user &&
          (current.user.id === accountId ||
            current.user.username?.toLowerCase() === username.toLowerCase())
        ) {
          current.logout();
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?reason=forced_logout';
          }
        }
      }
    };
  } catch {
    // ignore
  }
}

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

const emptySubscribe = () => () => {};

export function useAuthHydrated(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => useAuthStore.persist?.hasHydrated?.() ?? true,
    () => false
  );
}
