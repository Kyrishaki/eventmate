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
} from 'lucide-react';

export default function AnalyticsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { orders } = useOrdersStore();
  const { events, booths, products, variants, allocations } = useDataStore();

  const workspaceOrders = orders.filter(
    (o) => !activeWorkspace || o.workspace_id === activeWorkspace.id
  );

  const totalRevenue = workspaceOrders.reduce((sum, o) => sum + o.final_amount, 0);
  const totalOrdersCount = workspaceOrders.length;
  const totalUnitsSold = workspaceOrders.reduce(
    (sum, o) => sum + (o.items?.reduce((iSum, item) => iSum + item.quantity, 0) || 0),
    0
  );
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Breakdown by Booth
  const boothSalesMap = booths.map((b) => {
    const boothOrders = workspaceOrders.filter((o) => o.booth_id === b.id);
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
  function handleExportCsv() {
    if (workspaceOrders.length === 0) {
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

    const rows = workspaceOrders.map((o) => {
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
    link.setAttribute('download', `EventMate_BaoCaoDoanhThu_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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

        <div className="overflow-x-auto">
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
      </Card>
    </div>
  );
}
