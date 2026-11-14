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
  ArrowUpDown,
  Tag,
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
    categories,
    allocations,
    setAllocation,
    allocateMaxToBooth,
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
    'all' | 'allocated' | 'empty'
  >('all');
  const [viewMode, setViewMode] = React.useState<'grouped' | 'table'>('grouped');

  // Extended Inventory Sorting & Filtering
  const [inventorySortBy, setInventorySortBy] = React.useState<
    'name_asc' | 'name_desc' | 'available_desc' | 'available_asc' | 'storage_desc' | 'storage_asc' | 'sold_desc' | 'total_stock_desc'
  >('name_asc');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [sourceFilter, setSourceFilter] = React.useState<'all' | 'store' | 'collab'>('all');

  const isInventoryFilterActive =
    inventorySortBy !== 'name_asc' ||
    stockFilter !== 'all' ||
    categoryFilter !== 'all' ||
    sourceFilter !== 'all' ||
    Boolean(searchQuery.trim());

  const resetInventoryFilters = React.useCallback(() => {
    setInventorySortBy('name_asc');
    setStockFilter('all');
    setCategoryFilter('all');
    setSourceFilter('all');
    setSearchQuery('');
  }, []);

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

    const prodVarIds = variants.filter((v) => v.product_id === prod.id).map((v) => v.id);
    if (prodVarIds.length === 0) return;

    const updatedCount = allocateMaxToBooth(
      activeWorkspace?.id || 'ws-default',
      selectedEvent.id,
      selectedBooth.id,
      prodVarIds
    );

    if (updatedCount > 0) {
      setAllocInputs((prev) => {
        const next = { ...prev };
        prodVarIds.forEach((id) => delete next[id]);
        return next;
      });
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

    const manageableVarIds = activeVariants
      .filter((v) => {
        const prod = products.find((p) => p.id === v.product_id);
        return canManageProduct(user, prod?.collab_partner);
      })
      .map((v) => v.id);

    if (manageableVarIds.length === 0) return;

    const totalUpdated = allocateMaxToBooth(
      activeWorkspace?.id || 'ws-default',
      selectedEvent.id,
      selectedBooth.id,
      manageableVarIds
    );

    if (totalUpdated > 0) {
      setAllocInputs({});
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

  function handleRecallAll() {
    if (!selectedBooth || !canManageInventory() || !user) return;
    if (!window.confirm(`Thu hồi toàn bộ hàng chưa bán của gian "${selectedBooth.name}" về kho tổng? Số đã bán được giữ nguyên.`)) return;
    const current = useDataStore.getState();
    let recalled = 0;
    const now = new Date().toISOString();
    const next = current.allocations.map((allocation) => {
      if (allocation.booth_id !== selectedBooth.id || allocation.workspace_id !== selectedBooth.workspace_id) return allocation;
      const variant = current.variants.find((item) => item.id === allocation.variant_id);
      const product = current.products.find((item) => item.id === variant?.product_id);
      if (!product || !canManageProduct(user, product.collab_partner)) return allocation;
      const remaining = Math.max(0, allocation.allocated_quantity - allocation.sold_quantity);
      if (!remaining) return allocation;
      recalled += remaining;
      return { ...allocation, allocated_quantity: allocation.sold_quantity, updated_at: now };
    });
    if (!recalled) return;
    current.setAllocations(next);
    setAllocInputs({});
    logActivity({
      actor_name: user.fullName, actor_role: user.role as AuditActorRole,
      action_type: 'stock_adjust', entity_type: 'inventory', entity_name: selectedBooth.name,
      booth_name: selectedBooth.name, event_name: selectedEvent?.name,
      description: `Thu hồi ${recalled} món chưa bán từ gian "${selectedBooth.name}" về kho tổng.`,
    });
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
  const countEmpty = enrichedVariants.filter(
    (item) => item.availableToSell <= 0
  ).length;

  // Filtered variants based on search, stockFilter, categoryFilter, sourceFilter & sorting
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEnrichedVariants = enrichedVariants
    .filter((item) => {
      // 1. Stock allocation filter
      if (stockFilter === 'allocated' && item.currentAllocQty <= 0) return false;
      if (stockFilter === 'empty' && item.availableToSell > 0) return false;

      // 2. Category filter
      if (categoryFilter !== 'all' && item.product?.category_id !== categoryFilter) return false;

      // 3. Source filter
      if (sourceFilter === 'store' && item.product?.collab_partner) return false;
      if (sourceFilter === 'collab' && !item.product?.collab_partner) return false;

      // 4. Search query
      if (!normalizedQuery) return true;
      const matchName = (item.product?.name || '').toLowerCase().includes(normalizedQuery);
      const matchVar = item.variant.name.toLowerCase().includes(normalizedQuery);
      const matchSku = item.variant.sku.toLowerCase().includes(normalizedQuery);
      return matchName || matchVar || matchSku;
    })
    .sort((a, b) => {
      if (inventorySortBy === 'name_asc') {
        const nameA = `${a.product?.name || ''} ${a.variant.name}`;
        const nameB = `${b.product?.name || ''} ${b.variant.name}`;
        return nameA.localeCompare(nameB, 'vi');
      }
      if (inventorySortBy === 'name_desc') {
        const nameA = `${a.product?.name || ''} ${a.variant.name}`;
        const nameB = `${b.product?.name || ''} ${b.variant.name}`;
        return nameB.localeCompare(nameA, 'vi');
      }
      if (inventorySortBy === 'available_desc') {
        return b.availableToSell - a.availableToSell;
      }
      if (inventorySortBy === 'available_asc') {
        return a.availableToSell - b.availableToSell;
      }
      if (inventorySortBy === 'storage_desc') {
        return b.centralStorageRemaining - a.centralStorageRemaining;
      }
      if (inventorySortBy === 'storage_asc') {
        return a.centralStorageRemaining - b.centralStorageRemaining;
      }
      if (inventorySortBy === 'sold_desc') {
        return b.currentSoldQty - a.currentSoldQty;
      }
      if (inventorySortBy === 'total_stock_desc') {
        return (b.variant.total_inventory || 0) - (a.variant.total_inventory || 0);
      }
      return 0;
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

  const groupedProducts = Array.from(groupedProductsMap.values()).sort((a, b) => {
    if (inventorySortBy === 'name_asc') {
      return (a.product.name || '').localeCompare(b.product.name || '', 'vi');
    }
    if (inventorySortBy === 'name_desc') {
      return (b.product.name || '').localeCompare(a.product.name || '', 'vi');
    }
    if (inventorySortBy === 'available_desc') {
      const aAvail = a.items.reduce((s, it) => s + it.availableToSell, 0);
      const bAvail = b.items.reduce((s, it) => s + it.availableToSell, 0);
      return bAvail - aAvail;
    }
    if (inventorySortBy === 'available_asc') {
      const aAvail = a.items.reduce((s, it) => s + it.availableToSell, 0);
      const bAvail = b.items.reduce((s, it) => s + it.availableToSell, 0);
      return aAvail - bAvail;
    }
    if (inventorySortBy === 'storage_desc') {
      const aStore = a.items.reduce((s, it) => s + it.centralStorageRemaining, 0);
      const bStore = b.items.reduce((s, it) => s + it.centralStorageRemaining, 0);
      return bStore - aStore;
    }
    if (inventorySortBy === 'storage_asc') {
      const aStore = a.items.reduce((s, it) => s + it.centralStorageRemaining, 0);
      const bStore = b.items.reduce((s, it) => s + it.centralStorageRemaining, 0);
      return aStore - bStore;
    }
    if (inventorySortBy === 'sold_desc') {
      const aSold = a.items.reduce((s, it) => s + it.currentSoldQty, 0);
      const bSold = b.items.reduce((s, it) => s + it.currentSoldQty, 0);
      return bSold - aSold;
    }
    return 0;
  });

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
    <div className="space-y-4 sm:space-y-5 pb-20 sm:pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warning-bg text-primary border border-primary/20">
              {workspaceProducts.length} sản phẩm · {activeVariants.length} mã loại
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">{t('description')}</p>
        </div>

        {selectedBooth && (
          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <Button type="button" variant="outline" size="sm" onClick={handleRecallAll}>
                Thu hồi toàn bộ
              </Button>
            )}
            {canManage && boothStats.unallocatedInWarehouse > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAllocateMaxAllProducts}
                className="gap-1.5 text-xs h-9 px-3 rounded-lg border-primary/40 text-primary hover:bg-success-bg font-semibold shadow-2xs"
                title="Cấp toàn bộ số lượng khả dụng còn trong kho tổng ra quầy đang chọn"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>
                  Cấp hết kho (+{boothStats.unallocatedInWarehouse})
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
              <span>Kiểm kê ({selectedBooth.code})</span>
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

      {/* 4 Clear Inventory KPI Cards (Ergonomic vertical card stack on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-surface border border-border rounded-xl p-3 sm:p-3.5 flex flex-col justify-between gap-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold text-muted leading-tight">
              Còn bán tại quầy
            </p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-success-bg flex items-center justify-center text-primary shrink-0">
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-extrabold text-primary font-mono leading-none">
              {boothStats.boothAvailable.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] text-muted font-medium">
              / {boothStats.boothAllocated} đã cấp
            </span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3 sm:p-3.5 flex flex-col justify-between gap-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold text-muted leading-tight">
              Có thể cấp thêm
            </p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-warning-bg flex items-center justify-center text-warning shrink-0">
              <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-extrabold text-warning font-mono leading-none">
              +{boothStats.unallocatedInWarehouse.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] text-muted font-medium">khả dụng</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3 sm:p-3.5 flex flex-col justify-between gap-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold text-muted leading-tight">
              Khóa Online & VIP
            </p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8] shrink-0">
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-extrabold text-[#1D4ED8] font-mono leading-none">
              {totalHeldAll.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] text-muted font-medium">
              / {totalStockAll} tổng kho
            </span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3 sm:p-3.5 flex flex-col justify-between gap-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] sm:text-xs font-semibold text-muted leading-tight">
              Đã bán qua POS
            </p>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-extrabold text-foreground font-mono leading-none">
              {totalSoldAll.toLocaleString('vi-VN')}
            </span>
            <span className="text-[11px] text-muted font-medium">món đã xuất</span>
          </div>
        </div>
      </div>

      {/* Unified Event & Booth Selector + Filter & Search Toolbar */}
      <div className="bg-surface border border-border rounded-xl shadow-2xs overflow-hidden divide-y divide-border">
        {/* Top Row: Event & Booth Selection (Clean Vertical Stack on Mobile) */}
        <div className="p-3 sm:p-3.5 flex flex-col gap-3 bg-surface">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center gap-2.5 sm:gap-3">
            {/* Event Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
              <span className="text-[11px] font-semibold text-muted flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Sự kiện:</span>
              </span>
              <select
                className="h-9 w-full sm:w-auto sm:min-w-[220px] rounded-lg border border-border bg-background px-2.5 text-[13px] font-semibold text-foreground focus:outline-none focus:border-primary"
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

            {/* Mobile Booth Selector Dropdown (No clipped pills!) */}
            <div className="sm:hidden flex flex-col gap-1 min-w-0">
              <span className="text-[11px] font-semibold text-muted flex items-center gap-1.5 shrink-0">
                <Store className="w-3.5 h-3.5 text-primary" />
                <span>Quầy đang chọn:</span>
              </span>
              {eventBooths.length === 0 ? (
                <span className="text-xs text-muted italic">
                  Sự kiện chưa có quầy bán nào
                </span>
              ) : (
                <select
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-[13px] font-semibold text-foreground focus:outline-none focus:border-primary"
                  value={selectedBoothId}
                  onChange={(e) => setSelectedBoothId(e.target.value)}
                >
                  {eventBooths.map((b) => {
                    const bAllocTotal = allocations
                      .filter((a) => a.booth_id === b.id)
                      .reduce((sum, a) => sum + a.allocated_quantity, 0);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.name} ({bAllocTotal} món)
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Desktop/Tablet Booth Selector Pills */}
            <div className="hidden sm:flex items-center gap-1.5 flex-wrap py-0.5">
              <span className="text-[11px] font-semibold text-muted flex items-center gap-1 mr-1 shrink-0">
                <Store className="w-3.5 h-3.5 text-primary" />
                <span>Quầy:</span>
              </span>
              {eventBooths.length === 0 ? (
                <span className="text-xs text-muted italic">
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
                        'px-3 py-1.5 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 whitespace-nowrap',
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-background text-foreground border-border hover:border-primary/40'
                      )}
                    >
                      <span>{b.name}</span>
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0.2 rounded',
                          isSelected
                            ? 'bg-surface/20 text-white'
                            : 'bg-surface text-muted border border-border'
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

          <div className="text-[11px] text-muted flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span>Hàng Online & Giữ VIP được khóa tự động, không thể cấp nhầm ra quầy</span>
          </div>
        </div>

        {/* Bottom Row: 2x2 Filter Tabs on Mobile + Search + View Switcher */}
        <div className="p-2.5 sm:p-3 bg-surface flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Quick Filter Tabs (Clean 2x2 Grid on Mobile -> Flex Row on Tablet+) */}
          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1 bg-background rounded-lg border border-border text-xs shrink-0">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={cn(
                'px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center justify-between sm:justify-start gap-1.5 cursor-pointer',
                stockFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <span className="truncate">Tất cả</span>
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 rounded',
                  stockFilter === 'all'
                    ? 'bg-surface/20 text-white'
                    : 'bg-surface-hover text-foreground'
                )}
              >
                {enrichedVariants.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStockFilter('allocated')}
              className={cn(
                'px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center justify-between sm:justify-start gap-1.5 cursor-pointer',
                stockFilter === 'allocated'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-1 truncate">
                <CheckCircle2 className={cn('w-3.5 h-3.5 shrink-0', stockFilter === 'allocated' ? 'text-white' : 'text-primary')} />
                <span className="truncate">Đã cấp quầy</span>
              </span>
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 rounded',
                  stockFilter === 'allocated'
                    ? 'bg-surface/20 text-white'
                    : 'bg-success-bg text-primary'
                )}
              >
                {countAllocated}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStockFilter('empty')}
              className={cn(
                'px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center justify-between sm:justify-start gap-1.5 cursor-pointer',
                stockFilter === 'empty'
                  ? 'bg-error text-white shadow-2xs'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-1 truncate">
                <AlertCircle className={cn('w-3.5 h-3.5 shrink-0', stockFilter === 'empty' ? 'text-white' : 'text-error')} />
                <span className="truncate">Đã hết</span>
              </span>
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 rounded',
                  stockFilter === 'empty'
                    ? 'bg-surface/20 text-white'
                    : 'bg-error-bg text-error'
                )}
              >
                {countEmpty}
              </span>
            </button>
          </div>

          {/* Right: Search + View Mode on clean flex row */}
          <div className="flex items-center gap-2 flex-1 lg:justify-end">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Tìm sản phẩm, size, mã loại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 pr-7 text-xs rounded-lg bg-surface w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center p-0.5 rounded-lg bg-background border border-border shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={cn(
                  'px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer',
                  viewMode === 'grouped'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted hover:text-foreground'
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
                  'px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted hover:text-foreground'
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

      {/* Detailed Inventory Sorting & Filter Control Toolbar */}
      <div className="bg-surface dark:bg-surface border border-border dark:border-border rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Sorting Select */}
            <div className="flex items-center gap-1.5 min-w-[170px]">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary dark:text-success shrink-0" />
              <span className="text-xs font-bold text-muted dark:text-muted shrink-0">Sắp xếp:</span>
              <select
                value={inventorySortBy}
                onChange={(e) => setInventorySortBy(e.target.value as any)}
                className="h-8 rounded-lg border border-border dark:border-border bg-background dark:bg-surface px-2 text-xs font-semibold text-foreground dark:text-foreground focus:outline-none focus:border-primary flex-1 sm:flex-none"
              >
                <option value="name_asc">Tên: A → Z (Mặc định)</option>
                <option value="name_desc">Tên: Z → A</option>
                <option value="available_desc">Khả dụng tại quầy: Nhiều nhất</option>
                <option value="available_asc">Khả dụng tại quầy: Sắp hết (Ít nhất)</option>
                <option value="storage_desc">Kho tổng còn lại: Nhiều nhất</option>
                <option value="storage_asc">Kho tổng còn lại: Ít nhất</option>
                <option value="sold_desc">Đã bán tại quầy: Nhiều nhất</option>
                <option value="total_stock_desc">Tổng tồn kho toàn hệ thống: Cao nhất</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 min-w-[150px]">
              <Tag className="w-3.5 h-3.5 text-muted dark:text-muted shrink-0" />
              <span className="text-xs font-bold text-muted dark:text-muted shrink-0">Danh mục:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 rounded-lg border border-border dark:border-border bg-background dark:bg-surface px-2 text-xs font-semibold text-foreground dark:text-foreground focus:outline-none focus:border-primary flex-1 sm:flex-none"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-1.5 min-w-[140px]">
              <Store className="w-3.5 h-3.5 text-muted dark:text-muted shrink-0" />
              <span className="text-xs font-bold text-muted dark:text-muted shrink-0">Nguồn:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="h-8 rounded-lg border border-border dark:border-border bg-background dark:bg-surface px-2 text-xs font-semibold text-foreground dark:text-foreground focus:outline-none focus:border-primary flex-1 sm:flex-none"
              >
                <option value="all">Tất cả nguồn hàng</option>
                <option value="store">👑 Shop chính (HikaruStore)</option>
                <option value="collab">🤝 Hàng Collab đối tác</option>
              </select>
            </div>
          </div>

          {/* Result counter & Reset */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            <span className="text-xs text-muted dark:text-muted font-medium">
              Đang hiển thị <strong className="text-primary dark:text-success font-bold">{filteredEnrichedVariants.length}</strong> / {enrichedVariants.length} phân loại
            </span>
            {isInventoryFilterActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetInventoryFilters}
                className="h-7 px-2.5 text-xs text-error hover:bg-error-bg border-[#F8B4AF] gap-1 font-semibold"
                title="Đặt lại toàn bộ bộ lọc và sắp xếp về mặc định"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sandbox Test Mode Notice Banner */}
      {isTestEvent(selectedEventId) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-warning-bg border border-warning/30 text-xs text-warning shadow-xs">
          <FlaskConical className="w-4 h-4 shrink-0 text-warning" />
          <span>
            <strong>Quầy hàng thử nghiệm (Sandbox):</strong> Lượng hàng cấp và doanh số tại quầy
            test POS được cách ly độc lập, <strong>hoàn toàn không ảnh hưởng</strong> đến tồn kho
            tổng thực tế.
          </span>
        </div>
      )}

      {/* Main Inventory Content */}
      {!selectedBooth ? (
        <Card className="border-border rounded-xl shadow-xs">
          <CardContent className="p-12 text-center">
            <Store className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-xs text-muted">{t('selectBoothPrompt')}</p>
          </CardContent>
        </Card>
      ) : filteredEnrichedVariants.length === 0 ? (
        <Card className="border-border rounded-xl shadow-xs">
          <CardContent className="p-12 text-center">
            <Package className="w-10 h-10 text-muted mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              Không tìm thấy mã hàng phù hợp
            </h3>
            <p className="text-xs text-muted mt-1">
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
                  className="border-border bg-surface rounded-xl shadow-2xs p-4 hover:border-primary/35 transition-all"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Col 1-4: Product Image + Name + SKU + Price */}
                    <div className="lg:col-span-4 flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {thumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbUrl}
                            alt={product.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-muted" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-bold text-foreground truncate">
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
                          <span className="text-xs font-extrabold text-primary font-mono">
                            {formatCurrency(v.price, currency)}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-muted">
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
                          'bg-background border border-border rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs transition-colors',
                          canEditThisProd ? 'cursor-pointer hover:border-primary/50' : ''
                        )}
                        title={
                          canEditThisProd
                            ? 'Bấm để chỉnh sửa Tổng kho nhập, Giữ VIP hoặc đơn Online'
                            : undefined
                        }
                      >
                        <div>
                          <span className="text-[10px] text-muted block">Tổng kho</span>
                          <span className="font-bold text-foreground font-mono text-sm">
                            {v.total_inventory}
                          </span>
                        </div>

                        <div className="h-6 w-px bg-surface-hover" />

                        <div>
                          <span className="text-[10px] text-muted block">Khóa Onl / VIP</span>
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <span className="font-bold text-[#1D4ED8]">{stock.online} Onl</span>
                            <span className="text-muted">·</span>
                            <span className="font-bold text-warning">{stock.preord} VIP</span>
                          </div>
                        </div>

                        <div className="h-6 w-px bg-surface-hover" />

                        <div className="text-right">
                          <span className="text-[10px] text-muted block">Cấp thêm được</span>
                          <span
                            className={cn(
                              'font-extrabold font-mono text-sm',
                              centralStorageRemaining > 0 ? 'text-primary' : 'text-muted'
                            )}
                          >
                            +{centralStorageRemaining}
                          </span>
                        </div>
                      </div>

                      {isOverReserved && (
                        <div className="mt-1 flex items-center justify-between text-[10px] text-error px-1">
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
                            ? 'bg-error-bg text-error border-error/20'
                            : availableToSell <= 5
                            ? 'bg-warning-bg text-warning border-warning/20'
                            : 'bg-success-bg text-primary border-primary/20'
                        )}
                      >
                        <span>Còn bán tại quầy:</span>
                        <span className="font-mono text-sm font-extrabold">{availableToSell}</span>
                      </div>
                      <span className="text-[11px] text-muted pl-0.5">
                        Đã bán:{' '}
                        <strong className="text-foreground font-mono">{currentSoldQty}</strong> /{' '}
                        <span className="font-mono">{currentAllocQty}</span> đã cấp
                      </span>
                    </div>

                    {/* Col 10-12: Direct Allocation Stepper + 1-Click Max + Master Edit */}
                    <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-end gap-1.5">
                      {canEditThisProd ? (
                        <>
                          <div className="flex items-center justify-between sm:justify-end gap-1.5">
                            <div className="inline-flex items-center gap-1 bg-background p-1 rounded-xl border border-border">
                              <button
                                type="button"
                                className="h-8 w-8 rounded-lg bg-surface hover:bg-surface-hover text-foreground flex items-center justify-center font-bold text-xs border border-border disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
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
                                className="w-16 h-8 text-center text-sm font-extrabold font-mono bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                                title={`Nhập trực tiếp số lượng cấp cho quầy (Tối thiểu: ${currentSoldQty}, Tối đa: ${maxAllowedBoothAlloc})`}
                              />

                              <button
                                type="button"
                                className="h-8 w-8 rounded-lg bg-surface hover:bg-surface-hover text-foreground flex items-center justify-center font-bold text-xs border border-border disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
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
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() =>
                                  handleDirectSetAllocation(v.id, v.name, maxAllowedBoothAlloc)
                                }
                                className="h-8 px-2.5 rounded-lg text-[11px] font-bold bg-success-bg text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors shrink-0 cursor-pointer"
                                title={`Cấp toàn bộ +${centralStorageRemaining} món khả dụng ra quầy này`}
                              >
                                Cấp tối đa ({maxAllowedBoothAlloc})
                              </button>
                            ) : availableToSell > 0 ? (
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() =>
                                  handleDirectSetAllocation(v.id, v.name, currentSoldQty)
                                }
                                className="h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-background text-muted border border-border hover:text-error transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                                title={`Thu hồi ${availableToSell} món chưa bán về lại kho tổng`}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Thu hồi</span>
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => openMasterStockModal(product)}
                              className="h-8 w-8 rounded-lg bg-background border border-border text-muted hover:text-foreground flex items-center justify-center shrink-0 cursor-pointer"
                              title="Chỉnh sửa Tổng kho gốc / Online / Giữ VIP"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-warning" />
                            </button>
                          </div>

                          <span className="text-[10px] text-muted font-mono text-right">
                            Tối đa cấp được: {maxAllowedBoothAlloc} món
                          </span>
                        </>
                      ) : (
                        <span className="px-3 py-1.5 text-xs font-semibold text-muted bg-background rounded-lg border border-border">
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
                className="border-border bg-surface rounded-xl shadow-2xs overflow-hidden"
              >
                {/* Solid Dark-Mode-Safe Product Group Header */}
                <div className="p-3.5 sm:p-4 bg-background border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbUrl}
                          alt={product.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-muted" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm sm:text-[15px] font-bold text-foreground line-clamp-2 leading-snug">
                          {product.name}
                        </h3>
                        {product.collab_partner && (
                          <Badge variant="warning" className="text-[10px] gap-1 shrink-0">
                            <Users2 className="w-2.5 h-2.5" />
                            <span>Collab: {product.collab_partner}</span>
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-surface border border-border text-muted font-medium">
                          {items.length} phân loại
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface border border-border text-foreground font-semibold">
                          Đã cấp: <strong className="font-mono">{prodTotalBoothAlloc}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-success-bg text-primary font-semibold">
                          Còn bán: <strong className="font-mono">{prodTotalBoothAvail}</strong>
                        </span>
                        {prodTotalUnallocated > 0 && (
                          <span className="px-2 py-0.5 rounded bg-warning-bg text-warning font-semibold">
                            Cấp thêm: <strong className="font-mono">+{prodTotalUnallocated}</strong>
                          </span>
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
                            className="h-8 px-3 text-xs gap-1.5 rounded-lg border-primary/40 text-primary hover:bg-success-bg font-semibold bg-surface"
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
                          className="h-8 px-3 text-xs gap-1.5 rounded-lg bg-surface font-semibold"
                          title="Chỉnh sửa Tổng kho vật lý, số lượng Giữ VIP hoặc đơn Khách đặt Online"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-warning" />
                          <span>Chỉnh kho gốc / Online</span>
                        </Button>
                      </>
                    ) : isPartner ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-muted bg-surface rounded-lg border border-border">
                        <Lock className="w-3 h-3 text-muted" />
                        <span>Kho Admin (Chỉ đọc)</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Variants Rows inside Multi-Variant Product Card */}
                <div className="divide-y divide-border">
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
                        className="p-3.5 hover:bg-background transition-colors grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
                      >
                        {/* Col 1-3: Variant Name, SKU & Price */}
                        <div className="lg:col-span-3 flex items-center justify-between lg:block">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">{v.name}</span>
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-background border border-border text-muted">
                                {v.sku}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-primary font-mono mt-0.5 block">
                              {formatCurrency(v.price, currency)}
                            </span>
                          </div>
                        </div>

                        {/* Col 4-7: Central Warehouse Breakdown */}
                        <div className="lg:col-span-4 bg-background border border-border rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-muted block">Tổng kho</span>
                            <span className="font-bold text-foreground font-mono text-sm">
                              {v.total_inventory}
                            </span>
                          </div>

                          <div className="h-6 w-px bg-surface-hover" />

                          <div>
                            <span className="text-[10px] text-muted block">
                              Khóa Onl / VIP
                            </span>
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className="font-bold text-[#1D4ED8]">{stock.online} Onl</span>
                              <span className="text-muted">·</span>
                              <span className="font-bold text-warning">{stock.preord} VIP</span>
                            </div>
                          </div>

                          <div className="h-6 w-px bg-surface-hover" />

                          <div className="text-right">
                            <span className="text-[10px] text-muted block">Cấp thêm được</span>
                            <span
                              className={cn(
                                'font-extrabold font-mono text-sm',
                                centralStorageRemaining > 0 ? 'text-primary' : 'text-muted'
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
                                ? 'bg-error-bg text-error border-error/20'
                                : availableToSell <= 5
                                ? 'bg-warning-bg text-warning border-warning/20'
                                : 'bg-success-bg text-primary border-primary/20'
                            )}
                          >
                            <span>Còn bán tại quầy:</span>
                            <span className="font-mono text-sm font-extrabold">
                              {availableToSell}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted pl-0.5">
                            Đã bán:{' '}
                            <strong className="text-foreground font-mono">{currentSoldQty}</strong> /{' '}
                            <span className="font-mono">{currentAllocQty}</span> đã cấp
                          </span>
                        </div>

                        {/* Col 10-12: Direct Allocation Controls */}
                        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-end gap-1.5">
                          {canEditThisProd ? (
                            <>
                              <div className="flex items-center justify-between sm:justify-end gap-1.5">
                                <div className="inline-flex items-center gap-1 bg-background p-1 rounded-xl border border-border">
                                  <button
                                    type="button"
                                    className="h-8 w-8 rounded-lg bg-surface hover:bg-surface-hover text-foreground flex items-center justify-center font-bold text-xs border border-border disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
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
                                    className="w-16 h-8 text-center text-sm font-extrabold font-mono bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                                    title={`Nhập trực tiếp tổng số lượng cấp cho quầy (Tối thiểu: ${currentSoldQty}, Tối đa: ${maxAllowedBoothAlloc})`}
                                  />

                                  <button
                                    type="button"
                                    className="h-8 w-8 rounded-lg bg-surface hover:bg-surface-hover text-foreground flex items-center justify-center font-bold text-xs border border-border disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
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
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() =>
                                      handleDirectSetAllocation(
                                        v.id,
                                        v.name,
                                        maxAllowedBoothAlloc
                                      )
                                    }
                                    className="h-8 px-2.5 rounded-lg text-[11px] font-bold bg-success-bg text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors shrink-0 cursor-pointer"
                                    title={`Cấp toàn bộ +${centralStorageRemaining} món khả dụng cho quầy này`}
                                  >
                                    Cấp tối đa ({maxAllowedBoothAlloc})
                                  </button>
                                ) : availableToSell > 0 ? (
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() =>
                                      handleDirectSetAllocation(v.id, v.name, currentSoldQty)
                                    }
                                    className="h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-background text-muted border border-border hover:text-error transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                                    title={`Thu hồi ${availableToSell} món chưa bán về lại kho tổng`}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Thu hồi</span>
                                  </button>
                                ) : null}
                              </div>

                              <span className="text-[10px] text-muted font-mono text-right">
                                Tối đa cấp được: {maxAllowedBoothAlloc} món
                              </span>
                            </>
                          ) : (
                            <span className="px-3 py-1.5 text-xs font-semibold text-muted bg-background rounded-lg border border-border">
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
        <Card className="border-border bg-surface rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-background border-b border-border text-muted uppercase text-[10.5px] font-bold tracking-wider">
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
              <tbody className="divide-y divide-border">
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
                    <tr key={v.id} className="hover:bg-background transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                            {thumbUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumbUrl}
                                alt={product?.name || 'Sản phẩm'}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-muted" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-foreground">{product?.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-semibold text-primary">
                                {v.name}
                              </span>
                              <span className="text-[10px] font-mono text-muted">
                                ({v.sku})
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-foreground font-mono text-xs">
                          {v.total_inventory}
                        </span>
                        <span className="block text-[10px] text-muted font-mono">
                          Onl: <strong className="text-[#1D4ED8]">{stock.online}</strong> · VIP:{' '}
                          <strong className="text-warning">{stock.preord}</strong>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-xs',
                            centralStorageRemaining > 0
                              ? 'bg-success-bg text-primary'
                              : 'bg-background text-muted'
                          )}
                        >
                          +{centralStorageRemaining}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-xs text-foreground">
                        {currentSoldQty}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono border',
                            availableToSell <= 0
                              ? 'bg-error-bg text-error border-error/20'
                              : 'bg-success-bg text-primary border-primary/20'
                          )}
                        >
                          {availableToSell}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {canEditThis ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <div className="inline-flex items-center gap-1 bg-background p-1 rounded-lg border border-border">
                              <button
                                type="button"
                                className="h-7 w-7 rounded bg-surface hover:bg-surface-hover text-foreground flex items-center justify-center font-bold text-xs border border-border disabled:opacity-35"
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
                                className="w-16 h-7 text-center text-xs font-extrabold font-mono bg-surface border border-border rounded text-foreground"
                              />

                              <button
                                type="button"
                                className="h-7 w-7 rounded bg-surface hover:bg-surface-hover text-foreground flex items-center justify-center font-bold text-xs border border-border disabled:opacity-35"
                                disabled={centralStorageRemaining < 1}
                                onClick={() => handleStockTransfer(v.id, v.name, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {centralStorageRemaining > 0 && (
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() =>
                                  handleDirectSetAllocation(v.id, v.name, maxAllowedBoothAlloc)
                                }
                                className="h-7 px-2 rounded text-[10px] font-bold bg-success-bg text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                Cấp tối đa ({maxAllowedBoothAlloc})
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-xs text-muted">
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
                    className="p-3.5 bg-background rounded-xl border border-border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-foreground">{mv.name}</h4>
                        <span className="font-mono text-[10px] text-muted">
                          Mã: {mv.sku} • Đã bán tại quầy: {mv.offlineSold || 0}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted block">
                          Khả dụng cấp cho quầy:
                        </span>
                        <span
                          className={cn(
                            'text-xs font-extrabold font-mono',
                            offlineAvailable <= 0 ? 'text-error' : 'text-primary'
                          )}
                        >
                          {offlineAvailable} món
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-foreground">
                          Tổng số lượng nhập kho:
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={mv.total === 0 ? '' : mv.total}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                            setMasterEditVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, total: val } : item))
                            );
                          }}
                          className="h-8 text-xs bg-surface font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-warning flex items-center gap-1">
                          <Bookmark className="w-3 h-3 text-warning" />
                          <span>Tự giữ / Đặt trước (VIP):</span>
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={mv.reserved === 0 ? '' : mv.reserved}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                            setMasterEditVariants((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, reserved: val } : item
                              )
                            );
                          }}
                          className="h-8 text-xs bg-surface border-warning/40 font-mono"
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
                          placeholder="0"
                          value={mv.online === 0 ? '' : mv.online}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                            setMasterEditVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, online: val } : item))
                            );
                          }}
                          className="h-8 text-xs bg-surface border-[#3B82F6]/40 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
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
      {isStocktakeOpen && (
        <StocktakeModal
          isOpen={isStocktakeOpen}
          onClose={() => setIsStocktakeOpen(false)}
          booth={selectedBooth || null}
          event={selectedEvent || null}
        />
      )}
    </div>
  );
}
