'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { useOrdersStore } from '@/stores/orders-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  DollarSign,
  ShoppingCart,
  Boxes,
  Calendar,
  ArrowRight,
  Store,
  Plus,
  MapPin,
  CheckCircle2,
  Filter,
  FlaskConical,
  RotateCcw,
  AlertTriangle,
  Trash2,
  Download,
} from 'lucide-react';
import {
  isTestEvent,
  isTestOrder,
  isTestBooth,
  isTestAllocation,
  filterRealEvents,
  filterRealBooths,
  filterRealOrders,
  filterRealAllocations,
} from '@/lib/test-data-filter';
import { exportEventToExcel } from '@/lib/export-excel';

export default function DashboardOverviewPage() {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const tEvents = useTranslations('events');
  const { activeWorkspace } = useWorkspaceStore();
  const { events, booths, variants, allocations } = useDataStore();
  const { orders, clearTestOrders } = useOrdersStore();

  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );
  const realEvents = filterRealEvents(workspaceEvents);
  const testEvents = workspaceEvents.filter((e) => isTestEvent(e));

  // The "Upcoming Events" section should only list real performance events
  const effectiveEvents = realEvents.length > 0 ? realEvents : workspaceEvents;

  const [selectedEventId, setSelectedEventId] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eventmate_dashboard_selected_event');
      if (saved) return saved;
    }
    return 'all';
  });

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eventmate_dashboard_selected_event', eventId);
    }
  };

  const selectedEvent = workspaceEvents.find((e) => e.id === selectedEventId);

  // Orders filtered by workspace
  const workspaceOrders = orders.filter(
    (o) => !activeWorkspace || o.workspace_id === activeWorkspace.id || o.workspace_id === 'ws-hac-cam-studio'
  );

  // RULE: Test data MUST NEVER be counted into real revenue / general metrics!
  // When selectedEventId === 'all', only real production orders are calculated.
  const filteredOrders =
    selectedEventId === 'all'
      ? filterRealOrders(workspaceOrders)
      : isTestEvent(selectedEventId)
      ? workspaceOrders.filter((o) => o.event_id === selectedEventId || isTestOrder(o))
      : workspaceOrders.filter((o) => o.event_id === selectedEventId && !isTestOrder(o));

  // Filter booths according to event (excluding test booths from general overview)
  const filteredBooths =
    selectedEventId === 'all'
      ? filterRealBooths(booths.filter((b) => realEvents.some((e) => e.id === b.event_id)))
      : booths.filter((b) => b.event_id === selectedEventId);

  // Filter allocations according to event (excluding test allocations from general overview)
  const filteredAllocations =
    selectedEventId === 'all'
      ? filterRealAllocations(allocations.filter((a) => realEvents.some((e) => e.id === a.event_id)))
      : allocations.filter((a) => a.event_id === selectedEventId);

  const allRealAllocations = filterRealAllocations(
    allocations.filter((a) => realEvents.some((e) => e.id === a.event_id))
  );

  // Dynamic calculations
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.final_amount, 0);
  const totalAllocated = filteredAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
  const totalSold = filteredAllocations.reduce((sum, a) => sum + a.sold_quantity, 0);
  const totalStock = variants.reduce((sum, v) => sum + v.total_inventory, 0);
  const allAllocatedTotal = allRealAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
  const activeBoothsCount = filteredBooths.filter((b) => b.status === 'active').length;

  // Business metrics calculated from filtered state
  const metrics = [
    {
      title: t('metrics.totalRevenue'),
      value: formatCurrency(totalRevenue, activeWorkspace?.currency || 'VND'),
      change: `${filteredOrders.length} đơn thành công`,
      icon: DollarSign,
    },
    {
      title: t('metrics.ordersCount'),
      value: `${filteredOrders.length} đơn`,
      change: selectedEventId === 'all' ? 'Quầy POS thực tế' : `${filteredBooths.length} quầy`,
      icon: ShoppingCart,
    },
    {
      title: t('metrics.unitsSold'),
      value: `${totalSold} / ${totalAllocated}`,
      change: selectedEventId === 'all' ? `${totalStock} trong kho` : 'Hàng sự kiện',
      icon: Boxes,
    },
    {
      title: 'Quầy hoạt động',
      value: `${activeBoothsCount} quầy`,
      change:
        selectedEventId === 'all'
          ? `${realEvents.length} sự kiện thực`
          : 'Sự kiện hiện tại',
      icon: Store,
    },
  ];

  const handleExportExcel = () => {
    exportEventToExcel({
      event: selectedEventId === 'all' ? null : selectedEvent,
      orders: filteredOrders,
      booths: filteredBooths,
      products: useDataStore.getState().products,
      variants,
      allocations,
      workspaceName: activeWorkspace?.name || 'Gian hàng',
      currency: activeWorkspace?.currency || 'VND',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">
              {t('overviewTitle')}
            </h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {activeWorkspace?.name || 'Workspace'}
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Theo dõi doanh thu, kho hàng và quầy bán.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 text-xs text-[#2F7D55] border-[#2F7D55]/30 hover:bg-[#EAF4EE] font-semibold h-8 shadow-2xs"
            title="Xuất toàn bộ dữ liệu sự kiện này ra file Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-[#2F7D55]" />
            <span>Xuất Excel</span>
          </Button>
          <Link href="/dashboard/events">
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <Calendar className="w-3.5 h-3.5" />
              <span>{tNav('events')}</span>
            </Button>
          </Link>
          <Link href="/pos">
            <Button variant="primary" size="sm" className="gap-1.5 h-8">
              <Store className="w-3.5 h-3.5" />
              <span>{tNav('posTerminal')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Event Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-[8px] border border-[#E8E8E5] shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#555555]">
            <Filter className="w-4 h-4 text-[#315C4C]" />
            <span>Sự kiện:</span>
          </div>

          <div className="relative">
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="h-8.5 pl-8 pr-8 text-xs font-semibold text-[#202124] bg-[#F7F7F5] border border-[#D5D5D0] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#315C4C] cursor-pointer appearance-none"
            >
              <optgroup label="Dữ liệu thực tế">
                <option value="all">Tất cả sự kiện (Số liệu thực tế)</option>
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
                      {evt.name} (Không tính vào báo cáo thật)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <Calendar className="w-3.5 h-3.5 text-[#315C4C] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {selectedEventId !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEventChange('all')}
              className="text-xs h-8 text-[#737373] hover:text-[#202124] gap-1 px-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xem số liệu thật</span>
            </Button>
          )}
        </div>

        {isTestEvent(selectedEventId) ? (
          <div className="flex items-center gap-1.5 text-xs text-[#B7791F] bg-[#B7791F]/10 px-2.5 py-1 rounded-[6px] font-medium border border-[#B7791F]/20">
            <FlaskConical className="w-3.5 h-3.5 shrink-0" />
            <span>Chế độ Sandbox — Dữ liệu Test</span>
          </div>
        ) : selectedEventId !== 'all' ? (
          <Badge variant="outline" className="text-xs border-[#315C4C] text-[#315C4C] bg-[#315C4C]/5">
            {selectedEvent?.name}
          </Badge>
        ) : (
          <span className="text-[11px] text-[#737373]">
            {realEvents.length} sự kiện thực tế
          </span>
        )}
      </div>

      {/* Sandbox Test Mode Notice Banner */}
      {isTestEvent(selectedEventId) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-[8px] bg-[#FEF7EC] border border-[#B7791F]/30 text-xs text-[#B7791F] shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <FlaskConical className="w-4 h-4 shrink-0 text-[#B7791F] mt-0.5 sm:mt-0" />
            <span>
              <strong>Dữ liệu thử nghiệm (Sandbox):</strong> Doanh thu ({formatCurrency(totalRevenue, 'VND')}) và {filteredOrders.length} đơn hàng tại đây là số liệu TEST phát sinh khi chạy thử máy POS, <strong>hoàn toàn không được cộng vào tổng doanh thu thực tế</strong> của hệ thống.
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
              onClick={() => handleEventChange('all')}
              className="h-7 text-xs gap-1"
            >
              <span>Về số liệu thật</span>
            </Button>
          </div>
        </div>
      )}

      {/* KPI Business Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx} className="p-3 sm:p-4 bg-white border-[#E8E8E5] shadow-xs">
              <div className="flex items-center justify-between text-[#737373] mb-1.5">
                <span className="text-[11px] sm:text-xs font-medium truncate pr-1">{metric.title}</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-[4px] bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center text-[#315C4C] shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-bold tracking-tight text-[#202124] truncate">
                {metric.value}
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#737373] mt-0.5 truncate">{metric.change}</p>
            </Card>
          );
        })}
      </div>

      {/* Two Column Layout: Events & Stock Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events / Booths Overview Card */}
        <Card className="border-[#E8E8E5] shadow-xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-[#F0F0ED]">
            <div>
              <CardTitle className="text-sm font-semibold text-[#202124]">
                {selectedEventId === 'all' ? t('upcomingEvents') : 'Gian hàng sự kiện'}
              </CardTitle>
              <CardDescription className="text-xs text-[#737373]">
                {selectedEventId === 'all'
                  ? 'Danh sách sự kiện và quầy bán'
                  : selectedEvent?.name}
              </CardDescription>
            </div>
            {selectedEventId === 'all' ? (
              <Link href="/dashboard/events">
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-[#315C4C]">
                  <span>Tất cả</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEventChange('all')}
                className="text-xs gap-1 h-7 text-[#315C4C]"
              >
                <span>Tất cả sự kiện</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-5">
            {selectedEventId === 'all' ? (
              effectiveEvents.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-[6px] border border-dashed border-[#E8E8E5] bg-[#FBFBFA]">
                  <Calendar className="w-8 h-8 text-[#9E9E9C] mx-auto mb-2" />
                  <p className="text-xs font-medium text-[#202124]">{t('noUpcomingEvents')}</p>
                  <Link href="/dashboard/events" className="inline-block mt-3">
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tạo sự kiện đầu tiên</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {effectiveEvents.slice(0, 4).map((evt) => {
                    const eventBooths = booths.filter((b) => b.event_id === evt.id);
                    return (
                      <div
                        key={evt.id}
                        onClick={() => handleEventChange(evt.id)}
                        className="p-3 bg-[#FBFBFA] hover:bg-[#F2F2EF] border border-[#E8E8E5] rounded-[6px] flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#202124] truncate">{evt.name}</p>
                            <Badge
                              variant={evt.status === 'active' ? 'success' : 'default'}
                              className="text-[9px]"
                            >
                              {evt.id === 'evt-test-pos'
                                ? 'Thử nghiệm'
                                : tEvents(`statusList.${evt.status as 'upcoming' | 'active' | 'completed' | 'draft'}`)}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[#737373] flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3 h-3 text-[#9E9E9C] shrink-0" />
                            <span>{evt.location || 'Địa điểm tổ chức'}</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-semibold text-[#315C4C] block">
                            {eventBooths.length} quầy bán
                          </span>
                          <span className="text-[10px] text-[#737373]">
                            Lọc sự kiện này →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Specific Event Booths Breakdown */
              <div className="space-y-3">
                <div className="p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#737373]">Địa điểm:</span>
                    <span className="font-semibold text-[#202124]">{selectedEvent?.location || 'Chưa đặt'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737373]">Thời gian:</span>
                    <span className="font-semibold text-[#202124]">
                      {selectedEvent?.start_date ? formatDate(selectedEvent.start_date) : 'Đang cập nhật'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  <p className="text-xs font-semibold text-[#202124]">
                    Danh sách quầy bán ({filteredBooths.length} quầy):
                  </p>
                  {filteredBooths.map((booth) => {
                    const boothAllocs = filteredAllocations.filter((a) => a.booth_id === booth.id);
                    const boothAllocQty = boothAllocs.reduce((sum, a) => sum + a.allocated_quantity, 0);
                    const boothSoldQty = boothAllocs.reduce((sum, a) => sum + a.sold_quantity, 0);

                    return (
                      <div
                        key={booth.id}
                        className="p-3 bg-[#FBFBFA] border border-[#E8E8E5] rounded-[6px] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#202124]">{booth.name}</span>
                            <Badge variant="outline" className="text-[9px] font-mono">
                              {booth.code}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[#737373] mt-0.5">
                            Đã bán: <span className="font-semibold text-[#315C4C]">{boothSoldQty}</span> / Cấp: {boothAllocQty} món
                          </p>
                        </div>
                        <Link href="/pos">
                          <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                            <Store className="w-3 h-3" />
                            <span>Vào POS</span>
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Summary */}
        <Card className="border-[#E8E8E5] shadow-xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-[#F0F0ED]">
            <div>
              <CardTitle className="text-sm font-semibold text-[#202124]">{t('inventoryWarnings')}</CardTitle>
              <CardDescription className="text-xs text-[#737373]">
                {selectedEventId === 'all'
                  ? 'Tình trạng tồn kho và phân bổ'
                  : `Kho hàng: ${selectedEvent?.name}`}
              </CardDescription>
            </div>
            <Link href="/dashboard/inventory">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-[#315C4C]">
                <span>Kiểm tra kho</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              <div className="p-3 bg-[#FBFBFA] rounded-[6px] border border-[#E8E8E5] space-y-2 text-xs">
                {selectedEventId === 'all' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373]">Kho tổng:</span>
                      <span className="font-bold text-[#202124]">{totalStock} món</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373]">Đã cấp cho quầy:</span>
                      <span className="font-semibold text-[#315C4C]">{totalAllocated} món</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373]">Chưa phân bổ:</span>
                      <span className="font-semibold text-[#B7791F]">
                        {Math.max(0, totalStock - totalAllocated)} món
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373]">Hàng sự kiện:</span>
                      <span className="font-bold text-[#202124]">{totalAllocated} món</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373]">Đã bán:</span>
                      <span className="font-semibold text-[#315C4C]">{totalSold} món</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373]">Tồn tại quầy:</span>
                      <span className="font-semibold text-[#202124]">
                        {Math.max(0, totalAllocated - totalSold)} món
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#E8E8E5]">
                      <span className="text-[#737373]">Kho tổng còn:</span>
                      <span className="font-semibold text-[#B7791F]">
                        {Math.max(0, totalStock - allAllocatedTotal)} món
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-xs text-[#2F7D55]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Quầy sẵn sàng hoạt động</span>
                </div>
                <Link href="/dashboard/inventory">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <span>Điều phối</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card className="border-[#E8E8E5] shadow-xs bg-white">
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-[#F0F0ED]">
          <div>
            <CardTitle className="text-sm font-semibold text-[#202124]">{t('recentOrders')}</CardTitle>
            <CardDescription className="text-xs text-[#737373]">
              {selectedEventId === 'all'
                ? 'Giao dịch gần nhất qua POS'
                : `Giao dịch: ${selectedEvent?.name}`}
            </CardDescription>
          </div>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-[#315C4C]">
              <span>Xem tất cả</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-5">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-10 rounded-[6px] border border-dashed border-[#E8E8E5] bg-[#FBFBFA]">
              <ShoppingCart className="w-8 h-8 text-[#9E9E9C] mx-auto mb-2" />
              <p className="text-xs font-medium text-[#202124]">
                {selectedEventId === 'all'
                  ? t('noRecentOrders')
                  : `Chưa có đơn hàng nào tại ${selectedEvent?.name}`}
              </p>
              <p className="text-[11px] text-[#737373] mt-0.5">
                Đơn hàng tạo từ POS (cả online và offline) sẽ được tổng hợp tự động khi kết nối Internet.
              </p>
              {selectedEventId !== 'all' && (
                <Link href="/pos" className="inline-block mt-3">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <Store className="w-3.5 h-3.5" />
                    <span>Mở máy POS sự kiện này</span>
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0ED]">
              {filteredOrders.slice(0, 5).map((ord) => {
                const event = events.find((e) => e.id === ord.event_id);
                const booth = booths.find((b) => b.id === ord.booth_id);

                return (
                  <div
                    key={ord.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#202124]">
                          {ord.order_number}
                        </span>
                        <Badge variant="outline" className="text-[9px]">
                          {ord.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR'}
                        </Badge>
                        {isTestOrder(ord) && (
                          <Badge variant="outline" className="text-[9px] border-[#B7791F] text-[#B7791F] bg-[#B7791F]/5">
                            Thử nghiệm (Sandbox)
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5">
                        {event?.name || 'Sự kiện'} • {booth?.name || 'Quầy POS'} • {formatDate(ord.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#315C4C] text-sm block">
                        {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                      </span>
                      <span className="text-[10px] text-[#737373]">
                        {ord.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 1} món
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
