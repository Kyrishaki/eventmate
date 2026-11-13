'use client';

import * as React from 'react';
import { usePathname, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { cn } from '@/lib/utils';
import { WorkspaceSwitcher } from './workspace-switcher';
import { getGroupedNavSections, isNavRouteActive } from './nav-config';
import {
  TabletSmartphone,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Users2,
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
  const t = useTranslations('nav');
  const { user } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();

  const isCollab = user?.role === 'collab_partner';
  const sections = React.useMemo(() => getGroupedNavSections(isCollab), [isCollab]);

  return (
    <>
      {/* Tablet Drawer Backdrop (md to < lg when expanded) */}
      {isOpen && (
        <div
          className="hidden md:block lg:hidden fixed inset-0 bg-black/35 backdrop-blur-[1px] z-40"
          onClick={onClose}
        />
      )}

      {/* Adaptive NavigationRail (md / collapsed lg) <-> NavigationDrawer (lg / open md) */}
      <aside
        className={cn(
          'hidden md:flex fixed inset-y-0 left-0 z-50 bg-white dark:bg-neutral-900 border-r border-[#E8E8E5] flex-col justify-between transition-[width,box-shadow] duration-200 select-none print:hidden',
          isOpen ? 'md:w-64 md:shadow-2xl lg:shadow-none' : 'md:w-[76px]',
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-64'
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header & Brand + Collapse/Expand Toggle */}
          <div
            className={cn(
              'h-14 sm:h-16 border-b border-[#E8E8E5] flex items-center shrink-0',
              isOpen ? 'md:px-4 md:justify-between' : 'md:px-2 md:justify-center',
              isCollapsed ? 'lg:px-2 lg:justify-center' : 'lg:px-4 lg:justify-between'
            )}
          >
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex items-center gap-2.5 text-[#202124] group min-w-0"
              title="HikaruStore"
            >
              <div className="h-10 w-auto flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="HikaruStore Logo"
                  className="h-10 w-auto max-w-[48px] object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <div
                className={cn(
                  'flex-col min-w-0',
                  isOpen ? 'md:flex' : 'md:hidden',
                  isCollapsed ? 'lg:hidden' : 'lg:flex'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[15px] tracking-tight text-[#202124] truncate">
                    HikaruStore
                  </span>
                  <span className="text-[9px] text-[#737373] border border-[#E8E8E5] px-1 rounded font-mono font-semibold shrink-0">
                    v1.0
                  </span>
                </div>
                <span className="text-[10.5px] text-[#737373] leading-none mt-0.5 truncate">
                  Event Merchandise
                </span>
              </div>
            </Link>

            {/* Tablet Close Button (when tablet drawer is expanded) */}
            {isOpen && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="hidden md:flex lg:hidden p-1.5 rounded-[6px] text-[#737373] hover:text-[#202124] hover:bg-[#F0F0ED] cursor-pointer"
                aria-label="Thu gọn menu"
                title="Thu gọn thành thanh icon"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Desktop Collapse Toggle Button (when expanded) */}
            {onToggleCollapse && !isCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-[6px] text-[#737373] hover:text-[#202124] hover:bg-[#F0F0ED] transition-colors cursor-pointer"
                aria-label="Thu gọn thanh bên"
                title="Thu gọn thanh điều hướng (chế độ Icon Rail)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Expand Trigger in Rail Mode (Desktop collapsed or Tablet rail) */}
          <div
            className={cn(
              'px-2 pt-2 justify-center',
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
              className="w-12 h-9 rounded-[8px] border border-[#E8E8E5] bg-[#F7F7F5] hover:bg-[#EBF1EE] text-[#737373] hover:text-[#315C4C] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Mở rộng thanh điều hướng"
              title="Mở rộng thanh điều hướng"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace Switcher (Expanded) / Compact Avatar Pill (Rail) */}
          <div
            className={cn(
              'border-b border-[#E8E8E5]',
              isOpen ? 'md:p-3' : 'md:p-2',
              isCollapsed ? 'lg:p-2' : 'lg:p-3'
            )}
          >
            <div
              className={cn(
                isOpen ? 'md:block' : 'md:hidden',
                isCollapsed ? 'lg:hidden' : 'lg:block'
              )}
            >
              <WorkspaceSwitcher />
            </div>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  onToggleCollapse?.();
                } else {
                  onOpenDrawer?.();
                }
              }}
              title={`Không gian: ${activeWorkspace?.name || 'HikaruStore'} (Nhấn để chuyển)`}
              className={cn(
                'mx-auto w-11 h-10 rounded-[8px] border border-[#E8E8E5] bg-[#F7F7F5] hover:bg-[#EBF1EE] items-center justify-center transition-colors cursor-pointer',
                isOpen ? 'md:hidden' : 'md:flex',
                isCollapsed ? 'lg:flex' : 'lg:hidden'
              )}
            >
              <span
                className={cn(
                  'w-7 h-7 rounded-[6px] text-white flex items-center justify-center text-xs font-bold',
                  activeWorkspace?.is_collab ? 'bg-red-600' : 'bg-amber-500 text-neutral-950 font-black'
                )}
              >
                {activeWorkspace?.is_collab ? (
                  <Users2 className="w-3.5 h-3.5" />
                ) : (
                  activeWorkspace?.name.charAt(0) || 'H'
                )}
              </span>
            </button>
          </div>

          {/* Primary 1-Click POS Terminal Launch at reachable top zone */}
          <div
            className={cn(
              'border-b border-[#E8E8E5] dark:border-neutral-800',
              isOpen ? 'md:px-3 md:py-2.5' : 'md:px-2 md:py-2',
              isCollapsed ? 'lg:px-2 lg:py-2' : 'lg:px-3 lg:py-2.5'
            )}
          >
            <Link
              href="/pos"
              onClick={onClose}
              title={t('posTerminal')}
              className={cn(
                'flex items-center rounded-[8px] bg-amber-500 text-neutral-950 hover:bg-amber-400 font-black transition-all shadow-xs active:scale-[0.98] border border-amber-600/20',
                isOpen
                  ? 'md:flex-row md:justify-between md:px-3 md:py-2.5'
                  : 'md:flex-col md:justify-center md:px-1 md:py-2 md:gap-0.5',
                isCollapsed
                  ? 'lg:flex-col lg:justify-center lg:px-1 lg:py-2 lg:gap-0.5'
                  : 'lg:flex-row lg:justify-between lg:px-3 lg:py-2.5'
              )}
            >
              <div
                className={cn(
                  'flex items-center min-w-0',
                  isOpen ? 'md:flex-row md:gap-2.5' : 'md:flex-col md:gap-0.5',
                  isCollapsed ? 'lg:flex-col lg:gap-0.5' : 'lg:flex-row lg:gap-2.5'
                )}
              >
                <TabletSmartphone className="w-4 h-4 shrink-0 text-neutral-950" />
                <span
                  className={cn(
                    'font-black leading-tight truncate text-xs',
                    isOpen ? 'md:inline' : 'md:hidden',
                    isCollapsed ? 'lg:hidden' : 'lg:inline'
                  )}
                >
                  {t('posTerminal')}
                </span>
                <span
                  className={cn(
                    'font-black leading-tight truncate text-[10px]',
                    isOpen ? 'md:hidden' : 'md:inline',
                    isCollapsed ? 'lg:inline' : 'lg:hidden'
                  )}
                >
                  {t('posShort')}
                </span>
              </div>
              <span
                className={cn(
                  'text-[9.5px] bg-red-600 px-1.5 py-0.5 rounded text-white font-mono font-black shrink-0 shadow-2xs',
                  isOpen ? 'md:inline-block' : 'md:hidden',
                  isCollapsed ? 'lg:hidden' : 'lg:inline-block'
                )}
              >
                POS
              </span>
            </Link>
          </div>

          {/* Categorized Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-2.5 space-y-3 px-2">
            {sections.map((section, idx) => (
              <div key={section.id} className="space-y-1">
                {/* Group Header (Expanded) */}
                <div
                  className={cn(
                    'px-2.5 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8C8C88]',
                    isOpen ? 'md:block' : 'md:hidden',
                    isCollapsed ? 'lg:hidden' : 'lg:block'
                  )}
                >
                  {t(section.labelKey)}
                </div>

                {/* Group Divider (Rail Mode) */}
                {idx > 0 && (
                  <div
                    className={cn(
                      'mx-3 my-1.5 border-t border-[#E8E8E5]',
                      isOpen ? 'md:hidden' : 'md:block',
                      isCollapsed ? 'lg:block' : 'lg:hidden'
                    )}
                  />
                )}

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavRouteActive(pathname, item.href);
                  const fullLabel = t(item.labelKey);
                  const shortLabel = t(item.shortLabelKey || item.labelKey);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      title={fullLabel}
                      className={cn(
                        'group flex items-center transition-colors select-none rounded-[8px]',
                        isOpen
                          ? cn(
                              'md:flex-row md:gap-2.5 md:px-2.5 md:py-2',
                              isActive
                                ? 'md:bg-amber-500/15 md:text-amber-800 dark:md:text-amber-300 md:font-bold md:border-l-2 md:border-amber-500'
                                : 'md:bg-transparent md:text-[#5F6368] dark:md:text-neutral-400 md:hover:text-[#202124] dark:md:hover:text-neutral-100 md:hover:bg-[#F7F7F5] dark:md:hover:bg-neutral-800/60'
                            )
                          : 'md:flex-col md:justify-center md:px-1 md:py-1 md:gap-0.5 md:bg-transparent',
                        isCollapsed
                          ? 'lg:flex-col lg:justify-center lg:px-1 lg:py-1 lg:gap-0.5 lg:bg-transparent'
                          : cn(
                              'lg:flex-row lg:gap-2.5 lg:px-2.5 lg:py-2',
                              isActive
                                ? 'lg:bg-amber-500/15 lg:text-amber-800 dark:lg:text-amber-300 lg:font-bold lg:border-l-2 lg:border-amber-500'
                                : 'lg:bg-transparent lg:text-[#5F6368] dark:lg:text-neutral-400 lg:hover:text-[#202124] dark:lg:hover:text-neutral-100 lg:hover:bg-[#F7F7F5] dark:lg:hover:bg-neutral-800/60'
                            )
                      )}
                    >
                      {/* Icon Wrapper (Material 3 Pill in Rail Mode, standard icon in Expanded Mode) */}
                      <span
                        className={cn(
                          'relative flex items-center justify-center shrink-0 transition-colors',
                          isOpen
                            ? 'md:px-0 md:py-0 md:rounded-none md:bg-transparent'
                            : cn(
                                'md:px-3 md:py-1 md:rounded-full',
                                isActive
                                  ? 'md:bg-amber-500/20 md:text-amber-600 dark:md:text-amber-400'
                                  : 'md:text-[#737373] md:group-hover:bg-[#F0F0ED] md:group-hover:text-[#202124]'
                              ),
                          isCollapsed
                            ? cn(
                                'lg:px-3 lg:py-1 lg:rounded-full',
                                isActive
                                  ? 'lg:bg-amber-500/20 lg:text-amber-600 dark:lg:text-amber-400'
                                  : 'lg:text-[#737373] lg:group-hover:bg-[#F0F0ED] lg:group-hover:text-[#202124]'
                              )
                            : 'lg:px-0 lg:py-0 lg:rounded-none lg:bg-transparent',
                          isActive ? 'text-amber-600 dark:text-amber-400' : 'text-[#737373] group-hover:text-[#202124]'
                        )}
                      >
                        <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.25 : 1.9} />
                      </span>

                      {/* Full label (Expanded Drawer) */}
                      <span
                        className={cn(
                          'truncate flex-1 text-[13px]',
                          isOpen ? 'md:inline' : 'md:hidden',
                          isCollapsed ? 'lg:hidden' : 'lg:inline',
                          isActive
                            ? 'font-semibold text-[#315C4C]'
                            : 'font-medium text-[#5F6368] group-hover:text-[#202124]'
                        )}
                      >
                        {fullLabel}
                      </span>

                      {/* Short micro-label (NavigationRail) */}
                      <span
                        className={cn(
                          'text-[10px] leading-tight truncate max-w-[66px] text-center',
                          isOpen ? 'md:hidden' : 'md:block',
                          isCollapsed ? 'lg:block' : 'lg:hidden',
                          isActive ? 'font-bold text-[#315C4C]' : 'font-medium text-[#737373]'
                        )}
                      >
                        {shortLabel}
                      </span>

                      {/* Badge (Expanded Drawer only) */}
                      {item.badge && (
                        <span
                          className={cn(
                            'text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#B7791F]/15 text-[#8C5D17] border border-[#B7791F]/30 uppercase tracking-wider shrink-0',
                            isOpen ? 'md:inline-block' : 'md:hidden',
                            isCollapsed ? 'lg:hidden' : 'lg:inline-block'
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

        {/* Subtle Footer Workspace Chip (Expanded) */}
        <div
          className={cn(
            'p-2.5 border-t border-[#E8E8E5] bg-[#FAFAF8] text-[10.5px] text-[#737373] items-center justify-between',
            isOpen ? 'md:flex' : 'md:hidden',
            isCollapsed ? 'lg:hidden' : 'lg:flex'
          )}
        >
          <span className="truncate font-medium">
            {activeWorkspace?.name || 'HikaruStore'}
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#E8E8E5]">
            {activeWorkspace?.currency || 'VND'}
          </span>
        </div>
      </aside>
    </>
  );
}
