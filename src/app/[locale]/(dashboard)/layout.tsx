'use client';

import * as React from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { useAuthStore, isViewerOnly } from '@/stores/auth-store';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Lock, Eye, LogIn } from 'lucide-react';
import { FloatingFeedbackWidget } from '@/components/feedback/feedback-modal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { isAuthenticated, user, loginAsGuest } = useAuthStore();
  const router = useRouter();
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#315C4C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user has no active session, show clean gatekeeper
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-[#E8E8E5] rounded-[8px] p-6 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#EBF1EE] text-[#315C4C] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#202124]">Yêu cầu Đăng nhập</h3>
            <p className="text-xs text-[#737373] mt-1 leading-relaxed">
              Bạn chưa có phiên làm việc. Vui lòng đăng nhập bằng tài khoản Quản trị / Nhân sự hoặc vào xem với quyền Khách.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <Link href="/login" className="block">
              <Button variant="primary" size="md" className="w-full text-xs font-semibold gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                <span>Đến trang Đăng nhập</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={loginAsGuest}
              className="w-full text-xs text-[#737373] gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Tiếp tục với tư cách Khách xem (Chỉ đọc)</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isGuest = isViewerOnly(user.role);

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      {/* Read-Only Guest Notice Banner */}
      {isGuest && (
        <div className="bg-[#FEF7EC] border-b border-[#F8E3C3] px-4 py-2 flex flex-col sm:flex-row items-center justify-between text-xs text-[#B7791F] gap-2 z-40 sticky top-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0 text-[#B7791F]" />
            <span>
              <strong>Chế độ Khách xem (Chỉ đọc):</strong> Bạn chỉ có quyền xem thông tin. Không được phép thêm, chỉnh sửa hoặc xóa dữ liệu.
            </span>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm" className="h-7 text-xs border-[#B7791F] text-[#B7791F] hover:bg-[#F8E3C3]">
              Đăng nhập Quản trị viên
            </Button>
          </Link>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Floating Bug Report & Feedback Widget */}
      <FloatingFeedbackWidget />
    </div>
  );
}
