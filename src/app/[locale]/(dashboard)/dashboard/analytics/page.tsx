'use client';

import * as React from 'react';
import { SubpageShell } from '@/components/dashboard/subpage-shell';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <SubpageShell
      title="Báo cáo & Phân tích Doanh thu"
      description="Biểu đồ doanh thu theo sự kiện, xếp hạng sản phẩm bán chạy, hiệu suất từng gian hàng và xuất báo cáo CSV."
      badge="Phase 5"
      icon={BarChart3}
      actionLabel="Xuất báo cáo CSV"
    />
  );
}
