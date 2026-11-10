'use client';

import * as React from 'react';
import { SubpageShell } from '@/components/dashboard/subpage-shell';
import { CalendarDays } from 'lucide-react';

export default function EventsPage() {
  return (
    <SubpageShell
      title="Sự kiện & Tour diễn"
      description="Quản lý lịch diễn, địa điểm, thời gian và các gian hàng trực thuộc."
      badge="Phase 2"
      icon={CalendarDays}
      actionLabel="Tạo sự kiện"
    />
  );
}
