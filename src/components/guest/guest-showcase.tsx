'use client';

import * as React from 'react';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { usePreorderStore } from '@/stores/preorder-store';
import { useOrdersStore, normalizeVietQrBankId } from '@/stores/orders-store';
import { calculateVariantStock, VariantStockBreakdown } from '@/lib/stock-status';
import { formatCurrency } from '@/lib/utils';
import { filterRealEvents, filterRealBooths } from '@/lib/test-data-filter';
import {
  Product,
  ProductVariant,
  PreorderReservation,
  InventoryAllocation,
} from '@/types/database';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/stores/auth-store';
import {
  Package,
  Phone,
  MessageCircle,
  Ticket,
  CheckCircle2,
  Search,
  X,
  Sparkles,
  Users2,
  Bookmark,
  ArrowLeft,
  Calendar,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Copy,
  Check,
  Eye,
  LogIn,
} from 'lucide-react';

interface GuestBagItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  imageUrl?: string | null;
  collabPartner?: string | null;
  quantity: number;
  maxAvailable: number;
}

function getVariantAvailableStock(
  variant: ProductVariant | undefined,
  allocations: InventoryAllocation[]
): VariantStockBreakdown | null {
  if (!variant) return null;
  const vAllocs = allocations.filter((a) => a.variant_id === variant.id && !a.is_test);
  const vSoldOffline = vAllocs.reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
  const vAllocated = vAllocs.reduce((sum, a) => sum + (a.allocated_quantity || 0), 0);
  return calculateVariantStock(variant, vSoldOffline, vAllocated);
}

