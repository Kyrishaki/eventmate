'use client';

import * as React from 'react';
import { SubpageShell } from '@/components/dashboard/subpage-shell';
import { ShoppingCart } from 'lucide-react';

export default function OrdersPage() {
  return (
    <SubpageShell
      title="Đơn hàng & Giao dịch"
      description="Lịch sử đơn hàng, chi tiết các món đã bán, trạng thái thanh toán và nhân viên thu ngân phụ trách."
      badge="Phase 3"
      icon={ShoppingCart}
    />
  );
}
