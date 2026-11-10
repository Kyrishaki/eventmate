'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useOrdersStore } from '@/stores/orders-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3,
  Download,
  Calendar,
  Store,
  Boxes,
  DollarSign,
  TrendingUp,
  Percent,
  Users2,
  FileSpreadsheet,
  Filter,
  FlaskConical,
  Trash2,
} from 'lucide-react';

import { Order, EventItem, Booth } from '@/types/database';
import {
  isTestEvent,
  isTestOrder,
  isTestBooth,
  filterRealEvents,
  filterRealOrders,
  filterRealBooths,
} from '@/lib/test-data-filter';

function downloadRevenueCsv(
  orders: Order[],
  events: EventItem[],
  booths: Booth[]
) {
  if (orders.length === 0) {
    alert('Không có dữ liệu giao dịch để xuất');
    return;
  }

  const headers = [
    'Mã đơn hàng',
    'Thời gian',
    'Sự kiện',
    'Gian hàng',
    'Mô hình',
    'Đối tác Collab',
    'Phương thức thanh toán',
    'Tạm tính',
    'Giảm giá',
    'Tổng thanh toán',
  ];

  const rows = orders.map((o) => {
    const event = events.find((e) => e.id === o.event_id);
    const booth = booths.find((b) => b.id === o.booth_id);
    return [
      o.order_number,
      o.created_at,
      `"${event?.name || ''}"`,
      `"${booth?.name || ''}"`,
      booth?.booth_type === 'collab' ? 'Collab' : 'Solo',
      `"${booth?.collab_partner || ''}"`,
      o.payment_method,
      o.subtotal_amount,
      o.discount_amount,
      o.final_amount,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `EventMate_BaoCaoDoanhThu_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AnalyticsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { orders, clearTestOrders } = useOrdersStore();
  const { events, booths, products, variants, allocations } = useDataStore();

  const [selectedEventId, setSelectedEventId] = React.useState<string>('all');

  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );
  const realEvents = filterRealEvents(workspaceEvents);
  const testEvents = workspaceEvents.filter((e) => isTestEvent(e));
  const selectedEvent = workspaceEvents.find((e) => e.id === selectedEventId);

  const workspaceOrders = orders.filter(
    (o) => !activeWorkspace || o.workspace_id === activeWorkspace.id || o.workspace_id === 'ws-hac-cam-studio'
  );

  // STRICT RULE: Test orders must NOT contaminate real business metrics
  const filteredOrders =
    selectedEventId === 'all'
      ? filterRealOrders(workspaceOrders)
      : isTestEvent(selectedEventId)
      ? workspaceOrders.filter((o) => o.event_id === selectedEventId || isTestOrder(o))
      : workspaceOrders.filter((o) => o.event_id === selectedEventId && !isTestOrder(o));

  const displayBooths =
    selectedEventId === 'all'
      ? filterRealBooths(booths.filter((b) => realEvents.some((e) => e.id === b.event_id)))
      : isTestEvent(selectedEventId)
      ? booths.filter((b) => isTestBooth(b) || b.event_id === selectedEventId)
      : booths.filter((b) => b.event_id === selectedEventId && !isTestBooth(b));

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.final_amount, 0);
  const totalOrdersCount = filteredOrders.length;
  const totalUnitsSold = filteredOrders.reduce(
    (sum, o) => sum + (o.items?.reduce((iSum, item) => iSum + item.quantity, 0) || 0),
    0
  );
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Breakdown by Booth
  const boothSalesMap = displayBooths.map((b) => {
    const boothOrders = filteredOrders.filter((o) => o.booth_id === b.id);
    const revenue = boothOrders.reduce((sum, o) => sum + o.final_amount, 0);
    const units = boothOrders.reduce(
      (sum, o) => sum + (o.items?.reduce((iSum, item) => iSum + item.quantity, 0) || 0),
      0
    );
    const event = events.find((e) => e.id === b.event_id);
    const isCollab = b.booth_type === 'collab' || !!b.collab_partner;
    const partnerSharePercent = b.revenue_share_ratio || (isCollab ? 50 : 0);
    const partnerAmount = isCollab ? (revenue * partnerSharePercent) / 100 : 0;
    const netRetained = revenue - partnerAmount;

    return {
      booth: b,
      event,
      orderCount: boothOrders.length,
      revenue,
      units,
      isCollab,
      partnerSharePercent,
      partnerAmount,
      netRetained,
    };
  });

  // Export CSV Functionality
  const handleExportCsv = () => {
    downloadRevenueCsv(filteredOrders, events, displayBooths);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">
              Báo cáo & Phân tích Doanh thu
            </h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              Doanh thu thực tế
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Tổng hợp dữ liệu bán hàng tại các quầy sự kiện, đối soát gian hàng Collab và xuất báo cáo kế toán.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          className="gap-1.5 border-[#315C4C] text-[#315C4C] hover:bg-[#EBF1EE]"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Xuất báo cáo CSV</span>
        </Button>
      </div>

      {/* Event Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-[8px] border border-[#E8E8E5] shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#555555]">
            <Filter className="w-3.5 h-3.5 text-[#737373]" />
            <span>Phạm vi sự kiện:</span>
          </div>

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="h-8 rounded-[6px] border border-[#E8E8E5] bg-[#F7F7F5] px-2.5 text-xs font-medium text-[#202124] focus:outline-none focus:border-[#315C4C]"
          >
            <option value="all">Tất cả sự kiện (Dữ liệu thực tế)</option>
            <optgroup label="Dữ liệu thực tế">
              {realEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </optgroup>
            {testEvents.length > 0 && (
              <optgroup label="Thử nghiệm / Sandbox (Tách biệt)">
                {testEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    🧪 {evt.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div className="text-xs text-[#737373]">
          {isTestEvent(selectedEventId) ? (
            <Badge variant="outline" className="text-xs border-[#B7791F] text-[#B7791F] bg-[#B7791F]/10">
              Chế độ Sandbox (Test)
            </Badge>
          ) : selectedEventId !== 'all' ? (
            <Badge variant="outline" className="text-xs border-[#315C4C] text-[#315C4C] bg-[#315C4C]/5">
              {selectedEvent?.name}
            </Badge>
          ) : (
            <span className="text-[11px] text-[#737373]">
              Doanh thu thực tế ({realEvents.length} sự kiện)
            </span>
          )}
        </div>
      </div>

      {/* Sandbox Test Mode Notice Banner */}
      {isTestEvent(selectedEventId) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-[8px] bg-[#FEF7EC] border border-[#B7791F]/30 text-xs text-[#B7791F] shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <FlaskConical className="w-4 h-4 shrink-0 text-[#B7791F] mt-0.5 sm:mt-0" />
            <span>
              <strong>Dữ liệu thử nghiệm (Sandbox):</strong> Doanh thu ({formatCurrency(totalRevenue, activeWorkspace?.currency || 'VND')}) và {filteredOrders.length} đơn hàng tại đây là số liệu TEST phát sinh khi chạy thử máy POS, <strong>hoàn toàn không được cộng vào tổng doanh thu thực tế</strong> của hệ thống.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Bạn có muốn xóa toàn bộ các đơn hàng thử nghiệm để làm sạch dữ liệu test?')) {
                  clearTestOrders();
                }
              }}
              className="h-7 text-xs border-[#B7791F] text-[#B7791F] hover:bg-[#B7791F]/15 gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Xóa đơn test</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEventId('all')}
              className="h-7 text-xs gap-1"
            >
              <span>Về số liệu thật</span>
            </Button>
          </div>
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-[#E8E8E5] shadow-xs">
          <span className="text-xs text-[#737373] font-medium">Tổng doanh thu</span>
          <div className="text-2xl font-bold text-[#315C4C] mt-1">
            {formatCurrency(totalRevenue, activeWorkspace?.currency || 'VND')}
          </div>
          <p className="text-[10px] text-[#737373] mt-0.5">Đã thu qua các quầy</p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-xs">
          <span className="text-xs text-[#737373] font-medium">Tổng đơn hàng</span>
          <div className="text-2xl font-bold text-[#202124] mt-1">{totalOrdersCount} đơn</div>
          <p className="text-[10px] text-[#737373] mt-0.5">Giao dịch thành công</p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-xs">
          <span className="text-xs text-[#737373] font-medium">Số lượng món đã bán</span>
          <div className="text-2xl font-bold text-[#202124] mt-1">{totalUnitsSold} món</div>
          <p className="text-[10px] text-[#737373] mt-0.5">Merchandise xuất kho</p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-xs">
          <span className="text-xs text-[#737373] font-medium">Giá trị trung bình / đơn</span>
          <div className="text-2xl font-bold text-[#B7791F] mt-1">
            {formatCurrency(avgOrderValue, activeWorkspace?.currency || 'VND')}
          </div>
          <p className="text-[10px] text-[#737373] mt-0.5">AOV theo phiên tour</p>
        </Card>
      </div>

      {/* Booth Performance Table */}
      <Card className="border-[#E8E8E5] bg-white shadow-xs overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-[#FAFAF8] border-b border-[#E8E8E5]">
          <CardTitle className="text-sm font-semibold text-[#202124] flex items-center gap-2">
            <Store className="w-4 h-4 text-[#315C4C]" />
            Hiệu suất Bán hàng theo từng Gian hàng & Quầy bán
          </CardTitle>
          <CardDescription className="text-xs">
            Theo dõi chi tiết doanh số từng quầy và phân bổ chia sẻ doanh thu đối tác Collab.
          </CardDescription>
        </CardHeader>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F7F7F5] border-b border-[#E8E8E5] text-[#737373] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Gian hàng & Mã</th>
                <th className="py-3 px-4 font-semibold">Sự kiện</th>
                <th className="py-3 px-4 font-semibold">Mô hình</th>
                <th className="py-3 px-4 font-semibold text-right">Số đơn</th>
                <th className="py-3 px-4 font-semibold text-right">Món đã bán</th>
                <th className="py-3 px-4 font-semibold text-right text-[#315C4C]">
                  Tổng doanh thu
                </th>
                <th className="py-3 px-4 font-semibold text-right text-[#B7791F]">
                  Phần Đối tác Collab
                </th>
                <th className="py-3 px-4 font-semibold text-right text-[#2F7D55]">
                  Thực nhận Nghệ sĩ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0ED]">
              {boothSalesMap.map((row) => (
                <tr key={row.booth.id} className="hover:bg-[#FBFBFA] transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-[#202124]">{row.booth.name}</p>
                    <span className="font-mono text-[10px] text-[#737373] bg-[#F0F0ED] px-1.5 py-0.2 rounded">
                      {row.booth.code}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-[#737373]">{row.event?.name}</td>

                  <td className="py-3 px-4">
                    {row.isCollab ? (
                      <div>
                        <Badge variant="warning" className="text-[10px]">
                          Collab: {row.booth.collab_partner || 'Đối tác'}
                        </Badge>
                        <span className="text-[10px] text-[#737373] block mt-0.5">
                          Chia: {row.partnerSharePercent}%
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Độc lập
                      </Badge>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right font-medium text-[#202124]">
                    {row.orderCount}
                  </td>

                  <td className="py-3 px-4 text-right font-medium text-[#202124]">
                    {row.units}
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-[#315C4C]">
                    {formatCurrency(row.revenue, activeWorkspace?.currency || 'VND')}
                  </td>

                  <td className="py-3 px-4 text-right font-semibold text-[#B7791F]">
                    {row.isCollab
                      ? formatCurrency(row.partnerAmount, activeWorkspace?.currency || 'VND')
                      : '—'}
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-[#2F7D55]">
                    {formatCurrency(row.netRetained, activeWorkspace?.currency || 'VND')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-[#F0F0ED]">
          {boothSalesMap.map((row) => (
            <div key={row.booth.id} className="p-3.5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-[#202124]">{row.booth.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[10px] text-[#737373] bg-[#F0F0ED] px-1.5 py-0.2 rounded">
                      {row.booth.code}
                    </span>
                    <span className="text-xs text-[#737373]">{row.event?.name}</span>
                  </div>
                </div>

                {row.isCollab ? (
                  <Badge variant="warning" className="text-[10px] shrink-0">
                    Collab {row.partnerSharePercent}%
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    Độc lập
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#F7F7F5] p-2.5 rounded-[6px] text-xs">
                <div>
                  <span className="text-[#737373] text-[10px] block">Tổng doanh thu:</span>
                  <span className="font-bold text-sm text-[#315C4C]">
                    {formatCurrency(row.revenue, activeWorkspace?.currency || 'VND')}
                  </span>
                </div>
                <div>
                  <span className="text-[#737373] text-[10px] block">Đã bán:</span>
                  <span className="font-semibold text-xs text-[#202124]">
                    {row.orderCount} đơn • {row.units} món
                  </span>
                </div>
                <div>
                  <span className="text-[#737373] text-[10px] block">Trả đối tác:</span>
                  <span className="font-bold text-xs text-[#B7791F]">
                    {row.isCollab ? formatCurrency(row.partnerAmount, activeWorkspace?.currency || 'VND') : '0 ₫'}
                  </span>
                </div>
                <div>
                  <span className="text-[#737373] text-[10px] block">Thực nhận Artist:</span>
                  <span className="font-bold text-xs text-[#2F7D55]">
                    {formatCurrency(row.netRetained, activeWorkspace?.currency || 'VND')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
