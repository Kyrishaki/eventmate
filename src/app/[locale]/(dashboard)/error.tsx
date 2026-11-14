'use client';

import * as React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  retry,
  reset,
}: {
  error: unknown;
  retry?: () => void;
  reset?: () => void;
}) {
  React.useEffect(() => {
    console.error('Dashboard runtime error:', error);
  }, [error]);

  const handleRecover = () => {
    if (typeof retry === 'function') {
      retry();
    } else if (typeof reset === 'function') {
      reset();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-6 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-warning-bg border border-warning/25 text-warning flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-foreground">
            Đã xảy ra sự cố hiển thị tạm thời
          </h2>
          <p className="text-xs text-muted">
            Hệ thống đã tự động bảo vệ dữ liệu kho hàng của bạn. Vui lòng nhấn tải lại để tiếp tục thao tác.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleRecover}
            className="gap-1.5 px-4"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Thử lại ngay</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
