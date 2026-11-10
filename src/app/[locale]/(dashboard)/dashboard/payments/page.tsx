'use client';

import * as React from 'react';
import { SubpageShell } from '@/components/dashboard/subpage-shell';
import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <SubpageShell
      title="Phương thức & Đối soát Thanh toán"
      description="Quản lý tiền mặt, mã QR chuyển khoản và kết nối cổng thanh toán trực tuyến."
      badge="Phase 3"
      icon={CreditCard}
      actionLabel="Cấu hình QR"
    />
  );
}
