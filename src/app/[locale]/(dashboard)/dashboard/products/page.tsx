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
import { Product, ProductVariant, AuditActorRole } from '@/types/database';
import { calculateVariantStock, calculateProductStock } from '@/lib/stock-status';
import { logActivity } from '@/stores/audit-store';
import { ProductImageUploader } from '@/components/ui/product-image-uploader';
import {
  Package,
  Plus,
  Trash2,
  Tag,
  Boxes,
  Users2,
  CheckCircle,
  Archive,
  SlidersHorizontal,
  Bookmark,
  Globe,
  Info,
  Edit,
  RotateCcw,
  Eye,
  EyeOff,
  Camera,
  Lock,
  Check,
  ChevronDown,
  Search,
  X,
  LayoutGrid,
  List,
  Layers,
  Store,
  ShoppingBag,
} from 'lucide-react';

interface VariantInput {
  id?: string;
  name: string;
  sku: string;
  price: number;
  total_inventory: number;
  reserved_quantity: number;
  online_preorder_quantity: number;
  barcode: string;
}

function getProductPriceLabel(productVariants: ProductVariant[], currency: string): string {
  if (productVariants.length === 0) return formatCurrency(0, currency);
  const prices = productVariants.map((v) => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (minPrice === maxPrice) {
    return formatCurrency(minPrice, currency);
  }
  return `${formatCurrency(minPrice, currency)} – ${formatCurrency(maxPrice, currency)}`;
}

export default function ProductsPage() {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const {
    products,
    variants,
    allocations,
    categories,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    toggleProductActive,
    updateVariantPreorders,
    addCategory,
  } = useDataStore();
  const { canEditData, user } = useAuthStore();
  const editable = canEditData();
  const isPartner = isCollabPartner(user?.role);
  const partnerName = user?.collabPartnerName;

  const [statusFilter, setStatusFilter] = React.useState<'active' | 'all' | 'sold_out' | 'archived'>('active');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  // Quick Pre-order / Reservation Adjustment Modal
  const [quickAdjustProduct, setQuickAdjustProduct] = React.useState<Product | null>(null);
  const [quickVariants, setQuickVariants] = React.useState<
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

  function openQuickAdjustModal(prod: Product) {
    if (!canManageProduct(user, prod.collab_partner)) {
      alert('Bạn chỉ có quyền điều chỉnh sản phẩm thuộc thương hiệu Collab của mình. Không thể can thiệp hàng kho Admin.');
      return;
    }
    const prodVariants = variants.filter((v) => v.product_id === prod.id);
    setQuickAdjustProduct(prod);
    setQuickVariants(
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

  function handleSaveQuickAdjust() {
    quickVariants.forEach((qv) => {
      updateVariantPreorders(qv.id, {
        totalInventory: qv.total,
        reservedQuantity: qv.reserved,
        onlinePreorderQuantity: qv.online,
      });
    });

    if (quickAdjustProduct) {
      logActivity({
        actor_name: user?.fullName || 'Nhân viên / Admin',
        actor_role: (user?.role as AuditActorRole) || 'staff',
        action_type: 'preorder_adjust',
        entity_type: 'variant',
        entity_name: quickAdjustProduct.name,
        description: `Điều chỉnh số lượng đặt trước / online cho "${quickAdjustProduct.name}": ${quickVariants.map((v) => `${v.name} (Tự giữ: ${v.reserved}, Onl: ${v.online})`).join('; ')}.`,
        changes: quickVariants.map((v) => ({
          field: v.name,
          field_label: v.name,
          new_value: `Tổng: ${v.total} | Tự giữ: ${v.reserved} | Onl: ${v.online}`,
        })),
      });
    }

    setQuickAdjustProduct(null);
  }

  // Form states
  const [name, setName] = React.useState('');
  const [, setCategoryId] = React.useState('');
  const [categoryInput, setCategoryInput] = React.useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = React.useState(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Aggregated categories: both predefined and created on other products
  const allExistingCategories = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();

    categories.forEach((cat) => {
      const trimmed = cat.name.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, { id: cat.id, name: trimmed, count: 0 });
      }
    });

    products.forEach((p) => {
      if (p.is_deleted) return;
      if (p.category_id) {
        const found = categories.find((c) => c.id === p.category_id);
        if (found) {
          const item = map.get(found.name.trim().toLowerCase());
          if (item) item.count += 1;
        }
      }
      if (p.category?.name) {
        const trimmed = p.category.name.trim();
        const lower = trimmed.toLowerCase();
        if (map.has(lower)) {
          map.get(lower)!.count += 1;
        } else {
          map.set(lower, { id: p.category.id || `cat-${lower}`, name: trimmed, count: 1 });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [categories, products]);

  const filteredCategories = React.useMemo(() => {
    const q = categoryInput.trim().toLowerCase();
    if (!q) return allExistingCategories;
    return allExistingCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [allExistingCategories, categoryInput]);

  const [description, setDescription] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [collabPartner, setCollabPartner] = React.useState('');
  const [formVariants, setFormVariants] = React.useState<VariantInput[]>([
    {
      name: 'Tiêu chuẩn (Standard)',
      sku: '',
      price: 0,
      total_inventory: 0,
      reserved_quantity: 0,
      online_preorder_quantity: 0,
      barcode: '',
    },
  ]);

  const workspaceProducts = products.filter(
    (p) => !activeWorkspace || p.workspace_id === activeWorkspace.id
  );

  // Check if a product had stock (> 0) and is completely sold out across all variants (offline available <= 0)
  function isProductSoldOut(prodId: string): boolean {
    const prodVariants = variants.filter((v) => v.product_id === prodId);
    if (prodVariants.length === 0) return false;
    const summary = calculateProductStock(prodVariants, allocations);
    return summary.total > 0 && summary.offlineAvailable <= 0;
  }

  // Counts for Status Tabs & Top KPIs
  const activeCount = workspaceProducts.filter(
    (p) => !p.is_deleted && p.is_active && !isProductSoldOut(p.id)
  ).length;
  const soldOutCount = workspaceProducts.filter(
    (p) => !p.is_deleted && p.is_active && isProductSoldOut(p.id)
  ).length;
  const archivedCount = workspaceProducts.filter((p) => p.is_deleted || !p.is_active).length;
  const allCount = workspaceProducts.length;

  // Aggregate inventory KPIs across active workspace products
  const catalogTotals = React.useMemo(() => {
    const activeProds = workspaceProducts.filter((p) => !p.is_deleted);
    let totalVariantsCount = 0;
    let totalStock = 0;
    let offlineAvailable = 0;
    let offlineSold = 0;
    let onlineCount = 0;
    let preordCount = 0;

    activeProds.forEach((p) => {
      const pVars = variants.filter((v) => v.product_id === p.id);
      totalVariantsCount += pVars.length;
      const s = calculateProductStock(pVars, allocations);
      totalStock += s.total;
      offlineAvailable += s.offlineAvailable;
      offlineSold += s.offlineSold;
      onlineCount += s.online;
      preordCount += s.preord;
    });

    return {
      totalVariantsCount,
      totalStock,
      offlineAvailable,
      offlineSold,
      onlineCount,
      preordCount,
    };
  }, [workspaceProducts, variants, allocations]);

  const filteredProducts = workspaceProducts.filter((p) => {
    const isSoldOut = isProductSoldOut(p.id);
    const isArchived = Boolean(p.is_deleted || !p.is_active);

    if (statusFilter === 'active') {
      if (isArchived || isSoldOut) return false;
    } else if (statusFilter === 'sold_out') {
      if (isArchived || !isSoldOut) return false;
    } else if (statusFilter === 'archived') {
      if (!isArchived) return false;
    }

    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variants
        .filter((v) => v.product_id === p.id)
        .some((v) => v.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  function openCreateModal() {
    setEditingProduct(null);
    setName('');
    const defaultCat = allExistingCategories[0];
    setCategoryId(defaultCat?.id || categories[0]?.id || '');
    setCategoryInput(defaultCat?.name || categories[0]?.name || '');
    setIsCategoryDropdownOpen(false);
    setDescription('');
    setImageUrl('');
    setCollabPartner(isPartner ? (partnerName || '') : '');
    setFormVariants([
      {
        name: 'Tiêu chuẩn',
        sku: isPartner ? `COL-${Date.now().toString().slice(-4)}` : '',
        price: 0,
        total_inventory: 0,
        reserved_quantity: 0,
        online_preorder_quantity: 0,
        barcode: '',
      },
    ]);
    setIsModalOpen(true);
  }

  function openEditModal(prod: Product) {
    if (!canManageProduct(user, prod.collab_partner)) {
      alert('Bạn chỉ có quyền quản trị các sản phẩm thuộc thương hiệu Collab của mình. Không thể chỉnh sửa hàng kho của Admin.');
      return;
    }
    setEditingProduct(prod);
    setName(prod.name);
    const prodCat =
      allExistingCategories.find((c) => c.id === prod.category_id) ||
      categories.find((c) => c.id === prod.category_id);
    setCategoryId(prod.category_id || '');
    setCategoryInput(prodCat?.name || prod.category?.name || '');
    setIsCategoryDropdownOpen(false);
    setDescription(prod.description || '');
    setImageUrl(prod.image_url || '');
    setCollabPartner(prod.collab_partner || '');

    const prodVariants = variants.filter((v) => v.product_id === prod.id);
    if (prodVariants.length > 0) {
      setFormVariants(
        prodVariants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price || 0,
          total_inventory: v.total_inventory || 0,
          reserved_quantity: v.reserved_quantity || 0,
          online_preorder_quantity: v.online_preorder_quantity || 0,
          barcode: v.barcode || '',
        }))
      );
    } else {
      setFormVariants([
        {
          name: 'Tiêu chuẩn',
          sku: '',
          price: 0,
          total_inventory: 0,
          reserved_quantity: 0,
          online_preorder_quantity: 0,
          barcode: '',
        },
      ]);
    }
    setIsModalOpen(true);
  }

  function addVariantField() {
    setFormVariants([
      ...formVariants,
      {
        name: '',
        sku: '',
        price: 0,
        total_inventory: 0,
        reserved_quantity: 0,
        online_preorder_quantity: 0,
        barcode: '',
      },
    ]);
  }

  function removeVariantField(index: number) {
    if (formVariants.length <= 1) return;
    setFormVariants(formVariants.filter((_, idx) => idx !== index));
  }

  function updateVariantField(index: number, field: keyof VariantInput, value: string | number) {
    setFormVariants(
      formVariants.map((v, idx) => (idx === index ? { ...v, [field]: value } : v))
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editable) {
      alert('Tài khoản của bạn chỉ có quyền xem, không được phép thêm hoặc sửa sản phẩm.');
      return;
    }
    if (!name.trim() || !activeWorkspace) return;

    const effectiveCollabPartner = isPartner ? (partnerName || 'Collab Partner') : collabPartner.trim();

    let resolvedCategoryId: string | null = null;
    const catName = categoryInput.trim();
    if (catName) {
      const match =
        allExistingCategories.find((c) => c.name.toLowerCase() === catName.toLowerCase()) ||
        categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());

      if (match) {
        resolvedCategoryId = match.id;
      } else {
        const newCat = addCategory(catName, activeWorkspace.id);
        resolvedCategoryId = newCat.id;
      }
    }

    if (editingProduct) {
      if (!canManageProduct(user, editingProduct.collab_partner)) {
        alert('Bạn không có quyền chỉnh sửa sản phẩm thuộc kho hàng Admin.');
        return;
      }

      updateProduct(
        editingProduct.id,
        {
          name,
          category_id: resolvedCategoryId,
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          collab_partner: effectiveCollabPartner || null,
        },
        formVariants.map((fv) => ({
          id: fv.id,
          name: fv.name || 'Standard',
          sku: fv.sku.toUpperCase() || `SKU-${Date.now().toString().slice(-4)}`,
          price: Math.max(0, Number(fv.price) || 0),
          total_inventory: Math.max(0, Number(fv.total_inventory) || 0),
          reserved_quantity: Math.max(0, Number(fv.reserved_quantity) || 0),
          online_preorder_quantity: Math.max(0, Number(fv.online_preorder_quantity) || 0),
          barcode: fv.barcode.trim() || null,
        }))
      );

      logActivity({
        actor_name: user?.fullName || 'Người dùng',
        actor_role: (user?.role as AuditActorRole) || 'staff',
        action_type: 'update',
        entity_type: 'product',
        entity_name: name,
        description: `Cập nhật thông tin sản phẩm "${name}" (${effectiveCollabPartner ? `Collab: ${effectiveCollabPartner}` : 'Hàng Host'}).`,
        changes: [
          { field: 'name', field_label: 'Tên sản phẩm', new_value: name },
          { field: 'collab_partner', field_label: 'Đối tác', new_value: effectiveCollabPartner || 'Không' },
        ],
      });
    } else {
      createProduct(
        {
          workspace_id: activeWorkspace.id,
          category_id: resolvedCategoryId,
          name,
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          collab_partner: effectiveCollabPartner || null,
          is_active: true,
        },
        formVariants.map((fv) => ({
          name: fv.name || 'Standard',
          sku: fv.sku.toUpperCase() || `SKU-${Date.now().toString().slice(-4)}`,
          price: Math.max(0, Number(fv.price) || 0),
          total_inventory: Math.max(0, Number(fv.total_inventory) || 0),
          reserved_quantity: Math.max(0, Number(fv.reserved_quantity) || 0),
          online_preorder_quantity: Math.max(0, Number(fv.online_preorder_quantity) || 0),
          barcode: fv.barcode.trim() || null,
        }))
      );

      logActivity({
        actor_name: user?.fullName || 'Người dùng',
        actor_role: (user?.role as AuditActorRole) || 'staff',
        action_type: 'create',
        entity_type: 'product',
        entity_name: name,
        description: `Tạo mới sản phẩm "${name}" (${effectiveCollabPartner ? `Collab: ${effectiveCollabPartner}` : 'Hàng Host'}) với ${formVariants.length} phân loại.`,
      });
    }
    setIsModalOpen(false);
  }

  function handleDeleteProduct(prod: Product) {
    if (
      confirm(
        `Bạn có chắc muốn ẩn/xóa sản phẩm "${prod.name}"? (Sản phẩm sẽ được ẩn đi chứ không bị xóa vĩnh viễn, bạn có thể khôi phục lại bất kỳ lúc nào).`
      )
    ) {
      deleteProduct(prod.id);
      logActivity({
        actor_name: user?.fullName || 'Người dùng',
        actor_role: (user?.role as AuditActorRole) || 'staff',
        action_type: 'delete',
        entity_type: 'product',
        entity_name: prod.name,
        description: `Đã ẩn/xóa sản phẩm "${prod.name}" khỏi danh mục đang bán (chuyển vào mục Đã ẩn/Đã xóa).`,
      });
    }
  }

  function handleRestoreProduct(prod: Product) {
    restoreProduct(prod.id);
    logActivity({
      actor_name: user?.fullName || 'Người dùng',
      actor_role: (user?.role as AuditActorRole) || 'staff',
      action_type: 'update',
      entity_type: 'product',
      entity_name: prod.name,
      description: `Khôi phục sản phẩm "${prod.name}" trở lại danh mục đang mở bán.`,
    });
  }

  const currency = activeWorkspace?.currency || 'VND';

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">{t('title')}</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF1EE] text-[#315C4C] border border-[#315C4C]/20">
              {workspaceProducts.length} {t('units')} · {catalogTotals.totalVariantsCount} phân loại
            </span>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">{t('description')}</p>
        </div>

        {editable ? (
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 h-9 px-4 rounded-lg shadow-xs font-semibold"
            onClick={openCreateModal}
          >
            <Plus className="w-4 h-4" />
            <span>{t('createButton')}</span>
          </Button>
        ) : (
          <Badge variant="outline" className="text-xs text-[#737373]">
            Chế độ Chỉ Xem
          </Badge>
        )}
      </div>

      {/* Collab Partner Scoped Access Notification Banner */}
      {isPartner && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-[#FAF5FF] border border-[#A855F7]/30 text-xs text-[#6B21A8] shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Users2 className="w-4 h-4 text-[#9333EA] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-[#6B21A8]">
                Không gian Đối tác Collab: {partnerName || 'Đối tác'}
              </p>
              <p className="text-[11px] text-[#7E22CE] mt-0.5">
                Bạn có toàn quyền quản lý, thêm mới, sửa ảnh và điều phối sản phẩm của thương hiệu{' '}
                <strong>{partnerName}</strong>. Hàng hóa kho tổng của Admin được bảo vệ ở chế độ{' '}
                <strong>Chỉ đọc (Read-only)</strong>.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-xs border-[#A855F7] text-[#7E22CE] bg-[#A855F7]/10 shrink-0 font-semibold"
          >
            Quản trị Độc lập
          </Badge>
        </div>
      )}

      {/* 4 Compact Inventory KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E8E8E5] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-[#737373]"> Sẵn sàng bán quầy (POS)</p>
            <p className="text-lg font-extrabold text-[#2F7D55] mt-0.5 font-mono">
              {catalogTotals.offlineAvailable.toLocaleString('vi-VN')}
              <span className="text-xs font-normal text-[#737373] ml-1">món</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EAF4EE] flex items-center justify-center text-[#2F7D55] shrink-0">
            <Store className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E8E5] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-[#737373]">Tổng tồn kho vật lý</p>
            <p className="text-lg font-extrabold text-[#202124] mt-0.5 font-mono">
              {catalogTotals.totalStock.toLocaleString('vi-VN')}
              <span className="text-xs font-normal text-[#737373] ml-1">món</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center text-[#315C4C] shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E8E5] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-[#737373]">Đơn Online & Giữ chỗ</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-lg font-extrabold text-[#1D4ED8] font-mono">
                {(catalogTotals.onlineCount + catalogTotals.preordCount).toLocaleString('vi-VN')}
              </p>
              <span className="text-[10px] text-[#737373]">
                ({catalogTotals.onlineCount} Onl · {catalogTotals.preordCount} VIP)
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8] shrink-0">
            <Globe className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E8E5] rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-[#737373]">Đã bán tại sự kiện</p>
            <p className="text-lg font-extrabold text-[#202124] mt-0.5 font-mono">
              {catalogTotals.offlineSold.toLocaleString('vi-VN')}
              <span className="text-xs font-normal text-[#737373] ml-1">món</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center text-[#737373] shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Unified Filter, Search & View Mode Toolbar */}
      <div className="bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-800 rounded-xl p-2.5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#F7F7F5] dark:bg-neutral-800 rounded-lg border border-[#E8E8E5] dark:border-neutral-700 text-xs overflow-x-auto no-scrollbar shrink-0 -mx-0.5 px-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={cn(
              'px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer',
              statusFilter === 'active'
                ? 'bg-white dark:bg-neutral-900 text-[#315C4C] dark:text-emerald-400 shadow-2xs'
                : 'text-[#737373] dark:text-neutral-400 hover:text-[#202124]'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-[#2F7D55]" />
            <span>Đang bán</span>
            <span className="text-[10px] bg-[#EBF1EE] dark:bg-emerald-950/40 px-1.5 py-0.2 rounded font-mono text-[#315C4C] dark:text-emerald-400">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('sold_out')}
            className={cn(
              'px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer',
              statusFilter === 'sold_out'
                ? 'bg-white dark:bg-neutral-900 text-[#B7791F] dark:text-amber-400 shadow-2xs'
                : 'text-[#737373] dark:text-neutral-400 hover:text-[#202124]'
            )}
          >
            <EyeOff className="w-3.5 h-3.5 text-[#B7791F] dark:text-amber-400" />
            <span>Hết hàng</span>
            <span className="text-[10px] bg-[#FEF7EC] dark:bg-amber-950/40 px-1.5 py-0.2 rounded font-mono text-[#B7791F] dark:text-amber-400">
              {soldOutCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('archived')}
            className={cn(
              'px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer',
              statusFilter === 'archived'
                ? 'bg-white dark:bg-neutral-900 text-[#C44536] dark:text-rose-400 shadow-2xs'
                : 'text-[#737373] dark:text-neutral-400 hover:text-[#202124]'
            )}
          >
            <Archive className="w-3.5 h-3.5 text-[#C44536] dark:text-rose-400" />
            <span>Đã ẩn</span>
            <span className="text-[10px] bg-[#FDF1F0] dark:bg-rose-950/40 px-1.5 py-0.2 rounded font-mono text-[#C44536] dark:text-rose-400">
              {archivedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer',
              statusFilter === 'all'
                ? 'bg-white dark:bg-neutral-900 text-[#202124] dark:text-neutral-100 shadow-2xs font-semibold'
                : 'text-[#737373] dark:text-neutral-400 hover:text-[#202124]'
            )}
          >
            <span>Tất cả</span>
            <span className="text-[10px] bg-[#E8E8E5] dark:bg-neutral-700 px-1.5 py-0.2 rounded font-mono text-[#737373] dark:text-neutral-300">
              {allCount}
            </span>
          </button>
        </div>

        {/* Right: Search + Category Select + View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 lg:justify-end">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#9E9E9C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              placeholder="Tìm tên sản phẩm, mã loại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs rounded-lg w-full"
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

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Tag className="w-3.5 h-3.5 text-[#9E9E9C] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                className="h-8 w-full sm:w-auto rounded-lg border border-[#E8E8E5] dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-8 pr-7 text-xs text-[#202124] dark:text-neutral-100 focus:outline-none focus:border-[#315C4C]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">{t('allCategories')}</option>
                {allExistingCategories.map((c) => (
                  <option key={c.id || c.name} value={c.id}>
                    {c.name} {c.count > 0 ? `(${c.count})` : ''}
                  </option>
                ))}
              </select>
            </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-medium',
                viewMode === 'list'
                  ? 'bg-white text-[#315C4C] shadow-2xs'
                  : 'text-[#737373] hover:text-[#202124]'
              )}
              title="Chế độ danh sách chi tiết"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Danh sách</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-medium',
                viewMode === 'grid'
                  ? 'bg-white text-[#315C4C] shadow-2xs'
                  : 'text-[#737373] hover:text-[#202124]'
              )}
              title="Chế độ lưới thẻ sản phẩm"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Lưới thẻ</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Products Content */}
      {filteredProducts.length === 0 ? (
        <Card className="border-[#E8E8E5] shadow-xs rounded-xl">
          <CardContent className="p-12 text-center">
            <Package className="w-10 h-10 text-[#9E9E9C] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#202124]">{t('noProducts')}</h3>
            <p className="text-xs text-[#737373] mt-1 max-w-sm mx-auto">{t('noProductsDesc')}</p>
            {editable && (
              <Button variant="outline" size="sm" className="mt-4 gap-1" onClick={openCreateModal}>
                <Plus className="w-3.5 h-3.5" />
                <span>{t('createButton')}</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* =========================================================
           GRID VIEW: Visual Merchandise Cards (2-3 Columns)
           ========================================================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => {
            const productVariants = variants.filter((v) => v.product_id === prod.id);
            const category =
              categories.find((c) => c.id === prod.category_id) ||
              allExistingCategories.find((c) => c.id === prod.category_id);
            const prodSummary = calculateProductStock(productVariants, allocations);
            const canManageThis = editable && canManageProduct(user, prod.collab_partner);
            const priceLabel = getProductPriceLabel(productVariants, currency);
            const isSoldOut = isProductSoldOut(prod.id);

            const availPct =
              prodSummary.total > 0
                ? Math.min(100, Math.round((prodSummary.offlineAvailable / prodSummary.total) * 100))
                : 0;
            const heldPct =
              prodSummary.total > 0
                ? Math.min(
                    100 - availPct,
                    Math.round(((prodSummary.online + prodSummary.preord) / prodSummary.total) * 100)
                  )
                : 0;

            return (
              <Card
                key={prod.id}
                className="border-[#E8E8E5] bg-white rounded-xl overflow-hidden shadow-2xs hover:border-[#315C4C]/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Top Visual Header */}
                  <div className="p-4 flex items-start gap-3.5">
                    <div
                      onClick={() => canManageThis && openEditModal(prod)}
                      className={cn(
                        'w-20 h-20 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] overflow-hidden shrink-0 flex items-center justify-center relative',
                        canManageThis ? 'cursor-pointer hover:border-[#315C4C]' : ''
                      )}
                      title={canManageThis ? 'Bấm để đổi ảnh hoặc sửa thông tin sản phẩm' : undefined}
                    >
                      {prod.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="w-7 h-7 text-[#9E9E9C]" />
                      )}
                      {canManageThis && (
                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold">
                          <Camera className="w-4 h-4 mb-0.5" />
                          <span>Đổi ảnh</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {category && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F7F7F5] border border-[#E8E8E5] text-[#737373]">
                            {category.name}
                          </span>
                        )}
                        {prod.collab_partner && (
                          <Badge variant="warning" className="text-[10px] gap-1">
                            <Users2 className="w-2.5 h-2.5" />
                            <span>{prod.collab_partner}</span>
                          </Badge>
                        )}
                        {prod.is_deleted ? (
                          <Badge variant="error" className="text-[10px]">
                            Đã xóa
                          </Badge>
                        ) : !prod.is_active ? (
                          <Badge variant="warning" className="text-[10px]">
                            Đang ẩn
                          </Badge>
                        ) : isSoldOut ? (
                          <Badge variant="warning" className="text-[10px]">
                            Hết hàng quầy
                          </Badge>
                        ) : null}
                      </div>

                      <h3 className="text-sm font-bold text-[#202124] leading-snug line-clamp-2">
                        {prod.name}
                      </h3>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm font-extrabold text-[#315C4C] font-mono">
                          {priceLabel}
                        </span>
                        {productVariants.length === 1 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F7F7F5] border border-[#E8E8E5] text-[#737373]">
                            {productVariants[0].sku}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unified Stock Allocation Box */}
                  <div className="px-4 pb-3">
                    <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-[#737373]">
                          Khả dụng bán tại quầy:
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-xs font-extrabold font-mono',
                            prodSummary.offlineAvailable <= 0
                              ? 'bg-[#FDF1F0] text-[#C44536]'
                              : prodSummary.offlineAvailable <= 10
                              ? 'bg-[#FEF7EC] text-[#B7791F]'
                              : 'bg-[#EAF4EE] text-[#2F7D55]'
                          )}
                        >
                          {prodSummary.offlineAvailable} / {prodSummary.total} món
                        </span>
                      </div>

                      {/* Segmented Stock Progress Bar */}
                      <div className="h-1.5 w-full rounded-full bg-[#E8E8E5] overflow-hidden flex">
                        <div
                          className="h-full bg-[#2F7D55] transition-all"
                          style={{ width: `${availPct}%` }}
                          title={`Khả dụng tại quầy: ${prodSummary.offlineAvailable}`}
                        />
                        <div
                          className="h-full bg-[#3B82F6] transition-all"
                          style={{ width: `${heldPct}%` }}
                          title={`Online & Giữ chỗ: ${prodSummary.online + prodSummary.preord}`}
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-1 pt-0.5 text-center text-[10px]">
                        <div>
                          <span className="text-[#737373] block">Tổng kho</span>
                          <span className="font-bold text-[#202124] font-mono">{prodSummary.total}</span>
                        </div>
                        <div>
                          <span className="text-[#1D4ED8] block">Online</span>
                          <span className="font-bold text-[#1D4ED8] font-mono">{prodSummary.online}</span>
                        </div>
                        <div>
                          <span className="text-[#B7791F] block">Giữ VIP</span>
                          <span className="font-bold text-[#B7791F] font-mono">{prodSummary.preord}</span>
                        </div>
                        <div>
                          <span className="text-[#737373] block">Đã bán</span>
                          <span className="font-bold text-[#202124] font-mono">{prodSummary.offlineSold}</span>
                        </div>
                      </div>
                    </div>

                    {/* Variant Chips Preview */}
                    {productVariants.length > 1 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {productVariants.map((v) => {
                          const vAllocs = allocations.filter((a) => a.variant_id === v.id && !a.is_test);
                          const vSoldOff = vAllocs.reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
                          const vAlloc = vAllocs.reduce((sum, a) => sum + (a.allocated_quantity || 0), 0);
                          const st = calculateVariantStock(v, vSoldOff, vAlloc);
                          return (
                            <span
                              key={v.id}
                              onClick={() => canManageThis && openQuickAdjustModal(prod)}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border bg-white border-[#E8E8E5]',
                                canManageThis ? 'cursor-pointer hover:border-[#315C4C]' : ''
                              )}
                              title={`${v.name} (${v.sku}) — Bấm để chỉnh nhanh tồn kho`}
                            >
                              <span className="font-semibold text-[#202124]">{v.name}</span>
                              <span
                                className={cn(
                                  'font-mono font-bold text-[10px] px-1 rounded',
                                  st.offlineAvailable <= 0
                                    ? 'bg-[#FDF1F0] text-[#C44536]'
                                    : 'bg-[#EAF4EE] text-[#2F7D55]'
                                )}
                              >
                                {st.offlineAvailable}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-2.5 bg-[#F7F7F5] border-t border-[#E8E8E5] flex items-center justify-between gap-2">
                  {editable && canManageThis ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-[11px] gap-1 bg-white font-semibold"
                          onClick={() => openEditModal(prod)}
                        >
                          <Edit className="w-3 h-3 text-[#315C4C]" />
                          <span>Sửa & Ảnh</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-[11px] gap-1 bg-white font-semibold"
                          onClick={() => openQuickAdjustModal(prod)}
                        >
                          <SlidersHorizontal className="w-3 h-3 text-[#B7791F]" />
                          <span>Chỉnh tồn</span>
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        {prod.is_deleted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] gap-1 text-[#2F7D55]"
                            onClick={() => handleRestoreProduct(prod)}
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Khôi phục</span>
                          </Button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleProductActive(prod.id)}
                              className="p-1.5 rounded-md text-[#737373] hover:text-[#202124] hover:bg-white transition-colors"
                              title={prod.is_active ? 'Tạm ẩn sản phẩm' : 'Hiện lại sản phẩm'}
                            >
                              {prod.is_active ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-[#2F7D55]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod)}
                              className="p-1.5 rounded-md text-[#737373] hover:text-[#C44536] hover:bg-[#FDF1F0] transition-colors"
                              title="Xóa / Ẩn sản phẩm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  ) : editable && isPartner ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#737373] font-medium">
                      <Lock className="w-3 h-3 text-[#9E9E9C]" />
                      <span>Kho hàng Admin (Chỉ đọc)</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#9E9E9C] italic">Chỉ xem</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* =========================================================
           LIST VIEW (Default): Sleek, Zero-Redundancy Catalog Cards
           ========================================================= */
        <div className="space-y-3.5">
          {filteredProducts.map((prod) => {
            const productVariants = variants.filter((v) => v.product_id === prod.id);
            const category =
              categories.find((c) => c.id === prod.category_id) ||
              allExistingCategories.find((c) => c.id === prod.category_id);
            const prodSummary = calculateProductStock(productVariants, allocations);
            const canManageThis = editable && canManageProduct(user, prod.collab_partner);
            const priceLabel = getProductPriceLabel(productVariants, currency);
            const isSoldOut = isProductSoldOut(prod.id);
            const singleVariant = productVariants.length === 1 ? productVariants[0] : null;

            const availPct =
              prodSummary.total > 0
                ? Math.min(100, Math.round((prodSummary.offlineAvailable / prodSummary.total) * 100))
                : 0;
            const heldPct =
              prodSummary.total > 0
                ? Math.min(
                    100 - availPct,
                    Math.round(((prodSummary.online + prodSummary.preord) / prodSummary.total) * 100)
                  )
                : 0;

            return (
              <Card
                key={prod.id}
                className="border-[#E8E8E5] bg-white rounded-xl shadow-2xs hover:border-[#315C4C]/35 transition-all overflow-hidden"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Left: Thumbnail + Product Identity */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div
                        onClick={() => canManageThis && openEditModal(prod)}
                        className={cn(
                          'w-[72px] h-[72px] rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] overflow-hidden shrink-0 flex items-center justify-center relative group',
                          canManageThis ? 'cursor-pointer hover:border-[#315C4C]' : ''
                        )}
                        title={canManageThis ? 'Bấm để đổi ảnh hoặc sửa thông tin sản phẩm' : undefined}
                      >
                        {prod.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Package className="w-7 h-7 text-[#9E9E9C]" />
                        )}
                        {canManageThis && (
                          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold">
                            <Camera className="w-4 h-4 mb-0.5" />
                            <span>Đổi ảnh</span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Title + Category + Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-bold text-[#202124] tracking-tight">
                            {prod.name}
                          </h3>

                          {category && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F7F7F5] border border-[#E8E8E5] text-[#737373]">
                              <Tag className="w-2.5 h-2.5" />
                              {category.name}
                            </span>
                          )}

                          {singleVariant && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#F7F7F5] border border-[#E8E8E5] text-[#737373]">
                              Mã: {singleVariant.sku}
                            </span>
                          )}

                          {prod.collab_partner && (
                            <Badge variant="warning" className="text-[10px] gap-1">
                              <Users2 className="w-2.5 h-2.5" />
                              <span>Collab: {prod.collab_partner}</span>
                            </Badge>
                          )}

                          {prod.is_deleted && (
                            <Badge variant="error" className="text-[10px] font-semibold">
                              Đã xóa (Đang ẩn)
                            </Badge>
                          )}
                          {!prod.is_active && !prod.is_deleted && (
                            <Badge variant="warning" className="text-[10px]">
                              Tạm ngưng bán
                            </Badge>
                          )}
                          {isSoldOut && !prod.is_deleted && prod.is_active && (
                            <Badge variant="warning" className="text-[10px] font-semibold">
                              Hết hàng bán quầy
                            </Badge>
                          )}
                        </div>

                        {/* Price + Description */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-sm font-extrabold text-[#315C4C] font-mono">
                            {priceLabel}
                          </span>
                          {productVariants.length > 1 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#737373]">
                              <Layers className="w-3 h-3" />
                              {productVariants.length} phân loại
                            </span>
                          )}
                          {prod.description && (
                            <span className="text-xs text-[#737373] line-clamp-1 max-w-xl">
                              • {prod.description}
                            </span>
                          )}
                        </div>

                        {/* Unified Stock Strip (Harmonious in both Light & Dark Mode) */}
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <div className="inline-flex flex-wrap items-center gap-x-3.5 gap-y-1 px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-xs">
                            <span className="inline-flex items-center gap-1.5 text-[#737373]">
                              <Boxes className="w-3.5 h-3.5 text-[#315C4C]" />
                              <span>Tổng kho:</span>
                              <strong className="text-[#202124] font-mono">{prodSummary.total}</strong>
                            </span>

                            <span className="text-[#E8E8E5] select-none">|</span>

                            <span className="inline-flex items-center gap-1 text-[#737373]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                              <span>Online:</span>
                              <strong className="text-[#1D4ED8] font-mono">{prodSummary.online}</strong>
                            </span>

                            <span className="inline-flex items-center gap-1 text-[#737373]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                              <span>Giữ VIP:</span>
                              <strong className="text-[#B7791F] font-mono">{prodSummary.preord}</strong>
                            </span>

                            <span className="inline-flex items-center gap-1 text-[#737373]">
                              <span>Đã bán:</span>
                              <strong className="text-[#202124] font-mono">{prodSummary.offlineSold}</strong>
                            </span>
                          </div>

                          {/* Primary POS Available Pill */}
                          <div
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border',
                              prodSummary.offlineAvailable <= 0
                                ? 'bg-[#FDF1F0] text-[#C44536] border-[#C44536]/25'
                                : prodSummary.offlineAvailable <= 10
                                ? 'bg-[#FEF7EC] text-[#B7791F] border-[#B7791F]/25'
                                : 'bg-[#EAF4EE] text-[#2F7D55] border-[#2F7D55]/25'
                            )}
                          >
                            <Store className="w-3.5 h-3.5" />
                            <span>Còn bán quầy:</span>
                            <span className="font-mono text-[13px] font-extrabold">
                              {prodSummary.offlineAvailable}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Refined Action Toolbar */}
                    <div className="w-full xl:w-auto grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0 border-t xl:border-t-0 pt-3 xl:pt-0 border-[#F0F0ED] dark:border-neutral-800">
                      {editable && canManageThis ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 sm:px-3 text-xs gap-1.5 rounded-lg font-semibold justify-center"
                            onClick={() => openQuickAdjustModal(prod)}
                            title="Chỉnh nhanh số lượng tổng kho, tự giữ VIP và đơn khách đặt online"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[#B7791F]" />
                            <span className="sm:inline hidden">Chỉnh tồn &amp; Đặt trước</span>
                            <span className="sm:hidden">Chỉnh tồn</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 sm:px-3 text-xs gap-1.5 rounded-lg font-semibold justify-center"
                            onClick={() => openEditModal(prod)}
                            title="Sửa thông tin, giá bán hoặc đổi ảnh sản phẩm"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#315C4C]" />
                            <span>Sửa &amp; Ảnh</span>
                          </Button>

                          {prod.is_deleted ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs gap-1.5 rounded-lg border-[#2F7D55]/50 text-[#2F7D55] hover:bg-[#EBF1EE] font-semibold"
                              onClick={() => handleRestoreProduct(prod)}
                              title="Khôi phục sản phẩm này trở lại mở bán"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Khôi phục</span>
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1 pl-1 border-l border-[#E8E8E5]">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 text-xs gap-1 text-[#737373] hover:text-[#202124] rounded-lg"
                                onClick={() => toggleProductActive(prod.id)}
                                title={prod.is_active ? 'Tạm ẩn khỏi POS' : 'Mở bán lại trên POS'}
                              >
                                {prod.is_active ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Ẩn</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5 text-[#2F7D55]" />
                                    <span className="hidden sm:inline text-[#2F7D55] font-semibold">
                                      Hiện lại
                                    </span>
                                  </>
                                )}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-[#737373] hover:text-[#C44536] hover:bg-[#FDF1F0] rounded-lg"
                                onClick={() => handleDeleteProduct(prod)}
                                title="Xóa / Ẩn sản phẩm (Có thể khôi phục bất kỳ lúc nào)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </>
                      ) : editable && isPartner ? (
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-xs text-[#737373] font-medium"
                          title="Hàng kho Admin - Bạn không thể chỉnh sửa"
                        >
                          <Lock className="w-3.5 h-3.5 text-[#9E9E9C]" />
                          <span>Kho hàng Admin (Chỉ đọc)</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#9E9E9C] italic">Chỉ xem</span>
                      )}
                    </div>
                  </div>

                  {/* Multi-Variant Breakdown Grid (Only rendered when product has > 1 variant, avoiding duplicate single-variant clutter) */}
                  {productVariants.length > 1 && (
                    <div className="mt-4 pt-3.5 border-t border-[#F0F0ED]">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-semibold text-[#737373] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#315C4C]" />
                          <span>Chi tiết theo phân loại ({productVariants.length} biến thể)</span>
                        </span>
                        <div className="hidden sm:flex items-center gap-3 text-[10px] text-[#737373]">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#2F7D55]" /> Khả dụng quầy
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Khách Online / Giữ VIP
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {productVariants.map((v) => {
                          const vAllocs = allocations.filter(
                            (a) => a.variant_id === v.id && !a.is_test
                          );
                          const vSoldOffline = vAllocs.reduce(
                            (sum, a) => sum + (a.sold_quantity || 0),
                            0
                          );
                          const vAllocated = vAllocs.reduce(
                            (sum, a) => sum + (a.allocated_quantity || 0),
                            0
                          );
                          const stock = calculateVariantStock(v, vSoldOffline, vAllocated);
                          const vAvailPct =
                            stock.total > 0
                              ? Math.min(100, Math.round((stock.offlineAvailable / stock.total) * 100))
                              : 0;
                          const vHeldPct =
                            stock.total > 0
                              ? Math.min(
                                  100 - vAvailPct,
                                  Math.round(((stock.online + stock.preord) / stock.total) * 100)
                                )
                              : 0;

                          return (
                            <div
                              key={v.id}
                              onClick={() => canManageThis && openQuickAdjustModal(prod)}
                              className={cn(
                                'p-3 rounded-xl border border-[#E8E8E5] bg-[#F7F7F5] flex flex-col justify-between gap-2.5 transition-all',
                                canManageThis ? 'cursor-pointer hover:border-[#315C4C]/40' : ''
                              )}
                              title={
                                canManageThis
                                  ? 'Bấm để chỉnh nhanh tồn kho & đặt trước của phân loại này'
                                  : undefined
                              }
                            >
                              {/* Top Row: Variant Name + SKU on left, Price + Single Stock Pill on right */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-[#202124] truncate">
                                      {v.name}
                                    </span>
                                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white border border-[#E8E8E5] text-[#737373] shrink-0">
                                      {v.sku}
                                    </span>
                                  </div>
                                  <span className="text-xs font-extrabold text-[#315C4C] font-mono mt-0.5 block">
                                    {formatCurrency(v.price, currency)}
                                  </span>
                                </div>

                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded-md text-[11px] font-bold font-mono shrink-0 border',
                                    stock.offlineAvailable <= 0
                                      ? 'bg-[#FDF1F0] text-[#C44536] border-[#C44536]/20'
                                      : stock.offlineAvailable <= 10
                                      ? 'bg-[#FEF7EC] text-[#B7791F] border-[#B7791F]/20'
                                      : 'bg-[#EAF4EE] text-[#2F7D55] border-[#2F7D55]/20'
                                  )}
                                >
                                  Còn {stock.offlineAvailable} quầy
                                </span>
                              </div>

                              {/* Mini Progress Bar */}
                              <div className="h-1.5 w-full rounded-full bg-[#E8E8E5] overflow-hidden flex">
                                <div
                                  className="h-full bg-[#2F7D55]"
                                  style={{ width: `${vAvailPct}%` }}
                                />
                                <div
                                  className="h-full bg-[#3B82F6]"
                                  style={{ width: `${vHeldPct}%` }}
                                />
                              </div>

                              {/* 4-Metric Compact Row (Zero Duplication) */}
                              <div className="grid grid-cols-4 gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-[#E8E8E5] text-center text-[10px]">
                                <div>
                                  <span className="text-[#737373] block">Tổng</span>
                                  <span className="font-bold text-[#202124] font-mono">
                                    {stock.total}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#1D4ED8] block">Online</span>
                                  <span className="font-bold text-[#1D4ED8] font-mono">
                                    {stock.online}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#B7791F] block">Giữ VIP</span>
                                  <span className="font-bold text-[#B7791F] font-mono">
                                    {stock.preord}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#737373] block">Đã bán</span>
                                  <span className="font-bold text-[#202124] font-mono">
                                    {stock.offlineSold}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Product Modal with Image Uploader & Variants Builder */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Chỉnh Sửa Thông Tin & Đổi Ảnh Sản Phẩm' : t('createButton')}
        maxWidth="lg"
        description={
          editingProduct
            ? 'Cập nhật ảnh chụp sản phẩm, tên, phân loại và số lượng mở bán.'
            : 'Nhập thông tin sản phẩm merchandise và danh sách các biến thể kích thước/màu sắc.'
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <ProductImageUploader
            value={imageUrl}
            onChange={(val) => setImageUrl(val || '')}
            label="Ảnh chụp sản phẩm / Tải ảnh từ điện thoại"
          />

          <div className="space-y-1.5">
            <Label htmlFor="prod-name" required>
              {t('productName')}
            </Label>
            <Input
              id="prod-name"
              required
              placeholder={t('productNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Combobox: Manual Entry + Suggestions from All Products */}
            <div className="space-y-1.5 relative" ref={categoryDropdownRef}>
              <div className="flex items-center justify-between">
                <Label htmlFor="prod-cat">{t('categoryLabel')}</Label>
                <span className="text-[10px] text-[#737373] dark:text-neutral-400">
                  Nhập tự do hoặc chọn có sẵn
                </span>
              </div>

              <div className="relative">
                <Input
                  id="prod-cat"
                  type="text"
                  placeholder="Gõ danh mục (VD: Móc khóa, Sticker...) hoặc bấm chọn"
                  value={categoryInput}
                  onChange={(e) => {
                    setCategoryInput(e.target.value);
                    setIsCategoryDropdownOpen(true);
                  }}
                  onFocus={() => setIsCategoryDropdownOpen(true)}
                  className="pr-9 text-xs bg-white dark:bg-neutral-900 border-[#E8E8E5] dark:border-neutral-700 text-[#202124] dark:text-neutral-100 placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  title="Bấm để mở danh sách danh mục có sẵn"
                >
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isCategoryDropdownOpen ? 'rotate-180 text-[#315C4C]' : ''
                    )}
                  />
                </button>
              </div>

              {isCategoryDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-700 rounded-[6px] shadow-lg z-50 max-h-52 overflow-y-auto py-1 divide-y divide-[#F0F0ED] dark:divide-neutral-800">
                  {categoryInput.trim() &&
                    !allExistingCategories.some(
                      (c) => c.name.toLowerCase() === categoryInput.trim().toLowerCase()
                    ) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#315C4C] dark:text-emerald-400 hover:bg-[#EBF1EE] dark:hover:bg-emerald-950/40 flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Dùng danh mục mới: <strong>&ldquo;{categoryInput.trim()}&rdquo;</strong>
                        </span>
                      </button>
                    )}

                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((c) => {
                      const isSelected =
                        c.name.toLowerCase() === categoryInput.trim().toLowerCase();
                      return (
                        <button
                          key={c.id || c.name}
                          type="button"
                          onClick={() => {
                            setCategoryInput(c.name);
                            setCategoryId(c.id);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F7F7F5] dark:hover:bg-neutral-800 transition-colors',
                            isSelected
                              ? 'bg-[#EBF1EE]/60 dark:bg-emerald-950/40 font-bold text-[#315C4C] dark:text-emerald-300'
                              : 'text-[#202124] dark:text-neutral-200'
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Tag className="w-3 h-3 text-[#9E9E9C] shrink-0" />
                            <span className="truncate">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {c.count > 0 && (
                              <span className="text-[10px] text-[#737373] dark:text-neutral-400 font-mono">
                                {c.count} SP
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#315C4C] dark:text-emerald-400" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-xs text-[#737373] dark:text-neutral-400 italic">
                      Không tìm thấy danh mục có sẵn. Danh mục mới sẽ được tạo khi lưu.
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-[#737373] dark:text-neutral-400">Gợi ý nhanh:</span>
                {allExistingCategories.slice(0, 5).map((c) => (
                  <button
                    key={c.id || c.name}
                    type="button"
                    onClick={() => {
                      setCategoryInput(c.name);
                      setCategoryId(c.id);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full border transition-all',
                      categoryInput.trim().toLowerCase() === c.name.toLowerCase()
                        ? 'bg-[#315C4C] text-white border-[#315C4C] font-semibold'
                        : 'bg-[#F7F7F5] dark:bg-neutral-800 text-[#555] dark:text-neutral-300 border-[#E8E8E5] dark:border-neutral-700 hover:border-[#315C4C]'
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-collab">Đối tác Collab</Label>
              {isPartner ? (
                <div>
                  <Input
                    id="prod-collab"
                    value={partnerName || 'Collab Partner'}
                    disabled
                    className="bg-[#F0F0ED] text-[#202124] font-semibold cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#737373] mt-1">
                    🔒 Tự động gán cho tài khoản đối tác của bạn ({partnerName}).
                  </p>
                </div>
              ) : (
                <Input
                  id="prod-collab"
                  placeholder="VD: GenZ Studio, The Cassette..."
                  value={collabPartner}
                  onChange={(e) => setCollabPartner(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prod-desc">{t('descriptionLabel')}</Label>
            <textarea
              id="prod-desc"
              rows={2}
              className="flex w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-sm text-[#202124] focus:outline-none focus:border-[#315C4C]"
              placeholder="Chất liệu, ghi chú đóng gói..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Dynamic Variants Form */}
          <div className="border-t border-[#F0F0ED] pt-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-bold text-[#202124]">
                {t('variantsSection')}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={addVariantField}
              >
                <Plus className="w-3 h-3" />
                <span>{t('addVariant')}</span>
              </Button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {formVariants.map((v, idx) => {
                const totalHeld = (v.reserved_quantity || 0) + (v.online_preorder_quantity || 0);
                const available = Math.max(0, (v.total_inventory || 0) - totalHeld);

                return (
                  <div
                    key={idx}
                    className="p-3 bg-[#F7F7F5] rounded-[8px] border border-[#E8E8E5] space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-5">
                        <span className="text-[10px] text-[#737373] block mb-1 font-semibold">
                          Tên biến thể:
                        </span>
                        <Input
                          placeholder={t('variantNamePlaceholder')}
                          value={v.name}
                          onChange={(e) => updateVariantField(idx, 'name', e.target.value)}
                          className="h-8 text-xs bg-white"
                          required
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-[10px] text-[#737373] block mb-1 font-semibold">
                          Mã loại:
                        </span>
                        <Input
                          placeholder="Tự động nếu để trống"
                          value={v.sku}
                          onChange={(e) => updateVariantField(idx, 'sku', e.target.value)}
                          className="h-8 text-xs bg-white font-mono uppercase"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-[10px] text-[#737373] block mb-1 font-semibold">
                          Giá bán (VND):
                        </span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={v.price === 0 ? '' : v.price}
                          onChange={(e) =>
                            updateVariantField(
                              idx,
                              'price',
                              e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                            )
                          }
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end sm:justify-center pt-1 sm:pt-4">
                        <button
                          type="button"
                          disabled={formVariants.length <= 1}
                          onClick={() => removeVariantField(idx)}
                          className="p-1.5 text-[#737373] hover:text-[#C44536] disabled:opacity-30"
                          title="Xóa biến thể"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E8E8E5]">
                      <div>
                        <span className="text-[10px] text-[#202124] block mb-1 font-semibold">
                          Tổng tồn kho:
                        </span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={v.total_inventory === 0 ? '' : v.total_inventory}
                          onChange={(e) =>
                            updateVariantField(
                              idx,
                              'total_inventory',
                              e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                            )
                          }
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#B7791F] block mb-1 font-semibold">
                          Tự giữ chỗ (VIP):
                        </span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={v.reserved_quantity === 0 ? '' : v.reserved_quantity}
                          onChange={(e) =>
                            updateVariantField(
                              idx,
                              'reserved_quantity',
                              e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                            )
                          }
                          className="h-8 text-xs bg-white border-[#B7791F]/40"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#1D4ED8] block mb-1 font-semibold">
                          Khách đặt Online:
                        </span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={v.online_preorder_quantity === 0 ? '' : v.online_preorder_quantity}
                          onChange={(e) =>
                            updateVariantField(
                              idx,
                              'online_preorder_quantity',
                              e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0)
                            )
                          }
                          className="h-8 text-xs bg-white border-[#3B82F6]/40"
                        />
                      </div>
                      <div className="bg-white p-1.5 rounded border border-[#E8E8E5] flex flex-col justify-center text-center">
                        <span className="text-[9px] text-[#737373] block">Khả dụng tại quầy</span>
                        <span
                          className={`text-xs font-bold font-mono ${
                            available <= 0 ? 'text-[#C44536]' : 'text-[#2F7D55]'
                          }`}
                        >
                          {available} món
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0ED]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingProduct ? 'Lưu cập nhật & Đổi ảnh' : tCommon('save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Adjust Pre-orders & Reservations Modal */}
      {quickAdjustProduct && (
        <Modal
          isOpen={!!quickAdjustProduct}
          onClose={() => setQuickAdjustProduct(null)}
          title={`Chỉnh Tồn Kho & Đặt Trước — ${quickAdjustProduct.name}`}
          description="Cập nhật nhanh tổng kho, số lượng chủ shop giữ VIP hoặc khách đặt mua online."
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Product Mini Preview Header inside Modal */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5]">
              <div className="w-12 h-12 rounded-lg bg-white border border-[#E8E8E5] overflow-hidden flex items-center justify-center shrink-0">
                {quickAdjustProduct.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={quickAdjustProduct.image_url}
                    alt={quickAdjustProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-5 h-5 text-[#9E9E9C]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#202124] truncate">
                  {quickAdjustProduct.name}
                </h4>
                <p className="text-[11px] text-[#737373] mt-0.5 flex items-center gap-1">
                  <Info className="w-3 h-3 text-[#315C4C] shrink-0" />
                  <span>
                    Tồn bán quầy = Tổng kho − Tự giữ VIP − Khách Online − Đã bán tại quầy
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {quickVariants.map((qv, idx) => {
                const totalHeld = qv.reserved + qv.online;
                const offlineAvailable = Math.max(0, qv.total - totalHeld - (qv.offlineSold || 0));

                return (
                  <div
                    key={qv.id}
                    className="p-3.5 bg-[#F7F7F5] rounded-xl border border-[#E8E8E5] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-[#202124]">{qv.name}</h4>
                        <span className="font-mono text-[10px] text-[#737373]">
                          Mã: {qv.sku} • Đã bán tại quầy: {qv.offlineSold || 0}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#737373] block">Còn bán tại quầy:</span>
                        <span
                          className={`text-xs font-extrabold font-mono ${
                            offlineAvailable <= 0 ? 'text-[#C44536]' : 'text-[#2F7D55]'
                          }`}
                        >
                          {offlineAvailable} món
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-[#202124]">
                          Tổng số lượng kho:
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={qv.total === 0 ? '' : qv.total}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                            setQuickVariants((prev) =>
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
                          placeholder="0"
                          value={qv.reserved === 0 ? '' : qv.reserved}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                            setQuickVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, reserved: val } : item))
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
                          placeholder="0"
                          value={qv.online === 0 ? '' : qv.online}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                            setQuickVariants((prev) =>
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
                onClick={() => setQuickAdjustProduct(null)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-[#315C4C] hover:bg-[#27483B] text-white font-bold"
                onClick={handleSaveQuickAdjust}
              >
                Lưu Thay Đổi Số Lượng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
