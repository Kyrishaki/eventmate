'use client';

import * as React from 'react';
import { SubpageShell } from '@/components/dashboard/subpage-shell';
import { Boxes } from 'lucide-react';

export default function InventoryPage() {
  return (
    <SubpageShell
      title="Kho & Phân bổ Gian hàng"
      description="Quản lý tổng tồn kho, phân bổ hạn mức cho từng quầy bán và theo dõi lượng hàng còn lại theo thời gian thực."
      badge="Phase 2"
      icon={Boxes}
      actionLabel="Phân bổ kho"
    />
  );
}
