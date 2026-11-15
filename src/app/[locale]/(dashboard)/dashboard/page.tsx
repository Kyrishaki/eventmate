'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { useOrdersStore } from '@/stores/orders-store';
import { usePreorderStore } from '@/stores/preorder-store';
import { useAuthStore, canManageSandboxData } from '@/stores/auth-store';
import { Link } from '@/i18n/routing';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
  TrendingUp,
  BarChart3,
  Trophy,
  Clock,
  ArrowUpRight,
  CreditCard,
  Banknote,
  QrCode,
  Package,
  Sparkles,
  Layers,
  ChevronRight,
  Award,
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
    (o) => !activeWorkspace || o.workspace_id === activeWorkspace.id
  );

  const filteredOrders =
    selectedEventId === 'all'
      ? filterRealOrders(workspaceOrders)
      : isTestEvent(selectedEventId)
      ? workspaceOrders.filter((o) => o.event_id === selectedEventId)
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

  // Pending items for "Thông báo xử lý gấp"
  const pendingPreordersCount = preorders.filter(
    (p) => p.status === 'pending_pickup' &&
      (!activeWorkspace || p.workspace_id === activeWorkspace.id) &&
      (selectedEventId === 'all' ? !isTestEvent(p.event_id) : p.event_id === selectedEventId)
  ).length;

  // Stock sent to the selected event's booths, after completed sales.
  const productsAddedToBooths = filteredAllocations.reduce(
    (sum, allocation) => sum + allocation.allocated_quantity,
    0
  );
  const productsRemainingAtBooths = filteredAllocations.reduce(
    (sum, allocation) => sum + Math.max(0, allocation.allocated_quantity - allocation.sold_quantity),
    0
  );

  // 1. Top Best-Selling Products Calculation
  const topSellingProducts = React.useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        imageUrl?: string | null;
        partnerName?: string | null;
        unitsSold: number;
        revenue: number;
        variantsSold: Map<string, number>;
      }
    >();

    for (const ord of netOrders) {
      for (const it of ord.items || []) {
        const v = variants.find((item) => item.id === it.variant_id);
        const prod = products.find((p) => p.id === v?.product_id);
        const prodId = prod?.id || v?.product_id || it.variant_id;
        const prodName = prod?.name || it.variant_id;

        const current = map.get(prodId) || {
          id: prodId,
          name: prodName,
          imageUrl: prod?.image_url,
          partnerName: prod?.collab_partner,
          unitsSold: 0,
          revenue: 0,
          variantsSold: new Map<string, number>(),
        };

        current.unitsSold += it.quantity;
        current.revenue += it.total_price;
        if (v?.name) {
          current.variantsSold.set(v.name, (current.variantsSold.get(v.name) || 0) + it.quantity);
        }
        map.set(prodId, current);
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 5);
  }, [netOrders, variants, products]);

  const maxProductSoldUnits = topSellingProducts.length > 0 ? topSellingProducts[0].unitsSold : 1;
  const totalUnitsSold = netOrders.reduce(
    (sum, o) => sum + (o.items || []).reduce((s, it) => s + it.quantity, 0),
    0
  );

  // 2. Payment Method Split
  const cashNetRevenue = netOrders
    .filter((o) => o.payment_method === 'cash')
    .reduce((sum, o) => sum + o.final_amount, 0);
  const qrNetRevenue = netOrders
    .filter((o) => o.payment_method !== 'cash')
    .reduce((sum, o) => sum + o.final_amount, 0);
  const cashNetOrders = netOrders.filter((o) => o.payment_method === 'cash').length;
  const qrNetOrders = netOrders.filter((o) => o.payment_method !== 'cash').length;
  const cashPercent = totalRevenue > 0 ? Math.round((cashNetRevenue / totalRevenue) * 100) : 0;
  const qrPercent = totalRevenue > 0 ? 100 - cashPercent : 0;

  // 3. Hourly Sales Distribution
  const salesByTimeSlot = React.useMemo(() => {
    const slots = [
      { key: 'morning', label: 'Sáng (06h - 11h)', count: 0, revenue: 0, barColor: 'bg-amber-500' },
      { key: 'noon', label: 'Trưa (11h - 14h)', count: 0, revenue: 0, barColor: 'bg-primary' },
      { key: 'afternoon', label: 'Chiều (14h - 18h)', count: 0, revenue: 0, barColor: 'bg-emerald-500' },
      { key: 'evening', label: 'Tối (18h - 23h)', count: 0, revenue: 0, barColor: 'bg-purple-500' },
    ];
    for (const ord of netOrders) {
      const h = new Date(ord.created_at).getHours();
      let slotIdx = 0;
      if (h >= 6 && h < 11) slotIdx = 0;
      else if (h >= 11 && h < 14) slotIdx = 1;
      else if (h >= 14 && h < 18) slotIdx = 2;
      else slotIdx = 3;
      slots[slotIdx].count += 1;
      slots[slotIdx].revenue += ord.final_amount;
    }
    return slots;
  }, [netOrders]);

  const maxSlotRevenue = Math.max(...salesByTimeSlot.map((s) => s.revenue), 1);

  // 4. Events Comparative Performance Matrix
  const eventComparison = React.useMemo(() => {
    return effectiveEvents.map((evt) => {
      const evtBooths = booths.filter((b) => b.event_id === evt.id);
      const evtOrders = workspaceOrders.filter(
        (o) => o.event_id === evt.id && isNetRevenueOrder(o) && (isTestEvent(evt) || !isTestOrder(o))
      );
      const revenue = evtOrders.reduce((sum, o) => sum + o.final_amount, 0);
      const ordersCount = evtOrders.length;
      const aov = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;

      let unitsSold = 0;
      for (const o of evtOrders) {
        for (const it of o.items || []) {
          unitsSold += it.quantity;
        }
      }

      const evtAllocations = allocations.filter((a) => a.event_id === evt.id && !a.is_test);
      const totalAllocated = evtAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);

      const cashRevenue = evtOrders
        .filter((o) => o.payment_method === 'cash')
        .reduce((sum, o) => sum + o.final_amount, 0);
      const qrRevenue = evtOrders
        .filter((o) => o.payment_method !== 'cash')
        .reduce((sum, o) => sum + o.final_amount, 0);

      return {
        event: evt,
        boothsCount: evtBooths.length,
        revenue,
        ordersCount,
        unitsSold,
        totalAllocated,
        aov,
        cashRevenue,
        qrRevenue,
        status: evt.status,
      };
    });
  }, [effectiveEvents, booths, workspaceOrders, allocations]);

  const maxEventRevenue = Math.max(...eventComparison.map((e) => e.revenue), 1);

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
    <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-5 bg-background text-foreground font-sans">
      {/* Top Filter & Quick Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface border border-border rounded-2xl">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-0 flex-1">
          <Filter className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[13px] font-semibold text-muted shrink-0">Lọc sự kiện:</span>
          <select
            value={selectedEventId}
            onChange={(e) => handleEventChange(e.target.value)}
            className="h-9 min-w-0 flex-1 sm:flex-none sm:w-auto px-3 text-[13px] font-medium text-foreground bg-surface-hover border border-border rounded-lg focus:outline-none focus:border-primary cursor-pointer sm:max-w-xs"
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
              className="text-[12px] text-muted hover:text-foreground flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xem tất cả</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="h-9 justify-center px-2.5 sm:px-3.5 rounded-lg border border-border-strong bg-transparent hover:bg-surface-hover text-foreground text-[12px] sm:text-[13px] font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap"
            title="Xuất file Excel"
          >
            <Download className="w-3.5 h-3.5 text-success" />
            <span>Xuất Excel</span>
          </button>
          <Link
            href="/pos"
            className="h-9 justify-center px-2.5 sm:px-4 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-[12px] sm:text-[13px] font-bold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap"
          >
            <TabletSmartphone className="w-4 h-4" />
            <span>Mở POS bán hàng</span>
          </Link>
        </div>
      </div>

      {/* Sandbox Alert if selected */}
      {isTestEvent(selectedEventId) && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-hover border border-primary/40 text-primary text-[13px]">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 shrink-0" />
            <span>
              <strong>Chế độ Sandbox:</strong> Đang xem sự kiện thử nghiệm. Số liệu này không cộng vào doanh thu chính thức.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleEventChange('all')}
            className="text-[12px] underline cursor-pointer text-foreground"
          >
            Về số liệu thật
          </button>
        </div>
      )}

      {/* SECTION 1: Thông báo xử lý gấp (Chỉ hiển thị khi có việc cần xử lý thật sự) */}
      {pendingPreordersCount > 0 && (
        <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded-md">
                  Thông báo xử lý gấp
                </span>
                <span className="text-[12px] text-muted">Cần xác nhận</span>
              </div>
              <p className="text-[13.5px] sm:text-[14.5px] text-foreground font-medium mt-1">
                Có <strong className="font-bold text-amber-500">{pendingPreordersCount} đơn giữ</strong> đang chờ đối soát tiền chuyển khoản
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/payments"
            className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-[13px] flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-sm"
          >
            <span>Đối soát ngay</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* SECTION 2: 4 Thẻ chỉ số chính (.g4 - Matching C01-Today.dc.html) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Doanh thu */}
        <div className="min-w-0 bg-surface border border-border rounded-2xl p-3.5 sm:p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Doanh thu</span>
          <span className="text-xl sm:text-[28px] font-bold text-foreground tracking-tight break-words">
            {formatCurrency(totalRevenue, 'VND')}
          </span>
        </div>

        {/* Metric 2: Đơn hoàn tất */}
        <div className="min-w-0 bg-surface border border-border rounded-2xl p-3.5 sm:p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Đơn hoàn tất</span>
          <span className="text-xl sm:text-[28px] font-bold text-foreground tracking-tight">
            {netOrders.length}
          </span>
        </div>

        {/* Metric 3: Quầy đang hoạt động */}
        <div className="min-w-0 bg-surface border border-border rounded-2xl p-3.5 sm:p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Quầy đang hoạt động</span>
          <span className="text-xl sm:text-[28px] font-bold text-foreground tracking-tight">
            {activeBoothsCount}{' '}
            <span className="text-[14px] text-muted font-normal">
              / {filteredBooths.length} quầy
            </span>
          </span>
        </div>

        {/* Metric 4: Stock remaining at booths */}
        <div className="min-w-0 bg-surface border border-border rounded-2xl p-3.5 sm:p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Sản phẩm còn lại / đã thêm</span>
          <span className="text-xl sm:text-[28px] font-bold text-foreground tracking-tight break-words">
            {productsRemainingAtBooths.toLocaleString('vi-VN')} / {productsAddedToBooths.toLocaleString('vi-VN')}
            <span className="ml-1 text-[13px] text-muted font-normal">món</span>
          </span>
        </div>
      </section>

      {/* SECTION 3: Top Sản phẩm bán chạy & Biểu đồ phân tích trực quan */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Top 5 Sản phẩm bán chạy nhất */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-4.5 sm:p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning-bg text-primary flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-foreground m-0">Sản phẩm bán chạy nhất</h2>
                  <p className="text-[11.5px] text-muted">
                    {totalUnitsSold > 0 ? `Đã xuất bán tổng cộng ${totalUnitsSold} món qua quầy POS` : 'Chưa có sản phẩm nào phát sinh đơn hàng'}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/inventory"
                className="text-[12px] text-muted hover:text-primary transition-colors flex items-center gap-1 font-semibold"
              >
                <span>Kho hàng</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {topSellingProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">
                <Package className="w-8 h-8 text-muted mx-auto mb-2 opacity-60" />
                <p className="font-semibold text-foreground">Chưa có dữ liệu bán chạy</p>
                <p className="text-[11px] text-muted mt-1">Khi thu ngân tạo đơn bán hàng từ POS, danh sách sản phẩm chạy nhất sẽ tự động tổng hợp tại đây.</p>
              </div>
            ) : (
              <div className="divide-y divide-border pt-1">
                {topSellingProducts.map((prod, index) => {
                  const percentOfMax = Math.round((prod.unitsSold / maxProductSoldUnits) * 100);
                  const rankBadge =
                    index === 0
                      ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 font-extrabold'
                      : index === 1
                      ? 'bg-slate-400/15 text-slate-400 border-slate-400/30 font-bold'
                      : index === 2
                      ? 'bg-amber-700/15 text-amber-700 border-amber-700/30 font-bold'
                      : 'bg-surface-hover text-muted border-border font-semibold';

                  return (
                    <div key={prod.id} className="py-3 flex flex-col gap-1.5 group">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`w-6 h-6 rounded-md border text-[11px] flex items-center justify-center shrink-0 ${rankBadge}`}>
                            #{index + 1}
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-[13.5px] text-foreground truncate">
                                {prod.name}
                              </span>
                              {prod.partnerName && (
                                <Badge variant="warning" className="text-[9px] px-1.5 py-0">
                                  {prod.partnerName}
                                </Badge>
                              )}
                            </div>
                            {prod.variantsSold.size > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-muted truncate mt-0.5">
                                {Array.from(prod.variantsSold.entries()).slice(0, 3).map(([vName, vQty]) => (
                                  <span key={vName} className="inline-block truncate">
                                    {vName}: <strong className="font-mono text-foreground">{vQty}</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-[14px] text-primary block font-mono">
                            {formatCurrency(prod.revenue, 'VND')}
                          </span>
                          <span className="text-[11.5px] text-muted font-medium">
                            <strong className="text-foreground font-mono font-bold">{prod.unitsSold}</strong> món đã bán
                          </span>
                        </div>
                      </div>

                      {/* Visual progress bar proportional to top 1 */}
                      <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(8, percentOfMax)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải: Biểu đồ Thanh toán & Khung giờ bán hàng */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full">
          {/* Biểu đồ Phương thức thanh toán */}
          <div className="bg-surface border border-border rounded-2xl p-4.5 sm:p-5 flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-foreground m-0">Cơ cấu Thanh toán</h2>
                  <p className="text-[11px] text-muted">Tỷ trọng dòng tiền thực thu</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">
                {formatCurrency(totalRevenue, 'VND')}
              </span>
            </div>

            {/* Segmented Dual Bar Chart */}
            <div className="pt-3 space-y-2.5">
              <div className="w-full h-3 rounded-full bg-background overflow-hidden flex shadow-inner border border-border">
                {cashPercent > 0 && (
                  <div
                    className="bg-amber-500 h-full transition-all duration-500"
                    style={{ width: `${cashPercent}%` }}
                    title={`Tiền mặt: ${cashPercent}%`}
                  />
                )}
                {qrPercent > 0 && (
                  <div
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: `${qrPercent}%` }}
                    title={`VietQR: ${qrPercent}%`}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Cash Tile */}
                <div className="p-2.5 rounded-xl bg-background border border-border flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Tiền mặt</span>
                    </span>
                    <span className="text-[11px] font-bold text-amber-500 font-mono">
                      {cashPercent}%
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground font-mono">
                    {formatCurrency(cashNetRevenue, 'VND')}
                  </span>
                  <span className="text-[10px] text-muted">
                    {cashNetOrders} đơn thanh toán
                  </span>
                </div>

                {/* VietQR Tile */}
                <div className="p-2.5 rounded-xl bg-background border border-border flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <span>Chuyển khoản QR</span>
                    </span>
                    <span className="text-[11px] font-bold text-primary font-mono">
                      {qrPercent}%
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary font-mono">
                    {formatCurrency(qrNetRevenue, 'VND')}
                  </span>
                  <span className="text-[10px] text-muted">
                    {qrNetOrders} đơn thanh toán
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Biểu đồ Khung giờ bán hàng (Kéo dài flex-1 cân bằng với cột Sản phẩm bán chạy) */}
          <div className="bg-surface border border-border rounded-2xl p-4.5 sm:p-5 flex flex-col justify-between flex-1 min-h-[220px]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-hover text-muted flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-foreground m-0">Doanh thu theo Khung giờ</h2>
                  <p className="text-[11px] text-muted">Xác định các khung giờ cao điểm</p>
                </div>
              </div>
              {maxSlotRevenue > 1 && (
                <span className="text-[10.5px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold hidden sm:inline-block">
                  Đỉnh: {salesByTimeSlot.reduce((p, c) => (c.revenue > p.revenue ? c : p)).label.split(' ')[0]}
                </span>
              )}
            </div>

            {/* Visual Bar chart by Time Slots (Expanded evenly) */}
            <div className="pt-3 flex-1 flex flex-col justify-end">
              <div className="grid grid-cols-4 gap-2 sm:gap-3 items-end flex-1 min-h-[120px] sm:min-h-[140px] pt-1">
                {salesByTimeSlot.map((slot) => {
                  const heightPercent = maxSlotRevenue > 0 ? Math.round((slot.revenue / maxSlotRevenue) * 100) : 0;
                  return (
                    <div key={slot.key} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="text-center w-full min-w-0">
                        <span className="text-[10.5px] sm:text-[11px] font-mono text-foreground font-bold block truncate">
                          {slot.revenue > 0 ? formatCurrency(slot.revenue, 'VND') : '0 đ'}
                        </span>
                        <span className="text-[9px] sm:text-[9.5px] text-muted block truncate font-mono">
                          {slot.count > 0 ? `${slot.count} đơn` : '0 đơn'}
                        </span>
                      </div>
                      <div className="w-full bg-background rounded-xl flex-1 max-h-[120px] min-h-[60px] flex items-end p-1.5 border border-border group-hover:border-primary/40 transition-colors">
                        <div
                          className={`w-full rounded-lg ${slot.barColor} transition-all duration-500 shadow-sm`}
                          style={{ height: `${Math.max(12, heightPercent)}%` }}
                          title={`${slot.label}: ${formatCurrency(slot.revenue, 'VND')} (${slot.count} đơn)`}
                        />
                      </div>
                      <div className="text-center w-full min-w-0">
                        <span className="text-[10.5px] sm:text-[11.5px] font-semibold text-foreground block truncate">
                          {slot.key === 'morning' ? 'Sáng' : slot.key === 'noon' ? 'Trưa' : slot.key === 'afternoon' ? 'Chiều' : 'Tối'}
                        </span>
                        <span className="text-[9px] text-muted block truncate font-mono">
                          {slot.key === 'morning' ? '06-11h' : slot.key === 'noon' ? '11-14h' : slot.key === 'afternoon' ? '14-18h' : '18-23h'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: So sánh hiệu suất giữa các Sự kiện hiện có */}
      <section className="bg-surface border border-border rounded-2xl p-4.5 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Calendar className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-foreground m-0">
                So sánh hiệu suất giữa các Sự kiện
              </h2>
              <p className="text-[12px] text-muted">
                Đối sánh trực quan doanh thu, số đơn, món đã bán và giá trị trung bình giữa {eventComparison.length} sự kiện hiện có
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/events"
            className="text-[13px] text-muted hover:text-primary transition-colors flex items-center gap-1 font-semibold self-start sm:self-auto"
          >
            <span>Quản lý sự kiện</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Event Comparison Cards / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {eventComparison.map((item) => {
            const isOngoing = item.status === 'active';
            const isUpcoming = item.status === 'upcoming' || item.status === 'draft';
            const revenuePercent = maxEventRevenue > 0 ? Math.round((item.revenue / maxEventRevenue) * 100) : 0;
            const isCurrentSelected = selectedEventId === item.event.id;

            return (
              <div
                key={item.event.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3.5 transition-all ${
                  isCurrentSelected
                    ? 'bg-warning-bg/40 border-primary shadow-xs ring-1 ring-primary/30'
                    : 'bg-background border-border hover:border-border-strong hover:bg-surface-hover/30'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-[15px] text-foreground tracking-tight truncate" title={item.event.name}>
                        {item.event.name}
                      </h3>
                      <p className="text-[11.5px] text-muted mt-0.5">
                        {item.boothsCount} quầy bán
                      </p>
                    </div>

                    <span
                      className={`h-6 px-2.5 rounded-full text-[11px] font-semibold border inline-flex items-center shrink-0 ${
                        isOngoing
                          ? 'text-success border-success/40 bg-success/10'
                          : isUpcoming
                          ? 'text-primary border-primary/40 bg-primary/10'
                          : 'text-muted border-border bg-surface-hover'
                      }`}
                    >
                      {isOngoing ? 'Đang diễn ra' : isUpcoming ? 'Sắp diễn ra' : 'Đã kết thúc'}
                    </span>
                  </div>

                  {/* Revenue display & comparative proportional bar */}
                  <div className="pt-1 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12px] text-muted">Doanh thu thực tế:</span>
                      <span className="text-lg font-extrabold text-foreground font-mono">
                        {formatCurrency(item.revenue, 'VND')}
                      </span>
                    </div>
                    <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden border border-border">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(item.revenue > 0 ? 8 : 0, revenuePercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Metric Pills for each Event */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div className="p-2 rounded-lg bg-surface border border-border/80 flex flex-col">
                    <span className="text-[10.5px] text-muted">Đơn hoàn tất</span>
                    <span className="font-bold text-[13.5px] text-foreground font-mono">
                      {item.ordersCount} <span className="text-[10px] text-muted font-normal">đơn</span>
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-surface border border-border/80 flex flex-col">
                    <span className="text-[10.5px] text-muted">Món đã bán</span>
                    <span className="font-bold text-[13.5px] text-primary font-mono">
                      {item.unitsSold} <span className="text-[10px] text-muted font-normal">món</span>
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-surface border border-border/80 flex flex-col">
                    <span className="text-[10.5px] text-muted">AOV (TB / đơn)</span>
                    <span className="font-bold text-[13.5px] text-warning font-mono">
                      {item.aov > 0 ? formatCurrency(item.aov, 'VND') : '0 đ'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-surface border border-border/80 flex flex-col">
                    <span className="text-[10.5px] text-muted">Tiền mặt / QR</span>
                    <span className="font-bold text-[12px] text-foreground font-mono truncate">
                      {item.revenue > 0
                        ? `${Math.round((item.cashRevenue / item.revenue) * 100)}% / ${Math.round((item.qrRevenue / item.revenue) * 100)}%`
                        : '0% / 0%'}
                    </span>
                  </div>
                </div>

                {/* Quick Action to Filter to this Event */}
                <button
                  type="button"
                  onClick={() => handleEventChange(isCurrentSelected ? 'all' : item.event.id)}
                  className={`w-full h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isCurrentSelected
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'bg-surface-hover hover:bg-border text-foreground border border-border'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>{isCurrentSelected ? 'Đang lọc sự kiện này (Bấm để hủy)' : 'Lọc số liệu theo sự kiện này'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5: 2 Cột Sự kiện & Đơn gần đây (.g2 - Matching C01-Today.dc.html) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cột 1: Sự kiện */}
        <div className="bg-surface border border-border rounded-2xl p-4.5 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-[16px] font-bold text-foreground m-0">Sự kiện</h2>
            <Link
              href="/dashboard/events"
              className="text-[13px] text-muted hover:text-primary transition-colors"
            >
              Tất cả sự kiện
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {effectiveEvents.filter((event) => selectedEventId === 'all' || event.id === selectedEventId).slice(0, 4).map((evt) => {
              const eventBooths = booths.filter((b) => b.event_id === evt.id);
              const eventOrders = workspaceOrders.filter((o) => o.event_id === evt.id && isNetRevenueOrder(o) && (isTestEvent(evt) || !isTestOrder(o)));
              const eventRevenue = eventOrders.reduce((sum, o) => sum + o.final_amount, 0);

              const isOngoing = evt.status === 'active';
              const isUpcoming = evt.status === 'upcoming' || evt.status === 'draft';

              return (
                <Link
                  key={evt.id}
                  href={`/dashboard/events`}
                  className="flex items-center justify-between py-3 group hover:bg-surface-hover/40 rounded-lg px-1 transition-colors"
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-3">
                    <span className="font-semibold text-[14.5px] text-foreground group-hover:text-primary truncate">
                      {evt.name}
                    </span>
                    <span className="text-[12.5px] text-muted truncate">
                      {eventBooths.length} quầy · {eventOrders.length > 0 ? `${eventOrders.length} đơn · ${formatCurrency(eventRevenue, 'VND')}` : 'chưa có đơn'}
                    </span>
                  </div>

                  <span
                    className={`h-7 px-2.5 rounded-full text-[12px] font-medium border inline-flex items-center shrink-0 ${
                      isOngoing
                        ? 'text-success border-success bg-success/10'
                        : isUpcoming
                        ? 'text-primary border-primary bg-primary/10'
                        : 'text-muted border-border'
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
        <div className="bg-surface border border-border rounded-2xl p-4.5 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-[16px] font-bold text-foreground m-0">Đơn gần đây</h2>
            <Link
              href="/dashboard/orders"
              className="text-[13px] text-muted hover:text-primary transition-colors"
            >
              Tất cả đơn
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {filteredOrders.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-muted">
                Chưa có đơn hàng nào được ghi nhận.
              </div>
            ) : (
              [...filteredOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map((order) => {
                const booth = booths.find((b) => b.id === order.booth_id);
                const orderDate = new Date(order.created_at);
                const timeString = `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}`;
                const effectiveStatus = getEffectiveOrderStatus(order);
                const isCancelled = effectiveStatus === 'cancelled';
                const isCompleted = effectiveStatus === 'completed';
                const isRefunded = effectiveStatus === 'refunded';

                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders?id=${order.id}`}
                    className="flex items-center justify-between py-3 group hover:bg-surface-hover/40 rounded-lg px-1 transition-colors"
                  >
                    <div className="flex flex-col gap-1 min-w-0 pr-3">
                      <span className="font-semibold text-[14.5px] text-foreground group-hover:text-primary truncate">
                        {order.order_number || order.id.slice(-8)}
                      </span>
                      <span className="text-[12.5px] text-muted truncate">
                        {booth?.name || 'Quầy không xác định'} · {order.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'} · {timeString}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[13px] font-medium ${
                          isCompleted
                            ? 'text-success'
                            : isCancelled
                            ? 'text-error'
                            : 'text-primary'
                        }`}
                      >
                        {isCompleted ? 'Hoàn tất' : isCancelled ? 'Đã hủy' : isRefunded ? 'Đã hoàn tiền' : 'Đang xử lý'}
                      </span>
                      <span className="font-bold text-[14px] text-foreground text-right min-w-[80px]">
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
