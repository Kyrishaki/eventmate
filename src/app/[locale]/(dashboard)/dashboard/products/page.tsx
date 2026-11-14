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
  Layers,
  Store,
  ShoppingBag,
  ArrowUpDown,
  Hash,
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
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState<
    'default' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_desc' | 'sold_desc' | 'tag_asc'
  >('default');
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
  const [productTags, setProductTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState('');
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

  // Aggregate all tags across workspace products + default quick suggestions
  const allExistingTags = React.useMemo(() => {
    const tagMap = new Map<string, { name: string; count: number }>();
    const suggestedTags = [
      'Limbus Company',
      'Project Moon',
      'Keychain',
      'Standee',
      'Figure',
      'Acrylic',
      'Hologram',
      'Best Seller',
      'Limited',
      'Collab',
    ];
    suggestedTags.forEach((tag) => {
      tagMap.set(tag.toLowerCase(), { name: tag, count: 0 });
    });

    workspaceProducts.forEach((p) => {
      if (p.is_deleted) return;
      (p.tags || []).forEach((rawTag) => {
        const clean = rawTag.trim();
        if (!clean) return;
        const lower = clean.toLowerCase();
        const existing = tagMap.get(lower);
        if (existing) {
          existing.count += 1;
        } else {
          tagMap.set(lower, { name: clean, count: 1 });
        }
      });
    });

    return Array.from(tagMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
  }, [workspaceProducts]);

  function toggleTagFilter(tag: string) {
    setSelectedTags((previous) => previous[0]?.toLowerCase() === tag.toLowerCase() ? [] : [tag]);
  }

  function addTagsFromInput(rawInput: string) {
    const parts = rawInput
      .split(',')
      .map((s) => s.trim().replace(/^#+/, '').trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setProductTags((prev) => {
      const next = [...prev];
      parts.forEach((part) => {
        if (!next.some((t) => t.toLowerCase() === part.toLowerCase())) {
          next.push(part);
        }
      });
      return next;
    });
    setTagInput('');
  }

  function toggleFormTag(tag: string) {
    setProductTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === tag.toLowerCase());
      if (exists) {
        return prev.filter((t) => t.toLowerCase() !== tag.toLowerCase());
      }
      return [...prev, tag];
    });
  }

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

  const matchesOtherFilters = (p: Product) => {
    const archived = Boolean(p.is_deleted || !p.is_active);
    const summary = calculateProductStock(variants.filter((v) => v.product_id === p.id), allocations);
    const soldOut = summary.total > 0 && summary.offlineAvailable <= 0;
    if (statusFilter === 'active' && (archived || soldOut)) return false;
    if (statusFilter === 'sold_out' && (archived || !soldOut)) return false;
    if (statusFilter === 'archived' && !archived) return false;
    const query = searchQuery.trim().toLowerCase();
    return !query || p.name.toLowerCase().includes(query) ||
      (p.tags || []).some((tag) => tag.toLowerCase().includes(query)) ||
      variants.some((v) => v.product_id === p.id && v.sku.toLowerCase().includes(query));
  };
  const categoryOptions = workspaceProducts.filter((p) => matchesOtherFilters(p) &&
    (!selectedTags.length || (p.tags || []).some((tag) => tag.toLowerCase() === selectedTags[0].toLowerCase())));
  const tagOptions = workspaceProducts.filter((p) => matchesOtherFilters(p) &&
    (selectedCategory === 'all' || p.category_id === selectedCategory));
  const categoryOptionCounts = new Map<string, number>();
  categoryOptions.forEach((p) => {
    if (p.category_id) categoryOptionCounts.set(p.category_id, (categoryOptionCounts.get(p.category_id) || 0) + 1);
  });
  const tagOptionCounts = new Map<string, { name: string; count: number }>();
  tagOptions.forEach((p) => {
    new Set((p.tags || []).map((tag) => tag.trim().toLowerCase()).filter(Boolean)).forEach((key) => {
      const name = (p.tags || []).find((tag) => tag.trim().toLowerCase() === key)!.trim();
      const current = tagOptionCounts.get(key);
      tagOptionCounts.set(key, { name: current?.name || name, count: (current?.count || 0) + 1 });
    });
  });
  const availableTags = [...tagOptionCounts.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));

  const filteredProducts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = workspaceProducts.filter((p) => {
      const pVars = variants.filter((v) => v.product_id === p.id);
      const pSummary = calculateProductStock(pVars, allocations);
      const isSoldOut = pVars.length > 0 && pSummary.total > 0 && pSummary.offlineAvailable <= 0;
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
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.tags || []).some((tag) => tag.toLowerCase().includes(q)) ||
        pVars.some((v) => v.sku.toLowerCase().includes(q));

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((selTag) =>
          (p.tags || []).some((pt) => pt.toLowerCase() === selTag.toLowerCase())
        );

      return matchesCat && matchesSearch && matchesTags;
    });

    if (sortBy === 'default') return filtered;

    const getMinPrice = (prodId: string) => {
      const pVars = variants.filter((v) => v.product_id === prodId);
      if (pVars.length === 0) return 0;
      return Math.min(...pVars.map((v) => v.price || 0));
    };

    const getStockSummary = (prodId: string) => {
      const pVars = variants.filter((v) => v.product_id === prodId);
      return calculateProductStock(pVars, allocations);
    };

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name, 'vi');
        case 'name_desc':
          return b.name.localeCompare(a.name, 'vi');
        case 'price_asc':
          return getMinPrice(a.id) - getMinPrice(b.id);
        case 'price_desc':
          return getMinPrice(b.id) - getMinPrice(a.id);
        case 'stock_desc':
          return getStockSummary(b.id).offlineAvailable - getStockSummary(a.id).offlineAvailable;
        case 'sold_desc':
          return getStockSummary(b.id).offlineSold - getStockSummary(a.id).offlineSold;
        case 'tag_asc': {
          const tagA = (a.tags?.[0] || 'zzz').toLowerCase();
          const tagB = (b.tags?.[0] || 'zzz').toLowerCase();
          return tagA.localeCompare(tagB, 'vi') || a.name.localeCompare(b.name, 'vi');
        }
        default:
          return 0;
      }
    });
  }, [workspaceProducts, statusFilter, selectedCategory, searchQuery, selectedTags, sortBy, variants, allocations]);

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
    setProductTags(isPartner && partnerName ? ['Collab', partnerName] : []);
    setTagInput('');
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
    setProductTags(prod.tags ? [...prod.tags] : []);
    setTagInput('');

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

    // Merge any unsubmitted text in tagInput
    const finalTags = [...productTags];
    if (tagInput.trim()) {
      tagInput
        .split(',')
        .map((s) => s.trim().replace(/^#+/, '').trim())
        .filter(Boolean)
        .forEach((part) => {
          if (!finalTags.some((t) => t.toLowerCase() === part.toLowerCase())) {
            finalTags.push(part);
          }
        });
    }

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
          tags: finalTags,
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
          tags: finalTags,
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
            <h1 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning-bg text-primary border border-primary/20">
              {workspaceProducts.length} {t('units')} · {catalogTotals.totalVariantsCount} phân loại
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">{t('description')}</p>
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
          <Badge variant="outline" className="text-xs text-muted">
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
        <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-muted"> Sẵn sàng bán quầy (POS)</p>
            <p className="text-lg font-extrabold text-primary mt-0.5 font-mono">
              {catalogTotals.offlineAvailable.toLocaleString('vi-VN')}
              <span className="text-xs font-normal text-muted ml-1">món</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-success-bg flex items-center justify-center text-primary shrink-0">
            <Store className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-muted">Tổng tồn kho vật lý</p>
            <p className="text-lg font-extrabold text-foreground mt-0.5 font-mono">
              {catalogTotals.totalStock.toLocaleString('vi-VN')}
              <span className="text-xs font-normal text-muted ml-1">món</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-primary shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-muted">Đơn Online & Giữ chỗ</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-lg font-extrabold text-[#1D4ED8] font-mono">
                {(catalogTotals.onlineCount + catalogTotals.preordCount).toLocaleString('vi-VN')}
              </p>
              <span className="text-[10px] text-muted">
                ({catalogTotals.onlineCount} Onl · {catalogTotals.preordCount} VIP)
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8] shrink-0">
            <Globe className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-medium text-muted">Đã bán tại sự kiện</p>
            <p className="text-lg font-extrabold text-foreground mt-0.5 font-mono">
              {catalogTotals.offlineSold.toLocaleString('vi-VN')}
              <span className="text-xs font-normal text-muted ml-1">món</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center text-muted shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Unified Filter, Search, Tag & Sort Toolbar */}
      <div className="bg-surface border border-border rounded-xl p-2.5 shadow-2xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Segmented Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-background rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5',
                statusFilter === 'active'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Đang bán</span>
              <span className="text-[10px] bg-warning-bg px-1.5 py-0.2 rounded font-mono text-primary">
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('sold_out')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5',
                statusFilter === 'sold_out'
                  ? 'bg-surface text-warning shadow-2xs'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <EyeOff className="w-3.5 h-3.5 text-warning" />
              <span>Hết hàng</span>
              <span className="text-[10px] bg-warning-bg px-1.5 py-0.2 rounded font-mono text-warning">
                {soldOutCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('archived')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5',
                statusFilter === 'archived'
                  ? 'bg-surface text-error shadow-2xs'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <Archive className="w-3.5 h-3.5 text-error" />
              <span>Đã ẩn</span>
              <span className="text-[10px] bg-error-bg px-1.5 py-0.2 rounded font-mono text-error">
                {archivedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5',
                statusFilter === 'all'
                  ? 'bg-surface text-foreground shadow-2xs font-semibold'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <span>Tất cả</span>
              <span className="text-[10px] bg-surface-hover px-1.5 py-0.2 rounded font-mono text-muted">
                {allCount}
              </span>
            </button>
          </div>

          {/* Right: Search + Category Select + Sort Select + View Mode Switcher */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Tìm tên, SKU, #tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs rounded-lg"
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

            <div className="relative flex items-center">
              <Tag className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
              <select
                className="h-8 rounded-lg border border-border bg-surface pl-8 pr-7 text-xs text-foreground focus:outline-none focus:border-primary"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">{t('allCategories')} ({categoryOptions.length})</option>
                {allExistingCategories.filter((c) => categoryOptionCounts.has(c.id) || c.id === selectedCategory).map((c) => (
                  <option key={c.id || c.name} value={c.id}>
                    {c.name} ({categoryOptionCounts.get(c.id) || 0})
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-1.5 min-w-0">
              <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[11px] font-bold text-muted shrink-0">Tag:</span>
              <select
                value={selectedTags[0] || ''}
                onChange={(event) => setSelectedTags(event.target.value ? [event.target.value] : [])}
                className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:outline-none focus:border-primary max-w-36 sm:max-w-48"
              >
                <option value="">Tất cả tag ({tagOptions.length})</option>
                {availableTags.map((tag) => <option key={tag.name} value={tag.name}>{tag.name} ({tag.count})</option>)}
                {selectedTags[0] && !availableTags.some((tag) => tag.name.toLowerCase() === selectedTags[0].toLowerCase()) && (
                  <option value={selectedTags[0]}>{selectedTags[0]} (0)</option>
                )}
              </select>
            </label>

            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
              <select
                className="h-8 rounded-lg border border-border bg-surface pl-8 pr-6 text-xs text-foreground focus:outline-none focus:border-primary"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | 'default'
                      | 'name_asc'
                      | 'name_desc'
                      | 'price_asc'
                      | 'price_desc'
                      | 'stock_desc'
                      | 'sold_desc'
                      | 'tag_asc'
                  )
                }
                title="Sắp xếp danh sách sản phẩm"
              >
                <option value="default">Sắp xếp: Mặc định</option>
                <option value="name_asc">Tên (A → Z)</option>
                <option value="name_desc">Tên (Z → A)</option>
                <option value="price_asc">Giá (Thấp → Cao)</option>
                <option value="price_desc">Giá (Cao → Thấp)</option>
                <option value="stock_desc">Tồn quầy (Nhiều → Ít)</option>
                <option value="sold_desc">Bán chạy nhất</option>
                <option value="tag_asc">Nhóm theo Tag (A → Z)</option>
              </select>
            </div>


          </div>
        </div>


      </div>

      {/* Products Content */}
      {filteredProducts.length === 0 ? (
        <Card className="border-border shadow-xs rounded-xl">
          <CardContent className="p-12 text-center">
            <Package className="w-10 h-10 text-muted mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground">{t('noProducts')}</h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">{t('noProductsDesc')}</p>
            {editable && (
              <Button variant="outline" size="sm" className="mt-4 gap-1" onClick={openCreateModal}>
                <Plus className="w-3.5 h-3.5" />
                <span>{t('createButton')}</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
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
                className="border-border bg-surface rounded-xl overflow-hidden shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Top Visual Header */}
                  <div className="p-4 flex items-start gap-3.5">
                    <div
                      onClick={() => canManageThis && openEditModal(prod)}
                      className={cn(
                        'w-20 h-20 rounded-xl bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center relative',
                        canManageThis ? 'cursor-pointer hover:border-primary' : ''
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
                        <Package className="w-7 h-7 text-muted" />
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
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-background border border-border text-muted">
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

                      <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                        {prod.name}
                      </h3>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm font-extrabold text-primary font-mono">
                          {priceLabel}
                        </span>
                        {productVariants.length === 1 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted">
                            {productVariants[0].sku}
                          </span>
                        )}
                      </div>

                      {prod.tags && prod.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {prod.tags.map((tg) => {
                            const isTagActive = selectedTags.some(
                              (s) => s.toLowerCase() === tg.toLowerCase()
                            );
                            return (
                              <button
                                key={tg}
                                type="button"
                                onClick={() => toggleTagFilter(tg)}
                                className={cn(
                                  'text-[10px] px-1.5 py-0.2 rounded border transition-colors cursor-pointer',
                                  isTagActive
                                    ? 'bg-primary text-primary-foreground border-primary font-semibold dark:bg-amber-400 dark:border-amber-300'
                                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 dark:bg-surface-hover dark:text-amber-200 dark:border-amber-700 dark:hover:bg-surface-hover'
                                )}
                                title={`Bấm để lọc theo tag #${tg}`}
                              >
                                #{tg}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unified Stock Allocation Box */}
                  <div className="px-4 pb-3">
                    <div className="p-3 rounded-xl bg-background border border-border space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-muted">
                          Khả dụng bán tại quầy:
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-xs font-extrabold font-mono',
                            prodSummary.offlineAvailable <= 0
                              ? 'bg-error-bg text-error'
                              : prodSummary.offlineAvailable <= 10
                              ? 'bg-warning-bg text-warning'
                              : 'bg-success-bg text-primary'
                          )}
                        >
                          {prodSummary.offlineAvailable} / {prodSummary.total} món
                        </span>
                      </div>

                      {/* Segmented Stock Progress Bar */}
                      <div className="h-1.5 w-full rounded-full bg-surface-hover overflow-hidden flex">
                        <div
                          className="h-full bg-primary transition-all"
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
                          <span className="text-muted block">Tổng kho</span>
                          <span className="font-bold text-foreground font-mono">{prodSummary.total}</span>
                        </div>
                        <div>
                          <span className="text-[#1D4ED8] block">Online</span>
                          <span className="font-bold text-[#1D4ED8] font-mono">{prodSummary.online}</span>
                        </div>
                        <div>
                          <span className="text-warning block">Giữ VIP</span>
                          <span className="font-bold text-warning font-mono">{prodSummary.preord}</span>
                        </div>
                        <div>
                          <span className="text-muted block">Đã bán</span>
                          <span className="font-bold text-foreground font-mono">{prodSummary.offlineSold}</span>
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
                                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border bg-surface border-border',
                                canManageThis ? 'cursor-pointer hover:border-primary' : ''
                              )}
                              title={`${v.name} (${v.sku}) — Bấm để chỉnh nhanh tồn kho`}
                            >
                              <span className="font-semibold text-foreground">{v.name}</span>
                              <span
                                className={cn(
                                  'font-mono font-bold text-[10px] px-1 rounded',
                                  st.offlineAvailable <= 0
                                    ? 'bg-error-bg text-error'
                                    : 'bg-success-bg text-primary'
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
                <div className="px-4 py-2.5 bg-background border-t border-border flex items-center justify-between gap-2">
                  {editable && canManageThis ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-[11px] gap-1 bg-surface font-semibold"
                          onClick={() => openEditModal(prod)}
                        >
                          <Edit className="w-3 h-3 text-primary" />
                          <span>Sửa & Ảnh</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-[11px] gap-1 bg-surface font-semibold"
                          onClick={() => openQuickAdjustModal(prod)}
                        >
                          <SlidersHorizontal className="w-3 h-3 text-warning" />
                          <span>Chỉnh tồn</span>
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        {prod.is_deleted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] gap-1 text-primary"
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
                              className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
                              title={prod.is_active ? 'Tạm ẩn sản phẩm' : 'Hiện lại sản phẩm'}
                            >
                              {prod.is_active ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-primary" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod)}
                              className="p-1.5 rounded-md text-muted hover:text-error hover:bg-error-bg transition-colors"
                              title="Xóa / Ẩn sản phẩm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  ) : editable && isPartner ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted font-medium">
                      <Lock className="w-3 h-3 text-muted" />
                      <span>Kho hàng Admin (Chỉ đọc)</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted italic">Chỉ xem</span>
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
                <span className="text-[10px] text-muted dark:text-muted">
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
                  className="pr-9 text-xs bg-surface dark:bg-surface border-border dark:border-border text-foreground dark:text-foreground placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-muted dark:hover:text-foreground transition-colors"
                  title="Bấm để mở danh sách danh mục có sẵn"
                >
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isCategoryDropdownOpen ? 'rotate-180 text-primary' : ''
                    )}
                  />
                </button>
              </div>

              {isCategoryDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-surface dark:bg-surface border border-border dark:border-border rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto py-1 divide-y divide-border dark:divide-border">
                  {categoryInput.trim() &&
                    !allExistingCategories.some(
                      (c) => c.name.toLowerCase() === categoryInput.trim().toLowerCase()
                    ) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-primary dark:text-success hover:bg-warning-bg dark:hover:bg-success-bg/40 flex items-center gap-2 transition-colors"
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
                            'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-background dark:hover:bg-surface-hover transition-colors',
                            isSelected
                              ? 'bg-warning-bg/60 dark:bg-success-bg/40 font-bold text-primary dark:text-success'
                              : 'text-foreground dark:text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Tag className="w-3 h-3 text-muted shrink-0" />
                            <span className="truncate">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {c.count > 0 && (
                              <span className="text-[10px] text-muted dark:text-muted font-mono">
                                {c.count} SP
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-primary dark:text-success" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-xs text-muted dark:text-muted italic">
                      Không tìm thấy danh mục có sẵn. Danh mục mới sẽ được tạo khi lưu.
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-muted dark:text-muted">Gợi ý nhanh:</span>
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
                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                        : 'bg-background dark:bg-surface-hover text-[#555] dark:text-muted border-border dark:border-border hover:border-primary'
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
                    className="bg-surface-hover text-foreground font-semibold cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted mt-1">
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
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="Chất liệu, ghi chú đóng gói..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Multi-Tag Manager */}
          <div className="space-y-2 p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="prod-tags" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-primary" />
                <span>Nhãn phân loại (Tags — Gắn nhiều tag để dễ lọc &amp; sắp xếp)</span>
              </Label>
              <span className="text-[10px] text-muted">{productTags.length} tag</span>
            </div>

            {productTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {productTags.map((tg) => (
                  <span
                    key={tg}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground"
                  >
                    <span>#{tg}</span>
                    <button
                      type="button"
                      onClick={() => toggleFormTag(tg)}
                      className="hover:text-error-bg cursor-pointer"
                      title={`Gỡ tag #${tg}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                id="prod-tags"
                type="text"
                placeholder="Nhập tag rồi nhấn Enter hoặc dấu phẩy (VD: Limbus, Keychain, Hologram)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTagsFromInput(tagInput);
                  }
                }}
                className="h-8 text-xs bg-surface flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3 shrink-0 bg-surface"
                onClick={() => addTagsFromInput(tagInput)}
              >
                + Thêm tag
              </Button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-muted">Gợi ý nhanh:</span>
              {allExistingTags.slice(0, 10).map((tg) => {
                const isAdded = productTags.some(
                  (tItem) => tItem.toLowerCase() === tg.name.toLowerCase()
                );
                return (
                  <button
                    key={tg.name}
                    type="button"
                    onClick={() => toggleFormTag(tg.name)}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer',
                      isAdded
                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                        : 'bg-surface text-[#555] border-border hover:border-primary'
                    )}
                  >
                    #{tg.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Variants Form */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-bold text-foreground">
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
                const sold = allocations
                  .filter((allocation) => allocation.variant_id === v.id && !allocation.is_test)
                  .reduce((sum, allocation) => sum + (allocation.sold_quantity || 0), 0);
                const available = Math.max(0, (v.total_inventory || 0) - totalHeld - sold);

                return (
                  <div
                    key={idx}
                    className="p-3 bg-background rounded-lg border border-border space-y-2.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-5">
                        <span className="text-[10px] text-muted block mb-1 font-semibold">
                          Tên biến thể:
                        </span>
                        <Input
                          placeholder={t('variantNamePlaceholder')}
                          value={v.name}
                          onChange={(e) => updateVariantField(idx, 'name', e.target.value)}
                          className="h-8 text-xs bg-surface"
                          required
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-[10px] text-muted block mb-1 font-semibold">
                          Mã loại:
                        </span>
                        <Input
                          placeholder="Tự động nếu để trống"
                          value={v.sku}
                          onChange={(e) => updateVariantField(idx, 'sku', e.target.value)}
                          className="h-8 text-xs bg-surface font-mono uppercase"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-[10px] text-muted block mb-1 font-semibold">
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
                          className="h-8 text-xs bg-surface"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end sm:justify-center pt-1 sm:pt-4">
                        <button
                          type="button"
                          disabled={formVariants.length <= 1}
                          onClick={() => removeVariantField(idx)}
                          className="p-1.5 text-muted hover:text-error disabled:opacity-30"
                          title="Xóa biến thể"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border">
                      <div>
                        <span className="text-[10px] text-foreground block mb-1 font-semibold">
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
                          className="h-8 text-xs bg-surface"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-warning block mb-1 font-semibold">
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
                          className="h-8 text-xs bg-surface border-warning/40"
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
                          className="h-8 text-xs bg-surface border-[#3B82F6]/40"
                        />
                      </div>
                      <div className="bg-surface p-1.5 rounded border border-border flex flex-col justify-center text-center">
                        <span className="text-[9px] text-muted block">Khả dụng tại quầy</span>
                        <span
                          className={`text-xs font-bold font-mono ${
                            available <= 0 ? 'text-error' : 'text-primary'
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

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
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
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
              <div className="w-12 h-12 rounded-lg bg-surface border border-border overflow-hidden flex items-center justify-center shrink-0">
                {quickAdjustProduct.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={quickAdjustProduct.image_url}
                    alt={quickAdjustProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-5 h-5 text-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-foreground truncate">
                  {quickAdjustProduct.name}
                </h4>
                <p className="text-[11px] text-muted mt-0.5 flex items-center gap-1">
                  <Info className="w-3 h-3 text-primary shrink-0" />
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
                    className="p-3.5 bg-background rounded-xl border border-border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-foreground">{qv.name}</h4>
                        <span className="font-mono text-[10px] text-muted">
                          Mã: {qv.sku} • Đã bán tại quầy: {qv.offlineSold || 0}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted block">Còn bán tại quầy:</span>
                        <span
                          className={`text-xs font-extrabold font-mono ${
                            offlineAvailable <= 0 ? 'text-error' : 'text-primary'
                          }`}
                        >
                          {offlineAvailable} món
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-foreground">
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
                          value={qv.reserved === 0 ? '' : qv.reserved}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                            setQuickVariants((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, reserved: val } : item))
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
                          value={qv.online === 0 ? '' : qv.online}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value) || 0);
                            setQuickVariants((prev) =>
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
                onClick={() => setQuickAdjustProduct(null)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-primary hover:bg-[#27483B] text-primary-foreground font-bold"
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
