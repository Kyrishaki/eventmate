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
  History,
  MessageSquarePlus,
  LucideIcon,
} from 'lucide-react';

export type NavGroupId = 'operations' | 'catalog' | 'admin';

export interface NavItemConfig {
  href: string;
  labelKey: string;
  shortLabelKey?: string;
  icon: LucideIcon;
  group: NavGroupId;
  hideForCollab?: boolean;
  badge?: string;
  tileToneClass: string;
}

export interface NavGroupConfig {
  id: NavGroupId;
  labelKey: string;
}

export const NAV_GROUPS: NavGroupConfig[] = [
  { id: 'operations', labelKey: 'groupOperations' },
  { id: 'catalog', labelKey: 'groupCatalog' },
  { id: 'admin', labelKey: 'groupSystem' },
];

export const NAV_ITEMS: NavItemConfig[] = [
  {
    href: '/dashboard',
    labelKey: 'dashboard',
    icon: LayoutDashboard,
    group: 'operations',
    tileToneClass: 'bg-[#EBF1EE] text-[#315C4C]',
  },
  {
    href: '/dashboard/orders',
    labelKey: 'orders',
    icon: ShoppingCart,
    group: 'operations',
    tileToneClass: 'bg-[#EAF4EE] text-[#2F7D55]',
  },
  {
    href: '/dashboard/events',
    labelKey: 'events',
    icon: CalendarDays,
    group: 'operations',
    tileToneClass: 'bg-[#EEF2FF] text-[#3B5BDB]',
  },
  {
    href: '/dashboard/booths',
    labelKey: 'booths',
    icon: Store,
    group: 'operations',
    tileToneClass: 'bg-[#FEF7EC] text-[#B7791F]',
  },
  {
    href: '/dashboard/inventory',
    labelKey: 'inventory',
    icon: Boxes,
    group: 'catalog',
    tileToneClass: 'bg-[#EBF1EE] text-[#315C4C]',
  },
  {
    href: '/dashboard/products',
    labelKey: 'products',
    icon: Package,
    group: 'catalog',
    tileToneClass: 'bg-[#F3E8FF] text-[#7E22CE]',
  },
  {
    href: '/dashboard/payments',
    labelKey: 'payments',
    icon: CreditCard,
    group: 'admin',
    tileToneClass: 'bg-[#EAF4EE] text-[#2F7D55]',
  },
  {
    href: '/dashboard/analytics',
    labelKey: 'analytics',
    icon: BarChart3,
    group: 'admin',
    tileToneClass: 'bg-[#E0F2FE] text-[#0369A1]',
  },
  {
    href: '/dashboard/team',
    labelKey: 'team',
    icon: Users,
    group: 'admin',
    hideForCollab: true,
    tileToneClass: 'bg-[#FEF7EC] text-[#B7791F]',
  },
  {
    href: '/dashboard/logs',
    labelKey: 'logs',
    icon: History,
    group: 'admin',
    hideForCollab: true,
    badge: 'Admin',
    tileToneClass: 'bg-[#F0F0ED] text-[#494949]',
  },
  {
    href: '/dashboard/feedback',
    labelKey: 'feedback',
    shortLabelKey: 'feedbackShort',
    icon: MessageSquarePlus,
    group: 'admin',
    tileToneClass: 'bg-[#FDF1F0] text-[#C44536]',
  },
  {
    href: '/dashboard/settings',
    labelKey: 'settings',
    icon: Settings,
    group: 'admin',
    hideForCollab: true,
    tileToneClass: 'bg-[#F0F0ED] text-[#494949]',
  },
];

export const BOTTOM_PRIMARY_HREFS = ['/dashboard', '/dashboard/inventory', '/dashboard/orders'] as const;

export function isNavRouteActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
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
