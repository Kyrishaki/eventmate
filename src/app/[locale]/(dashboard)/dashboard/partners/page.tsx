'use client';

import * as React from 'react';
import { useDataStore } from '@/stores/data-store';
import { useOrdersStore } from '@/stores/orders-store';
import { formatCurrency } from '@/lib/utils';
import { isNetRevenueOrder } from '@/lib/test-data-filter';
import { Handshake, Download, Store, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function PartnersPage() {
  const { booths, events } = useDataStore();
  const { orders } = useOrdersStore();

  const collabBooths = booths.filter((b) => b.booth_type === 'collab' || Boolean(b.collab_partner));

  const partnersData = React.useMemo(() => {
    return collabBooths.map((booth) => {
      const event = events.find((e) => e.id === booth.event_id);
      const boothOrders = orders.filter(
        (o) => o.booth_id === booth.id && isNetRevenueOrder(o)
      );
      const totalRevenue = boothOrders.reduce((sum, o) => sum + o.final_amount, 0);
      const splitPercent = booth.revenue_share_ratio || 50;
      const partnerShare = (totalRevenue * splitPercent) / 100;
      const storeShare = totalRevenue - partnerShare;

      return {
        id: booth.id,
        partnerName: booth.collab_partner || 'Đối tác Collab',
        eventName: event?.name || 'Sự kiện',
        boothName: booth.name,
        splitPercent,
        totalRevenue,
        partnerShare,
        storeShare,
      };
    });
  }, [collabBooths, events, orders]);

  const hasRevenue = partnersData.some((p) => p.totalRevenue > 0);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 bg-[#0F0F10] text-[#F4F4F2] font-sans">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-[14px] text-[#A3A3A0]">
          Phần chia theo tỷ lệ đã thỏa thuận ở từng quầy collab
        </span>
        <button
          type="button"
          onClick={() => alert('Xuất báo cáo đối tác thành công!')}
          className="h-10 px-4 rounded-[10px] border border-[#4A4A4F] hover:border-[#F5B301] bg-transparent text-[#F4F4F2] text-[13.5px] font-semibold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Download className="w-4 h-4 text-[#4CC38A]" />
          <span>Xuất Excel</span>
        </button>
      </div>

      {/* Main Table */}
      <section className="bg-[#19191B] border border-[#2E2E32] rounded-[16px] px-5 py-2 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_220px_90px_130px_130px_130px_140px] gap-3 py-3 border-b border-[#2E2E32] text-[13px] text-[#A3A3A0]">
            <span>Đối tác</span>
            <span>Sự kiện · Quầy</span>
            <span className="text-right">Tỷ lệ</span>
            <span className="text-right">Doanh thu</span>
            <span className="text-right">Phần đối tác</span>
            <span className="text-right">Gian hàng nhận</span>
            <span className="text-right">Trạng thái</span>
          </div>

          {/* Rows */}
          {partnersData.length === 0 ? (
            <div className="py-8 text-center text-[#A3A3A0] text-[14px]">
              Chưa có quầy collab nào được cấu hình trong hệ thống.
            </div>
          ) : (
            partnersData.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_220px_90px_130px_130px_130px_140px] gap-3 py-3.5 border-b border-[#2E2E32] items-center text-[14.5px]"
              >
                <span className="font-semibold text-[#F4F4F2] truncate">{p.partnerName}</span>
                <span className="text-[#A3A3A0] truncate text-[13.5px]">
                  {p.eventName} · {p.boothName}
                </span>
                <span className="text-right font-medium">{p.splitPercent}%</span>
                <span className="text-right font-semibold text-[#F4F4F2]">
                  {formatCurrency(p.totalRevenue, 'VND')}
                </span>
                <span className="text-right font-semibold text-[#F5B301]">
                  {formatCurrency(p.partnerShare, 'VND')}
                </span>
                <span className="text-right font-semibold text-[#4CC38A]">
                  {formatCurrency(p.storeShare, 'VND')}
                </span>
                <span className="text-right text-[13px] text-[#A3A3A0]">
                  {p.totalRevenue > 0 ? (
                    <span className="text-[#F5B301] font-medium">Chờ thanh toán</span>
                  ) : (
                    'Chưa có gì để trả'
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Empty State Banner (Matching C19) */}
      {!hasRevenue && (
        <section className="bg-[#19191B] border border-dashed border-[#2E2E32] rounded-[16px] p-8 sm:p-10 flex flex-col items-center text-center gap-2.5">
          <span className="font-bold text-[17px] text-[#F4F4F2]">
            Chưa có quầy collab nào phát sinh doanh thu
          </span>
          <span className="text-[#A3A3A0] text-[14px] max-w-lg leading-relaxed">
            Khi quầy collab có đơn, trang này tính sẵn phần của đối tác theo tỷ lệ đã thỏa thuận. Bạn đánh dấu &ldquo;Đã trả&rdquo; sau khi chuyển tiền để hai bên cùng thấy.
          </span>
          <Link
            href="/dashboard/booths"
            className="mt-2 h-11 px-5 rounded-[10px] bg-[#F5B301] hover:bg-[#E5A500] text-[#1A1300] font-bold text-[14px] flex items-center gap-2 transition-all"
          >
            <Store className="w-4 h-4" />
            <span>Tạo quầy collab</span>
          </Link>
        </section>
      )}
    </div>
  );
}
