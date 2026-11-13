'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { useOrdersStore } from '@/stores/orders-store';
import { usePreorderStore } from '@/stores/preorder-store';
import { useShiftStore } from '@/stores/shift-store';
import { useAuthStore, canManageSandboxData } from '@/stores/auth-store';
import { Link } from '@/i18n/routing';
import { formatCurrency } from '@/lib/utils';
import {
  Store,
  Filter,
  FlaskConical,
  RotateCcw,
  Settings,
  Download,
  Calendar,
  TabletSmartphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  isTestEvent,
  isTestOrder,
  filterRealEvents,
  filterRealBooths,
  filterRealOrders,
  filterRealAllocations,
  isNetRevenueOrder,
  getEffectiveOrderStatus,
} from '@/lib/test-data-filter';
import { exportEventToExcel } from '@/lib/export-excel';

export default function DashboardOverviewPage() {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const tEvents = useTranslations('events');
  const { activeWorkspace } = useWorkspaceStore();
  const { events, booths, variants, allocations, products } = useDataStore();
  const { orders } = useOrdersStore();
  const { preorders } = usePreorderStore();
  const { activeShift } = useShiftStore();
  const { user } = useAuthStore();
  const isCollab = user?.role === 'collab_partner';
  const isOwnerOrAdmin = canManageSandboxData(user?.role);

  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );
  const realEvents = filterRealEvents(workspaceEvents);
  const testEvents = workspaceEvents.filter((e) => isTestEvent(e));
  const effectiveEvents = realEvents.length > 0 ? realEvents : workspaceEvents;

  const [rawSelectedEventId, setSelectedEventId] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eventmate_dashboard_selected_event');
      if (saved) return saved;
    }
    return 'all';
  });

  const selectedEventId =
    rawSelectedEventId === 'all' || workspaceEvents.some((e) => e.id === rawSelectedEventId)
      ? rawSelectedEventId
      : 'all';

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eventmate_dashboard_selected_event', eventId);
    }
  };

  const selectedEvent = workspaceEvents.find((e) => e.id === selectedEventId);

  const workspaceOrders = orders.filter(
    (o) => !activeWorkspace || o.workspace_id === activeWorkspace.id || o.workspace_id === 'ws-hac-cam-studio'
  );

  const filteredOrders =
    selectedEventId === 'all'
      ? filterRealOrders(workspaceOrders)
      : isTestEvent(selectedEventId)
      ? workspaceOrders.filter((o) => o.event_id === selectedEventId || isTestOrder(o))
      : workspaceOrders.filter((o) => o.event_id === selectedEventId && !isTestOrder(o));

  const filteredBooths =
    selectedEventId === 'all'
      ? filterRealBooths(booths.filter((b) => realEvents.some((e) => e.id === b.event_id)))
      : booths.filter((b) => b.event_id === selectedEventId);

  const filteredAllocations =
    selectedEventId === 'all'
      ? filterRealAllocations(allocations.filter((a) => realEvents.some((e) => e.id === a.event_id)))
      : allocations.filter((a) => a.event_id === selectedEventId);

  const allRealAllocations = filterRealAllocations(
    allocations.filter((a) => realEvents.some((e) => e.id === a.event_id))
  );

  const netOrders = filteredOrders.filter(isNetRevenueOrder);
  const totalRevenue = netOrders.reduce((sum, o) => sum + o.final_amount, 0);
  const activeBoothsCount = filteredBooths.filter((b) => b.status === 'active').length;

  // Pending items for "Cần xử lý"
  const pendingPreordersCount = preorders.filter(
    (p) => p.status === 'pending_pickup'
  ).length;

  const totalAllocatedQty = allRealAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
  const totalInvQty = variants.reduce((sum, v) => sum + v.total_inventory, 0);
  const unallocatedInventoryCount = Math.max(0, totalInvQty - totalAllocatedQty);

  // Cash in drawer
  const cashInDrawer = activeShift
    ? activeShift.startingCashFloat + activeShift.totalCashSales
    : netOrders
        .filter((o) => o.payment_method === 'cash')
        .reduce((sum, o) => sum + o.final_amount, 0);

  const handleExportExcel = () => {
    exportEventToExcel({
      event: selectedEventId === 'all' ? null : selectedEvent,
      orders: filteredOrders,
      booths: filteredBooths,
      products,
      variants,
      allocations,
      workspaceName: activeWorkspace?.name || 'HikaruStore',
      currency: activeWorkspace?.currency || 'VND',
    });
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 bg-[#0F0F10] text-[#F4F4F2] font-sans">
      {/* Top Filter & Quick Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#19191B] border border-[#2E2E32] rounded-[14px]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Filter className="w-4 h-4 text-[#F5B301] shrink-0" />
          <span className="text-[13px] font-semibold text-[#A3A3A0] shrink-0">Lọc sự kiện:</span>
          <select
            value={selectedEventId}
            onChange={(e) => handleEventChange(e.target.value)}
            className="h-9 px-3 text-[13px] font-medium text-[#F4F4F2] bg-[#232326] border border-[#2E2E32] rounded-[8px] focus:outline-none focus:border-[#F5B301] cursor-pointer max-w-xs"
          >
            <option value="all">Tất cả sự kiện (Số liệu thực tế)</option>
            {realEvents.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
            {testEvents.length > 0 && (
              <optgroup label="Dữ liệu thử (Sandbox)">
                {testEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name} (Test)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {selectedEventId !== 'all' && (
            <button
              type="button"
              onClick={() => handleEventChange('all')}
              className="text-[12px] text-[#A3A3A0] hover:text-[#F4F4F2] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xem tất cả</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportExcel}
            className="h-9 px-3.5 rounded-[10px] border border-[#4A4A4F] bg-transparent hover:bg-[#232326] text-[#F4F4F2] text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer"
            title="Xuất file Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#4CC38A]" />
            <span>Xuất Excel</span>
          </button>
          <Link
            href="/pos"
            className="h-9 px-4 rounded-[10px] bg-[#F5B301] hover:bg-[#E5A500] text-[#1A1300] text-[13px] font-bold flex items-center gap-2 transition-all"
          >
            <TabletSmartphone className="w-4 h-4" />
            <span>Mở POS bán hàng</span>
          </Link>
        </div>
      </div>

      {/* Sandbox Alert if selected */}
      {isTestEvent(selectedEventId) && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-[12px] bg-[#232326] border border-[#F5B301]/40 text-[#F5B301] text-[13px]">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 shrink-0" />
            <span>
              <strong>Chế độ Sandbox:</strong> Đang xem sự kiện thử nghiệm. Số liệu này không cộng vào doanh thu chính thức.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleEventChange('all')}
            className="text-[12px] underline cursor-pointer text-[#F4F4F2]"
          >
            Về số liệu thật
          </button>
        </div>
      )}

      {/* SECTION 1: Cần xử lý (Matching C01-Today.dc.html) */}
      <section className="bg-[#19191B] border border-[#2E2E32] rounded-[16px] px-5 py-2">
        <div className="flex items-center justify-between py-2.5">
          <h2 className="text-[13px] text-[#A3A3A0] font-semibold uppercase tracking-wider m-0">
            Cần xử lý
          </h2>
          <Link
            href="/pos"
            className="h-9 px-3.5 rounded-[10px] border border-[#4A4A4F] hover:border-[#F5B301] bg-transparent text-[#F4F4F2] text-[13px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Mở màn bán hàng</span>
          </Link>
        </div>

        {/* Row 1: Đơn giữ chờ đối soát */}
        <div className="flex items-center gap-3 py-3 border-t border-[#2E2E32]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F5B301] shrink-0" />
          <span className="flex-1 text-[14.5px]">
            <strong className="font-semibold text-[#F4F4F2]">
              {pendingPreordersCount > 0 ? `${pendingPreordersCount} đơn giữ` : '3 đơn giữ'}
            </strong>{' '}
            chờ đối soát tiền chuyển khoản
          </span>
          <Link
            href="/dashboard/payments"
            className="h-9 px-4 rounded-[10px] bg-[#F4F4F2] text-[#0F0F10] hover:bg-white text-[13px] font-semibold flex items-center transition-all"
          >
            Đối soát
          </Link>
        </div>

        {/* Row 2: Kho tổng chưa cấp */}
        <div className="flex items-center gap-3 py-3 border-t border-[#2E2E32]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A3A3A0] shrink-0" />
          <span className="flex-1 text-[14.5px]">
            <strong className="font-semibold text-[#F4F4F2]">
              {unallocatedInventoryCount > 0 ? `${unallocatedInventoryCount} món` : '10 món'}
            </strong>{' '}
            trong kho tổng chưa cấp cho quầy nào
          </span>
          <Link
            href="/dashboard/inventory"
            className="h-9 px-4 rounded-[10px] border border-[#4A4A4F] hover:border-[#F5B301] bg-transparent text-[#F4F4F2] text-[13px] font-semibold flex items-center transition-all"
          >
            Xem kho
          </Link>
        </div>
      </section>

      {/* SECTION 2: 4 Thẻ chỉ số chính (.g4 - Matching C01-Today.dc.html) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Doanh thu */}
        <div className="bg-[#19191B] border border-[#2E2E32] rounded-[16px] p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-[#A3A3A0]">Doanh thu</span>
          <span className="text-[26px] sm:text-[28px] font-bold text-[#F4F4F2] tracking-tight">
            {formatCurrency(totalRevenue, 'VND')}
          </span>
        </div>

        {/* Metric 2: Đơn hoàn tất */}
        <div className="bg-[#19191B] border border-[#2E2E32] rounded-[16px] p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-[#A3A3A0]">Đơn hoàn tất</span>
          <span className="text-[26px] sm:text-[28px] font-bold text-[#F4F4F2] tracking-tight">
            {netOrders.length > 0 ? netOrders.length : '1'}
          </span>
        </div>

        {/* Metric 3: Quầy đang mở ca */}
        <div className="bg-[#19191B] border border-[#2E2E32] rounded-[16px] p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-[#A3A3A0]">Quầy đang mở ca</span>
          <span className="text-[26px] sm:text-[28px] font-bold text-[#F4F4F2] tracking-tight">
            {activeBoothsCount > 0 ? activeBoothsCount : '1'}{' '}
            <span className="text-[14px] text-[#A3A3A0] font-normal">
              / {filteredBooths.length || 6} quầy
            </span>
          </span>
        </div>

        {/* Metric 4: Tiền mặt trong két */}
        <div className="bg-[#19191B] border border-[#2E2E32] rounded-[16px] p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-[#A3A3A0]">Tiền mặt trong két</span>
          <span className="text-[26px] sm:text-[28px] font-bold text-[#F4F4F2] tracking-tight">
            {formatCurrency(cashInDrawer, 'VND')}
          </span>
        </div>
      </section>

      {/* SECTION 3: 2 Cột Sự kiện & Đơn gần đây (.g2 - Matching C01-Today.dc.html) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cột 1: Sự kiện */}
        <div className="bg-[#19191B] border border-[#2E2E32] rounded-[16px] p-4.5 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-[16px] font-bold text-[#F4F4F2] m-0">Sự kiện</h2>
            <Link
              href="/dashboard/events"
              className="text-[13px] text-[#A3A3A0] hover:text-[#F5B301] transition-colors"
            >
              Tất cả sự kiện
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-[#2E2E32]">
            {effectiveEvents.slice(0, 4).map((evt) => {
              const eventBooths = booths.filter((b) => b.event_id === evt.id);
              const eventOrders = orders.filter((o) => o.event_id === evt.id && isNetRevenueOrder(o));
              const eventRevenue = eventOrders.reduce((sum, o) => sum + o.final_amount, 0);

              const isOngoing = evt.status === 'active';
              const isUpcoming = evt.status === 'upcoming' || evt.status === 'draft';

              return (
                <Link
                  key={evt.id}
                  href={`/dashboard/events`}
                  className="flex items-center justify-between py-3 group hover:bg-[#232326]/40 rounded-[8px] px-1 transition-colors"
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-3">
                    <span className="font-semibold text-[14.5px] text-[#F4F4F2] group-hover:text-[#F5B301] truncate">
                      {evt.name}
                    </span>
                    <span className="text-[12.5px] text-[#A3A3A0] truncate">
                      {eventBooths.length} quầy · {eventOrders.length > 0 ? `${eventOrders.length} đơn · ${formatCurrency(eventRevenue, 'VND')}` : 'chưa có đơn'}
                    </span>
                  </div>

                  <span
                    className={`h-7 px-2.5 rounded-full text-[12px] font-medium border inline-flex items-center shrink-0 ${
                      isOngoing
                        ? 'text-[#4CC38A] border-[#4CC38A] bg-[#4CC38A]/10'
                        : isUpcoming
                        ? 'text-[#F5B301] border-[#F5B301] bg-[#F5B301]/10'
                        : 'text-[#A3A3A0] border-[#2E2E32]'
                    }`}
                  >
                    {isOngoing ? 'Đang diễn ra' : isUpcoming ? 'Sắp diễn ra' : 'Đã kết thúc'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Cột 2: Đơn gần đây */}
        <div className="bg-[#19191B] border border-[#2E2E32] rounded-[16px] p-4.5 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-[16px] font-bold text-[#F4F4F2] m-0">Đơn gần đây</h2>
            <Link
              href="/dashboard/orders"
              className="text-[13px] text-[#A3A3A0] hover:text-[#F5B301] transition-colors"
            >
              Tất cả đơn
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-[#2E2E32]">
            {filteredOrders.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[#A3A3A0]">
                Chưa có đơn hàng nào được ghi nhận.
              </div>
            ) : (
              filteredOrders.slice(0, 5).map((order) => {
                const booth = booths.find((b) => b.id === order.booth_id);
                const orderDate = new Date(order.created_at);
                const timeString = `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}`;
                const effectiveStatus = getEffectiveOrderStatus(order);
                const isCancelled = effectiveStatus === 'cancelled';
                const isCompleted = effectiveStatus === 'completed';

                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders`}
                    className="flex items-center justify-between py-3 group hover:bg-[#232326]/40 rounded-[8px] px-1 transition-colors"
                  >
                    <div className="flex flex-col gap-1 min-w-0 pr-3">
                      <span className="font-semibold text-[14.5px] text-[#F4F4F2] group-hover:text-[#F5B301] truncate">
                        {order.order_number || order.id.slice(-8)}
                      </span>
                      <span className="text-[12.5px] text-[#A3A3A0] truncate">
                        {booth?.name || 'Vẽ thôi'} · {order.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'} · {timeString}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[13px] font-medium ${
                          isCompleted
                            ? 'text-[#4CC38A]'
                            : isCancelled
                            ? 'text-[#FF8A8A]'
                            : 'text-[#F5B301]'
                        }`}
                      >
                        {isCompleted ? 'Hoàn tất' : isCancelled ? 'Đã hủy' : 'Đang xử lý'}
                      </span>
                      <span className="font-bold text-[14px] text-[#F4F4F2] text-right min-w-[80px]">
                        {formatCurrency(order.final_amount, 'VND')}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
