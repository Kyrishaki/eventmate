'use client';

import * as React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DensityToggle } from '@/components/ui/density-toggle';
import { SyncStatusBadge } from '@/components/ui/sync-status-badge';
import { Badge } from '@/components/ui/badge';
import { getActiveNavItem } from './nav-config';
import { LogOut, User as UserIcon, Eye, ChevronDown } from 'lucide-react';
import { useRouter, usePathname, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface TopbarProps {
  onOpenMobileMenu?: () => void;
  title?: string;
}

export function Topbar({ onOpenMobileMenu, title }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const { user, logout } = useAuthStore();
  const { syncState, unsyncedOrdersCount, activeWorkspace } = useWorkspaceStore();

  const activeNav = React.useMemo(() => getActiveNavItem(pathname), [pathname]);
  const PageIcon = activeNav.icon;
  const pageTitle = title || tNav(activeNav.labelKey);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <header className="h-14 sm:h-16 border-b border-[#E8E8E5] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs print:hidden">
      {/* Left: Dynamic Context Header (Mobile: Logo + Title + Workspace pill | Desktop/Tablet: Icon + Page Title) */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Brand Icon (< md) */}
        <Link href="/dashboard" className="md:hidden shrink-0 flex items-center" title="Về Tổng quan">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="HikaruStore Logo"
            className="h-9 w-auto max-w-[44px] object-contain"
          />
        </Link>

        {/* Desktop/Tablet Active Page Icon (md+) */}
        <div className="hidden md:flex w-8 h-8 rounded-[8px] bg-[#EBF1EE] text-[#315C4C] items-center justify-center shrink-0">
          <PageIcon className="w-4 h-4" />
        </div>

        {/* Dynamic Page Title & Tappable Mobile Workspace Chip */}
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm sm:text-[15px] text-[#202124] leading-tight truncate">
            {pageTitle}
          </span>
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden inline-flex items-center gap-1 text-[10.5px] font-medium text-[#737373] hover:text-[#315C4C] leading-none mt-0.5 text-left truncate max-w-[160px] cursor-pointer"
              title="Đổi không gian hoặc mở menu"
            >
              <span className="truncate">{activeWorkspace?.name || 'HikaruStore'}</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Sync Status, Language, Theme, Scale, Guest Preview, Profile & Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <SyncStatusBadge status={syncState} pendingCount={unsyncedOrdersCount} />

        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <DensityToggle />
        </div>

        <ThemeToggle />

        {/* View as Guest Button */}
        <button
          type="button"
          onClick={() => {
            useAuthStore.getState().enterGuestPreview();
          }}
          className="hidden lg:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] text-xs font-semibold border border-[#315C4C]/30 text-[#315C4C] hover:bg-[#EBF1EE] transition-colors cursor-pointer"
          title="Xem thử giao diện Gian hàng Khách xem (Chỉ xem sản phẩm & Keep đồ)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Gian hàng Khách</span>
        </button>

        {/* User Account & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-[#E8E8E5]">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:pointer-events-none w-7 h-7 rounded-full bg-[#F0F0ED] text-[#202124] flex items-center justify-center text-xs font-semibold shrink-0 cursor-pointer md:cursor-default"
            aria-label="Tài khoản"
          >
            {user?.fullName?.charAt(0) || <UserIcon className="w-3.5 h-3.5 text-[#737373]" />}
          </button>

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
            className="p-1.5 text-[#737373] hover:text-[#C44536] hover:bg-[#FDF1F0] rounded-[4px] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