export function GuestShowcase() {
  const { previousUser, exitGuestPreview } = useAuthStore();
  const {
    products,
    variants,
    categories,
    events,
    booths,
    allocations,
    updateVariantPreorders,
  } = useDataStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { activeBankConfig } = useOrdersStore();
  const { preorders, createPreorder } = usePreorderStore();

  // Catalog filters & state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>('all');
  const [selectedEventId, setSelectedEventId] = React.useState<string>('all');
  const [sourceFilter, setSourceFilter] = React.useState<'all' | 'store' | 'collab'>('all');
  const [selectedVariantMap, setSelectedVariantMap] = React.useState<Record<string, string>>({});

  // Customer shopping/keep bag
  const [bag, setBag] = React.useState<GuestBagItem[]>([]);
  const [bagOpen, setBagOpen] = React.useState(false);
  const [bagTab, setBagTab] = React.useState<'pickup' | 'online'>('pickup');
  const [justAddedToast, setJustAddedToast] = React.useState<string | null>(null);

  // Modals
  const [detailProduct, setDetailProduct] = React.useState<Product | null>(null);
  const [detailQty, setDetailQty] = React.useState(1);
  const [onlineModalProduct, setOnlineModalProduct] = React.useState<Product | null>(null);
  const [myReservationsOpen, setMyReservationsOpen] = React.useState(false);
  const [lookupInput, setLookupInput] = React.useState('');
  const [confirmedReservation, setConfirmedReservation] =
    React.useState<PreorderReservation | null>(null);

  // Customer form states
  const [guestName, setGuestName] = React.useState('');
  const [guestPhone, setGuestPhone] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eventmate_guest_phone') || '';
    }
    return '';
  });
  const [selectedPickupBoothId, setSelectedPickupBoothId] = React.useState('');
  const [pickupTime, setPickupTime] = React.useState('Trước giờ khai mạc (10:00 - 14:00)');
  const [keepNotes, setKeepNotes] = React.useState('');
  const [isSubmittingKeep, setIsSubmittingKeep] = React.useState(false);
  const [copiedOrderText, setCopiedOrderText] = React.useState(false);

  const hasStaffPreviewSession = Boolean(previousUser && previousUser.role !== 'viewer');
  const storeName = activeWorkspace?.name || 'HikaruStore';
  const currency = activeWorkspace?.currency || 'VND';
  const hotlineDisplay = activeWorkspace?.phone || '0988.776.655';
  const hotlineHref = `tel:${hotlineDisplay.replace(/[^0-9]/g, '')}`;
  const zaloHref = activeWorkspace?.social_link || 'https://zalo.me/0988776655';

  // Real events & booths (filtered cleanly)
  const realEvents = React.useMemo(() => filterRealEvents(events), [events]);
  const realBooths = React.useMemo(() => filterRealBooths(booths), [booths]);

  React.useEffect(() => {
    if (realBooths.length > 0 && !selectedPickupBoothId) {
      setSelectedPickupBoothId(realBooths[0].id);
    }
  }, [realBooths, selectedPickupBoothId]);

  // Customer reservations matched by saved phone or manual search query
  const effectiveLookup = (lookupInput || guestPhone).trim().toLowerCase();
  const matchedReservations = React.useMemo(() => {
    if (!effectiveLookup) return [];
    return preorders.filter(
      (p) =>
        (p.customer_phone || '').toLowerCase().includes(effectiveLookup) ||
        p.code.toLowerCase().includes(effectiveLookup)
    );
  }, [preorders, effectiveLookup]);

  const savedPhoneReservations = React.useMemo(() => {
    const cleanPhone = guestPhone.trim().toLowerCase();
    if (!cleanPhone) return [];
    return preorders.filter((p) => (p.customer_phone || '').toLowerCase() === cleanPhone);
  }, [preorders, guestPhone]);

  // Active catalog items & counts
  const allActiveProducts = React.useMemo(
    () => products.filter((p) => !p.is_deleted && p.is_active),
    [products]
  );
  const storeProdsCount = React.useMemo(
    () => allActiveProducts.filter((p) => !p.collab_partner).length,
    [allActiveProducts]
  );
  const collabProdsCount = React.useMemo(
    () => allActiveProducts.filter((p) => Boolean(p.collab_partner)).length,
    [allActiveProducts]
  );

  const visibleProducts = React.useMemo(() => {
    return allActiveProducts.filter((p) => {
      if (sourceFilter === 'store' && p.collab_partner) return false;
      if (sourceFilter === 'collab' && !p.collab_partner) return false;
      if (selectedCategoryId !== 'all' && p.category_id !== selectedCategoryId) return false;
      if (selectedEventId !== 'all') {
        const prodVariants = variants.filter((v) => v.product_id === p.id);
        const hasEventAlloc = allocations.some(
          (a) => a.event_id === selectedEventId && prodVariants.some((v) => v.id === a.variant_id)
        );
        if (!hasEventAlloc) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        const prodVariants = variants.filter((v) => v.product_id === p.id);
        const matchVar = prodVariants.some((v) => v.name.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchVar) return false;
      }
      return true;
    });
  }, [
    allActiveProducts,
    variants,
    allocations,
    selectedCategoryId,
    selectedEventId,
    searchQuery,
    sourceFilter,
  ]);

  const bagCount = React.useMemo(() => bag.reduce((s, item) => s + item.quantity, 0), [bag]);
  const bagTotal = React.useMemo(
    () => bag.reduce((s, item) => s + item.unitPrice * item.quantity, 0),
    [bag]
  );

  const showToast = (msg: string) => {
    setJustAddedToast(msg);
    setTimeout(() => {
      setJustAddedToast((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const addToBag = (
    product: Product,
    variant: ProductVariant,
    qtyToAdd = 1,
    openBagImmediately = false
  ) => {
    const stock = getVariantAvailableStock(variant, allocations);
    const maxAvail = Math.max(0, stock?.offlineAvailable || 0);
    if (maxAvail <= 0) {
      showToast(`"${variant.name}" hiện tạm hết suất giữ tại quầy.`);
      return;
    }

    setBag((prev) => {
      const idx = prev.findIndex((i) => i.variantId === variant.id);
      if (idx >= 0) {
        const updated = [...prev];
        const nextQty = Math.min(maxAvail, updated[idx].quantity + qtyToAdd);
        updated[idx] = { ...updated[idx], quantity: nextQty, maxAvailable: maxAvail };
        return updated;
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          variantName: variant.name,
          unitPrice: variant.price,
          imageUrl: product.image_url,
          collabPartner: product.collab_partner,
          quantity: Math.min(maxAvail, qtyToAdd),
          maxAvailable: maxAvail,
        },
      ];
    });

    if (openBagImmediately) {
      setBagTab('pickup');
      setBagOpen(true);
    } else {
      showToast(`Đã thêm ${qtyToAdd}× ${product.name} (${variant.name}) vào giỏ`);
    }
  };

  const updateBagQty = (variantId: string, delta: number) => {
    setBag((prev) =>
      prev
        .map((item) => {
          if (item.variantId !== variantId) return item;
          const next = item.quantity + delta;
          if (next <= 0) return null;
          return { ...item, quantity: Math.min(item.maxAvailable, next) };
        })
        .filter((x): x is GuestBagItem => x !== null)
    );
  };

  const removeFromBag = (variantId: string) => {
    setBag((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const handleOpenProductDetail = (product: Product) => {
    setDetailProduct(product);
    setDetailQty(1);
  };

  const handleSubmitBagReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (bag.length === 0) return;
    if (!guestName.trim() || !guestPhone.trim()) {
      alert('Vui lòng nhập Họ tên và Số điện thoại để nhân viên đối soát tại quầy.');
      return;
    }

    const effectiveBooth = realBooths.find((b) => b.id === selectedPickupBoothId) || realBooths[0];
    const effectiveEvent =
      realEvents.find((ev) => ev.id === effectiveBooth?.event_id) || realEvents[0];

    setIsSubmittingKeep(true);
    try {
      const newReservation = createPreorder({
        workspace_id: activeWorkspace?.id || 'ws-hac-cam-studio',
        event_id: effectiveEvent?.id || 'general-store',
        booth_id: effectiveBooth?.id || 'general-booth',
        customer_name: guestName.trim(),
        customer_phone: guestPhone.trim(),
        preorder_type: 'online_preorder',
        status: 'pending_pickup',
        items: bag.map((item) => ({
          variant_id: item.variantId,
          variant_name: item.variantName,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
        total_amount: bagTotal,
        deposit_paid: 0,
        remaining_amount: bagTotal,
        notes: `Khách đặt giữ qua Storefront. Khung giờ nhận: ${pickupTime}. Ghi chú: ${
          keepNotes.trim() || 'Không'
        }`,
      });

      // Reserve online quantities per variant
      bag.forEach((item) => {
        const currentVar = variants.find((v) => v.id === item.variantId);
        updateVariantPreorders(item.variantId, {
          onlinePreorderQuantity: (currentVar?.online_preorder_quantity || 0) + item.quantity,
        });
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('eventmate_guest_phone', guestPhone.trim());
      }

      setBag([]);
      setKeepNotes('');
      setBagOpen(false);
      setConfirmedReservation(newReservation);
    } catch {
      alert('Không thể tạo phiếu giữ đồ lúc này. Vui lòng thử lại.');
    } finally {
      setIsSubmittingKeep(false);
    }
  };

  const buildOnlineOrderSummary = () => {
    const lines = bag.map(
      (item, idx) =>
        `${idx + 1}. ${item.productName} (${item.variantName}) x${item.quantity} = ${formatCurrency(
          item.unitPrice * item.quantity,
          currency
        )}`
    );
    return [
      `ĐƠN ĐẶT ONLINE - ${storeName}`,
      ...lines,
      `Tổng tạm tính: ${formatCurrency(bagTotal, currency)}`,
      guestName.trim() ? `Khách: ${guestName.trim()}` : '',
      guestPhone.trim() ? `SĐT: ${guestPhone.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleCopyOrderSummary = () => {
    const text = buildOnlineOrderSummary();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedOrderText(true);
        setTimeout(() => setCopiedOrderText(false), 2000);
      });
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategoryId !== 'all' ||
    selectedEventId !== 'all' ||
    sourceFilter !== 'all';

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-neutral-950 text-[#202124] dark:text-neutral-100 flex flex-col font-sans transition-colors">
      {/* Staff Preview Bar (ONLY rendered when Admin/Staff is previewing) */}
      {hasStaffPreviewSession && (
        <div className="bg-[#18222F] text-white px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-50 border-b border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold truncate">
              Đang xem trước Giao diện Khách hàng
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              exitGuestPreview();
              window.location.href = '/dashboard';
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#315C4C] hover:bg-[#284A3D] text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trở lại Quản trị</span>
          </button>
        </div>
      )}

      {/* Storefront Header */}
      <header
        className={`sticky ${
          hasStaffPreviewSession ? 'top-[37px]' : 'top-0'
        } z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-[#E8E8E5] dark:border-neutral-800`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-left cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt={`${storeName} Logo`}
              className="h-10 sm:h-12 w-auto max-w-[96px] object-contain shrink-0"
            />
            <div className="min-w-0">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-[#202124] dark:text-neutral-100 block truncate">
                {storeName}
              </span>
              <span className="text-[11px] sm:text-xs text-[#737373] dark:text-neutral-400 block truncate">
                Official Merchandise Store
              </span>
            </div>
          </button>

          {/* Customer Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={hotlineHref}
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[6px] bg-[#F7F7F5] dark:bg-neutral-800 border border-[#E8E8E5] dark:border-neutral-700 hover:border-[#315C4C] text-[#202124] dark:text-neutral-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#315C4C] dark:text-emerald-400" />
              <span>{hotlineDisplay}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setLookupInput(guestPhone);
                setMyReservationsOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-[6px] text-xs font-semibold border border-[#E8E8E5] dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#315C4C] text-[#202124] dark:text-neutral-200 transition-colors cursor-pointer"
              title="Tra cứu phiếu giữ đồ bằng số điện thoại hoặc mã vé"
            >
              <Ticket className="w-4 h-4 text-[#B7791F]" />
              <span className="hidden sm:inline">Tra cứu giữ đồ</span>
              {savedPhoneReservations.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF7EC] dark:bg-amber-950 text-[#B7791F] dark:text-amber-300 border border-[#B7791F]/30">
                  {savedPhoneReservations.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setBagOpen(true)}
              className="relative inline-flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-xs font-bold bg-[#315C4C] hover:bg-[#284A3D] text-white transition-colors shadow-xs cursor-pointer"
              title="Mở giỏ hàng & đăng ký giữ đồ"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden xs:inline">Giỏ giữ đồ</span>
              {bagCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-[#315C4C]">
                  {bagCount}
                </span>
              )}
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Toast feedback when adding to bag */}
      {justAddedToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#202124] dark:bg-emerald-700 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white shrink-0" />
          <span>{justAddedToast}</span>
          {bagCount > 0 && (
            <button
              type="button"
              onClick={() => setBagOpen(true)}
              className="underline font-bold text-emerald-300 dark:text-white ml-1 cursor-pointer"
            >
              Xem giỏ ({bagCount})
            </button>
          )}
        </div>
      )}

      {/* Main Storefront Catalog */}
      <main
        id="catalog-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-5"
      >
        {/* Upcoming/Active Events & Pickup Locations Strip */}
        {realEvents.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-[10px] border border-[#E8E8E5] dark:border-neutral-800 px-3.5 py-2.5 shadow-2xs flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#5F6368] dark:text-neutral-400 flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#315C4C] dark:text-emerald-400" />
              <span>Sự kiện có quầy nhận hàng:</span>
            </span>
            {realEvents.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() =>
                  setSelectedEventId((prev) => (prev === ev.id ? 'all' : ev.id))
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  selectedEventId === ev.id
                    ? 'bg-[#315C4C] text-white border-[#315C4C]'
                    : 'bg-[#F7F7F5] dark:bg-neutral-800 text-[#202124] dark:text-neutral-200 border-[#E8E8E5] dark:border-neutral-700 hover:border-[#315C4C]'
                }`}
              >
                <MapPin className="w-3 h-3 opacity-80" />
                <span>{ev.name}</span>
              </button>
            ))}
          </div>
        )}
        {/* Filter & Search Toolbar */}
        {allActiveProducts.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-[10px] border border-[#E8E8E5] dark:border-neutral-800 p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Box & Event Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên sản phẩm, nhân vật, mẫu..."
                    className="pl-9 pr-8 h-9.5 text-xs sm:text-sm bg-[#F7F7F5] dark:bg-neutral-800 border-[#E8E8E5] dark:border-neutral-700"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#202124] dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {realEvents.length > 1 && (
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="h-9.5 rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700 bg-[#F7F7F5] dark:bg-neutral-800 px-3 text-xs font-semibold text-[#202124] dark:text-neutral-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả sự kiện</option>
                    {realEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Origin Toggle (only shown when store has collab items too) */}
              {collabProdsCount > 0 && (
                <div className="flex items-center gap-1.5 bg-[#F7F7F5] dark:bg-neutral-800 p-1 rounded-[8px] border border-[#E8E8E5] dark:border-neutral-700 self-start">
                  <button
                    type="button"
                    onClick={() => setSourceFilter('all')}
                    className={`px-2.5 py-1 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                      sourceFilter === 'all'
                        ? 'bg-white dark:bg-neutral-700 text-[#202124] dark:text-white shadow-2xs'
                        : 'text-[#737373] hover:text-[#202124] dark:hover:text-neutral-200'
                    }`}
                  >
                    Tất cả ({allActiveProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceFilter('store')}
                    className={`px-2.5 py-1 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                      sourceFilter === 'store'
                        ? 'bg-[#315C4C] text-white shadow-2xs'
                        : 'text-[#737373] hover:text-[#202124] dark:hover:text-neutral-200'
                    }`}
                  >
                    Chính hãng ({storeProdsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceFilter('collab')}
                    className={`px-2.5 py-1 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                      sourceFilter === 'collab'
                        ? 'bg-[#B7791F] text-white shadow-2xs'
                        : 'text-[#737373] hover:text-[#202124] dark:hover:text-neutral-200'
                    }`}
                  >
                    Collab ({collabProdsCount})
                  </button>
                </div>
              )}
            </div>

            {/* Category Chips */}
            {categories.some((c) => allActiveProducts.some((p) => p.category_id === c.id)) && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-1 border-t border-[#F0F0ED] dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                    selectedCategoryId === 'all'
                      ? 'bg-[#315C4C] text-white shadow-2xs'
                      : 'bg-[#F7F7F5] dark:bg-neutral-800 text-[#5F6368] dark:text-neutral-300 hover:bg-[#EDEDEA] dark:hover:bg-neutral-700'
                  }`}
                >
                  Tất cả danh mục ({allActiveProducts.length})
                </button>
                {categories.map((cat) => {
                  const count = allActiveProducts.filter((p) => p.category_id === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                        selectedCategoryId === cat.id
                          ? 'bg-[#315C4C] text-white shadow-2xs'
                          : 'bg-[#F7F7F5] dark:bg-neutral-800 text-[#5F6368] dark:text-neutral-300 hover:bg-[#EDEDEA] dark:hover:bg-neutral-700'
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Storefront Empty States vs Product Grid */}
        {allActiveProducts.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white dark:bg-neutral-900 rounded-[12px] border border-[#E8E8E5] dark:border-neutral-800 space-y-4 max-w-2xl mx-auto shadow-2xs">
            <div className="w-16 h-16 rounded-2xl bg-[#EAF4EE] dark:bg-emerald-950/60 text-[#2F7D55] dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#202124] dark:text-neutral-100">
                Gian hàng đang cập nhật bộ sưu tập mới
              </h2>
              <p className="text-xs sm:text-sm text-[#737373] dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                Các mẫu merchandise sắp mở bán đang được chuẩn bị lên kệ. Bạn có thể liên hệ trực
                tiếp qua Zalo hoặc Hotline để đặt hàng trước hoặc nhận thông báo sớm nhất.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={zaloHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-[8px] bg-[#315C4C] hover:bg-[#284A3D] text-white text-xs sm:text-sm font-bold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Liên hệ Zalo: {hotlineDisplay}</span>
              </a>
              <a
                href={hotlineHref}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-[8px] border border-[#E8E8E5] dark:border-neutral-700 bg-[#F7F7F5] dark:bg-neutral-800 text-[#202124] dark:text-neutral-100 text-xs sm:text-sm font-semibold hover:border-[#315C4C] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#315C4C] dark:text-emerald-400" />
                <span>Gọi Hotline</span>
              </a>
            </div>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-[12px] border border-[#E8E8E5] dark:border-neutral-800 space-y-3">
            <Package className="w-12 h-12 text-[#9E9E9C] mx-auto" />
            <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-neutral-200">
              Không tìm thấy sản phẩm phù hợp
            </h3>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-neutral-400">
              Hãy thử từ khóa khác hoặc đặt lại bộ lọc để xem toàn bộ sản phẩm.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryId('all');
                  setSelectedEventId('all');
                  setSourceFilter('all');
                }}
              >
                Xem tất cả sản phẩm ({allActiveProducts.length})
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {visibleProducts.map((prod) => {
              const prodVariants = variants.filter((v) => v.product_id === prod.id);
              const activeVarId = selectedVariantMap[prod.id] || prodVariants[0]?.id;
              const activeVariant =
                prodVariants.find((v) => v.id === activeVarId) || prodVariants[0];
              const stock = getVariantAvailableStock(activeVariant, allocations);
              const availCount = stock?.offlineAvailable || 0;
              const isAvailable = availCount > 0;
              const isLowStock = availCount > 0 && availCount <= 10;
              const category = categories.find((c) => c.id === prod.category_id);

              const maxInlineVariants = 3;
              const shownVariants = prodVariants.slice(0, maxInlineVariants);
              const hiddenVariantsCount = Math.max(0, prodVariants.length - maxInlineVariants);

              return (
                <article
                  key={prod.id}
                  className="rounded-[12px] bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-800 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#315C4C]/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Clickable Product Image */}
                    <div
                      onClick={() => handleOpenProductDetail(prod)}
                      className="relative aspect-[4/3] bg-[#F7F7F5] dark:bg-neutral-800/80 overflow-hidden flex items-center justify-center cursor-pointer"
                    >
                      {prod.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-[#9E9E9C]" />
                      )}

                      {/* Single Clean Stock Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        {isAvailable ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs ${
                              isLowStock ? 'bg-[#D97706]' : 'bg-[#2F7D55]'
                            }`}
                          >
                            {isLowStock ? `Còn ${availCount}` : `Còn hàng (${availCount})`}
                          </span>
                        ) : (stock?.online || 0) > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#B7791F] text-white shadow-xs">
                            Đã giữ hết tại quầy
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-700/90 text-white shadow-xs">
                            Tạm hết hàng
                          </span>
                        )}
                      </div>

                      {/* Subtle Quick View Overlay on Hover */}
                      <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 text-[#202124] text-[10px] font-bold">
                          <Eye className="w-3 h-3" />
                          Xem chi tiết
                        </span>
                      </div>
                    </div>

                    {/* Product Body */}
                    <div className="p-4 space-y-2.5">
                      {/* Single Metadata Row (Category & optional Collab tag) */}
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-[#315C4C] dark:text-emerald-400 truncate">
                          {category?.name || 'Merchandise'}
                        </span>
                        {prod.collab_partner && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FEF7EC] dark:bg-amber-950/60 text-[#8C5D17] dark:text-amber-300 font-bold shrink-0">
                            <Users2 className="w-3 h-3" />
                            <span>Collab: {prod.collab_partner}</span>
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => handleOpenProductDetail(prod)}
                        className="font-bold text-sm sm:text-[15px] text-[#202124] dark:text-neutral-100 line-clamp-2 min-h-[2.5rem] leading-snug cursor-pointer hover:text-[#315C4C] dark:hover:text-emerald-400 transition-colors"
                      >
                        {prod.name}
                      </h3>

                      {/* Price */}
                      <div className="flex items-baseline justify-between">
                        <span className="text-base sm:text-lg font-extrabold text-[#315C4C] dark:text-emerald-400">
                          {formatCurrency(activeVariant?.price || 0, currency)}
                        </span>
                        {prodVariants.length > 1 && (
                          <span className="text-[11px] text-[#737373] dark:text-neutral-400">
                            {prodVariants.length} mẫu
                          </span>
                        )}
                      </div>

                      {/* Compact Variant Pills */}
                      {prodVariants.length > 1 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {shownVariants.map((v) => {
                            const isSelected = v.id === activeVarId;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() =>
                                  setSelectedVariantMap({
                                    ...selectedVariantMap,
                                    [prod.id]: v.id,
                                  })
                                }
                                className={`px-2 py-1 rounded-[5px] text-[11px] font-semibold transition-colors max-w-[140px] truncate cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#315C4C] text-white shadow-2xs'
                                    : 'bg-[#F0F0ED] dark:bg-neutral-800 text-[#202124] dark:text-neutral-300 hover:bg-[#E4E4E0] dark:hover:bg-neutral-700'
                                }`}
                                title={v.name}
                              >
                                {v.name}
                              </button>
                            );
                          })}
                          {hiddenVariantsCount > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenProductDetail(prod)}
                              className="px-2 py-1 rounded-[5px] text-[11px] font-semibold bg-[#EAF4EE] dark:bg-emerald-950/60 text-[#2F7D55] dark:text-emerald-300 hover:underline cursor-pointer"
                            >
                              +{hiddenVariantsCount} mẫu khác
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOnlineModalProduct(prod)}
                      className="h-9 text-xs font-semibold gap-1 border-[#E8E8E5] dark:border-neutral-700 hover:border-[#315C4C] text-[#202124] dark:text-neutral-200"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#315C4C] dark:text-emerald-400" />
                      <span>Mua Online</span>
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={!activeVariant || !isAvailable}
                      onClick={() =>
                        activeVariant && addToBag(prod, activeVariant, 1, false)
                      }
                      className="h-9 text-xs font-bold gap-1 bg-[#315C4C] hover:bg-[#254639] text-white disabled:opacity-50"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{isAvailable ? 'Giữ đồ ngay' : 'Hết hàng'}</span>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal 1: Chi Tiết Sản Phẩm */}
      {detailProduct && (
        <Modal
          isOpen={!!detailProduct}
          onClose={() => setDetailProduct(null)}
          title={detailProduct.name}
          maxWidth="2xl"
        >
          {(() => {
            const pVariants = variants.filter((v) => v.product_id === detailProduct.id);
            const activeVarId = selectedVariantMap[detailProduct.id] || pVariants[0]?.id;
            const activeVariant =
              pVariants.find((v) => v.id === activeVarId) || pVariants[0];
            const stock = getVariantAvailableStock(activeVariant, allocations);
            const availCount = stock?.offlineAvailable || 0;
            const category = categories.find((c) => c.id === detailProduct.category_id);

            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Product Visual */}
                <div className="md:col-span-5">
                  <div className="aspect-square rounded-[10px] bg-[#F7F7F5] dark:bg-neutral-800 border border-[#E8E8E5] dark:border-neutral-700 overflow-hidden flex items-center justify-center">
                    {detailProduct.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={detailProduct.image_url}
                        alt={detailProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-[#9E9E9C]" />
                    )}
                  </div>
                </div>

                {/* Details & Selection */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {category && (
                        <Badge variant="neutral">{category.name}</Badge>
                      )}
                      {detailProduct.collab_partner ? (
                        <Badge variant="warning">
                          Collab: {detailProduct.collab_partner}
                        </Badge>
                      ) : (
                        <Badge variant="success">Chính hãng {storeName}</Badge>
                      )}
                    </div>

                    <div>
                      <span className="text-2xl font-extrabold text-[#315C4C] dark:text-emerald-400">
                        {formatCurrency(activeVariant?.price || 0, currency)}
                      </span>
                      <p className="text-xs mt-1 text-[#737373] dark:text-neutral-400">
                        Tình trạng:{' '}
                        <strong
                          className={
                            availCount > 0
                              ? 'text-[#2F7D55] dark:text-emerald-400'
                              : 'text-[#C44536] dark:text-red-400'
                          }
                        >
                          {availCount > 0 ? `Còn ${availCount} sản phẩm` : 'Tạm hết hàng'}
                        </strong>
                      </p>
                    </div>

                    {detailProduct.description && (
                      <p className="text-xs sm:text-sm text-[#5F6368] dark:text-neutral-300 leading-relaxed bg-[#F7F7F5] dark:bg-neutral-800/70 p-3 rounded-[8px]">
                        {detailProduct.description}
                      </p>
                    )}

                    {/* Full Variants List */}
                    {pVariants.length > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Chọn mẫu / phân loại:</Label>
                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                          {pVariants.map((v) => {
                            const vStock = getVariantAvailableStock(v, allocations);
                            const vAvail = vStock?.offlineAvailable || 0;
                            const isSelected = v.id === activeVarId;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                  setSelectedVariantMap({
                                    ...selectedVariantMap,
                                    [detailProduct.id]: v.id,
                                  });
                                  setDetailQty(1);
                                }}
                                className={`px-2.5 py-1.5 rounded-[6px] text-xs font-semibold border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#315C4C] text-white border-[#315C4C]'
                                    : vAvail > 0
                                    ? 'bg-white dark:bg-neutral-800 text-[#202124] dark:text-neutral-200 border-[#E8E8E5] dark:border-neutral-700 hover:border-[#315C4C]'
                                    : 'bg-neutral-100 dark:bg-neutral-900 text-[#9E9E9C] border-dashed border-[#E8E8E5] dark:border-neutral-800'
                                }`}
                              >
                                {v.name} ({vAvail})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quantity Stepper */}
                    {availCount > 0 && (
                      <div className="flex items-center gap-3 pt-1">
                        <Label className="text-xs font-bold">Số lượng:</Label>
                        <div className="inline-flex items-center border border-[#E8E8E5] dark:border-neutral-700 rounded-[6px] bg-white dark:bg-neutral-800 p-0.5">
                          <button
                            type="button"
                            onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                            disabled={detailQty <= 1}
                            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F0F0ED] dark:hover:bg-neutral-700 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-sm font-bold">{detailQty}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDetailQty(Math.min(availCount, detailQty + 1))
                            }
                            disabled={detailQty >= availCount}
                            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F0F0ED] dark:hover:bg-neutral-700 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-[#F0F0ED] dark:border-neutral-800">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOnlineModalProduct(detailProduct);
                        setDetailProduct(null);
                      }}
                      className="h-10 text-xs font-semibold gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4 text-[#315C4C] dark:text-emerald-400" />
                      <span>Đặt Ship COD Online</span>
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      disabled={!activeVariant || availCount <= 0}
                      onClick={() => {
                        if (!activeVariant) return;
                        addToBag(detailProduct, activeVariant, detailQty, true);
                        setDetailProduct(null);
                      }}
                      className="h-10 text-xs font-bold gap-1.5 bg-[#315C4C] hover:bg-[#254639] text-white"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {availCount > 0 ? 'Thêm & Đặt Giữ Đồ' : 'Tạm hết hàng'}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Modal 2: Giỏ Giữ Đồ & Đặt Hàng */}
      <Modal
        isOpen={bagOpen}
        onClose={() => setBagOpen(false)}
        title="Giỏ Hàng & Đặt Giữ Đồ"
        description={
          bag.length > 0
            ? `${bagCount} sản phẩm — Tạm tính: ${formatCurrency(bagTotal, currency)}`
            : 'Chọn sản phẩm để đặt giữ nhận tại quầy hoặc đặt ship COD online.'
        }
        maxWidth="lg"
      >
        {bag.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-[#9E9E9C] mx-auto" />
            <p className="text-sm font-bold text-[#202124] dark:text-neutral-200">
              Giỏ giữ đồ của bạn đang trống
            </p>
            <p className="text-xs text-[#737373]">
              Nhấn &ldquo;Giữ đồ ngay&rdquo; trên bất kỳ sản phẩm nào để gom chung thành một vé giữ đồ.
            </p>
            <Button variant="outline" size="sm" onClick={() => setBagOpen(false)}>
              Tiếp tục xem sản phẩm
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {bag.map((item) => (
                <div
                  key={item.variantId}
                  className="p-2.5 rounded-[8px] bg-[#F7F7F5] dark:bg-neutral-800 border border-[#E8E8E5] dark:border-neutral-700 flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-[#9E9E9C]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate text-[#202124] dark:text-neutral-100">
                      {item.productName}
                    </p>
                    <p className="text-[11px] text-[#737373] dark:text-neutral-400 truncate">
                      {item.variantName} • {formatCurrency(item.unitPrice, currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateBagQty(item.variantId, -1)}
                      className="w-7 h-7 rounded border border-[#E8E8E5] dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center hover:bg-[#EDEDEA] cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateBagQty(item.variantId, 1)}
                      disabled={item.quantity >= item.maxAvailable}
                      className="w-7 h-7 rounded border border-[#E8E8E5] dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center hover:bg-[#EDEDEA] disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromBag(item.variantId)}
                      className="w-7 h-7 rounded text-[#C44536] hover:bg-[#FDF1F0] dark:hover:bg-red-950/40 flex items-center justify-center cursor-pointer ml-1"
                      title="Xóa khỏi giỏ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mode Switch: Pickup at Booth vs Online Ship */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[8px] bg-[#F7F7F5] dark:bg-neutral-800 border border-[#E8E8E5] dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setBagTab('pickup')}
                className={`py-2 px-3 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                  bagTab === 'pickup'
                    ? 'bg-[#315C4C] text-white shadow-2xs'
                    : 'text-[#5F6368] dark:text-neutral-300 hover:text-[#202124]'
                }`}
              >
                🎟️ Giữ đồ nhận tại quầy (0đ)
              </button>
              <button
                type="button"
                onClick={() => setBagTab('online')}
                className={`py-2 px-3 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                  bagTab === 'online'
                    ? 'bg-[#315C4C] text-white shadow-2xs'
                    : 'text-[#5F6368] dark:text-neutral-300 hover:text-[#202124]'
                }`}
              >
                🚚 Đặt Ship COD / Chuyển khoản
              </button>
            </div>

            {bagTab === 'pickup' ? (
              <form onSubmit={handleSubmitBagReservation} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="bag-guest-name" required className="text-xs">
                      Họ và tên:
                    </Label>
                    <Input
                      id="bag-guest-name"
                      required
                      placeholder="VD: Nguyễn Thùy Linh"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bag-guest-phone" required className="text-xs">
                      Số điện thoại:
                    </Label>
                    <Input
                      id="bag-guest-phone"
                      required
                      type="tel"
                      placeholder="VD: 0912345678"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                {realBooths.length > 0 && (
                  <div className="space-y-1">
                    <Label htmlFor="bag-pickup-booth" className="text-xs">
                      Quầy & Sự kiện nhận hàng:
                    </Label>
                    <select
                      id="bag-pickup-booth"
                      value={selectedPickupBoothId}
                      onChange={(e) => setSelectedPickupBoothId(e.target.value)}
                      className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs text-[#202124] dark:text-neutral-100 focus:outline-none focus:border-[#315C4C]"
                    >
                      {realBooths.map((bth) => {
                        const ev = realEvents.find((e) => e.id === bth.event_id);
                        return (
                          <option key={bth.id} value={bth.id}>
                            {bth.name} — {ev?.name || 'Sự kiện'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Khung giờ dự kiến đến:</Label>
                    <Input
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      placeholder="VD: 15:00 chiều thứ 7"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ghi chú (tùy chọn):</Label>
                    <Input
                      value={keepNotes}
                      onChange={(e) => setKeepNotes(e.target.value)}
                      placeholder="Ghi chú thêm cho quầy..."
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-[#FEF7EC] dark:bg-amber-950/30 rounded-[6px] border border-[#B7791F]/30 text-[11px] text-[#8C5D17] dark:text-amber-300">
                  Không cần thanh toán trước. Bạn đến quầy đọc mã vé hoặc SĐT để kiểm tra và thanh
                  toán khi nhận hàng.
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8E8E5] dark:border-neutral-800">
                  <div>
                    <span className="text-[11px] text-[#737373] block">Tổng thanh toán tại quầy</span>
                    <span className="text-base font-extrabold text-[#315C4C] dark:text-emerald-400">
                      {formatCurrency(bagTotal, currency)}
                    </span>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmittingKeep}
                    className="h-10 px-5 bg-[#315C4C] hover:bg-[#254639] text-white font-bold text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    <span>Tạo Vé Giữ Đồ</span>
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-[8px] bg-[#F7F7F5] dark:bg-neutral-800 border border-[#E8E8E5] dark:border-neutral-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#202124] dark:text-neutral-100">
                      Tóm tắt đơn gửi Zalo / Fanpage
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOrderSummary}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-700 font-semibold hover:border-[#315C4C] cursor-pointer"
                    >
                      {copiedOrderText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#2F7D55]" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép đơn</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-[11px] text-[#5F6368] dark:text-neutral-300 bg-white dark:bg-neutral-900 p-2.5 rounded border border-[#E8E8E5] dark:border-neutral-700">
                    {buildOnlineOrderSummary()}
                  </pre>
                </div>

                {/* VietQR preview */}
                <div className="p-3 rounded-[8px] bg-[#F7F7F5] dark:bg-neutral-800 border border-[#E8E8E5] dark:border-neutral-700 flex items-center gap-3">
                  <div className="w-20 h-20 bg-white p-1 rounded border border-[#E8E8E5] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.vietqr.io/image/${normalizeVietQrBankId(activeBankConfig.bankId)}-${activeBankConfig.accountNo}-compact2.png?amount=${bagTotal}&addInfo=${encodeURIComponent(
                        'MUAONL'
                      )}&accountName=${encodeURIComponent(activeBankConfig.accountName)}`}
                      alt="VietQR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <p className="font-bold text-[#202124] dark:text-neutral-100">
                      Chuyển khoản {activeBankConfig.bankId}
                    </p>
                    <p className="font-mono font-bold text-[#315C4C] dark:text-emerald-400">
                      {activeBankConfig.accountNo}
                    </p>
                    <p>{activeBankConfig.accountName}</p>
                    <p className="text-[#737373]">Hoặc gửi tin nhắn để ship COD tận nhà.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={zaloHref}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 rounded-[8px] bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Gửi qua Zalo</span>
                  </a>
                  <a
                    href={hotlineHref}
                    className="h-10 rounded-[8px] bg-[#315C4C] hover:bg-[#254639] text-white font-bold flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Gọi {hotlineDisplay}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal 3: Vé Giữ Đồ Thành Công */}
      {confirmedReservation && (
        <Modal
          isOpen={!!confirmedReservation}
          onClose={() => setConfirmedReservation(null)}
          title="Đăng Ký Giữ Đồ Thành Công"
          description="Lưu lại mã vé hoặc chụp màn hình QR để quầy giao hàng nhanh nhất."
          maxWidth="sm"
        >
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EAF4EE] dark:bg-emerald-950/60 text-[#2F7D55] dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Ticket className="w-6 h-6" />
            </div>

            <div className="p-4 rounded-[10px] bg-[#F7F7F5] dark:bg-neutral-800 border-2 border-dashed border-[#315C4C]/40 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#737373] tracking-widest block">
                  Mã vé giữ đồ
                </span>
                <span className="text-2xl font-black font-mono text-[#315C4C] dark:text-emerald-400 tracking-wider">
                  {confirmedReservation.code}
                </span>
              </div>

              <div className="w-32 h-32 mx-auto bg-white p-2 rounded-[8px] border border-[#E8E8E5] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    confirmedReservation.code
                  )}`}
                  alt="QR Ticket"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-xs text-left space-y-1.5 pt-2 border-t border-[#E8E8E5] dark:border-neutral-700">
                <div className="flex justify-between gap-2">
                  <span className="text-[#737373] shrink-0">Khách hàng:</span>
                  <span className="font-bold text-right">{confirmedReservation.customer_name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-[#737373] shrink-0">Số điện thoại:</span>
                  <span className="font-mono font-bold">
                    {confirmedReservation.customer_phone}
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-[#737373] block">Sản phẩm đã giữ:</span>
                  <ul className="space-y-0.5 text-[#202124] dark:text-neutral-200 font-semibold">
                    {confirmedReservation.items.map((item, idx) => (
                      <li key={`${item.variant_id}-${idx}`}>
                        • {item.quantity}× {item.product_name} ({item.variant_name})
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-[#E8E8E5] dark:border-neutral-700">
                  <span className="text-[#737373]">Thanh toán tại quầy:</span>
                  <span className="font-extrabold text-[#315C4C] dark:text-emerald-400">
                    {formatCurrency(confirmedReservation.total_amount, currency)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() => setConfirmedReservation(null)}
              className="w-full h-10 bg-[#315C4C] hover:bg-[#254639] text-white font-bold text-xs"
            >
              Hoàn tất
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal 4: Liên Hệ Mua Online (Single Product) */}
      {onlineModalProduct && (
        <Modal
          isOpen={!!onlineModalProduct}
          onClose={() => setOnlineModalProduct(null)}
          title={`Đặt Mua Online — ${onlineModalProduct.name}`}
          description="Liên hệ trực tiếp để đặt ship COD tận nơi trên toàn quốc hoặc chuyển khoản."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={hotlineHref}
                className="p-3.5 rounded-[8px] border border-[#315C4C]/30 bg-[#EBF1EE] dark:bg-emerald-950/30 flex items-center gap-3 hover:border-[#315C4C] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#315C4C] text-white flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-[#737373] uppercase font-bold">Gọi Hotline</p>
                  <p className="text-sm font-extrabold text-[#315C4C] dark:text-emerald-400">
                    {hotlineDisplay}
                  </p>
                </div>
              </a>

              <a
                href={zaloHref}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-[8px] border border-[#1D4ED8]/30 bg-[#EFF6FF] dark:bg-blue-950/30 flex items-center gap-3 hover:border-[#1D4ED8] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-[#737373] uppercase font-bold">Nhắn Zalo</p>
                  <p className="text-sm font-extrabold text-[#1D4ED8] dark:text-blue-400">
                    {hotlineDisplay}
                  </p>
                </div>
              </a>
            </div>

            <div className="p-3.5 bg-[#F7F7F5] dark:bg-neutral-800 rounded-[8px] border border-[#E8E8E5] dark:border-neutral-700 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 bg-white p-1 rounded border border-[#E8E8E5] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.vietqr.io/image/${normalizeVietQrBankId(activeBankConfig.bankId)}-${activeBankConfig.accountNo}-compact2.png?amount=0&addInfo=MUAONL&accountName=${encodeURIComponent(
                    activeBankConfig.accountName
                  )}`}
                  alt="VietQR Bank"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-bold text-[#202124] dark:text-neutral-200">
                  Thông tin chuyển khoản chính thức
                </p>
                <p className="text-[#737373] dark:text-neutral-300">
                  Ngân hàng: <strong>{activeBankConfig.bankId}</strong> • STK:{' '}
                  <strong className="font-mono text-[#202124] dark:text-white">
                    {activeBankConfig.accountNo}
                  </strong>
                </p>
                <p className="text-[#737373] dark:text-neutral-300">
                  Chủ TK: <strong>{activeBankConfig.accountName}</strong>
                </p>
                <p className="text-[11px] text-[#8C5D17] dark:text-amber-300 bg-[#FEF7EC] dark:bg-amber-950/40 px-2 py-1 rounded border border-[#B7791F]/30">
                  Nội dung CK: <strong>ONL [Tên] [SĐT]</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOnlineModalProduct(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 5: Tra Cứu Vé Giữ Đồ */}
      <Modal
        isOpen={myReservationsOpen}
        onClose={() => setMyReservationsOpen(false)}
        title="Tra Cứu Phiếu Giữ Đồ"
        description="Nhập số điện thoại hoặc mã vé giữ đồ (VD: ONL-1234) để xem lại trạng thái."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="Nhập SĐT hoặc mã vé..."
              className="pl-9 h-9.5 text-xs"
            />
          </div>

          <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
            {!effectiveLookup ? (
              <p className="text-center text-xs text-[#737373] py-6">
                Nhập số điện thoại bạn đã dùng khi giữ đồ để tra cứu.
              </p>
            ) : matchedReservations.length === 0 ? (
              <p className="text-center text-xs text-[#737373] py-6">
                Không tìm thấy phiếu giữ đồ nào khớp với &ldquo;{lookupInput || guestPhone}&rdquo;.
              </p>
            ) : (
              matchedReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-3.5 rounded-[8px] bg-[#F7F7F5] dark:bg-neutral-800 border border-[#E8E8E5] dark:border-neutral-700 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-[#315C4C] dark:text-emerald-400 font-mono">
                        {res.code}
                      </span>
                      <span className="text-[10px] text-[#737373] block">
                        {new Date(res.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <Badge
                      variant={
                        res.status === 'picked_up'
                          ? 'success'
                          : res.status === 'cancelled'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {res.status === 'picked_up'
                        ? 'Đã nhận đồ'
                        : res.status === 'cancelled'
                        ? 'Đã hủy'
                        : 'Chờ nhận tại quầy'}
                    </Badge>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-neutral-900 rounded border border-[#E8E8E5] dark:border-neutral-700 space-y-1">
                    <p className="font-semibold text-[#202124] dark:text-neutral-200">
                      {res.items
                        .map((i) => `${i.quantity}× ${i.product_name} (${i.variant_name || ''})`)
                        .join(', ')}
                    </p>
                    <p className="text-[#315C4C] dark:text-emerald-400 font-bold">
                      Tổng tiền: {formatCurrency(res.total_amount, currency)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Clean Storefront Footer */}
      <footer className="bg-white dark:bg-neutral-900 border-t border-[#E8E8E5] dark:border-neutral-800 py-8 text-xs text-[#737373] dark:text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-bold text-[#202124] dark:text-neutral-100">
              © 2026 {storeName}. All rights reserved.
            </p>
            {(activeWorkspace?.address || activeWorkspace?.owner_name) && (
              <p className="text-[11px]">
                {activeWorkspace?.address}
                {activeWorkspace?.address && activeWorkspace?.owner_name ? ' • ' : ''}
                {activeWorkspace?.owner_name ? `Liên hệ: ${activeWorkspace.owner_name}` : ''}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] justify-center sm:justify-end">
            <a
              href={hotlineHref}
              className="font-semibold text-[#315C4C] dark:text-emerald-400 hover:underline"
            >
              Hotline: {hotlineDisplay}
            </a>
            <a
              href={zaloHref}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#1D4ED8] dark:text-blue-400 hover:underline"
            >
              Zalo Official
            </a>
            <button
              type="button"
              onClick={() => {
                if (hasStaffPreviewSession) {
                  exitGuestPreview();
                  window.location.href = '/dashboard';
                } else {
                  window.location.href = '/login';
                }
              }}
              className="inline-flex items-center gap-1 text-[#737373] hover:text-[#202124] dark:hover:text-neutral-200 cursor-pointer transition-colors"
            >
              <LogIn className="w-3 h-3" />
              <span>{hasStaffPreviewSession ? 'Quay lại Quản trị' : 'Cổng nhân viên'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
