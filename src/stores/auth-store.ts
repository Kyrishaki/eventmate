import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkspaceRole } from '@/types/database';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: WorkspaceRole;
  avatarUrl?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        id: 'user-owner',
        email: 'owner@eventmate.app',
        fullName: 'Chủ Gian Hàng',
        role: 'owner',
      },
      isAuthenticated: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'eventmate_auth_state_v3',
    }
  )
);
