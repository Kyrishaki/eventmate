'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useOrdersStore } from '@/stores/orders-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order } from '@/types/database';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  QrCode,
  Banknote,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
} from 'lucide-react';

export default function PosOrdersPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { orders, retryOrderSync } = useOrdersStore();
  const { events, booths } = useDataStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterSync, setFilterSync] = React.useState<string>('all');
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.notes && o.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSync =
      filterSync === 'all' ||
      (filterSync === 'synced' && o.sync_status === 'synced') ||
      (filterSync === 'pending' && o.sync_status === 'pending_sync');
    return matchesSearch && matchesSync;
  });

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-[#E8E8E5] px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/pos">
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về POS Bán hàng</span>
            </Button>
          </Link>
          <h1 className="text-sm font-bold text-[#202124]">Lịch sử Đơn hàng tại Quầy</h1>
        </div>

        <Badge variant="outline" className="text-xs font-mono">
          {orders.length} đơn đã ghi nhận
        </Badge>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-[#9E9E9C] absolute left-3 top-2.5" />
            <Input
              placeholder="Tìm theo mã đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterSync('all')}
              className={`px-3 py-1 text-xs rounded font-medium ${
                filterSync === 'all' ? 'bg-[#315C4C] text-white' : 'bg-white border text-[#737373]'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setFilterSync('synced')}
              className={`px-3 py-1 text-xs rounded font-medium ${
                filterSync === 'synced' ? 'bg-[#315C4C] text-white' : 'bg-white border text-[#737373]'
              }`}
            >
              Đã đồng bộ
            </button>
            <button
              type="button"
              onClick={() => setFilterSync('pending')}
              className={`px-3 py-1 text-xs rounded font-medium ${
                filterSync === 'pending' ? 'bg-[#B7791F] text-white' : 'bg-white border text-[#737373]'
              }`}
            >
              Chờ đồng bộ ngoại tuyến
            </button>
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <Card className="border-[#E8E8E5] shadow-xs">
            <CardContent className="p-12 text-center text-xs text-[#737373]">
              <ShoppingCart className="w-10 h-10 text-[#9E9E9C] mx-auto mb-2" />
              <p className="font-semibold text-[#202124]">Không tìm thấy đơn hàng nào</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredOrders.map((ord) => {
              const event = events.find((e) => e.id === ord.event_id);
              const booth = booths.find((b) => b.id === ord.booth_id);

              return (
                <Card
                  key={ord.id}
                  className="border-[#E8E8E5] bg-white p-4 shadow-2xs hover:border-[#315C4C]/40 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#202124]">
                          {ord.order_number}
                        </span>
                        <Badge
                          variant={ord.sync_status === 'synced' ? 'success' : 'warning'}
                          className="text-[10px]"
                        >
                          {ord.sync_status === 'synced' ? 'Đã đồng bộ server' : 'Chờ đồng bộ'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {ord.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR'}
                        </Badge>
                      </div>

                      <p className="text-xs text-[#737373] mt-1">
                        {event?.name} • {booth?.name} ({booth?.code}) • {formatDate(ord.created_at)}
                      </p>

                      {ord.notes && (
                        <p className="text-[11px] text-[#737373] italic mt-0.5">
                          Ghi chú: {ord.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-base font-bold text-[#315C4C]">
                          {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                        </span>
                        <span className="text-[10px] text-[#737373] block">
                          {ord.items?.length || 1} dòng sản phẩm
                        </span>
                      </div>

                      {ord.sync_status === 'pending_sync' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => retryOrderSync(ord.id)}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Đồng bộ</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
