'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { useAuthStore, isViewerOnly } from '@/stores/auth-store';
import { FloatingFeedbackWidget } from '@/components/feedback/feedback-modal';
import { GuestShowcase } from '@/components/guest/guest-showcase';
import { initCloudSync } from '@/lib/cloud-sync';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => {};
function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

const SIDEBAR_COLLAPSE_STORAGE_KEY = 'hikaru_sidebar_collapsed';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [tabletDrawerOpen, setTabletDrawerOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === 'true';
    }
    return false;
  });

  const handleToggleCollapse = React.useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(next));
      }
      return next;
    });
  }, []);

  const { isAuthenticated, user, isGuestPreview } = useAuthStore();
  const hasMounted = useMounted();

  React.useEffect(() => {
    initCloudSync();
  }, []);

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] dark:bg-neutral-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#315C4C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // GUEST SESSION CHECK:
  // If the user is in preview mode, or has role === 'viewer', or has no active session:
  // Render the dedicated public Guest Showcase Layout.
  const isGuest = isGuestPreview || !isAuthenticated || !user || isViewerOnly(user.role);

  if (isGuest) {
    return (
      <>
        <GuestShowcase />
        <FloatingFeedbackWidget />
      </>
    );
  }

  // INTERNAL SESSIONS (Owner, Admin, Manager, Cashier, Inventory Staff, Collab Partner):
  // Flutter-inspired 3-tier adaptive shell:
  // - Mobile (< md): Topbar + Thumb-zone Bottom Navigation Bar + Grid Sheet Menu
  // - Tablet (md to < lg): Persistent 76px NavigationRail + expandable Drawer overlay
  // - Desktop (lg+): Collapsible 256px NavigationDrawer <-> 76px NavigationRail
  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-neutral-950 flex flex-col">
      <div className="flex-1 flex">
        <Sidebar
          isOpen={tabletDrawerOpen}
          onClose={() => setTabletDrawerOpen(false)}
          onOpenDrawer={() => setTabletDrawerOpen(true)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Main Content Area adapting smoothly to NavigationRail / Drawer width */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 transition-[padding] duration-200 md:pl-[76px]',
            sidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-64'
          )}
        >
          <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <main className="flex-1 px-2.5 py-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 md:pb-8 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Thumb-friendly Bottom Bar & Grid Launcher on Mobile (< md) */}
      <MobileBottomNav
        isMenuOpen={mobileMenuOpen}
        onOpenMenu={() => setMobileMenuOpen(true)}
        onCloseMenu={() => setMobileMenuOpen(false)}
      />

      {/* Floating Bug Report & Feedback Widget (positioned cleanly above Bottom Bar on mobile) */}
      <FloatingFeedbackWidget hasBottomNav />
    </div>
  );
}
