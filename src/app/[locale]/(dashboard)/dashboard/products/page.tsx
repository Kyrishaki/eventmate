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
  Sparkles,
  Clock,
  Info,
  Edit,
  RotateCcw,
  Eye,
  EyeOff,
  Camera,
  Lock,
  Check,
  ChevronDown,
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
  const [categoryId, setCategoryId] = React.useState('');
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

    // 1. Predefined categories from store
    categories.forEach((cat) => {
      const trimmed = cat.name.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, { id: cat.id, name: trimmed, count: 0 });
      }
    });

    // 2. Scan all products to count usage and discover any custom categories created on other products
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
          map.set(lower, { id: p.category.id || `cat-${Date.now()}`, name: trimmed, count: 1 });
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
      price: 250000,
      total_inventory: 100,
      reserved_quantity: 10,
      online_preorder_quantity: 20,
      barcode: '',
    },
  ]);

  const workspaceProducts = products.filter(
    (p) => !activeWorkspace || p.workspace_id === activeWorkspace.id
  );

  // Check if a product is completely sold out across all variants (offline available <= 0)
  function isProductSoldOut(prodId: string): boolean {
    const prodVariants = variants.filter((v) => v.product_id === prodId);
    if (prodVariants.length === 0) return true;
    const summary = calculateProductStock(prodVariants, allocations);
    return summary.offlineAvailable <= 0;
  }

  // Counts for Status Tabs
  const activeCount = workspaceProducts.filter(
    (p) => !p.is_deleted && p.is_active && !isProductSoldOut(p.id)
  ).length;
  const soldOutCount = workspaceProducts.filter(
    (p) => !p.is_deleted && p.is_active && isProductSoldOut(p.id)
  ).length;
  const archivedCount = workspaceProducts.filter((p) => p.is_deleted || !p.is_active).length;
  const allCount = workspaceProducts.length;

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
      { name: 'Tiêu chuẩn', sku: isPartner ? `COL-${Date.now().toString().slice(-4)}` : 'TOUR-S', price: 250000, total_inventory: 80, reserved_quantity: 5, online_preorder_quantity: 10, barcode: '' },
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
          name: v.name,
          sku: v.sku,
          price: v.price,
          total_inventory: v.total_inventory,
          reserved_quantity: v.reserved_quantity || 0,
          online_preorder_quantity: v.online_preorder_quantity || 0,
          barcode: v.barcode || '',
        }))
      );
    } else {
      setFormVariants([
        { name: 'Tiêu chuẩn', sku: '', price: 200000, total_inventory: 50, reserved_quantity: 0, online_preorder_quantity: 0, barcode: '' },
      ]);
    }
    setIsModalOpen(true);
  }

  function addVariantField() {
    setFormVariants([
      ...formVariants,
      { name: '', sku: '', price: 200000, total_inventory: 50, reserved_quantity: 0, online_preorder_quantity: 0, barcode: '' },
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

    // Collab Partner restriction: cannot edit Admin products and products are automatically assigned to their partner name
    const effectiveCollabPartner = isPartner ? (partnerName || 'Collab Partner') : collabPartner.trim();

    // Resolve Category: find existing or create new dynamically
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

      updateProduct(editingProduct.id, {
        name,
        category_id: resolvedCategoryId,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        collab_partner: effectiveCollabPartner || null,
      });

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
          price: Number(fv.price) || 0,
          total_inventory: Number(fv.total_inventory) || 0,
          reserved_quantity: Number(fv.reserved_quantity) || 0,
          online_preorder_quantity: Number(fv.online_preorder_quantity) || 0,
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">{t('title')}</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {workspaceProducts.length} {t('units')}
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">{t('description')}</p>
        </div>

        {editable ? (
          <Button variant="primary" size="sm" className="gap-1.5" onClick={openCreateModal}>
            <Plus className="w-3.5 h-3.5" />
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-[8px] bg-[#FAF5FF] border border-[#A855F7]/30 text-xs text-[#6B21A8] shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Users2 className="w-4 h-4 text-[#9333EA] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-[#6B21A8]">
                Không gian Đối tác Collab: {partnerName || 'Đối tác'}
              </p>
              <p className="text-[11px] text-[#7E22CE] mt-0.5">
                Bạn có toàn quyền quản lý, thêm mới, sửa ảnh và điều phối sản phẩm của thương hiệu <strong>{partnerName}</strong>. Hàng hóa kho tổng của Admin được bảo vệ ở chế độ <strong>Chỉ đọc (Read-only)</strong> để tránh can thiệp ngoài phạm vi.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-[#A855F7] text-[#7E22CE] bg-[#A855F7]/10 shrink-0 font-semibold">
            Quản trị Độc lập
          </Badge>
        </div>
      )}

      {/* Status Filter Tabs (Active, Sold Out, Hidden/Archived, All) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F0F0ED] rounded-[8px] w-fit text-xs">
        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={cn(
            'px-3 py-1.5 rounded-[6px] font-semibold transition-all flex items-center gap-1.5',
            statusFilter === 'active'
              ? 'bg-white text-[#315C4C] shadow-2xs'
              : 'text-[#737373] hover:text-[#202124]'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-[#2F7D55]" />
          <span>Đang bán</span>
          <span className="text-[10px] bg-[#EBF1EE] px-1.5 py-0.2 rounded font-mono text-[#315C4C]">
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('sold_out')}
          className={cn(
            'px-3 py-1.5 rounded-[6px] font-semibold transition-all flex items-center gap-1.5',
            statusFilter === 'sold_out'
              ? 'bg-white text-[#B7791F] shadow-2xs'
              : 'text-[#737373] hover:text-[#202124]'
          )}
        >
          <EyeOff className="w-3.5 h-3.5 text-[#B7791F]" />
          <span>Hết hàng</span>
          <span className="text-[10px] bg-[#FEF7EC] px-1.5 py-0.2 rounded font-mono text-[#B7791F]">
            {soldOutCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('archived')}
          className={cn(
            'px-3 py-1.5 rounded-[6px] font-semibold transition-all flex items-center gap-1.5',
            statusFilter === 'archived'
              ? 'bg-white text-[#C44536] shadow-2xs'
              : 'text-[#737373] hover:text-[#202124]'
          )}
        >
          <Archive className="w-3.5 h-3.5 text-[#C44536]" />
          <span>Đã ẩn</span>
          <span className="text-[10px] bg-[#FDF1F0] px-1.5 py-0.2 rounded font-mono text-[#C44536]">
            {archivedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-[6px] font-medium transition-all flex items-center gap-1.5',
            statusFilter === 'all'
              ? 'bg-white text-[#202124] shadow-2xs font-semibold'
              : 'text-[#737373] hover:text-[#202124]'
          )}
        >
          <span>Tất cả</span>
          <span className="text-[10px] bg-[#E8E8E5] px-1.5 py-0.2 rounded font-mono text-[#737373]">
            {allCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="max-w-xs w-full">
          <Input
            placeholder={tCommon('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-[#9E9E9C]" />
          <select
            className="h-8 rounded-[6px] border border-[#E8E8E5] bg-white px-2.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
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
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card className="border-[#E8E8E5] shadow-xs">
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
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((prod) => {
            const productVariants = variants.filter((v) => v.product_id === prod.id);
            const category = categories.find((c) => c.id === prod.category_id);
            const totalStock = productVariants.reduce((sum, v) => sum + v.total_inventory, 0);
            const prodSummary = calculateProductStock(productVariants, allocations);
            const canManageThis = editable && canManageProduct(user, prod.collab_partner);

            return (
              <Card
                key={prod.id}
                className="border-[#E8E8E5] bg-white shadow-2xs hover:border-[#D6D6D2] transition-colors p-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Product Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      onClick={() => canManageThis && openEditModal(prod)}
                      className={`w-16 h-16 rounded-[6px] bg-[#F7F7F5] border border-[#E8E8E5] overflow-hidden shrink-0 flex items-center justify-center relative group ${
                        canManageThis ? 'cursor-pointer hover:border-[#315C4C]' : ''
                      }`}
                      title={canManageThis ? 'Bấm để đổi ảnh hoặc sửa thông tin sản phẩm' : undefined}
                    >
                      {prod.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-[#9E9E9C]" />
                      )}
                      {canManageThis && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-semibold">
                          <Camera className="w-3.5 h-3.5 mb-0.5" />
                          <span>Đổi ảnh</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-[#202124] tracking-tight truncate">
                          {prod.name}
                        </h3>
                        {category && (
                          <Badge variant="neutral" className="text-[10px]">
                            {category.name}
                          </Badge>
                        )}
                        {prod.collab_partner && (
                          <Badge variant="warning" className="text-[10px] gap-1">
                            <Users2 className="w-2.5 h-2.5" />
                            <span>Collab: {prod.collab_partner}</span>
                          </Badge>
                        )}
                        {prod.is_deleted && (
                          <Badge variant="outline" className="text-[10px] text-[#C44536] border-[#F8B4AF] bg-[#FDF1F0] font-semibold">
                            Đã xóa (Đang ẩn)
                          </Badge>
                        )}
                        {!prod.is_active && !prod.is_deleted && (
                          <Badge variant="warning" className="text-[10px]">
                            Tạm ngưng bán
                          </Badge>
                        )}
                        {isProductSoldOut(prod.id) && !prod.is_deleted && prod.is_active && (
                          <Badge variant="outline" className="text-[10px] text-[#8C5D17] border-[#B7791F]/30 bg-[#FEF7EC] font-semibold">
                            Đã bán hết (Ẩn khỏi POS)
                          </Badge>
                        )}
                      </div>

                      {prod.description && (
                        <p className="text-xs text-[#737373] mt-1 line-clamp-1">
                          {prod.description}
                        </p>
                      )}

                      {/* Product 5-State Stock Breakdown */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs mt-2.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#202124] bg-[#F7F7F5] px-2 py-0.5 rounded border border-[#E8E8E5] text-[11px]">
                          <Boxes className="w-3 h-3 text-[#315C4C]" />
                          Số lượng: {prodSummary.total}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#3B82F6]/20 font-medium text-[11px]">
                          Online: {prodSummary.online}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#8C5D17] bg-[#FEF7EC] px-2 py-0.5 rounded border border-[#B7791F]/20 font-medium text-[11px]">
                          Preord: {prodSummary.preord}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#2F7D55] bg-[#EAF4EE] px-2 py-0.5 rounded border border-[#2F7D55]/20 font-medium text-[11px]">
                          Đã bán offline: {prodSummary.offlineSold}
                        </span>
                        <span className="inline-flex items-center gap-1 text-white bg-[#315C4C] px-2.5 py-0.5 rounded font-bold text-[11px] shadow-2xs">
                          Tồn bán offline: {prodSummary.offlineAvailable}
                        </span>
                        <span className="text-[10px] text-[#737373]">
                          ({productVariants.length} biến thể)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0">
                    {editable && canManageThis ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 border-[#315C4C]/40 text-[#315C4C] hover:bg-[#315C4C]/5 font-semibold"
                          onClick={() => openEditModal(prod)}
                          title="Sửa thông tin, chụp ảnh hoặc tải ảnh mới từ điện thoại"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#315C4C]" />
                          <span>Sửa & Đổi ảnh</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 border-[#B7791F]/40 text-[#8C5D17] hover:bg-[#FEF7EC] font-semibold"
                          onClick={() => openQuickAdjustModal(prod)}
                          title="Chỉnh nhanh số lượng đặt trước thủ công và đơn đặt mua online"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#B7791F]" />
                          <span>⚡ Chỉnh Đặt Trước / Online</span>
                        </Button>

                        {prod.is_deleted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 border-[#2F7D55]/50 text-[#2F7D55] hover:bg-[#EBF1EE] font-semibold"
                            onClick={() => {
                              restoreProduct(prod.id);
                              logActivity({
                                actor_name: user?.fullName || 'Người dùng',
                                actor_role: (user?.role as AuditActorRole) || 'staff',
                                action_type: 'update',
                                entity_type: 'product',
                                entity_name: prod.name,
                                description: `Khôi phục sản phẩm "${prod.name}" trở lại danh mục đang mở bán.`,
                              });
                            }}
                            title="Khôi phục sản phẩm này trở lại mở bán"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Khôi phục</span>
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1"
                              onClick={() => toggleProductActive(prod.id)}
                            >
                              {prod.is_active ? (
                                <>
                                  <Archive className="w-3 h-3 text-[#737373]" />
                                  <span>Ẩn sản phẩm</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 text-[#2F7D55]" />
                                  <span>Hiện lại</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-[#C44536] hover:bg-[#FDF1F0]"
                              onClick={() => {
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
                              }}
                              title="Ẩn / Xóa sản phẩm (Chỉ ẩn đi, không bị mất dữ liệu)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </>
                    ) : editable && isPartner ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#F7F7F5] border border-[#E8E8E5] text-xs text-[#737373] font-medium" title="Hàng kho Admin - Bạn không thể chỉnh sửa">
                        <Lock className="w-3.5 h-3.5 text-[#9E9E9C]" />
                        <span>Kho hàng Admin (Chỉ đọc)</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#9E9E9C] italic">Chỉ xem</span>
                    )}
                  </div>
                </div>

                {/* Variants Table breakdown */}
                <div className="mt-4 pt-3 border-t border-[#F0F0ED]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
                      Phân rã Biến thể & Trạng thái Đặt Trước / Khả Dụng
                    </p>
                    <span className="text-[10px] text-[#737373]">
                      Bao gồm: Tự đặt trước (Chủ shop giữ) + Khách đặt mua Online
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {productVariants.map((v) => {
                      const vAllocs = allocations.filter((a) => a.variant_id === v.id && !a.is_test);
                      const vSoldOffline = vAllocs.reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
                      const vAllocated = vAllocs.reduce((sum, a) => sum + (a.allocated_quantity || 0), 0);
                      const stock = calculateVariantStock(v, vSoldOffline, vAllocated);
                      return (
                        <div
                          key={v.id}
                          className="p-3 rounded-[6px] border border-[#E8E8E5] bg-[#FBFBFA] flex flex-col justify-between text-xs space-y-2.5 hover:border-[#D6D6D2] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <p className="font-bold text-[#202124]">{v.name}</p>
                              <p className="font-mono text-[10px] text-[#737373]">{v.sku}</p>
                            </div>
                            <span className="font-bold text-[#315C4C]">
                              {formatCurrency(v.price, activeWorkspace?.currency || 'VND')}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant={stock.badgeVariant} className="text-[10px]">
                              {stock.statusLabel}
                            </Badge>
                            <span className="text-[10px] font-bold text-[#2F7D55] bg-[#EAF4EE] px-1.5 py-0.5 rounded border border-[#2F7D55]/30">
                              Còn {stock.offlineAvailable} bán quầy
                            </span>
                          </div>

                          {/* 5 Distinct Stock States Grid */}
                          <div className="grid grid-cols-5 gap-1 bg-white p-2 rounded border border-[#F0F0ED] text-center text-[10px]">
                            <div>
                              <span className="text-[#737373] text-[9px] block">Số lượng</span>
                              <span className="font-bold text-[#202124]">{stock.total}</span>
                            </div>
                            <div>
                              <span className="text-[#1D4ED8] text-[9px] block">Online</span>
                              <span className="font-bold text-[#1D4ED8]">{stock.online}</span>
                            </div>
                            <div>
                              <span className="text-[#8C5D17] text-[9px] block">Preord</span>
                              <span className="font-bold text-[#8C5D17]">{stock.preord}</span>
                            </div>
                            <div>
                              <span className="text-[#737373] text-[9px] block">Đã bán off</span>
                              <span className="font-bold text-[#555555]">{stock.offlineSold}</span>
                            </div>
                            <div className="bg-[#EAF4EE] rounded py-0.5">
                              <span className="text-[#2F7D55] text-[9px] font-bold block">Tồn bán off</span>
                              <span className="font-black text-[#2F7D55]">{stock.offlineAvailable}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
          {/* Product Image Uploader - Camera capture & Phone Gallery */}
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

              {/* Dropdown list of existing categories */}
              {isCategoryDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-700 rounded-[6px] shadow-lg z-50 max-h-52 overflow-y-auto py-1 divide-y divide-[#F0F0ED] dark:divide-neutral-800">
                  {/* Option to create new category if typed something new */}
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

                  {/* Existing categories */}
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

              {/* Quick suggestion chips */}
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
                    {/* Top Row: Name, SKU, Price */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-5">
                        <span className="text-[10px] text-[#737373] block mb-1 font-semibold">Tên biến thể:</span>
                        <Input
                          placeholder={t('variantNamePlaceholder')}
                          value={v.name}
                          onChange={(e) => updateVariantField(idx, 'name', e.target.value)}
                          className="h-8 text-xs bg-white"
                          required
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-[10px] text-[#737373] block mb-1 font-semibold">Mã loại:</span>
                        <Input
                          placeholder="Mã loại"
                          value={v.sku}
                          onChange={(e) => updateVariantField(idx, 'sku', e.target.value)}
                          className="h-8 text-xs bg-white font-mono uppercase"
                          required
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-[10px] text-[#737373] block mb-1 font-semibold">Giá bán (VND):</span>
                        <Input
                          type="number"
                          placeholder="Giá bán"
                          value={v.price}
                          onChange={(e) => updateVariantField(idx, 'price', Number(e.target.value))}
                          className="h-8 text-xs bg-white"
                          required
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

                    {/* Bottom Row: Total, Reserved, Online, Available to Sell */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E8E8E5]">
                      <div>
                        <span className="text-[10px] text-[#202124] block mb-1 font-semibold">Tổng tồn kho:</span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Tổng kho"
                          value={v.total_inventory}
                          onChange={(e) =>
                            updateVariantField(idx, 'total_inventory', Number(e.target.value))
                          }
                          className="h-8 text-xs bg-white"
                          required
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8C5D17] block mb-1 font-semibold">Tự giữ chỗ (VIP):</span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Đặt trước"
                          value={v.reserved_quantity}
                          onChange={(e) =>
                            updateVariantField(idx, 'reserved_quantity', Number(e.target.value))
                          }
                          className="h-8 text-xs bg-white border-[#B7791F]/40"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#1D4ED8] block mb-1 font-semibold">Khách đặt Online:</span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Đơn online"
                          value={v.online_preorder_quantity}
                          onChange={(e) =>
                            updateVariantField(idx, 'online_preorder_quantity', Number(e.target.value))
                          }
                          className="h-8 text-xs bg-white border-[#3B82F6]/40"
                        />
                      </div>
                      <div className="bg-white p-1.5 rounded border border-[#E8E8E5] flex flex-col justify-center text-center">
                        <span className="text-[9px] text-[#737373] block">Khả dụng tại quầy</span>
                        <span className={`text-xs font-bold ${available <= 0 ? 'text-[#C44536]' : 'text-[#2F7D55]'}`}>
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
          title={`Điều Chỉnh Số Lượng Đặt Trước & Online — ${quickAdjustProduct.name}`}
          description="Cập nhật nhanh số lượng sản phẩm được chủ shop tự giữ trước hoặc khách hàng đã đặt mua online."
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#FEF7EC] border border-[#B7791F]/30 rounded-[6px] text-xs text-[#8C5D17] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#B7791F]" />
                <span>Quy tắc 5 trạng thái kho EventMate:</span>
              </p>
              <p>
                <strong>Tồn kho để bán offline</strong> = Số lượng (Tổng nhập) - Online - Preord - Đã bán offline.
                Hệ thống POS bảo vệ nghiêm ngặt số lượng này, tuyệt đối không cho phép bán lấn sang hàng online hoặc giữ chỗ!
              </p>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {quickVariants.map((qv, idx) => {
                const totalHeld = qv.reserved + qv.online;
                const offlineAvailable = Math.max(0, qv.total - totalHeld - (qv.offlineSold || 0));

                return (
                  <div
                    key={qv.id}
                    className="p-3.5 bg-[#F7F7F5] rounded-[8px] border border-[#E8E8E5] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-[#202124]">{qv.name}</h4>
                        <span className="font-mono text-[10px] text-[#737373]">
                          {qv.sku} • Đã bán offline: {qv.offlineSold || 0}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#737373] block">Tồn bán offline:</span>
                        <span className={`text-xs font-bold ${offlineAvailable <= 0 ? 'text-[#C44536]' : 'text-[#2F7D55]'}`}>
                          {offlineAvailable} món
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-[#202124]">
                          Tổng số lượng trong kho:
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={qv.total}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setQuickVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, total: val } : item))
                            );
                          }}
                          className="h-8 text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-[#8C5D17] flex items-center gap-1">
                          <Bookmark className="w-3 h-3 text-[#B7791F]" />
                          <span>Tự giữ / Đặt trước (VIP):</span>
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={qv.reserved}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setQuickVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, reserved: val } : item))
                            );
                          }}
                          className="h-8 text-xs bg-white border-[#B7791F]/40"
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
                          value={qv.online}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setQuickVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, online: val } : item))
                            );
                          }}
                          className="h-8 text-xs bg-white border-[#3B82F6]/40"
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
                Lưu Thay Đổi Số Lượng & Trạng Thái
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
