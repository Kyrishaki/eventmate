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
} from 'lucide-react';

import { Order, EventItem, Booth } from '@/types/database';
import {
  isTestEvent,
  isTestOrder,
  isTestBooth,
  filterRealEvents,
  filterRealOrders,
  filterRealBooths,
  getEffectiveOrderStatus,
  isNetRevenueOrder,
} from '@/lib/test-data-filter';
import { exportEventToExcel } from '@/lib/export-excel';

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
    'Trạng thái',
    'Tạm tính',
    'Giảm giá',
    'Doanh thu thực nhận',
  ];

  const rows = orders.map((o) => {
    const event = events.find((e) => e.id === o.event_id);
    const booth = booths.find((b) => b.id === o.booth_id);
    const effectiveStatus = getEffectiveOrderStatus(o);
    const statusLabel =
      effectiveStatus === 'cancelled'
        ? 'Đã hủy (Void)'
        : effectiveStatus === 'refunded'
        ? `Đã hoàn tiền (${o.refund_record_number || 'Refund'})`
        : 'Hoàn tất';
    const recognizedRevenue = isNetRevenueOrder(o) ? o.final_amount : 0;
    return [
      o.order_number,
      o.created_at,
      `"${event?.name || ''}"`,
      `"${booth?.name || ''}"`,
      booth?.booth_type === 'collab' ? 'Collab' : 'Solo',
      `"${booth?.collab_partner || ''}"`,
      o.payment_method,
      statusLabel,
      o.subtotal_amount,
      o.discount_amount,
      recognizedRevenue,
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
  const { orders } = useOrdersStore();
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

  const netOrders = filteredOrders.filter(isNetRevenueOrder);
  const totalRevenue = netOrders.reduce((sum, o) => sum + o.final_amount, 0);
  const totalOrdersCount = netOrders.length;
  const totalUnitsSold = netOrders.reduce(
    (sum, o) => sum + (o.items?.reduce((iSum, item) => iSum + item.quantity, 0) || 0),
    0
  );
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Breakdown by Booth (net revenue, excluding cancelled / refunded orders)
  const boothSalesMap = displayBooths.map((b) => {
    const boothOrders = netOrders.filter((o) => o.booth_id === b.id);
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

  // Comprehensive Multi-Sheet Excel Export
  const handleExportExcel = () => {
    exportEventToExcel({
      event: selectedEventId === 'all' ? null : selectedEvent,
      orders: filteredOrders,
      booths: displayBooths,
      products,
      variants,
      allocations,
      workspaceName: activeWorkspace?.name || 'Gian hàng',
      currency: activeWorkspace?.currency || 'VND',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Báo cáo & Phân tích Doanh thu
            </h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              Doanh thu thực tế
            </Badge>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Tổng hợp dữ liệu bán hàng tại các quầy sự kiện, đối soát gian hàng Collab và xuất báo cáo kế toán.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex-1 sm:flex-none justify-center gap-1.5 text-xs text-muted dark:text-muted hover:text-foreground h-8"
            title="Xuất file CSV phẳng cơ bản"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none justify-center gap-1.5 text-xs bg-primary hover:bg-[#286646] text-primary-foreground shadow-xs font-semibold h-8"
            title="Xuất trọn gói dữ liệu Sự kiện, Doanh thu, Quầy Collab & Tồn kho ra file Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel (.xlsx)</span>
          </Button>
        </div>
      </div>

      {/* Event Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-surface dark:bg-surface rounded-lg border border-border dark:border-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted dark:text-muted shrink-0">
            <Filter className="w-3.5 h-3.5 text-muted dark:text-muted" />
            <span>Phạm vi sự kiện:</span>
          </div>

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full sm:w-auto sm:max-w-xs h-8 rounded-lg border border-border dark:border-border bg-background dark:bg-surface-hover px-2.5 text-xs font-medium text-foreground dark:text-foreground focus:outline-none focus:border-primary truncate max-w-full"
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

        <div className="text-xs text-muted dark:text-muted shrink-0">
          {isTestEvent(selectedEventId) ? (
            <Badge variant="outline" className="text-xs border-warning text-warning bg-warning/10">
              Chế độ Sandbox (Test)
            </Badge>
          ) : selectedEventId !== 'all' ? (
            <Badge variant="outline" className="text-xs border-primary text-primary bg-primary/5">
              {selectedEvent?.name}
            </Badge>
          ) : (
            <span className="text-[11px] text-muted dark:text-muted">
              Doanh thu thực tế ({realEvents.length} sự kiện)
            </span>
          )}
        </div>
      </div>

      {/* Sandbox Test Mode Notice Banner */}
      {isTestEvent(selectedEventId) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-lg bg-warning-bg border border-warning/30 text-xs text-warning shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <FlaskConical className="w-4 h-4 shrink-0 text-warning mt-0.5 sm:mt-0" />
            <span>
              <strong>Dữ liệu thử nghiệm (Sandbox):</strong> Doanh thu ({formatCurrency(totalRevenue, activeWorkspace?.currency || 'VND')}) và {totalOrdersCount} đơn hợp lệ tại đây là số liệu TEST phát sinh khi chạy thử máy POS, <strong>hoàn toàn không được cộng vào tổng doanh thu thực tế</strong> của hệ thống.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-surface dark:bg-surface border-border dark:border-border shadow-xs flex flex-col justify-between">
          <span className="text-xs text-muted dark:text-muted font-medium">Tổng doanh thu</span>
          <div className="text-lg min-[360px]:text-xl sm:text-2xl font-extrabold text-primary dark:text-success mt-1 truncate">
            {formatCurrency(totalRevenue, activeWorkspace?.currency || 'VND')}
          </div>
          <p className="text-[11px] text-muted dark:text-muted mt-1">Đã thu qua các quầy</p>
        </Card>

        <Card className="p-3 sm:p-4 bg-surface dark:bg-surface border-border dark:border-border shadow-xs flex flex-col justify-between">
          <span className="text-xs text-muted dark:text-muted font-medium">Tổng đơn hàng</span>
          <div className="text-lg min-[360px]:text-xl sm:text-2xl font-extrabold text-foreground dark:text-foreground mt-1 truncate">
            {totalOrdersCount} đơn
          </div>
          <p className="text-[11px] text-muted dark:text-muted mt-1">Giao dịch thành công</p>
        </Card>

        <Card className="p-3 sm:p-4 bg-surface dark:bg-surface border-border dark:border-border shadow-xs flex flex-col justify-between">
          <span className="text-xs text-muted dark:text-muted font-medium">Số lượng món đã bán</span>
          <div className="text-lg min-[360px]:text-xl sm:text-2xl font-extrabold text-foreground dark:text-foreground mt-1 truncate">
            {totalUnitsSold} món
          </div>
          <p className="text-[11px] text-muted dark:text-muted mt-1">Merchandise xuất kho</p>
        </Card>

        <Card className="p-3 sm:p-4 bg-surface dark:bg-surface border-border dark:border-border shadow-xs flex flex-col justify-between">
          <span className="text-xs text-muted dark:text-muted font-medium">Giá trị TB / đơn</span>
          <div className="text-lg min-[360px]:text-xl sm:text-2xl font-extrabold text-warning dark:text-gold-text mt-1 truncate">
            {formatCurrency(avgOrderValue, activeWorkspace?.currency || 'VND')}
          </div>
          <p className="text-[11px] text-muted dark:text-muted mt-1">AOV theo phiên tour</p>
        </Card>
      </div>

      {/* Booth Performance Table */}
      <Card className="border-border bg-surface shadow-xs overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-background border-b border-border">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            Hiệu suất Bán hàng theo từng Gian hàng & Quầy bán
          </CardTitle>
          <CardDescription className="text-xs">
            Theo dõi chi tiết doanh số từng quầy và phân bổ chia sẻ doanh thu đối tác Collab.
          </CardDescription>
        </CardHeader>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-background border-b border-border text-muted uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Gian hàng & Mã</th>
                <th className="py-3 px-4 font-semibold">Sự kiện</th>
                <th className="py-3 px-4 font-semibold">Mô hình</th>
                <th className="py-3 px-4 font-semibold text-right">Số đơn</th>
                <th className="py-3 px-4 font-semibold text-right">Món đã bán</th>
                <th className="py-3 px-4 font-semibold text-right text-primary">
                  Tổng doanh thu
                </th>
                <th className="py-3 px-4 font-semibold text-right text-warning">
                  Phần Đối tác Collab
                </th>
                <th className="py-3 px-4 font-semibold text-right text-primary">
                  Thực nhận Nghệ sĩ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {boothSalesMap.map((row) => (
                <tr key={row.booth.id} className="hover:bg-background transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-foreground">{row.booth.name}</p>
                    <span className="font-mono text-[10px] text-muted bg-surface-hover px-1.5 py-0.2 rounded">
                      {row.booth.code}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-muted">{row.event?.name}</td>

                  <td className="py-3 px-4">
                    {row.isCollab ? (
                      <div>
                        <Badge variant="warning" className="text-[10px]">
                          Collab: {row.booth.collab_partner || 'Đối tác'}
                        </Badge>
                        <span className="text-[10px] text-muted block mt-0.5">
                          Chia: {row.partnerSharePercent}%
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Độc lập
                      </Badge>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right font-medium text-foreground">
                    {row.orderCount}
                  </td>

                  <td className="py-3 px-4 text-right font-medium text-foreground">
                    {row.units}
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-primary">
                    {formatCurrency(row.revenue, activeWorkspace?.currency || 'VND')}
                  </td>

                  <td className="py-3 px-4 text-right font-semibold text-warning">
                    {row.isCollab
                      ? formatCurrency(row.partnerAmount, activeWorkspace?.currency || 'VND')
                      : '—'}
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-primary">
                    {formatCurrency(row.netRetained, activeWorkspace?.currency || 'VND')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-border">
          {boothSalesMap.map((row) => (
            <div key={row.booth.id} className="p-3.5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{row.booth.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[10px] text-muted bg-surface-hover px-1.5 py-0.2 rounded">
                      {row.booth.code}
                    </span>
                    <span className="text-xs text-muted">{row.event?.name}</span>
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

              <div className="grid grid-cols-2 gap-2 bg-background p-2.5 rounded-lg text-xs">
                <div>
                  <span className="text-muted text-[10px] block">Tổng doanh thu:</span>
                  <span className="font-bold text-sm text-primary">
                    {formatCurrency(row.revenue, activeWorkspace?.currency || 'VND')}
                  </span>
                </div>
                <div>
                  <span className="text-muted text-[10px] block">Đã bán:</span>
                  <span className="font-semibold text-xs text-foreground">
                    {row.orderCount} đơn • {row.units} món
                  </span>
                </div>
                <div>
                  <span className="text-muted text-[10px] block">Trả đối tác:</span>
                  <span className="font-bold text-xs text-warning">
                    {row.isCollab ? formatCurrency(row.partnerAmount, activeWorkspace?.currency || 'VND') : '0 ₫'}
                  </span>
                </div>
                <div>
                  <span className="text-muted text-[10px] block">Thực nhận Artist:</span>
                  <span className="font-bold text-xs text-primary">
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
