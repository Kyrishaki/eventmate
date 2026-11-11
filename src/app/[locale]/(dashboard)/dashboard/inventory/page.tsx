'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore, canManageProduct, isCollabPartner } from '@/stores/auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { calculateVariantStock } from '@/lib/stock-status';
import { logActivity } from '@/stores/audit-store';
import { AuditActorRole } from '@/types/database';
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
  FlaskConical,
  Lock,
  Users2,
  ClipboardCheck,
} from 'lucide-react';
import { StocktakeModal } from '@/components/inventory/stocktake-modal';
import {
  filterRealAllocations,
  filterRealEvents,
  isTestEvent,
  isTestBooth,
  isTestAllocation,
} from '@/lib/test-data-filter';

export default function InventoryPage() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const { events, booths, products, variants, allocations, setAllocation, quickTransferStock } =
    useDataStore();
  const { canManageInventory, user } = useAuthStore();
  const canManage = canManageInventory();
  const isPartner = isCollabPartner(user?.role);
  const partnerName = user?.collabPartnerName;

  function handleStockTransfer(variantId: string, variantName: string, amount: number) {
    if (!selectedBooth) return;

    // Collab Partner guard: strictly cannot alter Admin master warehouse goods
    const targetVariant = variants.find((v) => v.id === variantId);
    const targetProduct = products.find((p) => p.id === targetVariant?.product_id);
    if (!canManageProduct(user, targetProduct?.collab_partner)) {
      alert('Bạn không có quyền điều chuyển hoặc thay đổi số lượng kho hàng của Admin.');
      return;
    }

    quickTransferStock(selectedBooth.id, variantId, amount);
    logActivity({
      actor_name: user?.fullName || 'Nhân viên kho',
      actor_role: (user?.role as AuditActorRole) || 'inventory_staff',
      action_type: 'stock_adjust',
      entity_type: 'inventory',
      entity_name: variantName,
      booth_name: selectedBooth.name,
      event_name: selectedEvent?.name,
      description: `Điều chỉnh phân bổ quầy "${selectedBooth.name}": ${amount > 0 ? `+${amount}` : amount} món "${variantName}".`,
      changes: [
        { field: 'allocation_delta', field_label: 'Số lượng chuyển', new_value: amount > 0 ? `+${amount}` : String(amount) },
      ],
    });
  }

  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );
  const realEvents = filterRealEvents(workspaceEvents);
  const testEvents = workspaceEvents.filter((e) => isTestEvent(e));

  const [selectedEventId, setSelectedEventId] = React.useState<string>(
    realEvents[0]?.id || workspaceEvents[0]?.id || ''
  );

  const eventBooths = booths.filter((b) => b.event_id === selectedEventId);
  const [selectedBoothId, setSelectedBoothId] = React.useState<string>(
    eventBooths[0]?.id || ''
  );
  const [isStocktakeOpen, setIsStocktakeOpen] = React.useState(false);

  function handleSelectEvent(eventId: string) {
    setSelectedEventId(eventId);
    const availableBooths = booths.filter((b) => b.event_id === eventId);
    if (availableBooths.length > 0) {
      setSelectedBoothId(availableBooths[0].id);
    } else {
      setSelectedBoothId('');
    }
  }

  // Active variants of non-deleted products
  const activeVariants = variants.filter((v) => {
    const prod = products.find((p) => p.id === v.product_id);
    return !prod?.is_deleted;
  });

  // Overall Inventory Stats across active variants (strictly REAL allocations - test isolated)
  const totalStockAll = activeVariants.reduce((sum, v) => sum + v.total_inventory, 0);
  const activeVariantIds = new Set(activeVariants.map((v) => v.id));
  const realAllocations = filterRealAllocations(allocations);
  const activeRealAllocations = realAllocations.filter((a) => activeVariantIds.has(a.variant_id));
  const totalAllocatedAll = activeRealAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
  const totalSoldAll = activeRealAllocations.reduce((sum, a) => sum + a.sold_quantity, 0);
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

        {selectedBooth && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStocktakeOpen(true)}
              className="gap-1.5 text-xs text-[#315C4C] border-[#315C4C]/40 hover:bg-[#EAF4EE] font-semibold h-8 shadow-2xs"
              title="Kiểm đếm số lượng thực tế tại quầy và cân bằng kho"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-[#315C4C]" />
              <span>Kiểm Kê Quầy</span>
            </Button>
          </div>
        )}
      </div>

      {/* Collab Partner Scoped Access Notification Banner */}
      {isPartner && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-[8px] bg-[#FAF5FF] border border-[#A855F7]/30 text-xs text-[#6B21A8] shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Users2 className="w-4 h-4 text-[#9333EA] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-[#6B21A8]">
                Kho Hàng Đối tác Collab: {partnerName || 'Đối tác'}
              </p>
              <p className="text-[11px] text-[#7E22CE] mt-0.5">
                Bạn có quyền điều phối hàng hóa cho gian hàng hợp tác của mình. Kho hàng của Admin được hiển thị ở chế độ <strong>Chỉ đọc (Read-only)</strong> để bảo vệ dữ liệu tổng.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-[#A855F7] text-[#7E22CE] bg-[#A855F7]/10 shrink-0 font-semibold">
            Kho Độc Lập
          </Badge>
        </div>
      )}

      {/* Master Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <span className="text-xs text-[#737373] font-medium">{t('totalStock')}</span>
          <div className="text-xl font-bold text-[#202124] mt-1">{totalStockAll} món</div>
          <p className="text-[10px] text-[#737373] mt-0.5">Tổng nhập</p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <span className="text-xs text-[#737373] font-medium">{t('allocatedStock')}</span>
          <div className="text-xl font-bold text-[#315C4C] mt-1">{totalAllocatedAll} món</div>
          <p className="text-[10px] text-[#737373] mt-0.5">Đã cấp cho quầy</p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <span className="text-xs text-[#737373] font-medium">{t('storageStock')}</span>
          <div className="text-xl font-bold text-[#B7791F] mt-1">{storageStockAll} món</div>
          <p className="text-[10px] text-[#737373] mt-0.5">Còn tại kho tổng</p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <span className="text-xs text-[#737373] font-medium">{t('soldStock')}</span>
          <div className="text-xl font-bold text-[#2F7D55] mt-1">{totalSoldAll} món</div>
          <p className="text-[10px] text-[#737373] mt-0.5">Đã bán qua POS</p>
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
                onChange={(e) => handleSelectEvent(e.target.value)}
              >
                <optgroup label="Sự kiện thực tế">
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

      {/* Sandbox Test Mode Notice Banner */}
      {isTestEvent(selectedEventId) && (
        <div className="flex items-center gap-2 p-3 rounded-[6px] bg-[#FEF7EC] border border-[#B7791F]/30 text-xs text-[#B7791F] shadow-xs">
          <FlaskConical className="w-4 h-4 shrink-0 text-[#B7791F]" />
          <span>
            <strong>Quầy hàng thử nghiệm (Sandbox):</strong> Lượng hàng cấp và doanh số tại quầy test POS được cách ly độc lập, <strong>hoàn toàn không ảnh hưởng</strong> đến tồn kho tổng hay số liệu xuất kho thực tế của các show diễn.
          </span>
        </div>
      )}

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
                  <th className="py-3 px-4 font-semibold text-right">Số lượng (Tổng)</th>
                  <th className="py-3 px-4 font-semibold text-center text-[#1D4ED8]">Online</th>
                  <th className="py-3 px-4 font-semibold text-center text-[#8C5D17]">Preord</th>
                  <th className="py-3 px-4 font-semibold text-right">Đã bán offline</th>
                  <th className="py-3 px-4 font-semibold text-right text-[#2F7D55]">Tồn bán offline</th>
                  <th className="py-3 px-4 font-semibold text-right text-[#315C4C]">
                    Cấp quầy ({selectedBooth.code})
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold text-center">Điều chỉnh nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0ED]">
                {activeVariants.map((v) => {
                  const product = products.find((p) => p.id === v.product_id);
                  const allAllocations = allocations.filter((a) => a.variant_id === v.id);
                  const realAllocationsForVar = allAllocations.filter((a) => !a.is_test);
                  const totalAllocated = allAllocations.reduce(
                    (sum, a) => sum + a.allocated_quantity,
                    0
                  );
                  const totalSoldOffline = realAllocationsForVar.reduce(
                    (sum, a) => sum + (a.sold_quantity || 0),
                    0
                  );
                  const centralStorageRemaining = Math.max(0, v.total_inventory - totalAllocated);

                  const boothAlloc = allAllocations.find((a) => a.booth_id === selectedBooth.id);
                  const currentAllocQty = boothAlloc?.allocated_quantity || 0;
                  const currentSoldQty = boothAlloc?.sold_quantity || 0;
                  const availableToSell = Math.max(0, currentAllocQty - currentSoldQty);
                  const stock = calculateVariantStock(v, totalSoldOffline, totalAllocated);

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

                      <td className="py-3 px-4 text-center font-bold text-[#1D4ED8]">
                        {stock.online > 0 ? stock.online : '—'}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-[#8C5D17]">
                        {stock.preord > 0 ? stock.preord : '—'}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-[#737373]">
                        {stock.offlineSold}
                        {currentSoldQty > 0 && (
                          <span className="text-[10px] text-[#315C4C] block font-semibold">
                            (Quầy: {currentSoldQty})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-[#2F7D55] text-sm bg-[#EAF4EE]/40">
                        {stock.offlineAvailable}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-[#315C4C] text-sm">
                        {currentAllocQty}
                        <span className="text-[10px] font-normal text-[#737373] block">
                          (Còn bán: {availableToSell})
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant={stock.badgeVariant} className="text-[10px]">
                          {stock.statusLabel}
                        </Badge>
                      </td>

                      {/* Quick Adjustment Controls */}
                      <td className="py-3 px-4 text-center">
                        {canManage && canManageProduct(user, product?.collab_partner) ? (
                          <div className="inline-flex items-center gap-1 bg-[#F0F0ED] p-1 rounded-[6px]">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-6 w-6 p-0 text-xs bg-white hover:bg-[#E8E8E5] text-[#202124]"
                              title="Giảm 10 món về kho tổng"
                              disabled={currentAllocQty <= currentSoldQty}
                              onClick={() => handleStockTransfer(v.id, v.name, -10)}
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
                              onClick={() => handleStockTransfer(v.id, v.name, 10)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : isPartner ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#737373] bg-[#F0F0ED] rounded border border-[#E8E8E5]" title="Hàng kho Admin - Bạn không thể chỉnh sửa">
                            <Lock className="w-3 h-3 text-[#9E9E9C]" />
                            <span>{currentAllocQty} (Kho Admin)</span>
                          </span>
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
            {activeVariants.map((v) => {
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

                  {/* 5 Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#F7F7F5] p-2.5 rounded-[6px] text-xs">
                    <div>
                      <span className="text-[#737373] text-[10px] block">Số lượng (Tổng nhập):</span>
                      <span className="font-bold text-sm text-[#202124]">{v.total_inventory}</span>
                    </div>
                    <div>
                      <span className="text-[#1D4ED8] text-[10px] block">Online:</span>
                      <span className="font-bold text-sm text-[#1D4ED8]">{stock.online}</span>
                    </div>
                    <div>
                      <span className="text-[#8C5D17] text-[10px] block">Preord / Giữ chỗ:</span>
                      <span className="font-bold text-sm text-[#8C5D17]">{stock.preord}</span>
                    </div>
                    <div>
                      <span className="text-[#737373] text-[10px] block">Đã bán offline:</span>
                      <span className="font-semibold text-xs text-[#2F7D55]">
                        {stock.offlineSold} {currentSoldQty > 0 && `(Quầy: ${currentSoldQty})`}
                      </span>
                    </div>
                    <div className="bg-[#EAF4EE] p-1 rounded border border-[#2F7D55]/20">
                      <span className="text-[#2F7D55] text-[10px] font-bold block">Tồn bán offline:</span>
                      <span className="font-black text-sm text-[#2F7D55]">{stock.offlineAvailable}</span>
                    </div>
                    <div>
                      <span className="text-[#315C4C] text-[10px] block">Hạn mức quầy:</span>
                      <span className="font-bold text-sm text-[#315C4C]">{currentAllocQty}</span>
                      <span className="text-[10px] text-[#737373] ml-1">(Còn: {availableToSell})</span>
                    </div>
                  </div>

                  {/* Quick Stepper Action */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-[#737373]">
                      {canManage && canManageProduct(user, product?.collab_partner)
                        ? 'Điều chuyển số lượng:'
                        : 'Hạn mức kho:'}
                    </span>
                    {canManage && canManageProduct(user, product?.collab_partner) ? (
                      <div className="flex items-center gap-1 bg-[#F0F0ED] p-1 rounded-[6px]">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 px-2 text-xs font-bold bg-white hover:bg-[#E8E8E5] text-[#202124] shadow-2xs"
                          disabled={currentAllocQty <= currentSoldQty}
                          onClick={() => handleStockTransfer(v.id, v.name, -10)}
                        >
                          -10
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 px-2 text-xs font-bold bg-white hover:bg-[#E8E8E5] text-[#202124] shadow-2xs"
                          disabled={currentAllocQty <= currentSoldQty}
                          onClick={() => handleStockTransfer(v.id, v.name, -1)}
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
                          onClick={() => handleStockTransfer(v.id, v.name, 1)}
                        >
                          +1
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 px-2 text-xs font-bold bg-white hover:bg-[#E8E8E5] text-[#202124] shadow-2xs"
                          disabled={centralStorageRemaining < 10}
                          onClick={() => handleStockTransfer(v.id, v.name, 10)}
                        >
                          +10
                        </Button>
                      </div>
                    ) : isPartner ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#737373] bg-[#F0F0ED] rounded border border-[#E8E8E5]" title="Hàng kho Admin - Bạn không thể chỉnh sửa">
                        <Lock className="w-3 h-3 text-[#9E9E9C]" />
                        <span>{currentAllocQty} (Kho Admin)</span>
                      </span>
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

      {/* Physical Stocktake & Discrepancy Reconciliation Modal */}
      <StocktakeModal
        isOpen={isStocktakeOpen}
        onClose={() => setIsStocktakeOpen(false)}
        booth={selectedBooth || null}
        event={selectedEvent || null}
      />
    </div>
  );
}
