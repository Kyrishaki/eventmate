'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, cn } from '@/lib/utils';
import { Product, ProductVariant } from '@/types/database';
import { calculateVariantStock } from '@/lib/stock-status';
import { logActivity } from '@/stores/audit-store';
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
    categories,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    toggleProductActive,
    updateVariantPreorders,
  } = useDataStore();
  const { canEditData, user } = useAuthStore();
  const editable = canEditData();

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
    }>
  >([]);

  function openQuickAdjustModal(prod: Product) {
    const prodVariants = variants.filter((v) => v.product_id === prod.id);
    setQuickAdjustProduct(prod);
    setQuickVariants(
      prodVariants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        total: v.total_inventory,
        reserved: v.reserved_quantity || 0,
        online: v.online_preorder_quantity || 0,
      }))
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
        actor_role: (user?.role as any) || 'staff',
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

  // Check if a product is completely sold out across all variants
  function isProductSoldOut(prodId: string): boolean {
    const prodVariants = variants.filter((v) => v.product_id === prodId);
    if (prodVariants.length === 0) return true;
    const totalAvail = prodVariants.reduce(
      (sum, v) => sum + calculateVariantStock(v).availableForSale,
      0
    );
    return totalAvail <= 0;
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
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setImageUrl('');
    setCollabPartner('');
    setFormVariants([
      { name: 'Size S', sku: 'TOUR-S', price: 300000, total_inventory: 80, reserved_quantity: 10, online_preorder_quantity: 15, barcode: '' },
      { name: 'Size M', sku: 'TOUR-M', price: 300000, total_inventory: 100, reserved_quantity: 10, online_preorder_quantity: 20, barcode: '' },
      { name: 'Size L', sku: 'TOUR-L', price: 300000, total_inventory: 100, reserved_quantity: 10, online_preorder_quantity: 20, barcode: '' },
    ]);
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

  function updateVariantField(index: number, field: keyof VariantInput, value: any) {
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

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        category_id: categoryId || null,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        collab_partner: collabPartner.trim() || null,
      });

      logActivity({
        actor_name: user?.fullName || 'Người dùng',
        actor_role: (user?.role as any) || 'staff',
        action_type: 'update',
        entity_type: 'product',
        entity_name: name,
        description: `Cập nhật thông tin sản phẩm "${name}" (${collabPartner ? `Collab: ${collabPartner}` : 'Hàng Host'}).`,
        changes: [
          { field: 'name', field_label: 'Tên sản phẩm', new_value: name },
          { field: 'collab_partner', field_label: 'Đối tác', new_value: collabPartner || 'Không' },
        ],
      });
    } else {
      createProduct(
        {
          workspace_id: activeWorkspace.id,
          category_id: categoryId || null,
          name,
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
          collab_partner: collabPartner.trim() || null,
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
        actor_role: (user?.role as any) || 'staff',
        action_type: 'create',
        entity_type: 'product',
        entity_name: name,
        description: `Tạo mới sản phẩm "${name}" (${collabPartner ? `Collab: ${collabPartner}` : 'Hàng Host'}) với ${formVariants.length} phân loại.`,
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
          <span>Đang mở bán</span>
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
          <span>Đã bán hết (Ẩn)</span>
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
          <span>Đã ẩn / Đã xóa</span>
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
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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

            return (
              <Card
                key={prod.id}
                className="border-[#E8E8E5] bg-white shadow-2xs hover:border-[#D6D6D2] transition-colors p-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Product Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-16 h-16 rounded-[6px] bg-[#F7F7F5] border border-[#E8E8E5] overflow-hidden shrink-0 flex items-center justify-center">
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

                      <div className="flex items-center gap-3 text-xs text-[#737373] mt-2">
                        <span className="flex items-center gap-1 font-medium text-[#202124]">
                          <Boxes className="w-3.5 h-3.5 text-[#315C4C]" />
                          Tổng kho: {totalStock} cái
                        </span>
                        <span>•</span>
                        <span>{productVariants.length} biến thể</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0">
                    {editable ? (
                      <>
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
                                actor_role: (user?.role as any) || 'staff',
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
                                    actor_role: (user?.role as any) || 'staff',
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
                      const stock = calculateVariantStock(v);
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
                            {stock.reserved > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#8C5D17] bg-[#FEF7EC] px-1.5 py-0.5 rounded border border-[#B7791F]/20 font-medium">
                                <Bookmark className="w-2.5 h-2.5 text-[#B7791F]" />
                                Tự giữ: {stock.reserved}
                              </span>
                            )}
                            {stock.onlinePreorder > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#1D4ED8] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#3B82F6]/20 font-medium">
                                <Globe className="w-2.5 h-2.5 text-[#3B82F6]" />
                                Đơn online: {stock.onlinePreorder}
                              </span>
                            )}
                          </div>

                          {/* Detailed Stock Numbers Grid */}
                          <div className="grid grid-cols-3 gap-1 bg-white p-2 rounded border border-[#F0F0ED] text-center text-[11px]">
                            <div>
                              <span className="text-[#9E9E9C] text-[9px] block">Tổng kho</span>
                              <span className="font-bold text-[#202124]">{stock.total}</span>
                            </div>
                            <div>
                              <span className="text-[#9E9E9C] text-[9px] block">Đang giữ</span>
                              <span className="font-bold text-[#B7791F]">{stock.totalHeld}</span>
                            </div>
                            <div>
                              <span className="text-[#9E9E9C] text-[9px] block">Bán tại quầy</span>
                              <span className="font-bold text-[#2F7D55]">{stock.availableForSale}</span>
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

      {/* Create Product Modal with Variants Builder */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('createButton')}
        maxWidth="lg"
        description="Nhập thông tin sản phẩm merchandise và danh sách các biến thể kích thước/màu sắc."
      >
        <form onSubmit={handleSave} className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prod-cat">{t('categoryLabel')}</Label>
              <select
                id="prod-cat"
                className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-sm text-[#202124] focus:outline-none focus:border-[#315C4C]"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-collab">Đối tác Collab (nếu có)</Label>
              <Input
                id="prod-collab"
                placeholder="VD: The Cassette, Cá Hồi Hoang..."
                value={collabPartner}
                onChange={(e) => setCollabPartner(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-img">{t('imageUrlLabel')}</Label>
              <Input
                id="prod-img"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
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
                        <span className="text-[10px] text-[#737373] block mb-1 font-semibold">Mã SKU:</span>
                        <Input
                          placeholder="Mã SKU"
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
              {tCommon('save')}
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
                <span>Quy tắc trừ kho tự động:</span>
              </p>
              <p>
                Khả dụng bán tự do tại quầy = Tổng số lượng kho - (Số lượng tự giữ + Số lượng đơn online).
                Hệ thống POS sẽ bảo vệ số lượng này, không cho phép bán lố vào phần hàng khách đã đặt trước!
              </p>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {quickVariants.map((qv, idx) => {
                const totalHeld = qv.reserved + qv.online;
                const available = Math.max(0, qv.total - totalHeld);

                return (
                  <div
                    key={qv.id}
                    className="p-3.5 bg-[#F7F7F5] rounded-[8px] border border-[#E8E8E5] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-[#202124]">{qv.name}</h4>
                        <span className="font-mono text-[10px] text-[#737373]">{qv.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#737373] block">Khả dụng bán tại quầy:</span>
                        <span className={`text-xs font-bold ${available <= 0 ? 'text-[#C44536]' : 'text-[#2F7D55]'}`}>
                          {available} món
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
