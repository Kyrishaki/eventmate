'use client';

import * as React from 'react';
import { SubpageShell } from '@/components/dashboard/subpage-shell';
import { Store } from 'lucide-react';

export default function BoothsPage() {
  return (
    <SubpageShell
      title="Gian hàng & Quầy bán"
      description="Quản lý danh sách quầy bán tại từng khu vực của sự kiện và phân bổ nhân sự phụ trách."
      badge="Phase 2"
      icon={Store}
      actionLabel="Thêm gian hàng"
    />
  );
}
