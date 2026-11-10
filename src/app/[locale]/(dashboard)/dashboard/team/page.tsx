'use client';

import * as React from 'react';
import { SubpageShell } from '@/components/dashboard/subpage-shell';
import { Users } from 'lucide-react';

export default function TeamPage() {
  return (
    <SubpageShell
      title="Đội ngũ & Phân quyền Ekip"
      description="Quản lý thành viên trong Workspace, mời nhân sự và cấp quyền: Owner, Admin, Manager, Cashier, Inventory Staff, Viewer."
      badge="Phase 2"
      icon={Users}
      actionLabel="Mời thành viên"
    />
  );
}
