'use client';

import * as React from 'react';
import { SubpageShell } from '@/components/dashboard/subpage-shell';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <SubpageShell
      title="Cài đặt Không gian làm việc"
      description="Cấu hình tiền tệ, định dạng hóa đơn, thiết bị ngoại tuyến và tích hợp khóa bảo mật."
      badge="Phase 2"
      icon={Settings}
      actionLabel="Lưu cài đặt"
    />
  );
}
