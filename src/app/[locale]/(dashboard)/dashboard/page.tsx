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
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Store,
  Plus,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const tEvents = useTranslations('events');
  const { activeWorkspace } = useWorkspaceStore();
  const { events, booths, variants, allocations } = useDataStore();
  const { orders } = useOrdersStore();

  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );
  const upcomingEvents = workspaceEvents.filter((e) => e.status === 'upcoming' || e.status === 'active');

  const workspaceOrders = orders.filter(
    (o) => !activeWorkspace || o.workspace_id === activeWorkspace.id
  );

  const totalRevenue = workspaceOrders.reduce((sum, o) => sum + o.final_amount, 0);
  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
  const totalSold = allocations.reduce((sum, a) => sum + a.sold_quantity, 0);
  const totalStock = variants.reduce((sum, v) => sum + v.total_inventory, 0);
  const avgOrderValue = workspaceOrders.length > 0 ? totalRevenue / workspaceOrders.length : 0;

  // Business metrics calculated from real state
  const metrics = [
    {
      title: t('metrics.totalRevenue'),
      value: formatCurrency(totalRevenue, activeWorkspace?.currency || 'VND'),
      change: `${workspaceOrders.length} giao dịch thành công`,
      icon: DollarSign,
    },
    {
      title: t('metrics.ordersCount'),
      value: `${workspaceOrders.length} đơn`,
      change: 'Đã xuất tại quầy POS',
      icon: ShoppingCart,
    },
    {
      title: t('metrics.unitsSold'),
      value: `${totalSold} / ${totalAllocated}`,
      change: `${totalStock} trong tổng kho`,
      icon: Boxes,
    },
    {
      title: 'Quầy bán kích hoạt',
      value: `${booths.filter((b) => b.status === 'active').length} quầy`,
      change: `Thuộc ${workspaceEvents.length} sự kiện`,
      icon: Store,
    },
  ];

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
            Theo dõi phân bổ hàng hóa, tiến độ bán tại từng gian hàng và doanh thu thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/events">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{tNav('events')}</span>
            </Button>
          </Link>
          <Link href="/pos">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Store className="w-3.5 h-3.5" />
              <span>{tNav('posTerminal')}</span>
            </Button>
          </Link>
        </div>
      </div>

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
        {/* Upcoming Events */}
        <Card className="border-[#E8E8E5] shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-[#F0F0ED]">
            <div>
              <CardTitle className="text-sm font-semibold">{t('upcomingEvents')}</CardTitle>
              <CardDescription className="text-xs">Lịch diễn và danh sách gian hàng chuẩn bị mở bán</CardDescription>
            </div>
            <Link href="/dashboard/events">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-[#315C4C]">
                <span>Tất cả</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5">
            {upcomingEvents.length === 0 ? (
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
                {upcomingEvents.slice(0, 3).map((evt) => {
                  const eventBooths = booths.filter((b) => b.event_id === evt.id);
                  return (
                    <div
                      key={evt.id}
                      className="p-3 bg-[#FBFBFA] border border-[#E8E8E5] rounded-[6px] flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#202124] truncate">{evt.name}</p>
                          <Badge variant={evt.status === 'active' ? 'success' : 'default'} className="text-[9px]">
                            {tEvents(`statusList.${evt.status}` as any)}
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
                        <Link href="/dashboard/inventory">
                          <span className="text-[10px] text-[#737373] hover:underline">
                            Xem phân bổ →
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Summary */}
        <Card className="border-[#E8E8E5] shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-[#F0F0ED]">
            <div>
              <CardTitle className="text-sm font-semibold">{t('inventoryWarnings')}</CardTitle>
              <CardDescription className="text-xs">Tỷ lệ phân bổ và tình trạng tồn kho</CardDescription>
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
                <div className="flex items-center justify-between">
                  <span className="text-[#737373]">Tổng hàng hóa đã nhập:</span>
                  <span className="font-bold text-[#202124]">{totalStock} món</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#737373]">Đã cấp cho các quầy bán:</span>
                  <span className="font-semibold text-[#315C4C]">{totalAllocated} món</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#737373]">Trữ lượng kho tổng:</span>
                  <span className="font-semibold text-[#B7791F]">
                    {Math.max(0, totalStock - totalAllocated)} món
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-xs text-[#2F7D55]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Các quầy bán sẵn sàng hoạt động</span>
                </div>
                <Link href="/dashboard/inventory">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <span>Điều phối kho</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card className="border-[#E8E8E5] shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-[#F0F0ED]">
          <div>
            <CardTitle className="text-sm font-semibold">{t('recentOrders')}</CardTitle>
            <CardDescription className="text-xs">Các giao dịch được ghi nhận qua POS hoặc đồng bộ từ máy bán hàng</CardDescription>
          </div>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-[#315C4C]">
              <span>Xem đơn hàng</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-5">
          {workspaceOrders.length === 0 ? (
            <div className="text-center py-10 rounded-[6px] border border-dashed border-[#E8E8E5] bg-[#FBFBFA]">
              <ShoppingCart className="w-8 h-8 text-[#9E9E9C] mx-auto mb-2" />
              <p className="text-xs font-medium text-[#202124]">{t('noRecentOrders')}</p>
              <p className="text-[11px] text-[#737373] mt-0.5">
                Đơn hàng tạo từ POS (cả online và offline) sẽ được tổng hợp tự động khi kết nối Internet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0ED]">
              {workspaceOrders.slice(0, 3).map((ord) => {
                const event = events.find((e) => e.id === ord.event_id);
                const booth = booths.find((b) => b.id === ord.booth_id);

                return (
                  <div key={ord.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#202124]">{ord.order_number}</span>
                        <Badge variant="outline" className="text-[9px]">
                          {ord.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5">
                        {event?.name} • {booth?.name} • {formatDate(ord.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#315C4C] text-sm block">
                        {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                      </span>
                      <span className="text-[10px] text-[#737373]">
                        {ord.items?.length || 1} món
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
