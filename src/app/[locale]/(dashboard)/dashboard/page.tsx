'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { formatCurrency } from '@/lib/utils';
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
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const { activeWorkspace } = useWorkspaceStore();

  // Metrics from real workspace data or empty state
  const metrics = [
    {
      title: t('metrics.totalRevenue'),
      value: formatCurrency(0, activeWorkspace?.currency || 'VND'),
      change: '0% so với tour trước',
      icon: DollarSign,
    },
    {
      title: t('metrics.ordersCount'),
      value: '0',
      change: '0 đơn hàng',
      icon: ShoppingCart,
    },
    {
      title: t('metrics.unitsSold'),
      value: '0',
      change: '0 sản phẩm',
      icon: Boxes,
    },
    {
      title: t('metrics.avgOrderValue'),
      value: formatCurrency(0, activeWorkspace?.currency || 'VND'),
      change: 'AOV chuẩn hóa',
      icon: TrendingUp,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx} className="p-4 bg-white border-[#E8E8E5] shadow-xs">
              <div className="flex items-center justify-between text-[#737373] mb-2">
                <span className="text-xs font-medium">{metric.title}</span>
                <div className="w-7 h-7 rounded-[4px] bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center text-[#315C4C]">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-[#202124]">
                {metric.value}
              </div>
              <p className="text-[11px] text-[#737373] mt-1">{metric.change}</p>
            </Card>
          );
        })}
      </div>

      {/* Two Column Layout: Events & Stock Warnings */}
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
            <div className="text-center py-8 px-4 rounded-[6px] border border-dashed border-[#E8E8E5] bg-[#FBFBFA]">
              <Calendar className="w-8 h-8 text-[#9E9E9C] mx-auto mb-2" />
              <p className="text-xs font-medium text-[#202124]">{t('noUpcomingEvents')}</p>
              <p className="text-[11px] text-[#737373] mt-0.5 max-w-xs mx-auto">
                Bắt đầu bằng việc tạo một sự kiện biểu diễn để phân bổ merchandise cho các quầy bán.
              </p>
              <Link href="/dashboard/events" className="inline-block mt-3">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo sự kiện đầu tiên</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Warnings */}
        <Card className="border-[#E8E8E5] shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-[#F0F0ED]">
            <div>
              <CardTitle className="text-sm font-semibold">{t('inventoryWarnings')}</CardTitle>
              <CardDescription className="text-xs">Cảnh báo biến thể sắp hết tại gian hàng</CardDescription>
            </div>
            <Link href="/dashboard/inventory">
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-[#315C4C]">
                <span>Kiểm tra kho</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5">
            <div className="text-center py-8 px-4 rounded-[6px] border border-dashed border-[#E8E8E5] bg-[#FBFBFA]">
              <AlertTriangle className="w-8 h-8 text-[#9E9E9C] mx-auto mb-2" />
              <p className="text-xs font-medium text-[#202124]">{t('noWarnings')}</p>
              <p className="text-[11px] text-[#737373] mt-0.5 max-w-xs mx-auto">
                Khi các gian hàng bán tới hạn mức cảnh báo (dưới 10 món), thông tin sẽ hiển thị tức thì tại đây.
              </p>
              <Link href="/dashboard/inventory" className="inline-block mt-3">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <span>Phân bổ tồn kho</span>
                </Button>
              </Link>
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
          <div className="text-center py-10 rounded-[6px] border border-dashed border-[#E8E8E5] bg-[#FBFBFA]">
            <ShoppingCart className="w-8 h-8 text-[#9E9E9C] mx-auto mb-2" />
            <p className="text-xs font-medium text-[#202124]">{t('noRecentOrders')}</p>
            <p className="text-[11px] text-[#737373] mt-0.5">
              Đơn hàng tạo từ POS (cả online và offline) sẽ được tổng hợp tự động khi kết nối Internet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
