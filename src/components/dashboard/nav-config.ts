import {
  LayoutDashboard,
  CalendarDays,
  Package,
  Boxes,
  CreditCard,
  Coins,
  Store,
  Settings,
  LucideIcon,
} from 'lucide-react';

export type NavGroupId = 'operations' | 'catalog' | 'finance' | 'admin';

export interface NavItemConfig {
  href: string;
  labelKey: string;
  defaultLabel: string;
  shortLabelKey?: string;
  icon: LucideIcon;
  group: NavGroupId;
  hideForCollab?: boolean;
  badge?: string;
  badgeCountKey?: string;
  tileToneClass?: string;
}

export interface NavGroupConfig {
  id: NavGroupId;
  labelKey: string;
  defaultLabel: string;
}

export const NAV_GROUPS: NavGroupConfig[] = [
  { id: 'operations', labelKey: 'groupOperations', defaultLabel: 'Vận hành' },
  { id: 'catalog', labelKey: 'groupCatalog', defaultLabel: 'Hàng hóa và kho' },
  { id: 'finance', labelKey: 'groupFinance', defaultLabel: 'Đơn và tiền' },
  { id: 'admin', labelKey: 'groupSystem', defaultLabel: 'Hệ thống' },
];

export const NAV_ITEMS: NavItemConfig[] = [
  // 1. Vận hành
  {
    href: '/dashboard',
    labelKey: 'dashboard',
    defaultLabel: 'Tổng quan',
    icon: LayoutDashboard,
    group: 'operations',
  },
  {
    href: '/dashboard/events',
    labelKey: 'events',
    defaultLabel: 'Sự kiện',
    icon: CalendarDays,
    group: 'operations',
  },

  {
    href: '/dashboard/booths',
    labelKey: 'booths',
    defaultLabel: 'Gian hàng',
    icon: Store,
    group: 'operations',
  },

  // 2. Hàng hóa và kho
  {
    href: '/dashboard/products',
    labelKey: 'products',
    defaultLabel: 'Sản phẩm',
    icon: Package,
    group: 'catalog',
  },
  {
    href: '/dashboard/inventory',
    labelKey: 'inventory',
    defaultLabel: 'Kho tổng',
    icon: Boxes,
    group: 'catalog',
  },

  // 3. Đơn và tiền
  {
    href: '/dashboard/payments',
    labelKey: 'recon',
    defaultLabel: 'Đối soát chuyển khoản',
    icon: CreditCard,
    group: 'finance',
    badgeCountKey: 'pendingTransfers',
  },
  {
    href: '/dashboard/shifts',
    labelKey: 'shifts',
    defaultLabel: 'Ca và két',
    icon: Coins,
    group: 'finance',
    hideForCollab: true,
  },


  // 4. Hệ thống
  {
    href: '/dashboard/settings',
    labelKey: 'settings',
    defaultLabel: 'Thiết lập',
    icon: Settings,
    group: 'admin',
    hideForCollab: true,
  },
];

export const BOTTOM_PRIMARY_HREFS = ['/dashboard', '/dashboard/events', '/dashboard/inventory', '/dashboard/payments'] as const;

export function isNavRouteActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/vi/dashboard' || pathname === '/en/dashboard';
  }
  return pathname.includes(href);
}

export function getVisibleNavItems(isCollab: boolean): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => !(isCollab && item.hideForCollab));
}

export function getGroupedNavSections(isCollab: boolean) {
  const visible = getVisibleNavItems(isCollab);
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: visible.filter((item) => item.group === group.id),
  })).filter((group) => group.items.length > 0);
}

export function getActiveNavItem(pathname: string): NavItemConfig {
  return (
    NAV_ITEMS.find((item) => isNavRouteActive(pathname, item.href)) || NAV_ITEMS[0]
  );
}
