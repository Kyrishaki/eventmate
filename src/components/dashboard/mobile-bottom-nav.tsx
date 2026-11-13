'use client';

import * as React from 'react';
import { usePathname, useRouter, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { WorkspaceSwitcher } from './workspace-switcher';
import { DensityToggle } from '@/components/ui/density-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  BOTTOM_PRIMARY_HREFS,
  getGroupedNavSections,
  isNavRouteActive,
} from './nav-config';
import {
  LayoutDashboard,
  Boxes,
  TabletSmartphone,
  ShoppingCart,
  LayoutGrid,
  X,
  Eye,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface MobileBottomNavProps {
  isMenuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
}

export function MobileBottomNav({
  isMenuOpen,
  onOpenMenu,
  onCloseMenu,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  const { user, logout } = useAuthStore();

  const isCollab = user?.role === 'collab_partner';
  const sections = React.useMemo(() => getGroupedNavSections(isCollab), [isCollab]);

  const isSecondaryRouteActive = React.useMemo(() => {
    return !BOTTOM_PRIMARY_HREFS.some((href) => isNavRouteActive(pathname, href));
  }, [pathname]);

  React.useEffect(() => {
    if (!isMenuOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMenu();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMenuOpen, onCloseMenu]);

  function handleLogout() {
    onCloseMenu();
    logout();
    router.push('/login');
  }

  const primaryTabs = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/inventory', label: t('inventory'), icon: Boxes },
  ];

  const trailingTab = {
    href: '/dashboard/orders',
    label: t('orders'),
    icon: ShoppingCart,
  };

  return (
    <>
      {/* Thumb-Zone Bottom Navigation Bar (Mobile < md) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-[#E8E8E5] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 px-1 print:hidden"
      >
        <div className="grid grid-cols-5 items-end max-w-lg mx-auto">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isNavRouteActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={onCloseMenu}
                className="flex flex-col items-center justify-center py-1 min-h-[52px] gap-0.5 select-none active:scale-95 transition-transform"
              >
                <span
                  className={cn(
                    'flex items-center justify-center px-3.5 py-1 rounded-full transition-colors',
                    active
                      ? 'bg-[#315C4C]/15 text-[#315C4C] dark:bg-[#3E7A65]/25 dark:text-[#5ED69D]'
                      : 'text-[#737373] hover:text-[#202124] dark:text-[#9BA1A6] dark:hover:text-white'
                  )}
                >
                  <Icon className="w-[19px] h-[19px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={cn(
                    'text-[10.5px] leading-tight truncate max-w-[68px]',
                    active ? 'font-bold text-[#315C4C] dark:text-[#5ED69D]' : 'font-medium text-[#737373] dark:text-[#9BA1A6]'
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* Center Elevated 1-Tap POS Action */}
          <Link
            href="/pos"
            onClick={onCloseMenu}
            className="flex flex-col items-center justify-center pb-1 min-h-[56px] gap-0.5 select-none active:scale-95 transition-transform"
          >
            <span className="flex items-center justify-center w-12 h-9 -mt-3 rounded-2xl bg-[#315C4C] dark:bg-[#3E7A65] text-amber-300 shadow-md ring-4 ring-white dark:ring-[#111215] border border-[#315C4C]/30">
              <TabletSmartphone className="w-5 h-5 text-amber-300" />
            </span>
            <span className="text-[10.5px] font-black text-[#315C4C] dark:text-[#5ED69D] leading-tight">
              {t('posShort')}
            </span>
          </Link>

          {/* Orders Tab */}
          {(() => {
            const Icon = trailingTab.icon;
            const active = isNavRouteActive(pathname, trailingTab.href);
            return (
              <Link
                href={trailingTab.href}
                onClick={onCloseMenu}
                className="flex flex-col items-center justify-center py-1 min-h-[52px] gap-0.5 select-none active:scale-95 transition-transform"
              >
                <span
                  className={cn(
                    'flex items-center justify-center px-3.5 py-1 rounded-full transition-colors',
                    active
                      ? 'bg-[#315C4C]/15 text-[#315C4C] dark:bg-[#3E7A65]/25 dark:text-[#5ED69D]'
                      : 'text-[#737373] hover:text-[#202124] dark:text-[#9BA1A6] dark:hover:text-white'
                  )}
                >
                  <Icon className="w-[19px] h-[19px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={cn(
                    'text-[10.5px] leading-tight truncate max-w-[68px]',
                    active ? 'font-bold text-[#315C4C] dark:text-[#5ED69D]' : 'font-medium text-[#737373] dark:text-[#9BA1A6]'
                  )}
                >
                  {trailingTab.label}
                </span>
              </Link>
            );
          })()}

          {/* All Features / More Sheet Trigger */}
          <button
            type="button"
            onClick={() => (isMenuOpen ? onCloseMenu() : onOpenMenu())}
            className="flex flex-col items-center justify-center py-1 min-h-[52px] gap-0.5 select-none active:scale-95 transition-transform cursor-pointer"
            aria-expanded={isMenuOpen}
            aria-label={t('moreMenu')}
          >
            <span
              className={cn(
                'relative flex items-center justify-center px-3.5 py-1 rounded-full transition-colors',
                isMenuOpen || isSecondaryRouteActive
                  ? 'bg-[#EBF1EE] text-[#315C4C]'
                  : 'text-[#737373] hover:text-[#202124]'
              )}
            >
              <LayoutGrid
                className="w-[19px] h-[19px]"
                strokeWidth={isMenuOpen || isSecondaryRouteActive ? 2.4 : 2}
              />
            </span>
            <span
              className={cn(
                'text-[10.5px] leading-tight',
                isMenuOpen || isSecondaryRouteActive
                  ? 'font-bold text-[#315C4C]'
                  : 'font-medium text-[#737373]'
              )}
            >
              {t('moreMenu')}
            </span>
          </button>
        </div>
      </nav>

      {/* Flutter-Style Slide-Up Bottom Sheet Menu (Mobile < md) */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-150"
            onClick={onCloseMenu}
          />

          {/* Sheet Surface */}
          <div className="relative bg-white dark:bg-neutral-900 rounded-t-[20px] border-t border-[#E8E8E5] shadow-2xl max-h-[86vh] flex flex-col animate-in slide-in-from-bottom-4 duration-200 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {/* Drag Handle */}
            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#D6D6D2]" />
            </div>

            {/* Sheet Header: User Info + Quick Close / Logout */}
            <div className="px-4 py-2.5 border-b border-[#E8E8E5] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#EBF1EE] text-[#315C4C] flex items-center justify-center text-sm font-bold shrink-0">
                  {user?.fullName?.charAt(0) || <UserIcon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#202124] truncate">
                    {user?.fullName || 'HikaruStore Crew'}
                  </p>
                  <p className="text-[11px] text-[#737373] capitalize truncate">
                    {user?.role === 'collab_partner' && user?.collabPartnerName
                      ? `Collab: ${user.collabPartnerName}`
                      : user?.role || 'owner'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold text-[#C44536] bg-[#FDF1F0] hover:opacity-90 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
                <button
                  type="button"
                  onClick={onCloseMenu}
                  className="p-2 rounded-full bg-[#F7F7F5] text-[#737373] hover:text-[#202124] cursor-pointer"
                  aria-label="Đóng menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4">
              {/* Workspace Switcher */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] px-0.5">
                  Không gian làm việc
                </span>
                <WorkspaceSwitcher />
              </div>

              {/* Categorized Launcher Tiles */}
              {sections.map((section) => (
                <div key={section.id} className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] px-0.5 block">
                    {t(section.labelKey)}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isNavRouteActive(pathname, item.href);
                      const label = t(item.shortLabelKey || item.labelKey);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onCloseMenu}
                          className={cn(
                            'relative flex flex-col items-center justify-center p-2.5 rounded-[12px] border text-center gap-1.5 min-h-[76px] active:scale-95 transition-all',
                            active
                              ? 'bg-[#EBF1EE] border-[#315C4C] shadow-2xs'
                              : 'bg-[#FAFAF8] border-[#E8E8E5] hover:bg-[#F0F0ED]'
                          )}
                        >
                          {item.badge && (
                            <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1 rounded bg-[#B7791F]/15 text-[#8C5D17] uppercase">
                              {item.badge}
                            </span>
                          )}
                          <div
                            className={cn(
                              'w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0',
                              active ? 'bg-[#315C4C] text-white' : item.tileToneClass
                            )}
                          >
                            <Icon className="w-[18px] h-[18px]" />
                          </div>
                          <span
                            className={cn(
                              'text-[11px] leading-tight line-clamp-1',
                              active ? 'font-bold text-[#315C4C]' : 'font-semibold text-[#202124]'
                            )}
                          >
                            {label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Guest Preview + Display Controls */}
              <div className="pt-2 border-t border-[#E8E8E5] space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onCloseMenu();
                    useAuthStore.getState().enterGuestPreview();
                  }}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] border border-[#315C4C]/30 bg-[#EBF1EE]/60 text-[#315C4C] text-xs font-bold cursor-pointer active:scale-[0.99]"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem thử Giao diện Gian hàng Khách</span>
                </button>

                <div className="flex items-center justify-between gap-2 p-2.5 rounded-[10px] bg-[#F7F7F5] border border-[#E8E8E5]">
                  <span className="text-[11px] font-semibold text-[#737373]">Hiển thị:</span>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <DensityToggle />
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
