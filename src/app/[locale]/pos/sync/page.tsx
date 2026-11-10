'use client';

import * as React from 'react';
import { Link } from '@/i18n/routing';
import { useOrdersStore } from '@/stores/orders-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  Database,
  Layers,
} from 'lucide-react';

export default function PosSyncPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { orders, syncPendingOrders } = useOrdersStore();

  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<string | null>(null);

  const pendingOrders = orders.filter((o) => o.sync_status === 'pending_sync');
  const syncedOrders = orders.filter((o) => o.sync_status === 'synced');

  async function handleSyncNow() {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncPendingOrders();
      setSyncResult(`Đã đồng bộ thành công ${res.successCount} đơn hàng lên máy chủ!`);
    } catch {
      setSyncResult('Đồng bộ thất bại. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-[#E8E8E5] px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/pos">
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về POS</span>
            </Button>
          </Link>
          <h1 className="text-sm font-bold text-[#202124]">Trung tâm Đồng bộ Dữ liệu Ngoại tuyến</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {syncResult && (
          <div className="p-3 bg-[#EAF4EE] border border-[#CEE6D7] text-[#2F7D55] text-xs rounded-[6px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncResult}</span>
          </div>
        )}

        {/* Sync Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
            <span className="text-xs text-[#737373]">Chờ đồng bộ (Pending)</span>
            <div className="text-2xl font-bold text-[#B7791F] mt-1">
              {pendingOrders.length} đơn
            </div>
            <p className="text-[10px] text-[#737373] mt-0.5">Lưu trữ trong IndexedDB</p>
          </Card>

          <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
            <span className="text-xs text-[#737373]">Đã xác nhận (Confirmed)</span>
            <div className="text-2xl font-bold text-[#2F7D55] mt-1">
              {syncedOrders.length} đơn
            </div>
            <p className="text-[10px] text-[#737373] mt-0.5">Đã tải lên Supabase</p>
          </Card>

          <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
            <span className="text-xs text-[#737373]">Bộ nhớ cục bộ</span>
            <div className="text-2xl font-bold text-[#202124] mt-1 font-mono">
              Dexie.js
            </div>
            <p className="text-[10px] text-[#737373] mt-0.5">Sẵn sàng 100% khi mất mạng</p>
          </Card>
        </div>

        {/* Sync Action Card */}
        <Card className="border-[#E8E8E5] bg-white shadow-xs p-6 text-center space-y-3">
          <RefreshCw className={`w-8 h-8 text-[#315C4C] mx-auto ${isSyncing ? 'animate-spin' : ''}`} />
          <div>
            <h3 className="text-base font-bold text-[#202124]">Đồng bộ Hàng đợi Đơn hàng</h3>
            <p className="text-xs text-[#737373] max-w-md mx-auto mt-1">
              Hệ thống sử dụng cơ chế Idempotency Key để đảm bảo không bao giờ bị nhân đôi đơn hàng khi kết nối lại mạng Internet.
            </p>
          </div>

          <div>
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={isSyncing || pendingOrders.length === 0}
              isLoading={isSyncing}
              onClick={handleSyncNow}
              className="gap-2 font-bold px-6"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Đồng bộ tất cả ({pendingOrders.length} đơn chờ)</span>
            </Button>
          </div>
        </Card>

        {/* Pending Orders Detail list */}
        {pendingOrders.length > 0 && (
          <Card className="border-[#E8E8E5] bg-white shadow-xs overflow-hidden">
            <CardHeader className="py-3 px-5 bg-[#FAFAF8] border-b border-[#E8E8E5]">
              <CardTitle className="text-xs font-semibold text-[#737373] uppercase tracking-wider">
                Danh sách đơn hàng đang chờ đẩy lên máy chủ
              </CardTitle>
            </CardHeader>
            <div className="divide-y divide-[#F0F0ED]">
              {pendingOrders.map((ord) => (
                <div key={ord.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#202124]">
                      {ord.order_number}
                    </span>
                    <p className="text-[11px] text-[#737373] mt-0.5">
                      Tạo lúc: {formatDate(ord.created_at)} • Idempotency:{' '}
                      <span className="font-mono">{ord.idempotency_key}</span>
                    </p>
                  </div>
                  <span className="font-bold text-[#315C4C]">
                    {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
