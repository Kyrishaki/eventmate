'use client';

import * as React from 'react';
import { usePathname, Link } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { getGroupedNavSections, isNavRouteActive } from './nav-config';
import {
  X,
  PanelLeftClose,
  PanelLeftOpen,
  TabletSmartphone,
} from 'lucide-react';

interface SidebarProps {
  /** Tablet overlay drawer state (md to < lg) */
  isOpen?: boolean;
  onClose?: () => void;
  onOpenDrawer?: () => void;
  /** Desktop rail-collapse preference (lg+) */
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  isOpen = false,
  onClose,
  onOpenDrawer,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isCollab = user?.role === 'collab_partner';
  const sections = React.useMemo(() => getGroupedNavSections(isCollab), [isCollab]);

  const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'T';
  const userDisplayName = user?.fullName || 'Tài khoản';
  const userRoleDisplay = user?.role === 'owner' ? 'Chủ sở hữu' : user?.role === 'collab_partner' ? 'Đối tác Collab' : 'Quản trị';

  return (
    <>
      {/* Tablet Drawer Backdrop */}
      {isOpen && (
        <div
          className="hidden md:block lg:hidden fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
          onClick={onClose}
        />
      )}

      {/* Admin Sidebar Navigation Frame (matching AdminNav.dc.html) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col justify-between transition-all duration-200 select-none print:hidden',
          'bg-surface text-foreground border-r border-border font-sans',
          isOpen ? 'md:w-[240px] md:shadow-2xl lg:shadow-none' : 'md:w-[76px]',
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-[240px]',
          'hidden md:flex'
        )}
      >
        <div className="flex flex-col flex-1 min-h-0 p-3.5 gap-3.5">
          {/* Logo Header */}
          <div className="flex items-center justify-between px-2 shrink-0 h-12">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex items-center gap-2.5 text-foreground group min-w-0"
              title="HikaruStore Quản trị"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Logo HikaruStore"
                className="w-10 h-10 object-contain shrink-0 transition-transform group-hover:scale-105"
              />
              <div
                className={cn(
                  'flex-col min-w-0',
                  isOpen ? 'md:flex' : 'md:hidden',
                  isCollapsed ? 'lg:hidden' : 'lg:flex'
                )}
              >
                <span className="text-[17px] font-bold tracking-tight text-foreground truncate">
                  HikaruStore
                </span>
                <span className="text-[12px] text-muted leading-none mt-0.5">
                  Quản trị
                </span>
              </div>
            </Link>

            {/* Close / Collapse triggers */}
            {isOpen && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="hidden md:flex lg:hidden p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover cursor-pointer"
                aria-label="Đóng menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {onToggleCollapse && !isCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                aria-label="Thu gọn thanh điều hướng"
                title="Thu gọn thanh điều hướng"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick POS Launch Button */}
          <div
            className={cn(
              isOpen ? 'md:block' : 'md:hidden',
              isCollapsed ? 'lg:hidden' : 'lg:block'
            )}
          >
            <Link
              href="/pos"
              className="h-10 px-3 rounded-lg bg-surface-hover hover:bg-border text-primary border border-border hover:border-primary/40 text-[13.5px] font-semibold flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2">
                <TabletSmartphone className="w-4 h-4" />
                <span>Mở bán hàng POS</span>
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">
                POS
              </span>
            </Link>
          </div>

          {/* Expand Trigger in Rail Mode */}
          <div
            className={cn(
              'justify-center pt-1',
              isOpen ? 'md:hidden' : 'md:flex',
              isCollapsed ? 'lg:flex' : 'lg:hidden'
            )}
          >
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  onToggleCollapse?.();
                } else {
                  onOpenDrawer?.();
                }
              }}
              className="w-10 h-10 rounded-lg bg-surface-hover text-muted hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              title="Mở rộng menu"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>

          {/* Categorized Navigation Sections (Matching AdminNav 4 groups) */}
          <nav className="flex-1 overflow-y-auto space-y-4 pr-0.5 custom-scrollbar">
            {sections.map((section) => (
              <div key={section.id} className="flex flex-col gap-1">
                {/* Group Title */}
                <div
                  className={cn(
                    'px-3 pb-1 text-[11px] font-bold tracking-wider uppercase text-muted',
                    isOpen ? 'md:block' : 'md:hidden',
                    isCollapsed ? 'lg:hidden' : 'lg:block'
                  )}
                >
                  {section.defaultLabel}
                </div>

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavRouteActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      title={item.defaultLabel}
                      className={cn(
                        'h-11 px-3 rounded-lg text-sm flex items-center transition-colors select-none',
                        isActive
                          ? 'bg-surface-hover text-foreground font-semibold'
                          : 'text-muted hover:text-foreground hover:bg-surface-hover/60 font-normal',
                        isOpen ? 'md:justify-between' : 'md:justify-center md:px-0',
                        isCollapsed ? 'lg:justify-center lg:px-0' : 'lg:justify-between'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-primary' : 'text-muted')} />
                        <span
                          className={cn(
                            'truncate',
                            isOpen ? 'md:inline' : 'md:hidden',
                            isCollapsed ? 'lg:hidden' : 'lg:inline'
                          )}
                        >
                          {item.defaultLabel}
                        </span>
                      </div>

                      {/* Badge if present */}
                      {item.badge && (
                        <span
                          className={cn(
                            'min-w-[20px] h-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold inline-flex items-center justify-center shrink-0',
                            isOpen ? 'md:inline-flex' : 'md:hidden',
                            isCollapsed ? 'lg:hidden' : 'lg:inline-flex'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Area: User profile chip */}
        <div
          className={cn(
            'p-3.5 border-t border-border flex flex-col gap-3 shrink-0',
            isOpen ? 'md:flex' : 'md:hidden',
            isCollapsed ? 'lg:hidden' : 'lg:flex'
          )}
        >
          {/* User Profile Chip (Initial Avatar + Name + Role) */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              aria-hidden="true"
              className="w-9 h-9 rounded-full bg-surface-hover text-foreground flex items-center justify-center text-[14px] font-bold shrink-0 border border-border"
            >
              {userInitial}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[13.5px] font-semibold text-foreground truncate">
                {userDisplayName}
              </span>
              <span className="text-[12px] text-muted truncate">
                {userRoleDisplay}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
