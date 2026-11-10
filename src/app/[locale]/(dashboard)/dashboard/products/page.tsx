'use client';

import * as React from 'react';
import { SubpageShell } from '@/components/dashboard/subpage-shell';
import { Package } from 'lucide-react';

export default function ProductsPage() {
  return (
    <SubpageShell
      title="Sản phẩm & Biến thể"
      description="Quản lý danh mục merchandise, bảng giá, SKU, mã vạch và phân loại sản phẩm."
      badge="Phase 2"
      icon={Package}
      actionLabel="Thêm sản phẩm"
    />
  );
}
