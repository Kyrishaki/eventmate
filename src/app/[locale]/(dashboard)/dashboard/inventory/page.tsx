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

  function handleDirectSetAllocation(variantId: string, variantName: string, targetAlloc: number) {
    if (!selectedBooth || !selectedEvent) return;

    const targetVariant = variants.find((v) => v.id === variantId);
    const targetProduct = products.find((p) => p.id === targetVariant?.product_id);
    if (!canManageProduct(user, targetProduct?.collab_partner)) {
      alert('Bạn không có quyền điều chuyển hoặc thay đổi số lượng kho hàng của Admin.');
      return;
    }

    const currentAlloc = allocations.find(
      (a) => a.booth_id === selectedBooth.id && a.variant_id === variantId
    );
    const currentAllocQty = currentAlloc?.allocated_quantity || 0;
    const currentSoldQty = currentAlloc?.sold_quantity || 0;

    // Minimum limit cannot be less than already sold
    const validAlloc = Math.max(currentSoldQty, targetAlloc);

    // Maximum limit cannot exceed total_inventory minus other booths' allocations
    const otherBoothsAlloc = allocations
      .filter((a) => a.variant_id === variantId && a.booth_id !== selectedBooth.id)
      .reduce((sum, a) => sum + a.allocated_quantity, 0);
    const maxPossibleAlloc = Math.max(currentSoldQty, (targetVariant?.total_inventory || 0) - otherBoothsAlloc);
    const clampedAlloc = Math.min(validAlloc, maxPossibleAlloc);

    setAllocation(
      activeWorkspace?.id || 'ws-default',
      selectedEvent.id,
      selectedBooth.id,
      variantId,
      clampedAlloc
    );

    logActivity({
      actor_name: user?.fullName || 'Nhân viên kho',
      actor_role: (user?.role as AuditActorRole) || 'inventory_staff',
      action_type: 'stock_adjust',
      entity_type: 'inventory',
      entity_name: variantName,
      booth_name: selectedBooth.name,
      event_name: selectedEvent?.name,
      description: `Nhập trực tiếp số lượng cấp cho quầy "${selectedBooth.name}": ${clampedAlloc} món "${variantName}" (Cũ: ${currentAllocQty}).`,
      changes: [
        { field: 'allocated_quantity', field_label: 'Số lượng phân bổ', old_value: currentAllocQty, new_value: clampedAlloc },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5] dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124] dark:text-neutral-100">{t('title')}</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {variants.length} mã SKU
            </Badge>
          </div>
          <p className="text-xs text-[#737373] dark:text-neutral-400 mt-0.5">{t('description')}</p>
        </div>

        {selectedBooth && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStocktakeOpen(true)}
              className="gap-1.5 text-xs text-[#315C4C] dark:text-emerald-400 border-[#315C4C]/40 dark:border-emerald-700/60 hover:bg-[#EAF4EE] dark:hover:bg-emerald-950/40 font-semibold h-8 shadow-2xs"
              title="Kiểm đếm số lượng thực tế tại quầy và cân bằng kho"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-[#315C4C] dark:text-emerald-400" />
              <span>Kiểm Kê Quầy</span>
            </Button>
          </div>
        )}
      </div>

      {/* Collab Partner Scoped Access Notification Banner */}
      {isPartner && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-[8px] bg-[#FAF5FF] dark:bg-purple-950/40 border border-[#A855F7]/30 dark:border-purple-800/60 text-xs text-[#6B21A8] dark:text-purple-300 shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Users2 className="w-4 h-4 text-[#9333EA] dark:text-purple-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-[#6B21A8] dark:text-purple-200">
                Kho Hàng Đối tác Collab: {partnerName || 'Đối tác'}
              </p>
              <p className="text-[11px] text-[#7E22CE] dark:text-purple-300 mt-0.5">
                Bạn có quyền điều phối hàng hóa cho gian hàng hợp tác của mình. Kho hàng của Admin được hiển thị ở chế độ <strong>Chỉ đọc (Read-only)</strong> để bảo vệ dữ liệu tổng.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-[#A855F7] dark:border-purple-600 text-[#7E22CE] dark:text-purple-300 bg-[#A855F7]/10 dark:bg-purple-950/60 shrink-0 font-semibold">
            Kho Độc Lập
          </Badge>
        </div>
      )}

      {/* Master Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white dark:bg-neutral-900 border-[#E8E8E5] dark:border-neutral-800 shadow-2xs">
          <span className="text-xs text-[#737373] dark:text-neutral-400 font-medium">{t('totalStock')}</span>
          <div className="text-xl font-bold text-[#202124] dark:text-neutral-100 mt-1">{totalStockAll} món</div>
          <p className="text-[10px] text-[#737373] dark:text-neutral-400 mt-0.5">Tổng nhập</p>
        </Card>

        <Card className="p-4 bg-white dark:bg-neutral-900 border-[#E8E8E5] dark:border-neutral-800 shadow-2xs">
          <span className="text-xs text-[#737373] dark:text-neutral-400 font-medium">{t('allocatedStock')}</span>
          <div className="text-xl font-bold text-[#315C4C] dark:text-emerald-400 mt-1">{totalAllocatedAll} món</div>
          <p className="text-[10px] text-[#737373] dark:text-neutral-400 mt-0.5">Đã cấp cho quầy</p>
        </Card>

        <Card className="p-4 bg-white dark:bg-neutral-900 border-[#E8E8E5] dark:border-neutral-800 shadow-2xs">
          <span className="text-xs text-[#737373] dark:text-neutral-400 font-medium">{t('storageStock')}</span>
          <div className="text-xl font-bold text-[#B7791F] dark:text-amber-400 mt-1">{storageStockAll} món</div>
          <p className="text-[10px] text-[#737373] dark:text-neutral-400 mt-0.5">Còn tại kho tổng</p>
        </Card>

        <Card className="p-4 bg-white dark:bg-neutral-900 border-[#E8E8E5] dark:border-neutral-800 shadow-2xs">
          <span className="text-xs text-[#737373] dark:text-neutral-400 font-medium">{t('soldStock')}</span>
          <div className="text-xl font-bold text-[#2F7D55] dark:text-emerald-300 mt-1">{totalSoldAll} món</div>
          <p className="text-[10px] text-[#737373] dark:text-neutral-400 mt-0.5">Đã bán qua POS</p>
        </Card>
      </div>

      {/* Event and Booth Selector Bar */}
      <Card className="p-4 border-[#E8E8E5] dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Event Dropdown */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#9E9E9C] dark:text-neutral-400" />
              <select
                className="h-8 rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 text-xs font-semibold text-[#202124] dark:text-neutral-100 focus:outline-none focus:border-[#315C4C]"
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
            <div className="flex items-center gap-1.5 border-l border-[#E8E8E5] dark:border-neutral-700 pl-3">
              <Store className="w-3.5 h-3.5 text-[#9E9E9C] dark:text-neutral-400 mr-1" />
              {eventBooths.length === 0 ? (
                <span className="text-xs text-[#737373] dark:text-neutral-400">Sự kiện chưa có quầy bán nào</span>
              ) : (
                eventBooths.map((b) => {
                  const isSelected = b.id === selectedBoothId;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBoothId(b.id)}
                      className={`px-3 py-1 text-xs rounded-[4px] font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#315C4C] text-white shadow-xs'
                          : 'bg-[#F0F0ED] dark:bg-neutral-800 text-[#202124] dark:text-neutral-200 hover:bg-[#E8E8E5] dark:hover:bg-neutral-700'
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-xs text-[#737373] dark:text-neutral-400 flex items-center gap-1.5">
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
        <Card className="border-[#E8E8E5] dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden">
          <CardHeader className="py-3.5 px-5 bg-[#FAFAF8] dark:bg-neutral-800/60 border-b border-[#E8E8E5] dark:border-neutral-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#202124] dark:text-neutral-100">
                Phân bổ kho: {selectedBooth.name} ({selectedBooth.code})
              </CardTitle>
              <CardDescription className="text-xs text-[#737373] dark:text-neutral-400">
                Sự kiện: {selectedEvent?.name}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-bold">
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
              <thead className="bg-[#F7F7F5] dark:bg-neutral-800 border-b border-[#E8E8E5] dark:border-neutral-700 text-[#737373] dark:text-neutral-300 uppercase text-[10.5px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Sản phẩm & Biến thể</th>
                  <th className="py-3 px-4 font-mono">SKU</th>
                  <th className="py-3 px-4 text-right">Tổng nhập</th>
                  <th className="py-3 px-4 text-center">Giữ Online</th>
                  <th className="py-3 px-4 text-center">Giữ Pre-order</th>
                  <th className="py-3 px-4 text-right">Đã bán tại quầy</th>
                  <th className="py-3 px-4 text-center text-emerald-700 dark:text-emerald-300">Tồn khả dụng bán</th>
                  <th className="py-3 px-4 text-right text-[#315C4C] dark:text-emerald-300">
                    Cấp quầy ({selectedBooth.code})
                  </th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Điều chỉnh cấp kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0ED] dark:divide-neutral-800">
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
                    <tr key={v.id} className="hover:bg-[#FBFBFA] dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-[#202124] dark:text-neutral-100">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-[#9E9E9C] dark:text-neutral-400 shrink-0" />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-xs text-[#202124] dark:text-neutral-100">{product?.name}</p>
                              {product?.collab_partner && (
                                <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-[#8C5D17] dark:text-amber-300 bg-[#FEF7EC] dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-[#B7791F]/30">
                                  <Users2 className="w-2.5 h-2.5 text-[#B7791F]" />
                                  <span>Collab: {product.collab_partner}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#737373] dark:text-neutral-400 font-medium">{v.name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#737373] dark:text-neutral-400 font-semibold">
                        {v.sku}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-xs text-[#202124] dark:text-neutral-100">
                        {v.total_inventory}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {stock.online > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded text-xs font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 shadow-2xs">
                            {stock.online}
                          </span>
                        ) : (
                          <span className="text-neutral-400 dark:text-neutral-600 font-mono">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {stock.preord > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 shadow-2xs">
                            {stock.preord}
                          </span>
                        ) : (
                          <span className="text-neutral-400 dark:text-neutral-600 font-mono">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-neutral-700 dark:text-neutral-300">
                        <span className="text-xs font-semibold">{stock.offlineSold}</span>
                        {currentSoldQty > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">
                            (Tại quầy: {currentSoldQty})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[36px] px-2.5 py-1 rounded-[6px] text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                          {stock.offlineAvailable}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-[#315C4C] dark:text-emerald-400 block">
                          {currentAllocQty}
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-medium">
                          Còn bán: <strong className="text-neutral-800 dark:text-neutral-200">{availableToSell}</strong>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant={stock.badgeVariant} className="text-[10px] font-bold">
                          {stock.statusLabel}
                        </Badge>
                      </td>

                      {/* Quick Adjustment Controls */}
                      <td className="py-3 px-4 text-center">
                        {canManage && canManageProduct(user, product?.collab_partner) ? (
                          <div className="inline-flex items-center gap-1 bg-[#F0F0ED] dark:bg-neutral-800 p-1 rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700">
                            <button
                              type="button"
                              className="h-6 w-6 rounded bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 flex items-center justify-center font-bold text-xs shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Giảm 1 món về kho tổng"
                              disabled={currentAllocQty <= currentSoldQty}
                              onClick={() => handleStockTransfer(v.id, v.name, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <input
                              type="number"
                              min={currentSoldQty}
                              max={currentAllocQty + centralStorageRemaining}
                              value={currentAllocQty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                handleDirectSetAllocation(v.id, v.name, isNaN(val) ? 0 : val);
                              }}
                              className="w-14 h-6 text-center text-xs font-bold font-mono bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#315C4C]"
                              title="Nhập trực tiếp số lượng cấp cho quầy"
                            />

                            <button
                              type="button"
                              className="h-6 w-6 rounded bg-white dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 flex items-center justify-center font-bold text-xs shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Cấp thêm 1 món từ kho tổng"
                              disabled={centralStorageRemaining < 1}
                              onClick={() => handleStockTransfer(v.id, v.name, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : isPartner ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#737373] dark:text-neutral-400 bg-[#F0F0ED] dark:bg-neutral-800 rounded border border-[#E8E8E5] dark:border-neutral-700" title="Hàng kho Admin - Bạn không thể chỉnh sửa">
                            <Lock className="w-3 h-3 text-[#9E9E9C]" />
                            <span>{currentAllocQty} (Kho Admin)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold text-[#737373] dark:text-neutral-400 bg-[#F0F0ED] dark:bg-neutral-800 rounded">
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
          <div className="md:hidden divide-y divide-[#F0F0ED] dark:divide-neutral-800">
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-sm text-[#202124] dark:text-neutral-100 truncate">{product?.name}</h4>
                        {product?.collab_partner && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                            🤝 {product.collab_partner}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-[#315C4C] dark:text-emerald-300 bg-[#EBF1EE] dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-[#D5E2DC] dark:border-emerald-800">
                          {v.name}
                        </span>
                        <span className="text-[11px] font-mono text-[#737373] dark:text-neutral-400">{v.sku}</span>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#F7F7F5] dark:bg-neutral-800/70 p-2.5 rounded-[6px] text-xs border border-[#E8E8E5] dark:border-neutral-700/60">
                    <div className="p-1.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
                      <span className="text-[#737373] dark:text-neutral-400 text-[10px] block">Số lượng (Tổng nhập):</span>
                      <span className="font-bold text-sm text-[#202124] dark:text-neutral-100">{v.total_inventory}</span>
                    </div>
                    <div className="p-1.5 rounded bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/60">
                      <span className="text-blue-600 dark:text-blue-300 text-[10px] font-medium block">Giữ Online:</span>
                      <span className="font-bold text-sm text-blue-700 dark:text-blue-300">{stock.online}</span>
                    </div>
                    <div className="p-1.5 rounded bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/60">
                      <span className="text-amber-600 dark:text-amber-300 text-[10px] font-medium block">Preord / Giữ chỗ:</span>
                      <span className="font-bold text-sm text-amber-700 dark:text-amber-300">{stock.preord}</span>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
                      <span className="text-[#737373] dark:text-neutral-400 text-[10px] block">Đã bán offline:</span>
                      <span className="font-semibold text-xs text-emerald-700 dark:text-emerald-400">
                        {stock.offlineSold} {currentSoldQty > 0 && `(Quầy: ${currentSoldQty})`}
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/70 dark:border-emerald-700">
                      <span className="text-emerald-700 dark:text-emerald-300 text-[10px] font-bold block">Tồn bán offline:</span>
                      <span className="font-black text-sm text-emerald-700 dark:text-emerald-300">{stock.offlineAvailable}</span>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800">
                      <span className="text-[#315C4C] dark:text-emerald-400 text-[10px] font-medium block">Hạn mức quầy:</span>
                      <span className="font-bold text-sm text-[#315C4C] dark:text-emerald-300">{currentAllocQty}</span>
                      <span className="text-[10px] text-[#737373] dark:text-neutral-400 ml-1">(Còn: {availableToSell})</span>
                    </div>
                  </div>

                  {/* Quick Stepper Action */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-[#737373] dark:text-neutral-400">
                      {canManage && canManageProduct(user, product?.collab_partner)
                        ? 'Điều chuyển số lượng:'
                        : 'Hạn mức kho:'}
                    </span>
                    {canManage && canManageProduct(user, product?.collab_partner) ? (
                      <div className="flex items-center gap-1.5 bg-[#F0F0ED] dark:bg-neutral-800 p-1 rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700">
                        <button
                          type="button"
                          className="h-8 w-8 rounded bg-white dark:bg-neutral-700 hover:bg-[#E8E8E5] dark:hover:bg-neutral-600 text-[#202124] dark:text-neutral-100 flex items-center justify-center font-bold text-xs shadow-2xs border border-[#E8E8E5] dark:border-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          disabled={currentAllocQty <= currentSoldQty}
                          onClick={() => handleStockTransfer(v.id, v.name, -1)}
                          title="Giảm 1 món"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          min={currentSoldQty}
                          max={currentAllocQty + centralStorageRemaining}
                          value={currentAllocQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleDirectSetAllocation(v.id, v.name, isNaN(val) ? 0 : val);
                          }}
                          className="w-16 h-8 text-center text-xs font-bold font-mono bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-700 rounded text-[#202124] dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#315C4C]"
                          title="Nhập trực tiếp số lượng cấp cho quầy"
                        />

                        <button
                          type="button"
                          className="h-8 w-8 rounded bg-white dark:bg-neutral-700 hover:bg-[#E8E8E5] dark:hover:bg-neutral-600 text-[#202124] dark:text-neutral-100 flex items-center justify-center font-bold text-xs shadow-2xs border border-[#E8E8E5] dark:border-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          disabled={centralStorageRemaining < 1}
                          onClick={() => handleStockTransfer(v.id, v.name, 1)}
                          title="Cấp thêm 1 món"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : isPartner ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#737373] dark:text-neutral-400 bg-[#F0F0ED] dark:bg-neutral-800 rounded border border-[#E8E8E5] dark:border-neutral-700" title="Hàng kho Admin - Bạn không thể chỉnh sửa">
                        <Lock className="w-3 h-3 text-[#9E9E9C] dark:text-neutral-400" />
                        <span>{currentAllocQty} (Kho Admin)</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#315C4C] dark:text-emerald-300 bg-[#F0F0ED] dark:bg-neutral-800 px-2.5 py-1 rounded border border-[#E8E8E5] dark:border-neutral-700">
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
