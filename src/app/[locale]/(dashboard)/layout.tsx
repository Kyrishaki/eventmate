'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { useAuthStore, isViewerOnly } from '@/stores/auth-store';
import { FloatingFeedbackWidget } from '@/components/feedback/feedback-modal';
import { GuestShowcase } from '@/components/guest/guest-showcase';

const emptySubscribe = () => () => {};
function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { isAuthenticated, user, isGuestPreview } = useAuthStore();
  const hasMounted = useMounted();

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

  // INTERNAL SESSIONS (Owner, Admin, Manager, Cashier, Inventory Staff):
  // Full operational dashboard with internal navigation and control tools.
  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-neutral-950 flex flex-col">
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 px-2.5 py-3 sm:px-6 sm:py-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Floating Bug Report & Feedback Widget */}
      <FloatingFeedbackWidget />
    </div>
  );
}
