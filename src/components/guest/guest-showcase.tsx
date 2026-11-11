'use client';

import * as React from 'react';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { usePreorderStore } from '@/stores/preorder-store';
import { useOrdersStore } from '@/stores/orders-store';
import { calculateVariantStock } from '@/lib/stock-status';
import { formatCurrency } from '@/lib/utils';
import { filterRealEvents, filterRealBooths } from '@/lib/test-data-filter';
import { Product, ProductVariant, PreorderReservation } from '@/types/database';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DensityToggle } from '@/components/ui/density-toggle';
import { Link } from '@/i18n/routing';
import {
  Package,
  Phone,
  MessageCircle,
  Ticket,
  CheckCircle2,
  Search,
  ShieldCheck,
  Lock,
  X,
  Sparkles,
  Truck,
  Users2,
  Bookmark,
} from 'lucide-react';

export function GuestShowcase() {
  const { products, variants, categories, events, booths, allocations, updateVariantPreorders } = useDataStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { activeBankConfig } = useOrdersStore();
  const { preorders, createPreorder } = usePreorderStore();

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>('all');
  const [selectedEventId, setSelectedEventId] = React.useState<string>('all');
  const [selectedVariantMap, setSelectedVariantMap] = React.useState<Record<string, string>>({});

  // Modals
  const [onlineModalProduct, setOnlineModalProduct] = React.useState<Product | null>(null);
  const [keepModalProduct, setKeepModalProduct] = React.useState<{
    product: Product;
    variant: ProductVariant;
  } | null>(null);
  const [myReservationsOpen, setMyReservationsOpen] = React.useState(false);
  const [confirmedReservation, setConfirmedReservation] = React.useState<PreorderReservation | null>(null);

  // Form states for Keep Modal
  const [guestName, setGuestName] = React.useState('');
  const [guestPhone, setGuestPhone] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eventmate_guest_phone') || '';
    }
    return '';
  });
  const [keepQuantity, setKeepQuantity] = React.useState(1);
  const [selectedPickupBoothId, setSelectedPickupBoothId] = React.useState('');
  const [pickupTime, setPickupTime] = React.useState('Trước giờ biểu diễn (16:30 - 18:30)');
  const [keepNotes, setKeepNotes] = React.useState('');
  const [isSubmittingKeep, setIsSubmittingKeep] = React.useState(false);

  // Real events & booths (no test data in public catalog)
  const realEvents = filterRealEvents(events);
  const realBooths = filterRealBooths(booths);

  // Guest's personal reservations matching their saved phone number
  const myReservations = React.useMemo(() => {
    if (!guestPhone) return [];
    return preorders.filter(
      (p) => p.customer_phone === guestPhone.trim() || p.code.toLowerCase().includes(guestPhone.trim())
    );
  }, [preorders, guestPhone]);

  // Active products (not deleted, is_active)
  const visibleProducts = React.useMemo(() => {
    return products.filter((p) => {
      if (p.is_deleted || !p.is_active) return false;
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
        const prodVariants = variants.filter((v) => v.product_id === p.id);
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = prodVariants.some((v) => v.sku.toLowerCase().includes(q));
        if (!matchName && !matchSku) return false;
      }
      return true;
    });
  }, [products, variants, allocations, selectedCategoryId, selectedEventId, searchQuery]);

  // Open Keep Item Modal
  const handleOpenKeepModal = (product: Product, variant: ProductVariant) => {
    setKeepModalProduct({ product, variant });
    setKeepQuantity(1);
    setKeepNotes('');
    if (realBooths.length > 0 && !selectedPickupBoothId) {
      setSelectedPickupBoothId(realBooths[0].id);
    }
  };

  // Submit Keep Item (Pre-order pickup)
  const handleSubmitKeep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keepModalProduct) return;
    if (!guestName.trim() || !guestPhone.trim()) {
      alert('Vui lòng nhập Họ tên và Số điện thoại để nhân viên đối soát nhận đồ tại sự kiện.');
      return;
    }

    const { product, variant } = keepModalProduct;
    const effectiveBooth = realBooths.find((b) => b.id === selectedPickupBoothId) || realBooths[0];
    const effectiveEvent = realEvents.find((ev) => ev.id === effectiveBooth?.event_id) || realEvents[0];

    setIsSubmittingKeep(true);
    try {
      // 1. Create Preorder in store
      const newReservation = createPreorder({
        workspace_id: activeWorkspace?.id || 'ws-hac-cam-studio',
        event_id: effectiveEvent?.id || 'evt-tour-2026',
        booth_id: effectiveBooth?.id || 'bth-booth-a1',
        customer_name: guestName.trim(),
        customer_phone: guestPhone.trim(),
        preorder_type: 'online_preorder',
        status: 'pending_pickup',
        items: [
          {
            variant_id: variant.id,
            variant_name: variant.name,
            product_name: product.name,
            quantity: keepQuantity,
            unit_price: variant.price,
          },
        ],
        total_amount: variant.price * keepQuantity,
        deposit_paid: 0, // Free hold - pay or pick up at booth
        remaining_amount: variant.price * keepQuantity,
        notes: `Khách giữ đồ qua Khách xem Showcase. Khung giờ nhận: ${pickupTime}. Ghi chú: ${keepNotes.trim() || 'Không'}`,
      });

      // 2. Increment held online stock in data-store so nobody else takes it
      updateVariantPreorders(variant.id, {
        onlinePreorderQuantity: (variant.online_preorder_quantity || 0) + keepQuantity,
      });

      // 3. Save phone for easy retrieval
      if (typeof window !== 'undefined') {
        localStorage.setItem('eventmate_guest_phone', guestPhone.trim());
      }

      setKeepModalProduct(null);
      setConfirmedReservation(newReservation);
    } catch {
      alert('Có lỗi xảy ra khi tạo phiếu giữ đồ. Vui lòng thử lại.');
    } finally {
      setIsSubmittingKeep(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-neutral-950 text-[#202124] dark:text-neutral-100 flex flex-col font-sans transition-colors">
      {/* Top Customer Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-[#E8E8E5] dark:border-neutral-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Showcase Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="HikaruStore Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight">HikaruStore</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EAF4EE] dark:bg-emerald-950/60 text-[#2F7D55] dark:text-emerald-400 border border-[#CEE6D7] dark:border-emerald-800">
                  Gian Hàng Trưng Bày
                </span>
              </div>
              <p className="text-[11px] text-[#737373] dark:text-neutral-400 leading-none mt-0.5">
                Official Merchandise Catalog & Pre-order
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hotline Quick Call */}
            <a
              href="tel:0988776655"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-[6px] bg-[#F7F7F5] dark:bg-neutral-800 border border-[#E8E8E5] dark:border-neutral-700 hover:border-[#315C4C] text-[#315C4C] dark:text-emerald-400 transition-colors"
              title="Hotline tư vấn và chốt đơn giao hàng tận nơi"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Hotline: 0988.776.655</span>
            </a>

            {/* My Held Items Button */}
            {myReservations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMyReservationsOpen(true)}
                className="h-8 gap-1.5 text-xs font-semibold border-[#B7791F]/40 text-[#8C5D17] dark:text-amber-400 bg-[#FEF7EC] dark:bg-amber-950/30"
              >
                <Ticket className="w-3.5 h-3.5 text-[#B7791F]" />
                <span>Vé giữ đồ ({myReservations.length})</span>
              </Button>
            )}

            {/* Dark / Light Toggle */}
            <ThemeToggle />

            {/* Display Density Toggle */}
            <DensityToggle />

            {/* Admin Login Switcher */}
            <Link href="/login">
              <Button
                variant="primary"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 bg-[#315C4C] hover:bg-[#254639] text-white"
                title="Dành cho Quản trị viên và Thu ngân máy POS"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng nhập Quản lý</span>
                <span className="sm:hidden">Quản lý</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Notice Banner */}
      <section className="bg-white dark:bg-neutral-900 border-b border-[#E8E8E5] dark:border-neutral-800 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF1EE] dark:bg-emerald-950/40 text-[#315C4C] dark:text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gian Hàng Merchandise Chính Thức — Tour 2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202124] dark:text-neutral-100">
                Bộ Sưu Tập Merchandise & Giữ Đồ Tại Sự Kiện
              </h1>
              <p className="text-xs sm:text-sm text-[#737373] dark:text-neutral-400 leading-relaxed">
                Khám phá đầy đủ trang phục, phụ kiện và quà tặng chính thức. Bạn có thể{' '}
                <strong>liên hệ mua online giao tận nơi</strong> hoặc{' '}
                <strong>giữ đồ miễn phí để nhận tại quầy sự kiện</strong> mà không lo hết hàng.
              </p>
            </div>

            {/* 3 Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              <div className="p-3 rounded-[6px] bg-[#F7F7F5] dark:bg-neutral-800/60 border border-[#E8E8E5] dark:border-neutral-700 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#2F7D55] shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-[#202124] dark:text-neutral-200">100% Chính Hãng</p>
                  <p className="text-[10px] text-[#737373] dark:text-neutral-400">Merchandise tour chuẩn</p>
                </div>
              </div>

              <div className="p-3 rounded-[6px] bg-[#F7F7F5] dark:bg-neutral-800/60 border border-[#E8E8E5] dark:border-neutral-700 flex items-center gap-2.5">
                <Bookmark className="w-5 h-5 text-[#B7791F] shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-[#202124] dark:text-neutral-200">Keep Đồ 0đ</p>
                  <p className="text-[10px] text-[#737373] dark:text-neutral-400">Giữ chỗ không cần cọc</p>
                </div>
              </div>

              <div className="p-3 rounded-[6px] bg-[#F7F7F5] dark:bg-neutral-800/60 border border-[#E8E8E5] dark:border-neutral-700 flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-[#315C4C] shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-[#202124] dark:text-neutral-200">Giao Tận Nơi</p>
                  <p className="text-[10px] text-[#737373] dark:text-neutral-400">Ship COD toàn quốc</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 rounded-[8px] border border-[#E8E8E5] dark:border-neutral-800 shadow-2xs">
          {/* Search Box & Event Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-lg w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên áo, nón, lightstick, phụ kiện..."
                className="pl-9 h-9 text-xs bg-[#F7F7F5] dark:bg-neutral-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#202124]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {realEvents.length > 1 && (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="h-9 rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700 bg-[#F7F7F5] dark:bg-neutral-800 px-2.5 text-xs font-semibold text-[#202124] dark:text-neutral-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả tour diễn</option>
                {realEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold shrink-0 transition-colors ${
                selectedCategoryId === 'all'
                  ? 'bg-[#315C4C] text-white shadow-2xs'
                  : 'bg-[#F7F7F5] dark:bg-neutral-800 text-[#737373] hover:text-[#202124] dark:hover:text-neutral-200'
              }`}
            >
              Tất cả ({products.filter((p) => !p.is_deleted && p.is_active).length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id && !p.is_deleted && p.is_active).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold shrink-0 transition-colors ${
                    selectedCategoryId === cat.id
                      ? 'bg-[#315C4C] text-white shadow-2xs'
                      : 'bg-[#F7F7F5] dark:bg-neutral-800 text-[#737373] hover:text-[#202124] dark:hover:text-neutral-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        {visibleProducts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-[8px] border border-[#E8E8E5] dark:border-neutral-800 space-y-3">
            <Package className="w-12 h-12 text-[#9E9E9C] mx-auto" />
            <h3 className="text-sm font-bold text-[#202124] dark:text-neutral-200">
              Không tìm thấy sản phẩm phù hợp
            </h3>
            <p className="text-xs text-[#737373]">
              Thử xóa từ khóa tìm kiếm hoặc chọn danh mục khác.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategoryId('all'); }}>
              Xem toàn bộ sản phẩm
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {visibleProducts.map((prod) => {
              const prodVariants = variants.filter((v) => v.product_id === prod.id);
              const activeVarId = selectedVariantMap[prod.id] || prodVariants[0]?.id;
              const activeVariant = prodVariants.find((v) => v.id === activeVarId) || prodVariants[0];

              // Calculate stock breakdown
              const vAllocs = activeVariant
                ? allocations.filter((a) => a.variant_id === activeVariant.id && !a.is_test)
                : [];
              const vSoldOffline = vAllocs.reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
              const vAllocated = vAllocs.reduce((sum, a) => sum + (a.allocated_quantity || 0), 0);
              const stock = activeVariant
                ? calculateVariantStock(activeVariant, vSoldOffline, vAllocated)
                : null;

              const isAvailable = (stock?.offlineAvailable || 0) > 0;
              const isLowStock = (stock?.offlineAvailable || 0) > 0 && (stock?.offlineAvailable || 0) <= 10;
              const category = categories.find((c) => c.id === prod.category_id);

              return (
                <div
                  key={prod.id}
                  className="rounded-[8px] bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-800 overflow-hidden shadow-2xs hover:border-[#315C4C]/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative h-48 bg-[#F7F7F5] dark:bg-neutral-800/80 overflow-hidden flex items-center justify-center">
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

                      {/* Stock Badge Overlay */}
                      <div className="absolute top-2.5 right-2.5">
                        {isAvailable ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-xs ${
                              isLowStock ? 'bg-[#C44536]' : 'bg-[#2F7D55]'
                            }`}
                          >
                            {isLowStock
                              ? `Sắp hết (Còn ${stock?.offlineAvailable})`
                              : `Còn ${stock?.offlineAvailable} món`}
                          </span>
                        ) : (stock?.online || 0) > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#B7791F] text-white shadow-xs">
                            Nhận đặt trước
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#737373] text-white shadow-xs">
                            Tạm hết hàng
                          </span>
                        )}
                      </div>

                      {/* Category Badge */}
                      {category && (
                        <div className="absolute bottom-2.5 left-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 dark:bg-neutral-900/90 text-[#202124] dark:text-neutral-200 backdrop-blur-[2px] shadow-2xs">
                            {category.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3.5 space-y-2">
                      {prod.collab_partner && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8C5D17] bg-[#FEF7EC] dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-[#B7791F]/30">
                          <Users2 className="w-3 h-3 text-[#B7791F]" />
                          <span>Collab: {prod.collab_partner}</span>
                        </div>
                      )}

                      <h3 className="font-bold text-sm text-[#202124] dark:text-neutral-100 line-clamp-1">
                        {prod.name}
                      </h3>

                      {prod.description && (
                        <p className="text-xs text-[#737373] dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      )}

                      {/* Variant Selector Pills */}
                      {prodVariants.length > 1 && (
                        <div className="pt-1">
                          <span className="text-[10px] text-[#737373] block mb-1 font-medium">Chọn biến thể:</span>
                          <div className="flex flex-wrap gap-1">
                            {prodVariants.map((v) => {
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
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                    isSelected
                                      ? 'bg-[#315C4C] text-white shadow-2xs'
                                      : 'bg-[#F0F0ED] dark:bg-neutral-800 text-[#202124] dark:text-neutral-300 hover:bg-[#E8E8E5]'
                                  }`}
                                >
                                  {v.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Price & SKU */}
                      <div className="pt-2 flex items-baseline justify-between border-t border-[#F0F0ED] dark:border-neutral-800">
                        <span className="text-base font-extrabold text-[#315C4C] dark:text-emerald-400">
                          {formatCurrency(activeVariant?.price || 0, activeWorkspace?.currency || 'VND')}
                        </span>
                        <span className="font-mono text-[10px] text-[#9E9E9C]">
                          {activeVariant?.sku}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Guest: Buy Online or Keep Item */}
                  <div className="p-3.5 pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setOnlineModalProduct(prod)}
                        className="h-8 text-xs font-semibold gap-1 border-[#315C4C]/30 text-[#315C4C] dark:text-emerald-400 hover:bg-[#EBF1EE] dark:hover:bg-emerald-950/30"
                        title="Liên hệ tư vấn và chốt đơn ship tận nơi toàn quốc"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Mua Online</span>
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={!activeVariant}
                        onClick={() => activeVariant && handleOpenKeepModal(prod, activeVariant)}
                        className="h-8 text-xs font-bold gap-1 bg-[#2F7D55] hover:bg-[#256343] text-white shadow-2xs"
                        title="Đăng ký giữ đồ miễn phí để nhận tại quầy sự kiện"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Keep Đồ Tour</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal 1: Keep Đồ Nhận Tại Sự Kiện */}
      {keepModalProduct && (
        <Modal
          isOpen={!!keepModalProduct}
          onClose={() => setKeepModalProduct(null)}
          title="Đăng Ký Giữ Đồ — Nhận Tại Sự Kiện"
          description="Hệ thống sẽ tạo mã vé giữ đồ cho bạn. Khi đến sự kiện, bạn chỉ cần đọc số điện thoại tại quầy để nhận đồ mà không lo bị cháy hàng."
          maxWidth="md"
        >
          <form onSubmit={handleSubmitKeep} className="space-y-4">
            {/* Selected Item Summary */}
            <div className="p-3 bg-[#F7F7F5] dark:bg-neutral-800 rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700 flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center">
                {keepModalProduct.product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={keepModalProduct.product.image_url}
                    alt={keepModalProduct.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-[#9E9E9C]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs truncate">{keepModalProduct.product.name}</h4>
                <p className="text-[11px] text-[#737373] mt-0.5">
                  Biến thể: <strong className="text-[#315C4C]">{keepModalProduct.variant.name}</strong> • Giá:{' '}
                  {formatCurrency(keepModalProduct.variant.price, activeWorkspace?.currency || 'VND')}
                </p>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Số lượng muốn giữ:</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setKeepQuantity(qty)}
                    className={`h-8 px-3 rounded-[6px] text-xs font-bold transition-colors ${
                      keepQuantity === qty
                        ? 'bg-[#315C4C] text-white'
                        : 'bg-[#F7F7F5] dark:bg-neutral-800 border border-[#E8E8E5] text-[#737373]'
                    }`}
                  >
                    {qty} cái
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="guest-name" required className="text-xs">
                  Họ và tên của bạn:
                </Label>
                <Input
                  id="guest-name"
                  required
                  placeholder="VD: Nguyễn Thùy Linh"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="guest-phone" required className="text-xs">
                  Số điện thoại nhận hàng:
                </Label>
                <Input
                  id="guest-phone"
                  required
                  type="tel"
                  placeholder="VD: 0912345678"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="h-8.5 text-xs font-mono"
                />
              </div>
            </div>

            {/* Pickup Booth Selection */}
            <div className="space-y-1">
              <Label htmlFor="pickup-booth" required className="text-xs">
                Sự kiện & Quầy nhận hàng:
              </Label>
              <select
                id="pickup-booth"
                value={selectedPickupBoothId}
                onChange={(e) => setSelectedPickupBoothId(e.target.value)}
                className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs text-[#202124] dark:text-neutral-100 focus:outline-none focus:border-[#315C4C]"
              >
                {realBooths.map((bth) => {
                  const ev = realEvents.find((e) => e.id === bth.event_id);
                  return (
                    <option key={bth.id} value={bth.id}>
                      {bth.name} ({bth.code}) — {ev?.name || 'Sự kiện'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Pickup Time Window */}
            <div className="space-y-1">
              <Label className="text-xs">Khung giờ dự kiến đến quầy lấy:</Label>
              <Input
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                placeholder="VD: 17:30 trước giờ biểu diễn"
                className="h-8.5 text-xs"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs">Ghi chú thêm (tùy chọn):</Label>
              <Input
                value={keepNotes}
                onChange={(e) => setKeepNotes(e.target.value)}
                placeholder="VD: Mình có vé VIP hàng A / Cần lấy thêm túi xách"
                className="h-8.5 text-xs"
              />
            </div>

            {/* Guarantee Note */}
            <div className="p-2.5 bg-[#FEF7EC] dark:bg-amber-950/30 rounded-[6px] border border-[#B7791F]/30 text-[11px] text-[#8C5D17] dark:text-amber-300 space-y-0.5">
              <p className="font-bold flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-[#B7791F]" />
                <span>Không cần thanh toán trước — Giữ đồ 0đ</span>
              </p>
              <p>
                Đơn giữ đồ sẽ được lưu trực tiếp vào danh sách của nhân viên quầy. Bạn chỉ cần đọc số điện thoại khi tới nơi để nhận hàng và thanh toán tiền mặt/VietQR.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F0ED] dark:border-neutral-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setKeepModalProduct(null)}>
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingKeep}
                className="bg-[#2F7D55] hover:bg-[#256343] text-white font-bold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Xác nhận Giữ đồ Tour ({formatCurrency(keepModalProduct.variant.price * keepQuantity, 'VND')})</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Vé Giữ Đồ Thành Công (Ticket Confirmation) */}
      {confirmedReservation && (
        <Modal
          isOpen={!!confirmedReservation}
          onClose={() => setConfirmedReservation(null)}
          title="Đăng Ký Giữ Đồ Thành Công!"
          description="Vui lòng chụp ảnh màn hình vé này hoặc ghi nhớ mã giữ đồ để đối soát nhanh tại quầy."
          maxWidth="sm"
        >
          <div className="space-y-4 text-center">
            {/* Success Icon */}
            <div className="w-14 h-14 rounded-full bg-[#EAF4EE] dark:bg-emerald-950/40 text-[#2F7D55] dark:text-emerald-400 flex items-center justify-center mx-auto border border-[#2F7D55]/30">
              <Ticket className="w-7 h-7" />
            </div>

            {/* Ticket Card */}
            <div className="p-4 rounded-[8px] bg-[#F7F7F5] dark:bg-neutral-800 border-2 border-dashed border-[#315C4C]/40 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#737373] tracking-widest block">
                  MÃ VÉ GIỮ ĐỒ CỦA BẠN
                </span>
                <span className="text-2xl font-black font-mono text-[#315C4C] dark:text-emerald-400 tracking-wider">
                  {confirmedReservation.code}
                </span>
              </div>

              {/* Dynamic QR Code for quick cashier scan */}
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-[6px] border border-[#E8E8E5] flex items-center justify-center">
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
                <div className="flex justify-between">
                  <span className="text-[#737373]">Khách hàng:</span>
                  <span className="font-bold">{confirmedReservation.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Số điện thoại:</span>
                  <span className="font-mono font-bold">{confirmedReservation.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Sản phẩm giữ:</span>
                  <span className="font-bold text-[#2F7D55]">
                    {confirmedReservation.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Tổng tiền thanh toán tại quầy:</span>
                  <span className="font-bold text-[#315C4C]">
                    {formatCurrency(confirmedReservation.total_amount, 'VND')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#737373] leading-relaxed">
              💡 <strong>Mẹo:</strong> Hãy chụp màn hình lại điện thoại. Khi đến cổng biểu diễn, bạn đến đúng quầy và đưa mã <strong>{confirmedReservation.code}</strong> cho nhân viên để lấy đồ ngay!
            </p>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setConfirmedReservation(null)}
              className="w-full bg-[#315C4C] hover:bg-[#254639] text-white font-bold"
            >
              Đã hiểu & Đóng lại
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal 3: Liên Hệ Mua Online / Ship Tận Nơi */}
      {onlineModalProduct && (
        <Modal
          isOpen={!!onlineModalProduct}
          onClose={() => setOnlineModalProduct(null)}
          title={`Liên Hệ Mua Online — ${onlineModalProduct.name}`}
          description="Bạn có thể đặt mua online để được đóng gói và giao hàng COD tận nơi trên toàn quốc."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {/* Contact Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="tel:0988776655"
                className="p-3.5 rounded-[8px] border border-[#315C4C]/40 bg-[#EBF1EE] dark:bg-emerald-950/30 flex items-center gap-3 hover:border-[#315C4C] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#315C4C] text-white flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-[#737373] uppercase font-bold">Gọi Hotline đặt hàng</p>
                  <p className="text-sm font-extrabold text-[#315C4C] dark:text-emerald-400">0988.776.655</p>
                  <p className="text-[10px] text-[#737373]">Hỗ trợ 8h - 22h hàng ngày</p>
                </div>
              </a>

              <a
                href="https://zalo.me/0988776655"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-[8px] border border-[#1D4ED8]/40 bg-[#EFF6FF] dark:bg-blue-950/30 flex items-center gap-3 hover:border-[#1D4ED8] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-[#737373] uppercase font-bold">Nhắn tin Zalo Official</p>
                  <p className="text-sm font-extrabold text-[#1D4ED8] dark:text-blue-400">Zalo: 0988.776.655</p>
                  <p className="text-[10px] text-[#737373]">Gửi ảnh & chốt đơn nhanh</p>
                </div>
              </a>
            </div>

            {/* Bank Transfer QR Info */}
            <div className="p-3.5 bg-[#F7F7F5] dark:bg-neutral-800 rounded-[8px] border border-[#E8E8E5] dark:border-neutral-700 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 bg-white p-1 rounded border border-[#E8E8E5] shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.vietqr.io/image/${activeBankConfig.bankId}-${activeBankConfig.accountNo}-compact2.png?amount=0&addInfo=MUAONL&accountName=${encodeURIComponent(
                    activeBankConfig.accountName
                  )}`}
                  alt="VietQR Bank"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <p className="font-bold text-[#202124] dark:text-neutral-200 text-xs">
                  Tài khoản chuyển khoản chính thức
                </p>
                <p className="text-[11px] text-[#737373]">
                  Ngân hàng: <strong>{activeBankConfig.bankId}</strong> • Số TK:{' '}
                  <strong className="font-mono text-[#202124] dark:text-neutral-200">{activeBankConfig.accountNo}</strong>
                </p>
                <p className="text-[11px] text-[#737373]">
                  Chủ tài khoản: <strong>{activeBankConfig.accountName}</strong>
                </p>
                <p className="text-[10px] text-[#8C5D17] bg-[#FEF7EC] dark:bg-amber-950/40 p-1 rounded border border-[#B7791F]/30">
                  Cú pháp CK: <strong>ONL [Tên bạn] [Số điện thoại]</strong>
                </p>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="p-3 bg-white dark:bg-neutral-900 rounded-[6px] border border-[#E8E8E5] dark:border-neutral-800 space-y-1">
              <p className="font-bold text-[#315C4C] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>Chính sách giao hàng toàn quốc:</span>
              </p>
              <ul className="list-disc list-inside text-[11px] text-[#737373] space-y-0.5">
                <li>Giao nhanh 1-2 ngày tại TP.HCM & Hà Nội; 2-4 ngày tại các tỉnh thành khác.</li>
                <li>Được kiểm tra hàng trước khi nhận và thanh toán COD.</li>
                <li>Hỗ trợ đổi size trong vòng 7 ngày nếu chưa qua sử dụng.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOnlineModalProduct(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 4: Danh Sách Vé Giữ Đồ Của Tôi */}
      {myReservationsOpen && (
        <Modal
          isOpen={myReservationsOpen}
          onClose={() => setMyReservationsOpen(false)}
          title="Danh Sách Phiếu Giữ Đồ Của Bạn"
          description={`Các đơn giữ đồ gắn liền với số điện thoại ${guestPhone}.`}
          maxWidth="md"
        >
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {myReservations.length === 0 ? (
              <p className="text-center text-xs text-[#737373] py-6">
                Chưa có đơn giữ đồ nào được ghi nhận với số điện thoại này.
              </p>
            ) : (
              myReservations.map((res) => (
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
                        Tạo lúc: {new Date(res.created_at).toLocaleTimeString('vi-VN')} {new Date(res.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <Badge variant={res.status === 'picked_up' ? 'success' : 'warning'}>
                      {res.status === 'picked_up' ? 'Đã nhận đồ' : 'Chờ đến quầy nhận'}
                    </Badge>
                  </div>

                  <div className="p-2 bg-white dark:bg-neutral-900 rounded border border-[#E8E8E5] dark:border-neutral-700 space-y-1">
                    <p className="font-semibold text-[#202124] dark:text-neutral-200">
                      {res.items.map((i) => `${i.quantity}x ${i.product_name} (${i.variant_name || ''})`).join(', ')}
                    </p>
                    <p className="text-[#315C4C] font-bold">
                      Tổng tiền cần thanh toán: {formatCurrency(res.total_amount, 'VND')}
                    </p>
                  </div>

                  {res.status === 'pending_pickup' && (
                    <p className="text-[11px] text-[#8C5D17] bg-[#FEF7EC] dark:bg-amber-950/40 p-2 rounded">
                      👉 Hãy đến quầy bán hàng tại sự kiện và đọc mã <strong>{res.code}</strong> hoặc số điện thoại <strong>{res.customer_phone}</strong> để nhận đồ nhé!
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Customer Footer */}
      <footer className="bg-white dark:bg-neutral-900 border-t border-[#E8E8E5] dark:border-neutral-800 py-6 text-center text-xs text-[#737373] space-y-2">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © 2026 HikaruStore Merchandise Platform. Hệ thống vận hành gian hàng concert & tour chuyên nghiệp.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="tel:0988776655" className="hover:text-[#315C4C]">
              Hotline: 0988.776.655
            </a>
            <span>•</span>
            <Link href="/login" className="hover:text-[#315C4C] font-semibold">
              Khu vực Quản trị / Thu ngân
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
