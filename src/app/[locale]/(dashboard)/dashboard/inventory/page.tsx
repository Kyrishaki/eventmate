'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore, canManageProduct, isCollabPartner } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, cn } from '@/lib/utils';
import { calculateVariantStock } from '@/lib/stock-status';
import { logActivity } from '@/stores/audit-store';
import { Product, AuditActorRole } from '@/types/database';
import {
  Boxes,
  Store,
  Calendar,
  Plus,
  Minus,
  Package,
  Bookmark,
  Globe,
  FlaskConical,
  Lock,
  Users2,
  ClipboardCheck,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  LayoutList,
  Table2,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { StocktakeModal } from '@/components/inventory/stocktake-modal';
import {
  filterRealAllocations,
  filterRealEvents,
  isTestEvent,
} from '@/lib/test-data-filter';

export default function InventoryPage() {
  const t = useTranslations('inventory');
  const { activeWorkspace } = useWorkspaceStore();
  const {
    events,
    booths,
    products,
    variants,
    allocations,
    setAllocation,
    quickTransferStock,
    updateVariantPreorders,
  } = useDataStore();
  const { canManageInventory, user } = useAuthStore();
  const canManage = canManageInventory();
  const isPartner = isCollabPartner(user?.role);
  const partnerName = user?.collabPartnerName;

  // Local state for manual quantity typing
  const [allocInputs, setAllocInputs] = React.useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = React.useState('');
  const [stockFilter, setStockFilter] = React.useState<
    'all' | 'allocated' | 'has_unallocated' | 'low_or_empty'
  >('all');
  const [viewMode, setViewMode] = React.useState<'grouped' | 'table'>('grouped');

  // Quick Master Stock / Preorder Edit Modal right from Inventory page
  const [masterEditProduct, setMasterEditProduct] = React.useState<Product | null>(null);
  const [masterEditVariants, setMasterEditVariants] = React.useState<
    Array<{
      id: string;
      name: string;
      sku: string;
      total: number;
      reserved: number;
      online: number;
      offlineSold: number;
    }>
  >([]);

  function getProductThumbnail(product?: { name?: string; image_url?: string | null } | null) {
    if (product?.image_url) return product.image_url;
    const lower = (product?.name || '').toLowerCase();
    if (lower.includes('keychain') || lower.includes('móc khóa')) {
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';
    }
    return null;
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

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedBooth = booths.find((b) => b.id === selectedBoothId);

  function handleSelectEvent(eventId: string) {
    setSelectedEventId(eventId);
    const availableBooths = booths.filter((b) => b.event_id === eventId);
    if (availableBooths.length > 0) {
      setSelectedBoothId(availableBooths[0].id);
    } else {
      setSelectedBoothId('');
    }
  }

  function openMasterStockModal(prod: Product) {
    if (!canManageProduct(user, prod.collab_partner)) {
      alert('Bạn chỉ có quyền điều chỉnh sản phẩm thuộc thương hiệu Collab của mình.');
      return;
    }
    const prodVariants = variants.filter((v) => v.product_id === prod.id);
    setMasterEditProduct(prod);
    setMasterEditVariants(
      prodVariants.map((v) => {
        const vAllocs = allocations.filter((a) => a.variant_id === v.id && !a.is_test);
        const soldOff = vAllocs.reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
        return {
          id: v.id,
          name: v.name,
          sku: v.sku,
          total: v.total_inventory,
          reserved: v.reserved_quantity || 0,
          online: v.online_preorder_quantity || 0,
          offlineSold: soldOff,
        };
      })
    );
  }

  function handleSaveMasterStock() {
    masterEditVariants.forEach((mv) => {
      updateVariantPreorders(mv.id, {
        totalInventory: mv.total,
        reservedQuantity: mv.reserved,
        onlinePreorderQuantity: mv.online,
      });
    });

    if (masterEditProduct) {
      logActivity({
        actor_name: user?.fullName || 'Nhân viên kho / Admin',
        actor_role: (user?.role as AuditActorRole) || 'inventory_staff',
        action_type: 'preorder_adjust',
        entity_type: 'variant',
        entity_name: masterEditProduct.name,
        description: `Cập nhật kho gốc & giữ chỗ cho "${masterEditProduct.name}": ${masterEditVariants
          .map((v) => `${v.name} (Tổng: ${v.total}, VIP: ${v.reserved}, Onl: ${v.online})`)
          .join('; ')}.`,
      });
    }

    setMasterEditProduct(null);
  }

  function handleStockTransfer(variantId: string, variantName: string, amount: number) {
    if (!selectedBooth) return;

    const targetVariant = variants.find((v) => v.id === variantId);
    const targetProduct = products.find((p) => p.id === targetVariant?.product_id);
    if (!canManageProduct(user, targetProduct?.collab_partner)) {
      alert('Bạn không có quyền điều chuyển hoặc thay đổi số lượng kho hàng của Admin.');
      return;
    }

    if (!targetVariant) return;

    const success = quickTransferStock(selectedBooth.id, variantId, amount);
    if (success) {
      setAllocInputs((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
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
          {
            field: 'allocation_delta',
            field_label: 'Số lượng chuyển',
            new_value: amount > 0 ? `+${amount}` : String(amount),
          },
        ],
      });
    }
  }

  function handleDirectSetAllocation(variantId: string, variantName: string, targetAlloc: number) {
    if (!selectedBooth || !selectedEvent) return;

    const targetVariant = variants.find((v) => v.id === variantId);
    const targetProduct = products.find((p) => p.id === targetVariant?.product_id);
    if (!canManageProduct(user, targetProduct?.collab_partner)) {
      alert('Bạn không có quyền điều chuyển hoặc thay đổi số lượng kho hàng của Admin.');
      return;
    }

    if (!targetVariant) return;

    const currentAlloc = allocations.find(
      (a) => a.booth_id === selectedBooth.id && a.variant_id === variantId
    );
    const currentAllocQty = currentAlloc?.allocated_quantity || 0;
    const currentSoldQty = currentAlloc?.sold_quantity || 0;

    const minAlloc = currentSoldQty;
    const maxOfflineLimit = Math.max(
      0,
      targetVariant.total_inventory -
        (targetVariant.online_preorder_quantity || 0) -
        (targetVariant.reserved_quantity || 0)
    );
    const otherRealSold = allocations
      .filter(
        (a) => a.variant_id === variantId && a.booth_id !== selectedBooth.id && !a.is_test
      )
      .reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
    const maxPossibleAlloc = Math.max(minAlloc, maxOfflineLimit - otherRealSold);

    let clampedAlloc = Math.max(minAlloc, targetAlloc);
    if (clampedAlloc > maxPossibleAlloc) {
      clampedAlloc = maxPossibleAlloc;
    }

    if (clampedAlloc === currentAllocQty) {
      setAllocInputs((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      return;
    }

    setAllocation(
      activeWorkspace?.id || 'ws-default',
      selectedEvent.id,
      selectedBooth.id,
      variantId,
      clampedAlloc
    );

    setAllocInputs((prev) => {
      const next = { ...prev };
      delete next[variantId];
      return next;
    });

    logActivity({
      actor_name: user?.fullName || 'Nhân viên kho',
      actor_role: (user?.role as AuditActorRole) || 'inventory_staff',
      action_type: 'stock_adjust',
      entity_type: 'inventory',
      entity_name: variantName,
      booth_name: selectedBooth.name,
      event_name: selectedEvent?.name,
      description: `Cập nhật hạn mức cấp cho quầy "${selectedBooth.name}": ${clampedAlloc} món "${variantName}" (Cũ: ${currentAllocQty}).`,
      changes: [
        {
          field: 'allocated_quantity',
          field_label: 'Số lượng phân bổ',
          old_value: currentAllocQty,
          new_value: clampedAlloc,
        },
      ],
    });
  }

  // Bulk allocate all remaining available stock of a single product to selectedBooth
  function handleAllocateMaxForProduct(prod: Product) {
    if (!selectedBooth || !selectedEvent) return;
    if (!canManageProduct(user, prod.collab_partner)) return;

    const prodVars = variants.filter((v) => v.product_id === prod.id);
    let updatedCount = 0;

    prodVars.forEach((v) => {
      const allAllocs = allocations.filter((a) => a.variant_id === v.id);
      const boothAlloc = allAllocs.find((a) => a.booth_id === selectedBooth.id);
      const currentAllocQty = boothAlloc?.allocated_quantity || 0;
      const currentSoldQty = boothAlloc?.sold_quantity || 0;

      const maxOfflineCap = Math.max(
        0,
        v.total_inventory - (v.online_preorder_quantity || 0) - (v.reserved_quantity || 0)
      );
      const otherRealSold = allAllocs
        .filter((a) => a.booth_id !== selectedBooth.id && !a.is_test)
        .reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
      const maxAllowed = Math.max(currentSoldQty, maxOfflineCap - otherRealSold);

      if (maxAllowed > currentAllocQty) {
        setAllocation(
          activeWorkspace?.id || 'ws-default',
          selectedEvent.id,
          selectedBooth.id,
          v.id,
          maxAllowed
        );
        updatedCount += 1;
      }
    });

    if (updatedCount > 0) {
      logActivity({
        actor_name: user?.fullName || 'Nhân viên kho',
        actor_role: (user?.role as AuditActorRole) || 'inventory_staff',
        action_type: 'stock_adjust',
        entity_type: 'inventory',
        entity_name: prod.name,
        booth_name: selectedBooth.name,
        event_name: selectedEvent?.name,
        description: `Cấp tối đa tồn kho khả dụng của sản phẩm "${prod.name}" cho quầy "${selectedBooth.name}".`,
      });
    }
  }

  function handleAllocateMaxAllProducts() {
    if (!selectedBooth || !selectedEvent) return;
    let totalUpdated = 0;

    activeVariants.forEach((v) => {
      const prod = products.find((p) => p.id === v.product_id);
      if (!canManageProduct(user, prod?.collab_partner)) return;

      const allAllocs = allocations.filter((a) => a.variant_id === v.id);
      const boothAlloc = allAllocs.find((a) => a.booth_id === selectedBooth.id);
      const currentAllocQty = boothAlloc?.allocated_quantity || 0;
      const currentSoldQty = boothAlloc?.sold_quantity || 0;

      const maxOfflineCap = Math.max(
        0,
        v.total_inventory - (v.online_preorder_quantity || 0) - (v.reserved_quantity || 0)
      );
      const otherRealSold = allAllocs
        .filter((a) => a.booth_id !== selectedBooth.id && !a.is_test)
        .reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
      const maxAllowed = Math.max(currentSoldQty, maxOfflineCap - otherRealSold);

      if (maxAllowed > currentAllocQty) {
        setAllocation(
          activeWorkspace?.id || 'ws-default',
          selectedEvent.id,
          selectedBooth.id,
          v.id,
          maxAllowed
        );
        totalUpdated += 1;
      }
    });

    if (totalUpdated > 0) {
      logActivity({
        actor_name: user?.fullName || 'Nhân viên kho',
        actor_role: (user?.role as AuditActorRole) || 'inventory_staff',
        action_type: 'stock_adjust',
        entity_type: 'inventory',
        entity_name: selectedBooth.name,
        booth_name: selectedBooth.name,
        event_name: selectedEvent?.name,
        description: `Cấp tối đa toàn bộ hàng khả dụng trong kho tổng (${totalUpdated} mã loại) ra quầy "${selectedBooth.name}".`,
      });
    }
  }

  // Active variants of non-deleted products in current workspace
  const workspaceProducts = products.filter(
    (p) => !p.is_deleted && (!activeWorkspace || p.workspace_id === activeWorkspace.id)
  );
  const workspaceProductIds = new Set(workspaceProducts.map((p) => p.id));
  const activeVariants = variants.filter((v) => workspaceProductIds.has(v.product_id));

  // Overall Inventory Stats across active variants
  const totalStockAll = activeVariants.reduce((sum, v) => sum + v.total_inventory, 0);
  const totalHeldAll = activeVariants.reduce(
    (sum, v) => sum + (v.online_preorder_quantity || 0) + (v.reserved_quantity || 0),
    0
  );
  const activeVariantIds = new Set(activeVariants.map((v) => v.id));
  const realAllocations = filterRealAllocations(allocations);
  const activeRealAllocations = realAllocations.filter((a) => activeVariantIds.has(a.variant_id));
  const totalSoldAll = activeRealAllocations.reduce((sum, a) => sum + a.sold_quantity, 0);

  // Enrich each variant with computed metrics for the selected booth
  const enrichedVariants = activeVariants.map((v) => {
    const product = products.find((p) => p.id === v.product_id);
    const allAllocations = allocations.filter((a) => a.variant_id === v.id);
    const realAllocationsForVar = allAllocations.filter((a) => !a.is_test);
    const totalAllocated = realAllocationsForVar.reduce(
      (sum, a) => sum + a.allocated_quantity,
      0
    );
    const totalSoldOffline = realAllocationsForVar.reduce(
      (sum, a) => sum + (a.sold_quantity || 0),
      0
    );

    const totalHeldOnlineVip =
      (v.online_preorder_quantity || 0) + (v.reserved_quantity || 0);
    const isOverReserved = totalHeldOnlineVip > v.total_inventory;

    const maxOfflineCap = Math.max(0, v.total_inventory - totalHeldOnlineVip);

    const boothAlloc = selectedBooth
      ? allAllocations.find((a) => a.booth_id === selectedBooth.id)
      : undefined;
    const currentAllocQty = boothAlloc?.allocated_quantity || 0;
    const currentSoldQty = boothAlloc?.sold_quantity || 0;
    const availableToSell = Math.max(0, currentAllocQty - currentSoldQty);

    // Physical stock sold at other real booths cannot be reallocated; unsold stock CAN be allocated to this booth
    const otherRealSold = selectedBooth
      ? realAllocationsForVar
          .filter((a) => a.booth_id !== selectedBooth.id)
          .reduce((sum, a) => sum + (a.sold_quantity || 0), 0)
      : totalSoldOffline;

    const maxAllowedBoothAlloc = Math.max(currentSoldQty, maxOfflineCap - otherRealSold);
    const centralStorageRemaining = Math.max(0, maxAllowedBoothAlloc - currentAllocQty);
    const stock = calculateVariantStock(v, totalSoldOffline, totalAllocated);

    return {
      variant: v,
      product,
      totalAllocated,
      totalSoldOffline,
      totalHeldOnlineVip,
      isOverReserved,
      maxOfflineCap,
      currentAllocQty,
      currentSoldQty,
      availableToSell,
      maxAllowedBoothAlloc,
      centralStorageRemaining,
      stock,
    };
  });

  // Filter counts
  const countAllocated = enrichedVariants.filter((item) => item.currentAllocQty > 0).length;
  const countHasUnallocated = enrichedVariants.filter(
    (item) => item.centralStorageRemaining > 0
  ).length;
  const countLowOrEmpty = enrichedVariants.filter(
    (item) => item.availableToSell <= 5
  ).length;

  // Filtered variants based on search & stockFilter
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEnrichedVariants = enrichedVariants.filter((item) => {
    if (stockFilter === 'allocated' && item.currentAllocQty <= 0) return false;
    if (stockFilter === 'has_unallocated' && item.centralStorageRemaining <= 0) return false;
    if (stockFilter === 'low_or_empty' && item.availableToSell > 5) return false;

    if (!normalizedQuery) return true;
    const matchName = (item.product?.name || '').toLowerCase().includes(normalizedQuery);
    const matchVar = item.variant.name.toLowerCase().includes(normalizedQuery);
    const matchSku = item.variant.sku.toLowerCase().includes(normalizedQuery);
    return matchName || matchVar || matchSku;
  });

  // Group filtered variants by Product for Grouped View
  const groupedProductsMap = new Map<
    string,
    {
      product: Product;
      items: typeof filteredEnrichedVariants;
    }
  >();

  filteredEnrichedVariants.forEach((item) => {
    if (!item.product) return;
    const existing = groupedProductsMap.get(item.product.id);
    if (existing) {
      existing.items.push(item);
    } else {
      groupedProductsMap.set(item.product.id, { product: item.product, items: [item] });
    }
  });

  const groupedProducts = Array.from(groupedProductsMap.values());

  // Selected Booth Aggregate Stats
  const boothStats = enrichedVariants.reduce(
    (acc, item) => {
      acc.boothAllocated += item.currentAllocQty;
      acc.boothSold += item.currentSoldQty;
      acc.boothAvailable += item.availableToSell;
      acc.unallocatedInWarehouse += item.centralStorageRemaining;
      return acc;
    },
    { boothAllocated: 0, boothSold: 0, boothAvailable: 0, unallocatedInWarehouse: 0 }
  );

  const currency = activeWorkspace?.currency || 'VND';

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">{t('title')}</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF1EE] text-[#315C4C] border border-[#315C4C]/20">
              {workspaceProducts.length} sản phẩm · {activeVariants.length} mã loại
            </span>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">{t('description')}</p>
        </div>

        {selectedBooth && (
          <div className="flex flex-wrap items-center gap-2">
            {canManage && boothStats.unallocatedInWarehouse > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAllocateMaxAllProducts}
                className="gap-1.5 text-xs h-9 px-3 rounded-lg border-[#315C4C]/40 text-[#315C4C] hover:bg-[#EAF4EE] font-semibold shadow-2xs"
                title="Cấp toàn bộ số lượng khả dụng còn trong kho tổng ra quầy đang chọn"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#315C4C]" />
                <span>
                  Cấp hết kho ra {selectedBooth.name} (+{boothStats.unallocatedInWarehouse})
                </span>
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsStocktakeOpen(true)}
              className="gap-1.5 text-xs h-9 px-3.5 rounded-lg font-semibold shadow-xs"
              title="Kiểm đếm số lượng thực tế tại quầy và cân bằng kho"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Kiểm kê quầy ({selectedBooth.code})</span>
            </Button>
          </div>
        )}
      </div>

      {/* Collab Partner Scoped Access Notification Banner */}
      {isPartner && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-[#FAF5FF] border border-[#A855F7]/30 text-xs text-[#6B21A8] shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Users2 className="w-4 h-4 text-[#9333EA] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-[#6B21A8]">
                Kho Hàng Đối tác Collab: {partnerName || 'Đối tác'}
              </p>
              <p className="text-[11px] text-[#7E22CE] mt-0.5">
                Bạn có quyền điều phối hàng hóa cho gian hàng hợp tác của mình. Kho hàng của Admin
                được hiển thị ở chế độ <strong>Chỉ đọc (Read-only)</strong>.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-xs border-[#A855F7] text-[#7E22CE] bg-[#A855F7]/10 shrink-0 font-semibold"
          >
            Kho Độc Lập
          </Badge>
        </div>
      )}

      {/* 4 Clear Inventory KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E8E8E5] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-[#737373]">
              Còn bán tại {selectedBooth ? selectedBooth.name : 'quầy'}
            </p>
            <p className="text-lg font-extrabold text-[#2F7D55] mt-0.5 font-mono">
              {boothStats.boothAvailable.toLocaleString('vi-VN')}
              <span className="text-xs font-normal text-[#737373] ml-1">
                / {boothStats.boothAllocated} đã cấp
              </span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EAF4EE] flex items-center justify-center text-[#2F7D55] shrink-0">
            <Store className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E8E5] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-[#737373]">
              Có thể cấp thêm cho {selectedBooth ? selectedBooth.name : 'quầy'}
            </p>
            <p className="text-lg font-extrabold text-[#B7791F] mt-0.5 font-mono">
              +{boothStats.unallocatedInWarehouse.toLocaleString('vi-VN')}
              <span className="text-xs font-normal text-[#737373] ml-1">món khả dụng</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#FEF7EC] flex items-center justify-center text-[#B7791F] shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E8E5] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-[#737373]">Đã khóa (Online & VIP)</p>
            <p className="text-lg font-extrabold text-[#1D4ED8] mt-0.5 font-mono">
              {totalHeldAll.toLocaleString('vi-VN')}
              <span className="text-xs font-normal text-[#737373] ml-1">
                / {totalStockAll} tổng kho
              </span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8] shrink-0">
            <Globe className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E8E5] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-[#737373]">Đã bán qua POS</p>
            <p className="text-lg font-extrabold text-[#202124] mt-0.5 font-mono">
              {totalSoldAll.toLocaleString('vi-VN')}
              <span className="text-xs font-normal text-[#737373] ml-1">món đã xuất</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center text-[#737373] shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Unified Event & Booth Selector + Filter & Search Toolbar (Solid Dark-Mode-Safe Surfaces) */}
      <div className="bg-white border border-[#E8E8E5] rounded-xl shadow-2xs overflow-hidden divide-y divide-[#F0F0ED]">
        {/* Top Row: Event & Booth Selection */}
        <div className="p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap items-center gap-3">
            {/* Event Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#737373] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#315C4C]" />
                <span>Sự kiện:</span>
              </span>
              <select
                className="h-8 rounded-lg border border-[#E8E8E5] bg-[#F7F7F5] px-2.5 text-xs font-bold text-[#202124] focus:outline-none focus:border-[#315C4C]"
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

            <span className="hidden sm:inline text-[#E8E8E5]">|</span>

            {/* Booth Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#737373] flex items-center gap-1 mr-1">
                <Store className="w-3.5 h-3.5 text-[#315C4C]" />
                <span>Quầy nhận hàng:</span>
              </span>
              {eventBooths.length === 0 ? (
                <span className="text-xs text-[#737373] italic">
                  Sự kiện chưa có quầy bán nào
                </span>
              ) : (
                eventBooths.map((b) => {
                  const isSelected = b.id === selectedBoothId;
                  const bAllocTotal = allocations
                    .filter((a) => a.booth_id === b.id)
                    .reduce((sum, a) => sum + a.allocated_quantity, 0);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBoothId(b.id)}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer border',
                        isSelected
                          ? 'bg-[#315C4C] text-white border-[#315C4C] shadow-xs'
                          : 'bg-[#F7F7F5] text-[#202124] border-[#E8E8E5] hover:border-[#315C4C]/40'
                      )}
                    >
                      <span>{b.name}</span>
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0.2 rounded',
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-[#737373] border border-[#E8E8E5]'
                        )}
                      >
                        {bAllocTotal} món
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-[11px] text-[#737373] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2F7D55] shrink-0" />
            <span>Hàng Online & Giữ VIP được khóa tự động, không thể cấp nhầm ra quầy</span>
          </div>
        </div>

        {/* Bottom Row: Filter Tabs + Search Input + View Switcher (No /60 opacity!) */}
        <div className="p-2.5 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F7F5] rounded-lg border border-[#E8E8E5] text-xs">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={cn(
                'px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5',
                stockFilter === 'all'
                  ? 'bg-white text-[#202124] shadow-2xs'
                  : 'text-[#737373] hover:text-[#202124]'
              )}
            >
              <span>Tất cả</span>
              <span className="text-[10px] font-mono px-1.5 rounded bg-[#E8E8E5] text-[#202124]">
                {enrichedVariants.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStockFilter('allocated')}
              className={cn(
                'px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5',
                stockFilter === 'allocated'
                  ? 'bg-white text-[#315C4C] shadow-2xs'
                  : 'text-[#737373] hover:text-[#202124]'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D55]" />
              <span>Đã cấp cho quầy</span>
              <span className="text-[10px] font-mono px-1.5 rounded bg-[#EAF4EE] text-[#2F7D55]">
                {countAllocated}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStockFilter('has_unallocated')}
              className={cn(
                'px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5',
                stockFilter === 'has_unallocated'
                  ? 'bg-white text-[#B7791F] shadow-2xs'
                  : 'text-[#737373] hover:text-[#202124]'
              )}
            >
              <Boxes className="w-3.5 h-3.5 text-[#B7791F]" />
              <span>Có thể cấp thêm</span>
              <span className="text-[10px] font-mono px-1.5 rounded bg-[#FEF7EC] text-[#B7791F]">
                {countHasUnallocated}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStockFilter('low_or_empty')}
              className={cn(
                'px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5',
                stockFilter === 'low_or_empty'
                  ? 'bg-white text-[#C44536] shadow-2xs'
                  : 'text-[#737373] hover:text-[#202124]'
              )}
            >
              <AlertCircle className="w-3.5 h-3.5 text-[#C44536]" />
              <span>Sắp hết / Chưa cấp</span>
              <span className="text-[10px] font-mono px-1.5 rounded bg-[#FDF1F0] text-[#C44536]">
                {countLowOrEmpty}
              </span>
            </button>
          </div>

          {/* Right: Search + View Mode */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#9E9E9C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Tìm tên sản phẩm, size, mã loại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs rounded-lg bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9E9E9C] hover:text-[#202124]"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center p-0.5 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-xs font-semibold',
                  viewMode === 'grouped'
                    ? 'bg-white text-[#315C4C] shadow-2xs'
                    : 'text-[#737373] hover:text-[#202124]'
                )}
                title="Gom nhóm theo từng sản phẩm (Dễ nhìn & Dễ thao tác)"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Theo sản phẩm</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-xs font-semibold',
                  viewMode === 'table'
                    ? 'bg-white text-[#315C4C] shadow-2xs'
                    : 'text-[#737373] hover:text-[#202124]'
                )}
                title="Xem dạng bảng gọn"
              >
                <Table2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Bảng gọn</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sandbox Test Mode Notice Banner */}
      {isTestEvent(selectedEventId) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEF7EC] border border-[#B7791F]/30 text-xs text-[#B7791F] shadow-xs">
          <FlaskConical className="w-4 h-4 shrink-0 text-[#B7791F]" />
          <span>
            <strong>Quầy hàng thử nghiệm (Sandbox):</strong> Lượng hàng cấp và doanh số tại quầy
            test POS được cách ly độc lập, <strong>hoàn toàn không ảnh hưởng</strong> đến tồn kho
            tổng thực tế.
          </span>
        </div>
      )}

      {/* Main Inventory Content */}
      {!selectedBooth ? (
        <Card className="border-[#E8E8E5] rounded-xl shadow-xs">
          <CardContent className="p-12 text-center">
            <Store className="w-10 h-10 text-[#9E9E9C] mx-auto mb-3" />
            <p className="text-xs text-[#737373]">{t('selectBoothPrompt')}</p>
          </CardContent>
        </Card>
      ) : filteredEnrichedVariants.length === 0 ? (
        <Card className="border-[#E8E8E5] rounded-xl shadow-xs">
          <CardContent className="p-12 text-center">
            <Package className="w-10 h-10 text-[#9E9E9C] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#202124]">
              Không tìm thấy mã hàng phù hợp
            </h3>
            <p className="text-xs text-[#737373] mt-1">
              Thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm của bạn.
            </p>
            {(searchQuery || stockFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => {
                  setSearchQuery('');
                  setStockFilter('all');
                }}
              >
                Xóa bộ lọc
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grouped' ? (
        /* =========================================================
           GROUPED BY PRODUCT VIEW (Default - Clean & Ergonomic)
           - Single-variant products render as ONE unified row (no redundant 2-level header!)
           - Multi-variant products render with a clean dark-mode-safe header + variant rows
           ========================================================= */
        <div className="space-y-3">
          {groupedProducts.map(({ product, items }) => {
            const thumbUrl = getProductThumbnail(product);
            const canEditThisProd = canManage && canManageProduct(user, product.collab_partner);
            const isSingleVariant = items.length === 1;

            if (isSingleVariant) {
              const item = items[0];
              const {
                variant: v,
                currentAllocQty,
                currentSoldQty,
                availableToSell,
                maxAllowedBoothAlloc,
                centralStorageRemaining,
                isOverReserved,
                totalHeldOnlineVip,
                stock,
              } = item;
              const inputValue =
                allocInputs[v.id] !== undefined ? allocInputs[v.id] : String(currentAllocQty);

              return (
                <Card
                  key={product.id}
                  className="border-[#E8E8E5] bg-white rounded-xl shadow-2xs p-4 hover:border-[#315C4C]/35 transition-all"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Col 1-4: Product Image + Name + SKU + Price */}
                    <div className="lg:col-span-4 flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] overflow-hidden shrink-0 flex items-center justify-center">
                        {thumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-[#9E9E9C]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-bold text-[#202124] truncate">
                            {product.name}
                          </h3>
                          {product.collab_partner && (
                            <Badge variant="warning" className="text-[10px] gap-1">
                              <Users2 className="w-2.5 h-2.5" />
                              <span>{product.collab_partner}</span>
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs font-extrabold text-[#315C4C] font-mono">
                            {formatCurrency(v.price, currency)}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F7F7F5] border border-[#E8E8E5] text-[#737373]">
                            {v.name} · {v.sku}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Col 5-7: Central Warehouse & Online/VIP Info (Clickable to Edit Master Stock) */}
                    <div className="lg:col-span-3">
                      <div
                        onClick={() => canEditThisProd && openMasterStockModal(product)}
                        className={cn(
                          'bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs transition-colors',
                          canEditThisProd ? 'cursor-pointer hover:border-[#315C4C]/50' : ''
                        )}
                        title={
                          canEditThisProd
                            ? 'Bấm để chỉnh sửa Tổng kho nhập, Giữ VIP hoặc đơn Online'
                            : undefined
                        }
                      >
                        <div>
                          <span className="text-[10px] text-[#737373] block">Tổng kho</span>
                          <span className="font-bold text-[#202124] font-mono text-sm">
                            {v.total_inventory}
                          </span>
                        </div>

                        <div className="h-6 w-px bg-[#E8E8E5]" />

                        <div>
                          <span className="text-[10px] text-[#737373] block">Khóa Onl / VIP</span>
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <span className="font-bold text-[#1D4ED8]">{stock.online} Onl</span>
                            <span className="text-[#9E9E9C]">·</span>
                            <span className="font-bold text-[#B7791F]">{stock.preord} VIP</span>
                          </div>
                        </div>

                        <div className="h-6 w-px bg-[#E8E8E5]" />

                        <div className="text-right">
                          <span className="text-[10px] text-[#737373] block">Cấp thêm được</span>
                          <span
                            className={cn(
                              'font-extrabold font-mono text-sm',
                              centralStorageRemaining > 0 ? 'text-[#2F7D55]' : 'text-[#737373]'
                            )}
                          >
                            +{centralStorageRemaining}
                          </span>
                        </div>
                      </div>

                      {isOverReserved && (
                        <div className="mt-1 flex items-center justify-between text-[10px] text-[#C44536] px-1">
                          <span>
                            ⚠️ Khóa Onl+VIP ({totalHeldOnlineVip}) &gt; Tổng kho (
                            {v.total_inventory})
                          </span>
                          {canEditThisProd && (
                            <button
                              type="button"
                              onClick={() => openMasterStockModal(product)}
                              className="underline font-bold cursor-pointer"
                            >
                              Sửa ngay
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Col 8-9: Booth Status */}
                    <div className="lg:col-span-2 flex items-center justify-between lg:flex-col lg:items-start lg:justify-center gap-1">
                      <div
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border',
                          availableToSell <= 0
                            ? 'bg-[#FDF1F0] text-[#C44536] border-[#C44536]/20'
                            : availableToSell <= 5
                            ? 'bg-[#FEF7EC] text-[#B7791F] border-[#B7791F]/20'
                            : 'bg-[#EAF4EE] text-[#2F7D55] border-[#2F7D55]/20'
                        )}
                      >
                        <span>Còn bán tại quầy:</span>
                        <span className="font-mono text-sm font-extrabold">{availableToSell}</span>
                      </div>
                      <span className="text-[11px] text-[#737373] pl-0.5">
                        Đã bán:{' '}
                        <strong className="text-[#202124] font-mono">{currentSoldQty}</strong> /{' '}
                        <span className="font-mono">{currentAllocQty}</span> đã cấp
                      </span>
                    </div>

                    {/* Col 10-12: Direct Allocation Stepper + 1-Click Max + Master Edit */}
                    <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-end gap-1.5">
                      {canEditThisProd ? (
                        <>
                          <div className="flex items-center justify-between sm:justify-end gap-1.5">
                            <div className="inline-flex items-center gap-1 bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
                              <button
                                type="button"
                                className="h-8 w-8 rounded-lg bg-white hover:bg-[#E8E8E5] text-[#202124] flex items-center justify-center font-bold text-xs border border-[#E8E8E5] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                                title={
                                  currentAllocQty <= currentSoldQty
                                    ? `Không thể giảm dưới số lượng đã bán (${currentSoldQty})`
                                    : 'Thu hồi 1 món về kho tổng'
                                }
                                disabled={currentAllocQty <= currentSoldQty}
                                onClick={() => handleStockTransfer(v.id, v.name, -1)}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <input
                                type="number"
                                min={currentSoldQty}
                                max={maxAllowedBoothAlloc}
                                value={inputValue}
                                onChange={(e) => {
                                  setAllocInputs((prev) => ({
                                    ...prev,
                                    [v.id]: e.target.value,
                                  }));
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = parseInt(
                                      allocInputs[v.id] ?? String(currentAllocQty),
                                      10
                                    );
                                    handleDirectSetAllocation(
                                      v.id,
                                      v.name,
                                      isNaN(val) ? currentAllocQty : val
                                    );
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                onBlur={() => {
                                  if (allocInputs[v.id] !== undefined) {
                                    const val = parseInt(allocInputs[v.id], 10);
                                    handleDirectSetAllocation(
                                      v.id,
                                      v.name,
                                      isNaN(val) ? currentAllocQty : val
                                    );
                                  }
                                }}
                                className="w-16 h-8 text-center text-sm font-extrabold font-mono bg-white border border-[#E8E8E5] rounded-lg text-[#202124] focus:outline-none focus:border-[#315C4C]"
                                title={`Nhập trực tiếp số lượng cấp cho quầy (Tối thiểu: ${currentSoldQty}, Tối đa: ${maxAllowedBoothAlloc})`}
                              />

                              <button
                                type="button"
                                className="h-8 w-8 rounded-lg bg-white hover:bg-[#E8E8E5] text-[#202124] flex items-center justify-center font-bold text-xs border border-[#E8E8E5] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                                title={
                                  centralStorageRemaining < 1
                                    ? 'Đã đạt tối đa số lượng khả dụng'
                                    : 'Cấp thêm 1 món cho quầy'
                                }
                                disabled={centralStorageRemaining < 1}
                                onClick={() => handleStockTransfer(v.id, v.name, 1)}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {centralStorageRemaining > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDirectSetAllocation(v.id, v.name, maxAllowedBoothAlloc)
                                }
                                className="h-8 px-2.5 rounded-lg text-[11px] font-bold bg-[#EAF4EE] text-[#2F7D55] border border-[#2F7D55]/30 hover:bg-[#2F7D55] hover:text-white transition-colors shrink-0 cursor-pointer"
                                title={`Cấp toàn bộ +${centralStorageRemaining} món khả dụng ra quầy này`}
                              >
                                Cấp tối đa ({maxAllowedBoothAlloc})
                              </button>
                            ) : availableToSell > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDirectSetAllocation(v.id, v.name, currentSoldQty)
                                }
                                className="h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-[#F7F7F5] text-[#737373] border border-[#E8E8E5] hover:text-[#C44536] transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                                title={`Thu hồi ${availableToSell} món chưa bán về lại kho tổng`}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Thu hồi</span>
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => openMasterStockModal(product)}
                              className="h-8 w-8 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[#737373] hover:text-[#202124] flex items-center justify-center shrink-0 cursor-pointer"
                              title="Chỉnh sửa Tổng kho gốc / Online / Giữ VIP"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-[#B7791F]" />
                            </button>
                          </div>

                          <span className="text-[10px] text-[#737373] font-mono text-right">
                            Tối đa cấp được: {maxAllowedBoothAlloc} món
                          </span>
                        </>
                      ) : (
                        <span className="px-3 py-1.5 text-xs font-semibold text-[#737373] bg-[#F7F7F5] rounded-lg border border-[#E8E8E5]">
                          Đã cấp: {currentAllocQty} (Chỉ xem)
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            }

            // Multi-variant Product Card (e.g., Size S, Size M, Size L)
            const prodTotalUnallocated = items.reduce(
              (sum, i) => sum + i.centralStorageRemaining,
              0
            );
            const prodTotalBoothAvail = items.reduce((sum, i) => sum + i.availableToSell, 0);
            const prodTotalBoothAlloc = items.reduce((sum, i) => sum + i.currentAllocQty, 0);

            return (
              <Card
                key={product.id}
                className="border-[#E8E8E5] bg-white rounded-xl shadow-2xs overflow-hidden"
              >
                {/* Solid Dark-Mode-Safe Product Group Header (NO /70 opacity!) */}
                <div className="p-4 bg-[#F7F7F5] border-b border-[#E8E8E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E8E8E5] overflow-hidden shrink-0 flex items-center justify-center">
                      {thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-[#9E9E9C]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-bold text-[#202124] truncate">
                          {product.name}
                        </h3>
                        {product.collab_partner && (
                          <Badge variant="warning" className="text-[10px] gap-1">
                            <Users2 className="w-2.5 h-2.5" />
                            <span>Collab: {product.collab_partner}</span>
                          </Badge>
                        )}
                        <span className="text-[11px] text-[#737373] font-medium">
                          ({items.length} phân loại)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs">
                        <span className="text-[#737373]">
                          Đã cấp cho <strong>{selectedBooth.name}</strong>:{' '}
                          <strong className="text-[#202124] font-mono">
                            {prodTotalBoothAlloc}
                          </strong>
                        </span>
                        <span className="text-[#E8E8E5]">•</span>
                        <span className="text-[#2F7D55] font-semibold">
                          Còn bán tại quầy:{' '}
                          <strong className="font-mono">{prodTotalBoothAvail}</strong>
                        </span>
                        {prodTotalUnallocated > 0 && (
                          <>
                            <span className="text-[#E8E8E5]">•</span>
                            <span className="text-[#B7791F] font-semibold">
                              Có thể cấp thêm:{' '}
                              <strong className="font-mono">+{prodTotalUnallocated}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Product-Level Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {canEditThisProd ? (
                      <>
                        {prodTotalUnallocated > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAllocateMaxForProduct(product)}
                            className="h-8 px-3 text-xs gap-1.5 rounded-lg border-[#2F7D55]/40 text-[#2F7D55] hover:bg-[#EAF4EE] font-semibold bg-white"
                            title="Cấp toàn bộ số lượng khả dụng của tất cả các size ra quầy này"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Cấp tối đa tất cả size (+{prodTotalUnallocated})</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMasterStockModal(product)}
                          className="h-8 px-3 text-xs gap-1.5 rounded-lg bg-white font-semibold"
                          title="Chỉnh sửa Tổng kho vật lý, số lượng Giữ VIP hoặc đơn Khách đặt Online"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#B7791F]" />
                          <span>Chỉnh kho gốc / Online</span>
                        </Button>
                      </>
                    ) : isPartner ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#737373] bg-white rounded-lg border border-[#E8E8E5]">
                        <Lock className="w-3 h-3 text-[#9E9E9C]" />
                        <span>Kho Admin (Chỉ đọc)</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Variants Rows inside Multi-Variant Product Card */}
                <div className="divide-y divide-[#F0F0ED]">
                  {items.map((item) => {
                    const {
                      variant: v,
                      currentAllocQty,
                      currentSoldQty,
                      availableToSell,
                      maxAllowedBoothAlloc,
                      centralStorageRemaining,
                      stock,
                    } = item;

                    const inputValue =
                      allocInputs[v.id] !== undefined ? allocInputs[v.id] : String(currentAllocQty);

                    return (
                      <div
                        key={v.id}
                        className="p-3.5 hover:bg-[#F7F7F5] transition-colors grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
                      >
                        {/* Col 1-3: Variant Name, SKU & Price */}
                        <div className="lg:col-span-3 flex items-center justify-between lg:block">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[#202124]">{v.name}</span>
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#F7F7F5] border border-[#E8E8E5] text-[#737373]">
                                {v.sku}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-[#315C4C] font-mono mt-0.5 block">
                              {formatCurrency(v.price, currency)}
                            </span>
                          </div>
                        </div>

                        {/* Col 4-7: Central Warehouse Breakdown */}
                        <div className="lg:col-span-4 bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-[#737373] block">Tổng kho</span>
                            <span className="font-bold text-[#202124] font-mono text-sm">
                              {v.total_inventory}
                            </span>
                          </div>

                          <div className="h-6 w-px bg-[#E8E8E5]" />

                          <div>
                            <span className="text-[10px] text-[#737373] block">
                              Khóa Onl / VIP
                            </span>
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="font-bold text-[#1D4ED8]">{stock.online} Onl</span>
                              <span className="text-[#9E9E9C]">·</span>
                              <span className="font-bold text-[#B7791F]">{stock.preord} VIP</span>
                            </div>
                          </div>

                          <div className="h-6 w-px bg-[#E8E8E5]" />

                          <div className="text-right">
                            <span className="text-[10px] text-[#737373] block">Cấp thêm được</span>
                            <span
                              className={cn(
                                'font-extrabold font-mono text-sm',
                                centralStorageRemaining > 0 ? 'text-[#2F7D55]' : 'text-[#737373]'
                              )}
                            >
                              +{centralStorageRemaining}
                            </span>
                          </div>
                        </div>

                        {/* Col 8-9: Booth Current Status */}
                        <div className="lg:col-span-2 flex items-center justify-between lg:flex-col lg:items-start lg:justify-center gap-1">
                          <div
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border',
                              availableToSell <= 0
                                ? 'bg-[#FDF1F0] text-[#C44536] border-[#C44536]/20'
                                : availableToSell <= 5
                                ? 'bg-[#FEF7EC] text-[#B7791F] border-[#B7791F]/20'
                                : 'bg-[#EAF4EE] text-[#2F7D55] border-[#2F7D55]/20'
                            )}
                          >
                            <span>Còn bán tại quầy:</span>
                            <span className="font-mono text-sm font-extrabold">
                              {availableToSell}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#737373] pl-0.5">
                            Đã bán:{' '}
                            <strong className="text-[#202124] font-mono">{currentSoldQty}</strong> /{' '}
                            <span className="font-mono">{currentAllocQty}</span> đã cấp
                          </span>
                        </div>

                        {/* Col 10-12: Direct Allocation Controls */}
                        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-end gap-1.5">
                          {canEditThisProd ? (
                            <>
                              <div className="flex items-center justify-between sm:justify-end gap-1.5">
                                <div className="inline-flex items-center gap-1 bg-[#F7F7F5] p-1 rounded-xl border border-[#E8E8E5]">
                                  <button
                                    type="button"
                                    className="h-8 w-8 rounded-lg bg-white hover:bg-[#E8E8E5] text-[#202124] flex items-center justify-center font-bold text-xs border border-[#E8E8E5] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                                    title={
                                      currentAllocQty <= currentSoldQty
                                        ? `Không thể giảm dưới số lượng đã bán (${currentSoldQty})`
                                        : 'Thu hồi 1 món về kho tổng'
                                    }
                                    disabled={currentAllocQty <= currentSoldQty}
                                    onClick={() => handleStockTransfer(v.id, v.name, -1)}
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>

                                  <input
                                    type="number"
                                    min={currentSoldQty}
                                    max={maxAllowedBoothAlloc}
                                    value={inputValue}
                                    onChange={(e) => {
                                      setAllocInputs((prev) => ({
                                        ...prev,
                                        [v.id]: e.target.value,
                                      }));
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = parseInt(
                                          allocInputs[v.id] ?? String(currentAllocQty),
                                          10
                                        );
                                        handleDirectSetAllocation(
                                          v.id,
                                          v.name,
                                          isNaN(val) ? currentAllocQty : val
                                        );
                                        (e.target as HTMLInputElement).blur();
                                      }
                                    }}
                                    onBlur={() => {
                                      if (allocInputs[v.id] !== undefined) {
                                        const val = parseInt(allocInputs[v.id], 10);
                                        handleDirectSetAllocation(
                                          v.id,
                                          v.name,
                                          isNaN(val) ? currentAllocQty : val
                                        );
                                      }
                                    }}
                                    className="w-16 h-8 text-center text-sm font-extrabold font-mono bg-white border border-[#E8E8E5] rounded-lg text-[#202124] focus:outline-none focus:border-[#315C4C]"
                                    title={`Nhập trực tiếp tổng số lượng cấp cho quầy (Tối thiểu: ${currentSoldQty}, Tối đa: ${maxAllowedBoothAlloc})`}
                                  />

                                  <button
                                    type="button"
                                    className="h-8 w-8 rounded-lg bg-white hover:bg-[#E8E8E5] text-[#202124] flex items-center justify-center font-bold text-xs border border-[#E8E8E5] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                                    title={
                                      centralStorageRemaining < 1
                                        ? 'Đã đạt mức tối đa khả dụng'
                                        : 'Cấp thêm 1 món cho quầy'
                                    }
                                    disabled={centralStorageRemaining < 1}
                                    onClick={() => handleStockTransfer(v.id, v.name, 1)}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {centralStorageRemaining > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDirectSetAllocation(
                                        v.id,
                                        v.name,
                                        maxAllowedBoothAlloc
                                      )
                                    }
                                    className="h-8 px-2.5 rounded-lg text-[11px] font-bold bg-[#EAF4EE] text-[#2F7D55] border border-[#2F7D55]/30 hover:bg-[#2F7D55] hover:text-white transition-colors shrink-0 cursor-pointer"
                                    title={`Cấp toàn bộ +${centralStorageRemaining} món khả dụng cho quầy này`}
                                  >
                                    Cấp tối đa ({maxAllowedBoothAlloc})
                                  </button>
                                ) : availableToSell > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDirectSetAllocation(v.id, v.name, currentSoldQty)
                                    }
                                    className="h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-[#F7F7F5] text-[#737373] border border-[#E8E8E5] hover:text-[#C44536] transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                                    title={`Thu hồi ${availableToSell} món chưa bán về lại kho tổng`}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Thu hồi</span>
                                  </button>
                                ) : null}
                              </div>

                              <span className="text-[10px] text-[#737373] font-mono text-right">
                                Tối đa cấp được: {maxAllowedBoothAlloc} món
                              </span>
                            </>
                          ) : (
                            <span className="px-3 py-1.5 text-xs font-semibold text-[#737373] bg-[#F7F7F5] rounded-lg border border-[#E8E8E5]">
                              Đã cấp: {currentAllocQty} (Chỉ xem)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* =========================================================
           COMPACT TABLE VIEW (6 Clear Columns)
           ========================================================= */
        <Card className="border-[#E8E8E5] bg-white rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F7F5] border-b border-[#E8E8E5] text-[#737373] uppercase text-[10.5px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Sản phẩm & Phân loại</th>
                  <th className="py-3 px-4 text-center">Tổng kho & Đã khóa</th>
                  <th className="py-3 px-4 text-center">Cấp thêm được</th>
                  <th className="py-3 px-4 text-center">Đã bán tại quầy</th>
                  <th className="py-3 px-4 text-center">Còn bán tại quầy</th>
                  <th className="py-3 px-4 text-right">
                    Hạn mức cấp quầy ({selectedBooth.code})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0ED]">
                {filteredEnrichedVariants.map((item) => {
                  const {
                    variant: v,
                    product,
                    currentAllocQty,
                    currentSoldQty,
                    availableToSell,
                    maxAllowedBoothAlloc,
                    centralStorageRemaining,
                    stock,
                  } = item;
                  const thumbUrl = getProductThumbnail(product);
                  const canEditThis = canManage && canManageProduct(user, product?.collab_partner);
                  const inputValue =
                    allocInputs[v.id] !== undefined ? allocInputs[v.id] : String(currentAllocQty);

                  return (
                    <tr key={v.id} className="hover:bg-[#F7F7F5] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] overflow-hidden shrink-0 flex items-center justify-center">
                            {thumbUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumbUrl}
                                alt={product?.name || 'Sản phẩm'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-[#9E9E9C]" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#202124]">{product?.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-semibold text-[#315C4C]">
                                {v.name}
                              </span>
                              <span className="text-[10px] font-mono text-[#737373]">
                                ({v.sku})
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-[#202124] font-mono text-xs">
                          {v.total_inventory}
                        </span>
                        <span className="block text-[10px] text-[#737373] font-mono">
                          Onl: <strong className="text-[#1D4ED8]">{stock.online}</strong> · VIP:{' '}
                          <strong className="text-[#B7791F]">{stock.preord}</strong>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-xs',
                            centralStorageRemaining > 0
                              ? 'bg-[#EAF4EE] text-[#2F7D55]'
                              : 'bg-[#F7F7F5] text-[#737373]'
                          )}
                        >
                          +{centralStorageRemaining}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-xs text-[#202124]">
                        {currentSoldQty}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono border',
                            availableToSell <= 0
                              ? 'bg-[#FDF1F0] text-[#C44536] border-[#C44536]/20'
                              : 'bg-[#EAF4EE] text-[#2F7D55] border-[#2F7D55]/20'
                          )}
                        >
                          {availableToSell}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {canEditThis ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <div className="inline-flex items-center gap-1 bg-[#F7F7F5] p-1 rounded-lg border border-[#E8E8E5]">
                              <button
                                type="button"
                                className="h-7 w-7 rounded bg-white hover:bg-[#E8E8E5] text-[#202124] flex items-center justify-center font-bold text-xs border border-[#E8E8E5] disabled:opacity-35"
                                disabled={currentAllocQty <= currentSoldQty}
                                onClick={() => handleStockTransfer(v.id, v.name, -1)}
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <input
                                type="number"
                                min={currentSoldQty}
                                max={maxAllowedBoothAlloc}
                                value={inputValue}
                                onChange={(e) =>
                                  setAllocInputs((prev) => ({
                                    ...prev,
                                    [v.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = parseInt(
                                      allocInputs[v.id] ?? String(currentAllocQty),
                                      10
                                    );
                                    handleDirectSetAllocation(
                                      v.id,
                                      v.name,
                                      isNaN(val) ? currentAllocQty : val
                                    );
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                onBlur={() => {
                                  if (allocInputs[v.id] !== undefined) {
                                    const val = parseInt(allocInputs[v.id], 10);
                                    handleDirectSetAllocation(
                                      v.id,
                                      v.name,
                                      isNaN(val) ? currentAllocQty : val
                                    );
                                  }
                                }}
                                className="w-16 h-7 text-center text-xs font-extrabold font-mono bg-white border border-[#E8E8E5] rounded text-[#202124]"
                              />

                              <button
                                type="button"
                                className="h-7 w-7 rounded bg-white hover:bg-[#E8E8E5] text-[#202124] flex items-center justify-center font-bold text-xs border border-[#E8E8E5] disabled:opacity-35"
                                disabled={centralStorageRemaining < 1}
                                onClick={() => handleStockTransfer(v.id, v.name, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {centralStorageRemaining > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDirectSetAllocation(v.id, v.name, maxAllowedBoothAlloc)
                                }
                                className="h-7 px-2 rounded text-[10px] font-bold bg-[#EAF4EE] text-[#2F7D55] border border-[#2F7D55]/30 hover:bg-[#2F7D55] hover:text-white transition-colors"
                              >
                                Cấp tối đa ({maxAllowedBoothAlloc})
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-xs text-[#737373]">
                            {currentAllocQty}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Quick Master Stock / Preorder Adjustment Modal right inside Inventory */}
      {masterEditProduct && (
        <Modal
          isOpen={!!masterEditProduct}
          onClose={() => setMasterEditProduct(null)}
          title={`Chỉnh Kho Gốc & Đặt Trước — ${masterEditProduct.name}`}
          description="Cập nhật tổng số lượng nhập kho, hàng giữ VIP và đơn khách đặt Online ngay tại trang Kho hàng."
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {masterEditVariants.map((mv, idx) => {
                const totalHeld = mv.reserved + mv.online;
                const offlineAvailable = Math.max(
                  0,
                  mv.total - totalHeld - (mv.offlineSold || 0)
                );

                return (
                  <div
                    key={mv.id}
                    className="p-3.5 bg-[#F7F7F5] rounded-xl border border-[#E8E8E5] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-[#202124]">{mv.name}</h4>
                        <span className="font-mono text-[10px] text-[#737373]">
                          Mã: {mv.sku} • Đã bán tại quầy: {mv.offlineSold || 0}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#737373] block">
                          Khả dụng cấp cho quầy:
                        </span>
                        <span
                          className={cn(
                            'text-xs font-extrabold font-mono',
                            offlineAvailable <= 0 ? 'text-[#C44536]' : 'text-[#2F7D55]'
                          )}
                        >
                          {offlineAvailable} món
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-[#202124]">
                          Tổng số lượng nhập kho:
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={mv.total}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setMasterEditVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, total: val } : item))
                            );
                          }}
                          className="h-8 text-xs bg-white font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-[#B7791F] flex items-center gap-1">
                          <Bookmark className="w-3 h-3 text-[#B7791F]" />
                          <span>Tự giữ / Đặt trước (VIP):</span>
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={mv.reserved}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setMasterEditVariants((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, reserved: val } : item
                              )
                            );
                          }}
                          className="h-8 text-xs bg-white border-[#B7791F]/40 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-[#1D4ED8] flex items-center gap-1">
                          <Globe className="w-3 h-3 text-[#3B82F6]" />
                          <span>Khách đặt mua Online:</span>
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={mv.online}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setMasterEditVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, online: val } : item))
                            );
                          }}
                          className="h-8 text-xs bg-white border-[#3B82F6]/40 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0ED]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMasterEditProduct(null)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveMasterStock}
              >
                Lưu Cập Nhật Kho Gốc
              </Button>
            </div>
          </div>
        </Modal>
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
