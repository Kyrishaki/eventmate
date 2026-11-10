'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useOrdersStore } from '@/stores/orders-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order } from '@/types/database';
import {
  ShoppingCart,
  Search,
  Filter,
  Calendar,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';

export default function DashboardOrdersPage() {
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const { orders } = useOrdersStore();
  const { events, booths, variants, products } = useDataStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterEvent, setFilterEvent] = React.useState('all');
  const [filterPayment, setFilterPayment] = React.useState('all');
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );

  const workspaceOrders = orders.filter(
    (o) => !activeWorkspace || o.workspace_id === activeWorkspace.id
  );

  const filteredOrders = workspaceOrders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.notes && o.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesEvent = filterEvent === 'all' || o.event_id === filterEvent;
    const matchesPayment = filterPayment === 'all' || o.payment_method === filterPayment;
    return matchesSearch && matchesEvent && matchesPayment;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">Đơn hàng & Giao dịch</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {workspaceOrders.length} đơn
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Lịch sử toàn bộ các giao dịch phát sinh qua máy POS từ tất cả quầy bán của sự kiện.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-[#9E9E9C] absolute left-3 top-2.5" />
          <Input
            placeholder="Tìm theo mã đơn hoặc ghi chú..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-white"
          />
        </div>

        {/* Event Filter */}
        <select
          className="h-8 rounded-[6px] border border-[#E8E8E5] bg-white px-2.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
        >
          <option value="all">Tất cả sự kiện</option>
          {workspaceEvents.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        {/* Payment Filter */}
        <select
          className="h-8 rounded-[6px] border border-[#E8E8E5] bg-white px-2.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
        >
          <option value="all">Tất cả hình thức</option>
          <option value="cash">Tiền mặt</option>
          <option value="qr_manual">VietQR</option>
          <option value="gateway">Cổng thanh toán</option>
        </select>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card className="border-[#E8E8E5] shadow-xs">
          <CardContent className="p-12 text-center text-xs text-[#737373]">
            <ShoppingCart className="w-10 h-10 text-[#9E9E9C] mx-auto mb-2" />
            <p className="font-semibold text-[#202124]">Chưa có đơn hàng nào phù hợp</p>
            <p className="text-[11px] text-[#737373] mt-1">
              Đơn hàng tạo từ POS tại các quầy bán sẽ tự động tổng hợp tại đây.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#E8E8E5] bg-white shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F7F5] border-b border-[#E8E8E5] text-[#737373] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold font-mono">Mã đơn</th>
                  <th className="py-3 px-4 font-semibold">Thời gian</th>
                  <th className="py-3 px-4 font-semibold">Sự kiện & Quầy</th>
                  <th className="py-3 px-4 font-semibold">Hình thức</th>
                  <th className="py-3 px-4 font-semibold">Đồng bộ</th>
                  <th className="py-3 px-4 font-semibold text-right">Tổng tiền</th>
                  <th className="py-3 px-4 font-semibold text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0ED]">
                {filteredOrders.map((ord) => {
                  const event = events.find((e) => e.id === ord.event_id);
                  const booth = booths.find((b) => b.id === ord.booth_id);

                  return (
                    <tr key={ord.id} className="hover:bg-[#FBFBFA] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#202124]">
                        {ord.order_number}
                      </td>

                      <td className="py-3 px-4 text-[#737373] whitespace-nowrap">
                        {formatDate(ord.created_at)}
                      </td>

                      <td className="py-3 px-4 text-[#202124]">
                        <p className="font-medium truncate max-w-[180px]">{event?.name}</p>
                        <p className="text-[11px] text-[#737373]">
                          {booth?.name} ({booth?.code})
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {ord.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={ord.sync_status === 'synced' ? 'success' : 'warning'}
                          className="text-[10px]"
                        >
                          {ord.sync_status === 'synced' ? 'Đã đồng bộ' : 'Chờ đồng bộ'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-[#315C4C] text-sm">
                        {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setSelectedOrder(ord)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Orders Card View */}
          <div className="md:hidden divide-y divide-[#F0F0ED]">
            {filteredOrders.map((ord) => {
              const event = events.find((e) => e.id === ord.event_id);
              const booth = booths.find((b) => b.id === ord.booth_id);

              return (
                <div key={ord.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[#202124]">
                      {ord.order_number}
                    </span>
                    <Badge
                      variant={ord.sync_status === 'synced' ? 'success' : 'warning'}
                      className="text-[10px]"
                    >
                      {ord.sync_status === 'synced' ? 'Đã đồng bộ' : 'Chờ đồng bộ'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#737373]">
                    <div className="truncate pr-2">
                      <p className="font-medium text-[#202124] truncate">{event?.name}</p>
                      <p className="text-[11px] text-[#737373]">
                        {booth?.name} ({booth?.code})
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px]">{formatDate(ord.created_at)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F0F0ED]">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {ord.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR'}
                      </Badge>
                      <span className="text-base font-bold text-[#315C4C]">
                        {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs gap-1 font-semibold"
                      onClick={() => setSelectedOrder(ord)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chi tiết</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Chi tiết Đơn hàng: ${selectedOrder?.order_number}`}
        description="Thông tin chi tiết các món hàng và hình thức thanh toán."
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#737373]">Thời gian tạo:</span>
                <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Hình thức thanh toán:</span>
                <span className="font-semibold capitalize">
                  {selectedOrder.payment_method === 'cash' ? 'Tiền mặt' : 'Quét mã VietQR'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Mã Idempotency:</span>
                <span className="font-mono text-[10px] truncate max-w-[200px]">
                  {selectedOrder.idempotency_key}
                </span>
              </div>
            </div>

            <div>
              <p className="font-bold text-[#202124] mb-2 uppercase text-[10px] tracking-wider">
                Sản phẩm trong đơn
              </p>
              <div className="divide-y divide-[#F0F0ED] border border-[#E8E8E5] rounded-[6px]">
                {selectedOrder.items?.map((item) => {
                  const variant = variants.find((v) => v.id === item.variant_id);
                  const product = products.find((p) => p.id === variant?.product_id);
                  return (
                    <div key={item.id} className="p-2.5 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-[#202124]">
                          {product?.name || item.variant_id}
                        </p>
                        <p className="text-[11px] text-[#737373]">
                          {variant?.name} • SKU: {variant?.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#202124]">
                          {formatCurrency(item.total_price, activeWorkspace?.currency || 'VND')}
                        </p>
                        <p className="text-[10px] text-[#737373]">
                          {item.quantity} x {formatCurrency(item.unit_price, activeWorkspace?.currency || 'VND')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E8E8E5] flex justify-between text-sm font-bold">
              <span>Tổng thanh toán:</span>
              <span className="text-[#315C4C]">
                {formatCurrency(selectedOrder.final_amount, activeWorkspace?.currency || 'VND')}
              </span>
            </div>

            <div className="pt-2 text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
