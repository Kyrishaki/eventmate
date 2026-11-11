'use client';

import * as React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DensityToggle } from '@/components/ui/density-toggle';
import { SyncStatusBadge } from '@/components/ui/sync-status-badge';
import { Badge } from '@/components/ui/badge';
import { Menu, LogOut, User as UserIcon, Eye } from 'lucide-react';
import { useRouter } from '@/i18n/routing';

interface TopbarProps {
  onToggleSidebar: () => void;
  title?: string;
}

export function Topbar({ onToggleSidebar, title }: TopbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { syncState, unsyncedOrdersCount } = useWorkspaceStore();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <header className="h-12 sm:h-14 border-b border-[#E8E8E5] bg-white px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Menu & Current Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-[6px] text-[#737373] hover:text-[#202124] hover:bg-[#F7F7F5]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-sm font-semibold text-[#202124] tracking-tight truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Right: Sync Status, Language, Theme, Scale, Profile & Logout */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <SyncStatusBadge status={syncState} pendingCount={unsyncedOrdersCount} />

        <LanguageSwitcher />

        <ThemeToggle />

        <DensityToggle />

        {/* View as Guest Button */}
        <button
          type="button"
          onClick={() => {
            useAuthStore.getState().loginAsGuest();
          }}
          className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] text-xs font-semibold border border-[#315C4C]/30 text-[#315C4C] hover:bg-[#EBF1EE] transition-colors"
          title="Xem thử giao diện Gian hàng Khách xem (Chỉ xem sản phẩm & Keep đồ)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Gian hàng Khách</span>
        </button>

        {/* User Account & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E8E8E5]">
          <div className="w-7 h-7 rounded-full bg-[#F0F0ED] text-[#202124] flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.fullName?.charAt(0) || <UserIcon className="w-3.5 h-3.5 text-[#737373]" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-[#202124] leading-tight truncate max-w-[120px]">
              {user?.fullName || 'Artist Tour Crew'}
            </p>
            <div className="flex items-center gap-1">
              {user?.role === 'collab_partner' ? (
                <Badge variant="warning" className="text-[9px] px-1 py-0 bg-[#FAF5FF] text-[#6B21A8] border-[#A855F7]/30 font-semibold">
                  {user?.collabPartnerName ? `Collab: ${user.collabPartnerName}` : 'Collab Partner'}
                </Badge>
              ) : (
                <Badge variant="neutral" className="text-[9px] px-1 py-0 capitalize">
                  {user?.role || 'owner'}
                </Badge>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-1.5 text-[#737373] hover:text-[#C44536] hover:bg-[#FDF1F0] rounded-[4px] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
