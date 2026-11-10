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
import { formatCurrency } from '@/lib/utils';
import { Product, ProductVariant } from '@/types/database';
import {
  Package,
  Plus,
  Trash2,
  Tag,
  Boxes,
  Users2,
  CheckCircle,
  Archive,
} from 'lucide-react';

interface VariantInput {
  name: string;
  sku: string;
  price: number;
  total_inventory: number;
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
    toggleProductActive,
  } = useDataStore();
  const { canEditData } = useAuthStore();
  const editable = canEditData();

  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  // Form states
  const [name, setName] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [collabPartner, setCollabPartner] = React.useState('');
  const [formVariants, setFormVariants] = React.useState<VariantInput[]>([
    { name: 'Tiêu chuẩn (Standard)', sku: '', price: 250000, total_inventory: 100, barcode: '' },
  ]);

  const workspaceProducts = products.filter(
    (p) => !activeWorkspace || p.workspace_id === activeWorkspace.id
  );

  const filteredProducts = workspaceProducts.filter((p) => {
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
      { name: 'Size S', sku: 'TOUR-S', price: 300000, total_inventory: 80, barcode: '' },
      { name: 'Size M', sku: 'TOUR-M', price: 300000, total_inventory: 100, barcode: '' },
      { name: 'Size L', sku: 'TOUR-L', price: 300000, total_inventory: 100, barcode: '' },
    ]);
    setIsModalOpen(true);
  }

  function addVariantField() {
    setFormVariants([
      ...formVariants,
      { name: '', sku: '', price: 200000, total_inventory: 50, barcode: '' },
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
          barcode: fv.barcode.trim() || null,
        }))
      );
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
                        {!prod.is_active && (
                          <Badge variant="warning" className="text-[10px]">
                            Lưu trữ
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
                  <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0">
                    {editable ? (
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
                              <span>Lưu trữ</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-[#2F7D55]" />
                              <span>Kích hoạt</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-[#C44536] hover:bg-[#FDF1F0]"
                          onClick={() => {
                            if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
                              deleteProduct(prod.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] text-[#9E9E9C] italic">Chỉ xem</span>
                    )}
                  </div>
                </div>

                {/* Variants Table breakdown */}
                <div className="mt-4 pt-3 border-t border-[#F0F0ED]">
                  <p className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                    Danh sách biến thể & Đơn giá
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {productVariants.map((v) => (
                      <div
                        key={v.id}
                        className="p-2.5 rounded-[6px] border border-[#E8E8E5] bg-[#FBFBFA] flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-[#202124]">{v.name}</p>
                          <p className="font-mono text-[10px] text-[#737373]">{v.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#315C4C]">
                            {formatCurrency(v.price, activeWorkspace?.currency || 'VND')}
                          </p>
                          <p className="text-[10px] text-[#737373]">Kho: {v.total_inventory}</p>
                        </div>
                      </div>
                    ))}
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

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {formVariants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] grid grid-cols-2 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-1 sm:col-span-3">
                    <span className="sm:hidden text-[10px] text-[#737373] block mb-1 font-semibold">Tên biến thể:</span>
                    <Input
                      placeholder={t('variantNamePlaceholder')}
                      value={v.name}
                      onChange={(e) => updateVariantField(idx, 'name', e.target.value)}
                      className="h-8 text-xs bg-white"
                      required
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <span className="sm:hidden text-[10px] text-[#737373] block mb-1 font-semibold">Mã SKU:</span>
                    <Input
                      placeholder="Mã SKU"
                      value={v.sku}
                      onChange={(e) => updateVariantField(idx, 'sku', e.target.value)}
                      className="h-8 text-xs bg-white font-mono uppercase"
                      required
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-3">
                    <span className="sm:hidden text-[10px] text-[#737373] block mb-1 font-semibold">Giá bán (VND):</span>
                    <Input
                      type="number"
                      placeholder="Giá bán"
                      value={v.price}
                      onChange={(e) => updateVariantField(idx, 'price', Number(e.target.value))}
                      className="h-8 text-xs bg-white"
                      required
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <span className="sm:hidden text-[10px] text-[#737373] block mb-1 font-semibold">Tổng tồn kho:</span>
                    <Input
                      type="number"
                      placeholder="Số lượng"
                      value={v.total_inventory}
                      onChange={(e) =>
                        updateVariantField(idx, 'total_inventory', Number(e.target.value))
                      }
                      className="h-8 text-xs bg-white"
                      required
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end sm:justify-center pt-1 sm:pt-0">
                    <button
                      type="button"
                      disabled={formVariants.length <= 1}
                      onClick={() => removeVariantField(idx)}
                      className="p-1.5 text-[#737373] hover:text-[#C44536] disabled:opacity-30 flex items-center gap-1 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="sm:hidden text-xs">Xóa biến thể</span>
                    </button>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
