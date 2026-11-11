'use client';

import * as React from 'react';
import { usePathname, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { WorkspaceSwitcher } from './workspace-switcher';
import {
  LayoutDashboard,
  CalendarDays,
  Store,
  Package,
  Boxes,
  ShoppingCart,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  TabletSmartphone,
  History,
  MessageSquarePlus,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const { user } = useAuthStore();

  const isCollab = user?.role === 'collab_partner';

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/events', label: t('events'), icon: CalendarDays },
    { href: '/dashboard/booths', label: t('booths'), icon: Store },
    { href: '/dashboard/products', label: t('products'), icon: Package },
    { href: '/dashboard/inventory', label: t('inventory'), icon: Boxes },
    { href: '/dashboard/orders', label: t('orders'), icon: ShoppingCart },
    { href: '/dashboard/payments', label: t('payments'), icon: CreditCard },
    ...(!isCollab ? [{ href: '/dashboard/team', label: t('team'), icon: Users }] : []),
    ...(!isCollab ? [{ href: '/dashboard/logs', label: t('logs'), icon: History, badge: 'Admin' }] : []),
    { href: '/dashboard/feedback', label: t('feedback'), icon: MessageSquarePlus },
    { href: '/dashboard/analytics', label: t('analytics'), icon: BarChart3 },
    ...(!isCollab ? [{ href: '/dashboard/settings', label: t('settings'), icon: Settings }] : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E8E8E5] flex flex-col justify-between transition-transform duration-200 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header & Logo */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#E8E8E5]">
            <Link href="/dashboard" className="flex items-center gap-3 text-[#202124] group">
              <div className="h-11 w-auto flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="HikaruStore Logo"
                  className="h-11 w-auto max-w-[90px] object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-[#202124]">HikaruStore</span>
                  <span className="text-[9px] text-[#737373] border border-[#E8E8E5] px-1 py-0.2 rounded font-mono">
                    v1.0
                  </span>
                </div>
                <span className="text-[10.5px] text-[#737373] leading-none mt-0.5">Event Merchandise</span>
              </div>
            </Link>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1 text-[#737373] hover:text-[#202124] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Workspace Switcher */}
          <div className="p-3 border-b border-[#E8E8E5]">
            <WorkspaceSwitcher />
          </div>

          {/* Main Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 sm:py-2 rounded-[6px] text-xs font-medium transition-colors select-none active:bg-[#F0F0ED]',
                    isActive
                      ? 'bg-[#EBF1EE] text-[#315C4C] font-semibold'
                      : 'text-[#737373] hover:text-[#202124] hover:bg-[#F7F7F5]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-[#315C4C]' : 'text-[#737373]'
                    )}
                  />
                  <span className="truncate flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#B7791F]/15 text-[#8C5D17] border border-[#B7791F]/30 uppercase tracking-wider shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: POS Terminal Quick Access */}
        <div className="p-3 border-t border-[#E8E8E5] bg-[#F7F7F5]">
          <Link
            href="/pos"
            className="flex items-center justify-between w-full p-2.5 rounded-[6px] bg-[#315C4C] text-white hover:bg-[#284A3D] transition-colors shadow-xs group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <TabletSmartphone className="w-4 h-4 shrink-0 text-white" />
              <div className="text-left min-w-0">
                <p className="text-xs font-semibold leading-tight truncate">
                  {t('posTerminal')}
                </p>
                <p className="text-[10px] text-[#A6C4B8] leading-tight">
                  Chế độ POS
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-mono shrink-0">
              POS
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}
