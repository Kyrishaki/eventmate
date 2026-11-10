'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SyncStatusBadge } from '@/components/ui/sync-status-badge';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { TabletSmartphone, ArrowLeft, Store, ShoppingBag, Wifi, RefreshCw } from 'lucide-react';

export default function PosShellPage() {
  const tNav = useTranslations('nav');
  const { activeWorkspace, syncState, unsyncedOrdersCount } = useWorkspaceStore();

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      {/* POS Top Navigation Bar */}
      <header className="h-14 bg-white border-b border-[#E8E8E5] px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-1 h-8 px-2 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quay lại Dashboard</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2 border-l border-[#E8E8E5] pl-3">
            <span className="font-bold text-sm tracking-tight text-[#202124]">
              POS Terminal
            </span>
            <Badge variant="default" className="text-[10px]">
              {activeWorkspace?.name || 'Workspace'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <SyncStatusBadge status={syncState} pendingCount={unsyncedOrdersCount} />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main POS Interface Preparation */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-md w-full border-[#E8E8E5] shadow-xs text-center p-6">
          <div className="w-14 h-14 rounded-full bg-[#EBF1EE] text-[#315C4C] flex items-center justify-center mx-auto mb-4">
            <TabletSmartphone className="w-7 h-7" />
          </div>

          <CardTitle className="text-lg font-bold text-[#202124]">
            Giao diện Bán hàng POS
          </CardTitle>

          <CardDescription className="text-xs text-[#737373] mt-1.5 leading-relaxed">
            Thiết kế tối ưu cho máy tính bảng và điện thoại với khả năng vận hành ngoại tuyến 100%, quét mã, giỏ hàng cảm ứng và đồng bộ hóa hàng đợi.
          </CardDescription>

          <div className="my-5 p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] text-left space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#737373]">Trạng thái thiết bị:</span>
              <span className="font-semibold text-[#2F7D55] flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Sẵn sàng hoạt động
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#737373]">Lưu trữ cục bộ:</span>
              <span className="font-mono text-[#202124]">IndexedDB (Dexie.js)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#737373]">Giai đoạn triển khai:</span>
              <Badge variant="warning">Phase 3 & Phase 4</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Link href="/dashboard" className="block w-full">
              <Button variant="outline" className="w-full text-xs">
                Về Bảng điều khiển Quản lý
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
