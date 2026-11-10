'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { calculateVariantStock } from '@/lib/stock-status';
import {
  Boxes,
  Store,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Package,
  Bookmark,
  Globe,
} from 'lucide-react';

export default function InventoryPage() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const { events, booths, products, variants, allocations, setAllocation, quickTransferStock } =
    useDataStore();
  const { canManageInventory } = useAuthStore();
  const canManage = canManageInventory();

  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );

  const [selectedEventId, setSelectedEventId] = React.useState<string>(
    workspaceEvents[0]?.id || ''
  );

  const eventBooths = booths.filter((b) => b.event_id === selectedEventId);
  const [selectedBoothId, setSelectedBoothId] = React.useState<string>(
    eventBooths[0]?.id || ''
  );

  // Sync selected booth when event changes
  React.useEffect(() => {
    const availableBooths = booths.filter((b) => b.event_id === selectedEventId);
    if (availableBooths.length > 0 && !availableBooths.some((b) => b.id === selectedBoothId)) {
      setSelectedBoothId(availableBooths[0].id);
    }
  }, [selectedEventId, booths, selectedBoothId]);

  // Overall Inventory Stats across all variants
  const totalStockAll = variants.reduce((sum, v) => sum + v.total_inventory, 0);
  const totalAllocatedAll = allocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
  const totalSoldAll = allocations.reduce((sum, a) => sum + a.sold_quantity, 0);
  const storageStockAll = Math.max(0, totalStockAll - totalAllocatedAll);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedBooth = booths.find((b) => b.id === selectedBoothId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">{t('title')}</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {variants.length} mã SKU
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">{t('description')}</p>
        </div>
      </div>

      {/* Master Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <span className="text-xs text-[#737373] font-medium">{t('totalStock')}</span>
          <div className="text-xl font-bold text-[#202124] mt-1">{totalStockAll} món</div>
          <p className="text-[10px] text-[#737373] mt-0.5">Toàn bộ hàng đã nhập</p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <span className="text-xs text-[#737373] font-medium">{t('allocatedStock')}</span>
          <div className="text-xl font-bold text-[#315C4C] mt-1">{totalAllocatedAll} món</div>
          <p className="text-[10px] text-[#737373] mt-0.5">Đã bàn giao cho các quầy</p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <span className="text-xs text-[#737373] font-medium">{t('storageStock')}</span>
          <div className="text-xl font-bold text-[#B7791F] mt-1">{storageStockAll} món</div>
          <p className="text-[10px] text-[#737373] mt-0.5">Còn trữ tại kho tổng lưu diễn</p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <span className="text-xs text-[#737373] font-medium">{t('soldStock')}</span>
          <div className="text-xl font-bold text-[#2F7D55] mt-1">{totalSoldAll} món</div>
          <p className="text-[10px] text-[#737373] mt-0.5">Ghi nhận qua hóa đơn POS</p>
        </Card>
      </div>

      {/* Event and Booth Selector Bar */}
      <Card className="p-4 border-[#E8E8E5] bg-white shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Event Dropdown */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#9E9E9C]" />
              <select
                className="h-8 rounded-[6px] border border-[#E8E8E5] bg-white px-2.5 text-xs font-medium text-[#202124] focus:outline-none focus:border-[#315C4C]"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {workspaceEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Booth Tabs */}
            <div className="flex items-center gap-1.5 border-l border-[#E8E8E5] pl-3">
              <Store className="w-3.5 h-3.5 text-[#9E9E9C] mr-1" />
              {eventBooths.length === 0 ? (
                <span className="text-xs text-[#737373]">Sự kiện chưa có quầy bán nào</span>
              ) : (
                eventBooths.map((b) => {
                  const isSelected = b.id === selectedBoothId;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBoothId(b.id)}
                      className={`px-3 py-1 text-xs rounded-[4px] font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#315C4C] text-white shadow-xs'
                          : 'bg-[#F0F0ED] text-[#202124] hover:bg-[#E8E8E5]'
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-xs text-[#737373] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2F7D55]" />
            <span>{t('ruleNotice')}</span>
          </div>
        </div>
      </Card>

      {/* Allocation Management Table */}
      {!selectedBooth ? (
        <Card className="border-[#E8E8E5] shadow-xs">
          <CardContent className="p-12 text-center">
            <Store className="w-10 h-10 text-[#9E9E9C] mx-auto mb-3" />
            <p className="text-xs text-[#737373]">{t('selectBoothPrompt')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#E8E8E5] bg-white shadow-xs overflow-hidden">
          <CardHeader className="py-3.5 px-5 bg-[#FAFAF8] border-b border-[#E8E8E5] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#202124]">
                Phân bổ kho: {selectedBooth.name} ({selectedBooth.code})
              </CardTitle>
              <CardDescription className="text-xs">
                Sự kiện: {selectedEvent?.name}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {
                allocations
                  .filter((a) => a.booth_id === selectedBooth.id)
                  .reduce((sum, a) => sum + a.allocated_quantity, 0)
              }{' '}
              món đã cấp
            </Badge>
          </CardHeader>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F7F5] border-b border-[#E8E8E5] text-[#737373] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Sản phẩm & Biến thể</th>
                  <th className="py-3 px-4 font-semibold font-mono">SKU</th>
                  <th className="py-3 px-4 font-semibold text-right">Tổng tồn kho</th>
                  <th className="py-3 px-4 font-semibold text-center text-[#B7791F]">
                    Đang Giữ (Đặt trước / Online)
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">Kho tổng (Còn)</th>
                  <th className="py-3 px-4 font-semibold text-right">Đã bán tại quầy</th>
                  <th className="py-3 px-4 font-semibold text-right text-[#315C4C]">
                    Hạn mức quầy ({selectedBooth.code})
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold text-center">Điều chỉnh nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0ED]">
                {variants.map((v) => {
                  const product = products.find((p) => p.id === v.product_id);
                  const allAllocations = allocations.filter((a) => a.variant_id === v.id);
                  const totalAllocated = allAllocations.reduce(
                    (sum, a) => sum + a.allocated_quantity,
                    0
                  );
                  const centralStorageRemaining = Math.max(0, v.total_inventory - totalAllocated);

                  const boothAlloc = allAllocations.find((a) => a.booth_id === selectedBooth.id);
                  const currentAllocQty = boothAlloc?.allocated_quantity || 0;
                  const currentSoldQty = boothAlloc?.sold_quantity || 0;
                  const availableToSell = Math.max(0, currentAllocQty - currentSoldQty);
                  const stock = calculateVariantStock(v, currentSoldQty, currentAllocQty);

                  return (
                    <tr key={v.id} className="hover:bg-[#FBFBFA] transition-colors">
                      <td className="py-3 px-4 font-medium text-[#202124]">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-[#9E9E9C] shrink-0" />
                          <div>
                            <p className="font-semibold">{product?.name}</p>
                            <p className="text-[11px] text-[#737373]">{v.name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#737373]">
                        {v.sku}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-[#202124]">
                        {v.total_inventory}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {stock.totalHeld > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-[#B7791F] text-xs">
                              {stock.totalHeld} món
                            </span>
                            <span className="text-[10px] text-[#737373]">
                              ({stock.reserved} VIP, {stock.onlinePreorder} Onl)
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#9E9E9C] text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-[#B7791F]">
                        {centralStorageRemaining}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-[#737373]">
                        {currentSoldQty}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-[#315C4C] text-sm">
                        {currentAllocQty}
                        <span className="text-[10px] font-normal text-[#737373] block">
                          (Bán được: {availableToSell})
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant={stock.badgeVariant} className="text-[10px]">
                          {stock.statusLabel}
                        </Badge>
                      </td>

                      {/* Quick Adjustment Controls */}
                      <td className="py-3 px-4 text-center">
                        {canManage ? (
                          <div className="inline-flex items-center gap-1 bg-[#F0F0ED] p-1 rounded-[6px]">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-6 w-6 p-0 text-xs bg-white hover:bg-[#E8E8E5] text-[#202124]"
                              title="Giảm 10 món về kho tổng"
                              disabled={currentAllocQty <= currentSoldQty}
                              onClick={() => quickTransferStock(selectedBooth.id, v.id, -10)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>

                            <span className="px-2 text-xs font-semibold text-[#202124]">
                              {currentAllocQty}
                            </span>

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-6 w-6 p-0 text-xs bg-white hover:bg-[#E8E8E5] text-[#202124]"
                              title="Cấp thêm 10 món từ kho tổng"
                              disabled={centralStorageRemaining < 10}
                              onClick={() => quickTransferStock(selectedBooth.id, v.id, 10)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold text-[#737373] bg-[#F0F0ED] rounded">
                            {currentAllocQty} (Chỉ xem)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="md:hidden divide-y divide-[#F0F0ED]">
            {variants.map((v) => {
              const product = products.find((p) => p.id === v.product_id);
              const allAllocations = allocations.filter((a) => a.variant_id === v.id);
              const totalAllocated = allAllocations.reduce(
                (sum, a) => sum + a.allocated_quantity,
                0
              );
              const centralStorageRemaining = Math.max(0, v.total_inventory - totalAllocated);

              const boothAlloc = allAllocations.find((a) => a.booth_id === selectedBooth.id);
              const currentAllocQty = boothAlloc?.allocated_quantity || 0;
              const currentSoldQty = boothAlloc?.sold_quantity || 0;
              const availableToSell = Math.max(0, currentAllocQty - currentSoldQty);
              const stock = calculateVariantStock(v, currentSoldQty, currentAllocQty);

              return (
                <div key={v.id} className="p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[#202124] truncate">{product?.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-[#315C4C] bg-[#EBF1EE] px-1.5 py-0.5 rounded">
                          {v.name}
                        </span>
                        <span className="text-[11px] font-mono text-[#737373]">{v.sku}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={stock.badgeVariant} className="text-[10px]">
                        {stock.statusLabel}
                      </Badge>
                      <Badge variant={currentAllocQty > 0 ? 'outline' : 'neutral'} className="text-[9px]">
                        {currentAllocQty > 0 ? 'Đang cấp quầy' : 'Chưa cấp'}
                      </Badge>
                    </div>
                  </div>

                  {/* 4 Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-[#F7F7F5] p-2.5 rounded-[6px] text-xs">
                    <div>
                      <span className="text-[#737373] text-[10px] block">Hạn mức quầy:</span>
                      <span className="font-bold text-sm text-[#315C4C]">{currentAllocQty}</span>
                      <span className="text-[10px] text-[#737373] ml-1">(Còn bán: {availableToSell})</span>
                    </div>
                    <div>
                      <span className="text-[#737373] text-[10px] block">Đang giữ (VIP/Online):</span>
                      <span className="font-bold text-sm text-[#B7791F]">{stock.totalHeld} món</span>
                      {stock.totalHeld > 0 && (
                        <span className="text-[9px] text-[#8C5D17] block">
                          ({stock.reserved} VIP, {stock.onlinePreorder} Onl)
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[#737373] text-[10px] block">Kho tổng còn:</span>
                      <span className="font-bold text-sm text-[#202124]">{centralStorageRemaining}</span>
                    </div>
                    <div>
                      <span className="text-[#737373] text-[10px] block">Đã bán tại quầy:</span>
                      <span className="font-semibold text-xs text-[#2F7D55]">{currentSoldQty}</span>
                    </div>
                  </div>

                  {/* Quick Stepper Action */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-[#737373]">
                      {canManage ? 'Điều chuyển số lượng:' : 'Hạn mức kho:'}
                    </span>
                    {canManage ? (
                      <div className="flex items-center gap-1 bg-[#F0F0ED] p-1 rounded-[6px]">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 px-2 text-xs font-bold bg-white hover:bg-[#E8E8E5] text-[#202124] shadow-2xs"
                          disabled={currentAllocQty <= currentSoldQty}
                          onClick={() => quickTransferStock(selectedBooth.id, v.id, -10)}
                        >
                          -10
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 px-2 text-xs font-bold bg-white hover:bg-[#E8E8E5] text-[#202124] shadow-2xs"
                          disabled={currentAllocQty <= currentSoldQty}
                          onClick={() => quickTransferStock(selectedBooth.id, v.id, -1)}
                        >
                          -1
                        </Button>
                        <span className="px-2 text-xs font-bold text-[#315C4C]">
                          {currentAllocQty}
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 px-2 text-xs font-bold bg-white hover:bg-[#E8E8E5] text-[#202124] shadow-2xs"
                          disabled={centralStorageRemaining < 1}
                          onClick={() => quickTransferStock(selectedBooth.id, v.id, 1)}
                        >
                          +1
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 px-2 text-xs font-bold bg-white hover:bg-[#E8E8E5] text-[#202124] shadow-2xs"
                          disabled={centralStorageRemaining < 10}
                          onClick={() => quickTransferStock(selectedBooth.id, v.id, 10)}
                        >
                          +10
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-[#315C4C] bg-[#F0F0ED] px-2.5 py-1 rounded">
                        {currentAllocQty} (Chỉ xem)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
