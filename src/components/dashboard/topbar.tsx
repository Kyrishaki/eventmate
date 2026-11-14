'use client';

import * as React from 'react';
import { useAuthStore, getVietnameseRoleLabel } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SyncStatusBadge } from '@/components/ui/sync-status-badge';
import { fetchCloudSnapshot } from '@/lib/cloud-sync';
import { Badge } from '@/components/ui/badge';
import { getActiveNavItem } from './nav-config';
import { LogOut, User as UserIcon, Eye, ChevronDown, ArrowLeft } from 'lucide-react';
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
  const { user, previousUser, logout, exitCollabPreview } = useAuthStore();
  const { syncState, unsyncedOrdersCount, activeWorkspace } = useWorkspaceStore();

  const activeNav = React.useMemo(() => getActiveNavItem(pathname), [pathname]);
  const PageIcon = activeNav.icon;
  const pageTitle = title || tNav(activeNav.labelKey);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-surface/95 backdrop-blur-sm px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs print:hidden">
      {/* Left: Dynamic Context Header */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
        {/* Mobile Brand Icon (< md) */}
        <Link href="/dashboard" className="md:hidden shrink-0 flex items-center" title="Về Tổng quan">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="HikaruStore Logo"
            className="h-8 w-auto max-w-[36px] object-contain"
          />
        </Link>

        {/* Desktop/Tablet Active Page Icon (md+) */}
        <div className="hidden md:flex w-8 h-8 rounded-lg bg-surface-hover text-primary items-center justify-center shrink-0 border border-border">
          <PageIcon className="w-4 h-4" />
        </div>

        {/* Dynamic Page Title & Mobile Open Menu Button */}
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm sm:text-[15px] text-foreground leading-tight truncate">
            {pageTitle}
          </span>
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-primary leading-none mt-0.5 text-left truncate cursor-pointer"
            >
              <span>HikaruStore · Menu</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Sync Status, Language, Theme, Guest Preview, Profile & Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <SyncStatusBadge
          status={syncState}
          pendingCount={unsyncedOrdersCount}
          onClick={() => {
            fetchCloudSnapshot();
          }}
        />

        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
        </div>

        <ThemeToggle />

        {/* Return to Admin from Collab Preview */}
        {user?.role === 'collab_partner' && previousUser && (
          <button
            type="button"
            onClick={() => {
              exitCollabPreview();
              router.push('/dashboard');
            }}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-bold bg-red-500/15 dark:bg-red-950/60 border border-red-500/40 text-red-600 dark:text-red-300 hover:bg-red-500/25 transition-colors cursor-pointer"
            title="Thoát chế độ xem thử Collab và trở lại tài khoản Quản trị"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trở lại Quản trị</span>
            <span className="sm:hidden">Thoát</span>
          </button>
        )}

        {/* View as Guest Button */}
        <button
          type="button"
          onClick={() => {
            useAuthStore.getState().enterGuestPreview();
          }}
          className="hidden lg:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-semibold border border-border dark:border-border text-muted dark:text-muted hover:text-foreground dark:hover:text-white hover:bg-surface-hover dark:hover:bg-surface-hover transition-colors cursor-pointer"
          title="Xem thử giao diện Gian hàng Khách xem (Chỉ xem sản phẩm & Keep đồ)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Gian hàng Khách</span>
        </button>

        {/* User Account & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-border">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:pointer-events-none w-7 h-7 rounded-full bg-surface-hover text-foreground flex items-center justify-center text-xs font-semibold shrink-0 cursor-pointer md:cursor-default"
            aria-label="Tài khoản"
          >
            {user?.fullName?.charAt(0) || <UserIcon className="w-3.5 h-3.5 text-muted" />}
          </button>

          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-foreground leading-tight truncate max-w-[120px]">
              {user?.fullName || 'Thành viên ban tổ chức'}
            </p>
            <div className="flex items-center gap-1">
              {user?.role === 'collab_partner' ? (
                <Badge variant="warning" className="text-[9px] px-1 py-0 bg-[#FAF5FF] text-[#6B21A8] border-[#A855F7]/30 font-semibold">
                  {user?.collabPartnerName ? `Đối tác: ${user.collabPartnerName}` : 'Đối tác gian hàng'}
                </Badge>
              ) : (
                <Badge variant="neutral" className="text-[9px] px-1 py-0">
                  {getVietnameseRoleLabel(user?.role)}
                </Badge>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-1.5 text-muted hover:text-error hover:bg-error-bg rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
