'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { useOrdersStore, CartItem } from '@/stores/orders-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { SyncStatusBadge, SyncState } from '@/components/ui/sync-status-badge';
import { formatCurrency } from '@/lib/utils';
import { PaymentMethod, Product, ProductVariant, Order } from '@/types/database';
import { PreorderPickupModal } from '@/components/pos/preorder-pickup-modal';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePreorderStore } from '@/stores/preorder-store';
import { useRealtimeCartSync } from '@/stores/realtime-cart-sync';
import {
  Store,
  Calendar,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  QrCode,
  Banknote,
  CreditCard,
  ArrowLeft,
  Wifi,
  WifiOff,
  History,
  RefreshCw,
  Package,
  Layers,
  X,
  Printer,
  Sparkles,
  LogIn,
  Eye,
  EyeOff,
  Coins,
  AlertCircle,
  Bug,
} from 'lucide-react';
import { FeedbackModal } from '@/components/feedback/feedback-modal';

export default function PosTerminalPage() {
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const { user, isAuthenticated, loginAsGuest } = useAuthStore();
  const { events, booths, products, variants, allocations } = useDataStore();
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    discountAmount,
    setDiscountAmount,
    submitOrder,
    activeBankConfig,
  } = useOrdersStore();

  // Active Event & Booth Selection with localStorage Persistence
  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );
  const [selectedEventId, setSelectedEventId] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eventmate_pos_selected_event') || '';
    }
    return '';
  });

  const eventBooths = booths.filter((b) => b.event_id === selectedEventId);
  const [selectedBoothId, setSelectedBoothId] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eventmate_pos_selected_booth') || '';
    }
    return '';
  });

  // Real-time Multi-seller Cart Synchronization
  const { initSync, broadcastMyCart, getRemoteHeldQty } = useRealtimeCartSync();

  React.useEffect(() => {
    initSync();
  }, [initSync]);

  // Broadcast local cart changes immediately so other cashiers see updated stock
  React.useEffect(() => {
    if (selectedBoothId) {
      broadcastMyCart(selectedBoothId, cart);
    }
  }, [cart, selectedBoothId, broadcastMyCart]);

  // Online / Offline State Listener
  const [isOnline, setIsOnline] = React.useState<boolean>(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  React.useEffect(() => {
    setIsOnline(navigator.onLine);
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ensure valid event and booth are ALWAYS selected (anti-flicker & F5 reload recovery)
  React.useEffect(() => {
    if (typeof window === 'undefined' || workspaceEvents.length === 0) return;

    // 1. Resolve Event
    let activeEvtId = selectedEventId;
    if (!activeEvtId || !workspaceEvents.some((e) => e.id === activeEvtId)) {
      const saved = localStorage.getItem('eventmate_pos_selected_event');
      if (saved && workspaceEvents.some((e) => e.id === saved)) {
        activeEvtId = saved;
      } else {
        const evtWithBooths = workspaceEvents.find((e) => booths.some((b) => b.event_id === e.id));
        activeEvtId = evtWithBooths?.id || workspaceEvents[0].id;
      }
      setSelectedEventId(activeEvtId);
      localStorage.setItem('eventmate_pos_selected_event', activeEvtId);
    }

    // 2. Resolve Booth for the resolved event
    const currentEventBooths = booths.filter((b) => b.event_id === activeEvtId);
    if (currentEventBooths.length > 0) {
      let activeBthId = selectedBoothId;
      if (!activeBthId || !currentEventBooths.some((b) => b.id === activeBthId)) {
        const savedBooth = localStorage.getItem('eventmate_pos_selected_booth');
        if (savedBooth && currentEventBooths.some((b) => b.id === savedBooth)) {
          activeBthId = savedBooth;
        } else {
          activeBthId = currentEventBooths[0].id;
        }
        setSelectedBoothId(activeBthId);
        localStorage.setItem('eventmate_pos_selected_booth', activeBthId);
      }
    } else {
      // Fallback if current event has no booths: auto-switch to an event that DOES have booths
      const anyValidBooth = booths.find((b) => workspaceEvents.some((e) => e.id === b.event_id));
      if (anyValidBooth) {
        setSelectedEventId(anyValidBooth.event_id);
        setSelectedBoothId(anyValidBooth.id);
        localStorage.setItem('eventmate_pos_selected_event', anyValidBooth.event_id);
        localStorage.setItem('eventmate_pos_selected_booth', anyValidBooth.id);
      }
    }
  }, [workspaceEvents, booths, selectedEventId, selectedBoothId]);

  function handleSelectEvent(eventId: string) {
    setSelectedEventId(eventId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eventmate_pos_selected_event', eventId);
    }
    const newBooths = booths.filter((b) => b.event_id === eventId);
    if (newBooths.length > 0) {
      setSelectedBoothId(newBooths[0].id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('eventmate_pos_selected_booth', newBooths[0].id);
      }
    } else {
      setSelectedBoothId('');
    }
  }

  function handleSelectBooth(boothId: string) {
    setSelectedBoothId(boothId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eventmate_pos_selected_booth', boothId);
    }
  }

  // Handle URL query preselection (?booth=...&event=...) safely after mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const qBooth = urlParams.get('booth');
    const qEvent = urlParams.get('event');

    if (qBooth) {
      const b = booths.find((item) => item.id === qBooth);
      if (b) {
        handleSelectBooth(b.id);
        handleSelectEvent(b.event_id);
      }
    } else if (qEvent) {
      handleSelectEvent(qEvent);
    }
  }, [booths]);

  // Search & Category Filtering
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  // Selected Variant state per Product
  const [selectedVariantMap, setSelectedVariantMap] = React.useState<Record<string, string>>({});

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('qr_manual');
  const [tenderedCash, setTenderedCash] = React.useState<number>(0);
  const [orderNotes, setOrderNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [confirmedOrder, setConfirmedOrder] = React.useState<Order | null>(null);

  // Mobile Cart Drawer Toggle
  const [isMobileCartOpen, setIsMobileCartOpen] = React.useState(false);

  // Preorder Pickup Modal State
  const [isPreorderPickupOpen, setIsPreorderPickupOpen] = React.useState(false);
  const { preorders } = usePreorderStore();
  const pendingPreordersCount = preorders.filter((p) => p.status === 'pending_pickup').length;

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedBooth = booths.find((b) => b.id === selectedBoothId);

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const totalCartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cash Change & Shortage Calculations
  const cashChange = Math.max(0, (tenderedCash || 0) - cartTotal);
  const cashShortage = Math.max(0, cartTotal - (tenderedCash || 0));
  const isCashUnderpaid = paymentMethod === 'cash' && cartTotal > 0 && (tenderedCash || 0) < cartTotal;

  // Toggle to hide sold-out products on POS terminal (defaults to true as requested)
  const [hideSoldOut, setHideSoldOut] = React.useState(true);

  // Calculate available stock for a variant at currently selected booth
  // (strictly respecting VIP hold, online pre-orders, my current cart, and other cashiers' active carts in real time)
  function getVariantAvailableStock(variantId: string) {
    if (!selectedBoothId) return 0;
    const alloc = allocations.find(
      (a) => a.booth_id === selectedBoothId && a.variant_id === variantId
    );
    if (!alloc) return 0;
    const variant = variants.find((v) => v.id === variantId);
    const totalHeld = (variant?.reserved_quantity || 0) + (variant?.online_preorder_quantity || 0);
    const inCart = cart.find((c) => c.variantId === variantId)?.quantity || 0;
    const remoteHeld = getRemoteHeldQty(selectedBoothId, variantId);
    return Math.max(0, alloc.allocated_quantity - totalHeld - alloc.sold_quantity - inCart - remoteHeld);
  }

  function getVariantRemoteHeldQty(variantId: string) {
    if (!selectedBoothId) return 0;
    return getRemoteHeldQty(selectedBoothId, variantId);
  }

  // Filtered Products (strictly exclude soft-deleted products)
  const activeProducts = products.filter(
    (p) => (!activeWorkspace || p.workspace_id === activeWorkspace.id) && p.is_active && !p.is_deleted
  );

  // Count sold-out products at this booth
  const soldOutPosCount = activeProducts.filter((p) => {
    const prodVariants = variants.filter((v) => v.product_id === p.id);
    return !prodVariants.some((v) => getVariantAvailableStock(v.id) > 0);
  }).length;

  const filteredProducts = activeProducts.filter((p) => {
    const prodVariants = variants.filter((v) => v.product_id === p.id);

    // If hideSoldOut is true, automatically hide products with 0 stock
    if (hideSoldOut) {
      const hasAvailable = prodVariants.some((v) => getVariantAvailableStock(v.id) > 0);
      if (!hasAvailable) return false;
    }

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prodVariants.some((v) => v.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  function handleAddToCart(product: Product) {
    if (user?.role === 'viewer') {
      alert('Tài khoản của bạn là Khách xem (Chỉ đọc). Vui lòng đăng nhập tài khoản Thu ngân hoặc Quản trị để bán hàng.');
      return;
    }
    const prodVariants = variants.filter((v) => v.product_id === product.id);
    if (prodVariants.length === 0) return;

    // Use currently selected variant or first
    const activeVarId = selectedVariantMap[product.id] || prodVariants[0].id;
    const variant = prodVariants.find((v) => v.id === activeVarId) || prodVariants[0];

    const available = getVariantAvailableStock(variant.id);
    if (available <= 0) {
      const remoteHeld = getVariantRemoteHeldQty(variant.id);
      if (remoteHeld > 0) {
        alert(`Sản phẩm này tạm thời hết hàng khả dụng vì đang có ${remoteHeld} sản phẩm nằm trong giỏ của thu ngân khác!`);
      } else {
        alert('Sản phẩm đã hết hàng khả dụng tại quầy này!');
      }
      return;
    }

    addToCart({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      price: variant.price,
      maxAvailable: available + (cart.find((c) => c.variantId === variant.id)?.quantity || 0),
      imageUrl: product.image_url,
    });
  }

  function handleIncrease(variantId: string) {
    const existing = cart.find((item) => item.variantId === variantId);
    if (!existing) return;
    const available = getVariantAvailableStock(variantId);
    if (available <= 0) {
      const remoteHeld = getVariantRemoteHeldQty(variantId);
      if (remoteHeld > 0) {
        alert(`Không thể mua quá số lượng! Đang có ${remoteHeld} sản phẩm nằm trong giỏ hàng của thu ngân khác.`);
      } else {
        alert('Không thể mua quá số lượng! Đã đạt số lượng tồn khả dụng tối đa của quầy.');
      }
      return;
    }
    updateQuantity(variantId, existing.quantity + 1);
  }

  function handleDecrease(variantId: string) {
    const existing = cart.find((item) => item.variantId === variantId);
    if (!existing) return;
    if (existing.quantity - 1 <= 0) {
      removeFromCart(variantId);
    } else {
      updateQuantity(variantId, existing.quantity - 1);
    }
  }

  function getVariantInCartQty(variantId: string) {
    return cart.find((item) => item.variantId === variantId)?.quantity || 0;
  }

  async function handleCompleteOrder() {
    if (user?.role === 'viewer') {
      alert('Tài khoản của bạn là Khách xem (Chỉ đọc), không thể xác nhận thanh toán đơn hàng.');
      return;
    }
    if (!selectedBooth || !selectedEvent || cart.length === 0) return;
    if (paymentMethod === 'cash' && cartTotal > 0 && (tenderedCash || 0) < cartTotal) {
      alert(`Số tiền khách đưa chưa đủ! Còn thiếu ${cashShortage.toLocaleString('vi-VN')} VND.`);
      return;
    }
    setIsSubmitting(true);

    try {
      const order = await submitOrder({
        workspaceId: selectedBooth.workspace_id,
        eventId: selectedEvent.id,
        boothId: selectedBooth.id,
        cashierId: user?.id || 'cashier-pos-demo',
        paymentMethod,
        tenderedAmount: paymentMethod === 'cash' ? (tenderedCash || cartTotal) : undefined,
        changeAmount: paymentMethod === 'cash' ? cashChange : undefined,
        notes: orderNotes.trim() || undefined,
        isOnline,
      });

      setConfirmedOrder(order);
      setIsCheckoutOpen(false);
      setIsMobileCartOpen(false);
      setTenderedCash(0);
      setOrderNotes('');
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo đơn hàng');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-[#E8E8E5] rounded-[8px] p-6 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#EBF1EE] text-[#315C4C] flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#202124]">Màn hình Bán hàng (POS)</h3>
            <p className="text-xs text-[#737373] mt-1 leading-relaxed">
              Vui lòng đăng nhập bằng tài khoản Thu ngân hoặc Quản trị viên để bán hàng tại quầy.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <Link href="/login" className="block">
              <Button variant="primary" size="md" className="w-full text-xs font-semibold gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                <span>Đến trang Đăng nhập</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={loginAsGuest}
              className="w-full text-xs text-[#737373] gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem giao diện với tư cách Khách</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col select-none">
      {/* POS Top Navigation Bar */}
      <header className="bg-white border-b border-[#E8E8E5] sticky top-0 z-30 shadow-2xs">
        {/* Main Bar */}
        <div className="h-13 sm:h-14 px-3 sm:px-5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-[#737373] hover:text-[#202124]">
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="font-semibold hidden xs:inline">Quản lý</span>
              </Button>
            </Link>

            {/* Desktop selectors */}
            <div className="hidden sm:flex items-center gap-2 border-l border-[#E8E8E5] pl-2.5 min-w-0">
              <select
                className="h-8 rounded-[4px] border border-[#E8E8E5] bg-[#F7F7F5] px-2 text-xs font-semibold text-[#202124] focus:outline-none focus:border-[#315C4C] max-w-[170px] truncate"
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
              >
                {workspaceEvents.length === 0 && <option value="">(Chưa có sự kiện)</option>}
                {workspaceEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>

              <select
                className="h-8 rounded-[4px] border border-[#315C4C]/40 bg-[#F7F7F5] px-2 text-xs font-bold text-[#315C4C] focus:outline-none focus:border-[#315C4C] max-w-[150px] truncate"
                value={selectedBoothId}
                onChange={(e) => handleSelectBooth(e.target.value)}
              >
                {eventBooths.length === 0 && <option value="">(Chưa có gian hàng)</option>}
                {eventBooths.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Status Actions */}
          <div className="flex items-center gap-2">
            {/* Real-time Connection Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${
                isOnline
                  ? 'bg-[#EAF4EE] text-[#2F7D55] border-[#CEE6D7]'
                  : 'bg-[#FEF7EC] text-[#B7791F] border-[#F8E3C3]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#2F7D55]' : 'bg-[#B7791F]'}`} />
              <span className="text-[11px] font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Pre-order Pickup Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5 border-[#B7791F]/40 text-[#8C5D17] hover:bg-[#FEF7EC] font-bold shadow-2xs"
              onClick={() => setIsPreorderPickupOpen(true)}
              title="Trả hàng cho khách đã đặt trước / online (Bắt buộc chụp ảnh minh chứng)"
            >
              <Package className="w-3.5 h-3.5 text-[#B7791F]" />
              <span className="hidden sm:inline">Trả Hàng Đặt Trước</span>
              <span className="sm:hidden">Trả hàng</span>
              {pendingPreordersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#B7791F] text-white font-mono">
                  {pendingPreordersCount}
                </span>
              )}
            </Button>

            <Link href="/pos/orders">
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1">
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lịch sử</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs gap-1 text-[#C44536] border-[#C44536]/30 hover:bg-[#FDF1F0] dark:hover:bg-[#3E1F1D]"
              onClick={() => setIsFeedbackOpen(true)}
              title="Báo cáo lỗi hoặc góp ý cải thiện POS"
            >
              <Bug className="w-3.5 h-3.5 text-[#C44536]" />
              <span className="hidden sm:inline">Báo lỗi</span>
            </Button>

            <ThemeToggle />

            {/* Mobile Cart Button Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="lg:hidden relative p-2 rounded-[6px] bg-[#315C4C] text-white active:scale-95 transition-transform"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalCartUnits > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C44536] text-white text-[10px] font-bold flex items-center justify-center">
                  {totalCartUnits}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Sub-bar: Event & Booth Pickers (large touch targets) */}
        <div className="sm:hidden px-3 py-2 bg-[#FAFAF8] border-t border-[#E8E8E5] grid grid-cols-2 gap-2">
          <div>
            <span className="text-[9px] font-bold text-[#737373] uppercase tracking-wider block mb-0.5">
              Sự kiện
            </span>
            <select
              className="w-full h-8 rounded-[4px] border border-[#E8E8E5] bg-white px-2 text-xs font-semibold text-[#202124] focus:outline-none focus:border-[#315C4C] truncate"
              value={selectedEventId}
              onChange={(e) => handleSelectEvent(e.target.value)}
            >
              {workspaceEvents.length === 0 && <option value="">(Chưa có sự kiện)</option>}
              {workspaceEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[9px] font-bold text-[#737373] uppercase tracking-wider block mb-0.5">
              Gian hàng
            </span>
            <select
              className="w-full h-8 rounded-[4px] border border-[#315C4C]/40 bg-white px-2 text-xs font-bold text-[#315C4C] focus:outline-none focus:border-[#315C4C] truncate"
              value={selectedBoothId}
              onChange={(e) => handleSelectBooth(e.target.value)}
            >
              {eventBooths.length === 0 && <option value="">(Chưa có gian hàng)</option>}
              {eventBooths.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Split Layout: Left Products Grid (65%), Right Cart (35%) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product Catalog */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col pb-28 lg:pb-5">
          {/* Search bar & Sold Out Filter Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-md min-w-[200px]">
              <Search className="w-4 h-4 text-[#9E9E9C] absolute left-3 top-2.5" />
              <Input
                placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-white"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle: Tự động ẩn hàng bán hết */}
              <button
                type="button"
                onClick={() => setHideSoldOut(!hideSoldOut)}
                className={`text-xs px-2.5 py-1.5 rounded-[6px] border font-medium transition-colors flex items-center gap-1.5 shadow-2xs ${
                  hideSoldOut
                    ? 'bg-[#EBF1EE] border-[#315C4C]/40 text-[#315C4C] font-semibold'
                    : 'bg-white border-[#E8E8E5] text-[#737373] hover:text-[#202124]'
                }`}
                title="Tự động ẩn các sản phẩm đã bán hết khỏi màn hình thu ngân"
              >
                {hideSoldOut ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-[#315C4C]" />
                    <span>Đang ẩn hàng hết ({soldOutPosCount})</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[#737373]" />
                    <span>Hiện tất cả ({soldOutPosCount} hết hàng)</span>
                  </>
                )}
              </button>

              {selectedBooth?.collab_partner && (
                <Badge variant="warning" className="text-xs shrink-0">
                  Quầy Collab: {selectedBooth.collab_partner}
                </Badge>
              )}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white border border-[#E8E8E5] rounded-[8px] my-auto">
              <Package className="w-12 h-12 text-[#9E9E9C] mb-3" />
              <h3 className="text-sm font-bold text-[#202124]">Chưa có sản phẩm nào tại quầy</h3>
              <p className="text-xs text-[#737373] mt-1 max-w-xs">
                {workspaceEvents.length === 0
                  ? 'Hãy tạo Sự kiện và Gian hàng trong Dashboard trước để bắt đầu bán.'
                  : 'Hãy thêm sản phẩm và phân bổ số lượng tồn kho cho gian hàng này trong mục Quản lý Kho.'}
              </p>
              <Link
                href={workspaceEvents.length === 0 ? '/dashboard/events' : '/dashboard/inventory'}
                className="mt-4"
              >
                <Button variant="primary" size="sm" className="text-xs">
                  {workspaceEvents.length === 0 ? 'Tạo Sự Kiện Ngay' : 'Phân Bổ Tồn Kho'}
                </Button>
              </Link>
            </div>
          ) : (
            /* Product Cards Touch Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((prod) => {
                const prodVariants = variants.filter((v) => v.product_id === prod.id);
                const activeVarId = selectedVariantMap[prod.id] || prodVariants[0]?.id;
                const activeVariant =
                  prodVariants.find((v) => v.id === activeVarId) || prodVariants[0];

                const availableStock = activeVariant
                  ? getVariantAvailableStock(activeVariant.id)
                  : 0;

                const remoteHeldStock = activeVariant
                  ? getVariantRemoteHeldQty(activeVariant.id)
                  : 0;

                const qtyInCart = activeVariant ? getVariantInCartQty(activeVariant.id) : 0;

                return (
                  <div
                    key={prod.id}
                    className="rounded-[8px] border border-[#E8E8E5] bg-white overflow-hidden shadow-2xs hover:border-[#315C4C]/40 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative h-28 sm:h-36 bg-[#F7F7F5] overflow-hidden flex items-center justify-center">
                        {prod.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-[#9E9E9C]" />
                        )}

                        {/* Stock Badge */}
                        <div className="absolute top-2 right-2">
                          {availableStock > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-[2px] flex items-center gap-1">
                              <span>Còn {availableStock}</span>
                              {remoteHeldStock > 0 && (
                                <span className="text-[#F3B05C] font-normal" title="Đang được chọn tại quầy/thu ngân khác">
                                  ({remoteHeldStock} giỏ khác)
                                </span>
                              )}
                            </span>
                          ) : qtyInCart > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#315C4C] text-white">
                              Đã lấy ({qtyInCart})
                            </span>
                          ) : remoteHeldStock > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#B7791F] text-white" title="Sản phẩm đang nằm trong giỏ hàng của thu ngân khác">
                              Quầy khác giữ {remoteHeldStock}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C44536] text-white">
                              Hết hàng
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3">
                        <h4 className="text-xs font-bold text-[#202124] line-clamp-2 leading-tight">
                          {prod.name}
                        </h4>
                        <p className="text-sm font-bold text-[#315C4C] mt-1">
                          {formatCurrency(
                            activeVariant?.price || 0,
                            activeWorkspace?.currency || 'VND'
                          )}
                        </p>

                        {/* Pre-order / Online reservation indicator */}
                        {activeVariant &&
                          ((activeVariant.reserved_quantity || 0) +
                            (activeVariant.online_preorder_quantity || 0)) > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-1 text-[9px]">
                              {(activeVariant.reserved_quantity || 0) > 0 && (
                                <span className="text-[#8C5D17] bg-[#FEF7EC] px-1.5 py-0.5 rounded border border-[#B7791F]/20 font-medium">
                                  Giữ chỗ: {activeVariant.reserved_quantity}
                                </span>
                              )}
                              {(activeVariant.online_preorder_quantity || 0) > 0 && (
                                <span className="text-[#1D4ED8] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#3B82F6]/20 font-medium">
                                  Đơn onl: {activeVariant.online_preorder_quantity}
                                </span>
                              )}
                            </div>
                          )}

                        {/* Variant Selector Pills */}
                        {prodVariants.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {prodVariants.map((v) => {
                              const isVarSelected = v.id === activeVarId;
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
                                  className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                                    isVarSelected
                                      ? 'bg-[#315C4C] text-white'
                                      : 'bg-[#F0F0ED] text-[#202124] hover:bg-[#E8E8E5]'
                                  }`}
                                >
                                  {v.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart / Inline Stepper Touch Action */}
                    <div className="p-2.5 sm:p-3 pt-0">
                      {qtyInCart > 0 ? (
                        <div className="flex items-center justify-between bg-[#EBF1EE] border border-[#315C4C]/40 rounded-[6px] p-1">
                          <button
                            type="button"
                            onClick={() => handleDecrease(activeVariant.id)}
                            className="w-8 h-8 rounded bg-white text-[#202124] flex items-center justify-center font-bold text-sm shadow-2xs hover:bg-[#F0F0ED] active:scale-95 transition-transform"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="text-center">
                            <span className="font-bold text-xs text-[#315C4C] leading-none block">
                              {qtyInCart}
                            </span>
                            <span className="text-[9px] text-[#737373] leading-none">trong giỏ</span>
                          </div>
                          <button
                            type="button"
                            disabled={availableStock <= 0}
                            onClick={() => handleIncrease(activeVariant.id)}
                            className="w-8 h-8 rounded bg-[#315C4C] text-white flex items-center justify-center font-bold text-sm shadow-2xs hover:bg-[#284a3d] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
                            title={availableStock <= 0 ? 'Đã đạt giới hạn tồn khả dụng (không thể thêm quá số lượng)' : 'Thêm 1'}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={availableStock <= 0}
                          onClick={() => handleAddToCart(prod)}
                          className="w-full h-9 text-xs font-semibold gap-1 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {availableStock > 0
                              ? 'Thêm vào giỏ'
                              : remoteHeldStock > 0
                              ? 'Quầy khác đang giữ'
                              : 'Hết hàng khả dụng'}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Right: Persistent Shopping Cart (Desktop) */}
        <aside className="w-80 lg:w-96 border-l border-[#E8E8E5] bg-white flex flex-col justify-between hidden lg:flex">
          {/* Cart Header */}
          <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#315C4C]" />
              <h3 className="text-sm font-bold text-[#202124]">Giỏ hàng hiện tại</h3>
              <Badge variant="neutral" className="text-[10px]">
                {totalCartUnits} món
              </Badge>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-[#C44536] hover:underline"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#737373] py-12">
                <ShoppingCart className="w-10 h-10 text-[#9E9E9C] mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium text-[#202124]">Giỏ hàng đang trống</p>
                <p className="text-[11px] text-[#737373] mt-0.5">
                  Chạm vào sản phẩm bên trái để thêm vào đơn
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.variantId}
                  className="p-2.5 rounded-[6px] border border-[#E8E8E5] bg-[#FBFBFA] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#202124] truncate">
                      {item.productName}
                    </p>
                    <p className="text-[11px] text-[#737373]">
                      {item.variantName} • {item.sku}
                    </p>
                    <p className="text-xs font-semibold text-[#315C4C] mt-0.5">
                      {formatCurrency(item.price, activeWorkspace?.currency || 'VND')}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-white border border-[#E8E8E5] rounded p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-1 hover:bg-[#F0F0ED] rounded text-[#202124]"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      disabled={getVariantAvailableStock(item.variantId) <= 0}
                      onClick={() => handleIncrease(item.variantId)}
                      className="p-1 hover:bg-[#F0F0ED] rounded text-[#202124] disabled:opacity-30 disabled:cursor-not-allowed"
                      title={getVariantAvailableStock(item.variantId) <= 0 ? 'Đã đạt số lượng tồn khả dụng' : 'Thêm 1'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.variantId)}
                    className="p-1 text-[#737373] hover:text-[#C44536]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Pricing Summary & Checkout Button */}
          <div className="p-4 border-t border-[#E8E8E5] bg-[#FAFAF8] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#737373]">
                <span>Tạm tính:</span>
                <span className="font-medium text-[#202124]">
                  {formatCurrency(cartSubtotal, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#737373]">
                <span>Giảm giá / Ưu đãi:</span>
                <input
                  type="number"
                  min={0}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-24 text-right px-1.5 py-0.5 text-xs border rounded bg-white font-mono"
                />
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-[#202124] pt-2 border-t border-[#E8E8E5]">
                <span>Tổng thanh toán:</span>
                <span className="text-base text-[#315C4C]">
                  {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              disabled={cart.length === 0}
              onClick={() => {
                setTenderedCash(cartTotal);
                setIsCheckoutOpen(true);
              }}
              className="w-full h-11 text-sm font-bold uppercase tracking-wider gap-2 shadow-xs"
            >
              <CreditCard className="w-4 h-4" />
              <span>Thanh toán ({formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')})</span>
            </Button>
          </div>
        </aside>
      </div>

      {/* Sticky Bottom Cart Bar on Mobile & Tablet */}
      {totalCartUnits > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E8E8E5] p-3 shadow-lg z-30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <div
            onClick={() => setIsMobileCartOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-[6px] bg-[#315C4C] text-white flex items-center justify-center font-bold">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C44536] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                {totalCartUnits}
              </span>
            </div>
            <div className="truncate">
              <p className="text-[11px] text-[#737373] leading-none">Giỏ hàng • {totalCartUnits} món</p>
              <p className="text-base font-bold text-[#315C4C] leading-tight mt-1">
                {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileCartOpen(true)}
              className="h-10 px-3 text-xs font-semibold"
            >
              Xem giỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setTenderedCash(cartTotal);
                setIsCheckoutOpen(true);
              }}
              className="h-10 px-4 text-xs font-bold bg-[#315C4C] text-white shadow-xs active:scale-95 transition-transform"
            >
              Thanh toán
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Cart Sheet / Modal */}
      <Modal
        isOpen={isMobileCartOpen}
        onClose={() => setIsMobileCartOpen(false)}
        title={`Chi tiết giỏ hàng (${totalCartUnits} món)`}
        description="Kiểm tra các sản phẩm đã chọn tại quầy."
        maxWidth="md"
      >
        <div className="space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-[#737373]">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-[#9E9E9C]" />
              <p className="text-xs">Chưa có sản phẩm nào trong giỏ hàng</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0ED] max-h-[45vh] overflow-y-auto -mx-2 px-2">
              {cart.map((item) => (
                <div key={item.variantId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#202124] truncate">{item.productName}</p>
                    <p className="text-[11px] text-[#737373]">
                      {item.variantName} • {formatCurrency(item.price, activeWorkspace?.currency || 'VND')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-[#E8E8E5] rounded-[4px] bg-white">
                      <button
                        type="button"
                        onClick={() => handleDecrease(item.variantId)}
                        className="w-7 h-7 flex items-center justify-center text-[#737373] hover:text-[#202124] active:bg-[#F0F0ED]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={getVariantAvailableStock(item.variantId) <= 0}
                        onClick={() => handleIncrease(item.variantId)}
                        className="w-7 h-7 flex items-center justify-center text-[#737373] hover:text-[#202124] disabled:opacity-30 disabled:cursor-not-allowed active:bg-[#F0F0ED]"
                        title={getVariantAvailableStock(item.variantId) <= 0 ? 'Đã đạt số lượng tồn khả dụng' : 'Thêm 1'}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.variantId)}
                      className="p-1.5 text-[#C44536] hover:bg-[#FDF1F0] rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pricing summary */}
          {cart.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[#E8E8E5] text-xs">
              <div className="flex items-center justify-between text-[#737373]">
                <span>Tạm tính:</span>
                <span className="font-medium text-[#202124]">
                  {formatCurrency(cartSubtotal, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#737373]">
                <span>Giảm giá:</span>
                <input
                  type="number"
                  min={0}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-24 text-right px-1.5 py-0.5 text-xs border rounded bg-white font-mono"
                />
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-[#202124] pt-2 border-t border-[#E8E8E5]">
                <span>Tổng cộng:</span>
                <span className="text-base text-[#315C4C]">
                  {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="h-10 text-xs text-[#C44536]"
                >
                  Xóa giỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsMobileCartOpen(false);
                    setTenderedCash(cartTotal);
                    setIsCheckoutOpen(true);
                  }}
                  className="flex-1 h-10 text-xs font-bold gap-1.5 active:scale-95 transition-transform"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Thanh toán ({formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')})</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Checkout Modal with Cash & Real VietQR Engine */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Thanh toán Đơn hàng"
        maxWidth="lg"
        description="Chọn hình thức thanh toán của khách hàng tại quầy."
      >
        <div className="space-y-4">
          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('qr_manual')}
              className={`p-3 rounded-[6px] border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors ${
                paymentMethod === 'qr_manual'
                  ? 'border-[#315C4C] bg-[#EBF1EE] text-[#315C4C]'
                  : 'border-[#E8E8E5] bg-white text-[#737373] hover:bg-[#F7F7F5]'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>Quét mã VietQR</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-[6px] border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors ${
                paymentMethod === 'cash'
                  ? 'border-[#315C4C] bg-[#EBF1EE] text-[#315C4C]'
                  : 'border-[#E8E8E5] bg-white text-[#737373] hover:bg-[#F7F7F5]'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>Tiền mặt (Cash)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('gateway')}
              className={`p-3 rounded-[6px] border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors ${
                paymentMethod === 'gateway'
                  ? 'border-[#315C4C] bg-[#EBF1EE] text-[#315C4C]'
                  : 'border-[#E8E8E5] bg-white text-[#737373] hover:bg-[#F7F7F5]'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Cổng / Thẻ POS</span>
            </button>
          </div>

          {/* Mode 1: VietQR Dynamic Code Generator */}
          {paymentMethod === 'qr_manual' && (
            <div className="p-4 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[6px] text-center space-y-3">
              <p className="text-xs font-semibold text-[#202124]">
                Khách mở App ngân hàng quét mã chuyển khoản nhanh Napas247:
              </p>

              {/* Real dynamic VietQR image with instant amount embedding */}
              <div className="w-48 h-48 mx-auto bg-white p-2 rounded-[8px] border border-[#E8E8E5] shadow-xs flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.vietqr.io/image/${activeBankConfig.bankId}-${activeBankConfig.accountNo}-compact2.png?amount=${cartTotal}&addInfo=EM${Date.now().toString().slice(-4)}&accountName=${encodeURIComponent(
                    activeBankConfig.accountName
                  )}`}
                  alt="VietQR code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-[11px] text-[#737373] space-y-0.5">
                <p>
                  Ngân hàng: <span className="font-semibold text-[#202124]">{activeBankConfig.bankId}</span>
                </p>
                <p>
                  Số TK: <span className="font-mono font-bold text-[#202124]">{activeBankConfig.accountNo}</span>
                </p>
                <p>
                  Chủ TK: <span className="font-semibold text-[#202124]">{activeBankConfig.accountName}</span>
                </p>
                <p className="font-bold text-[#315C4C] text-sm pt-1">
                  Số tiền: {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                </p>
              </div>
            </div>
          )}

          {/* Mode 2: Cash Drawer & Change Calculator */}
          {paymentMethod === 'cash' && (
            <div className="p-4 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[8px] space-y-3 text-xs">
              {/* Total required */}
              <div className="p-3 bg-white border border-[#E8E8E5] rounded-[6px] flex items-center justify-between">
                <span className="font-semibold text-[#737373]">Tổng tiền cần thu:</span>
                <span className="text-base font-extrabold text-[#315C4C]">
                  {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                </span>
              </div>

              {/* Manual input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tendered-cash" className="font-bold text-[#202124] flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#315C4C]" />
                    <span>Tiền khách đưa (Nhập thủ công):</span>
                  </Label>
                  {tenderedCash > 0 && (
                    <button
                      type="button"
                      onClick={() => setTenderedCash(0)}
                      className="text-[11px] font-semibold text-[#C5221F] hover:underline"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Input
                    id="tendered-cash"
                    type="text"
                    inputMode="numeric"
                    value={tenderedCash ? tenderedCash.toLocaleString('vi-VN') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setTenderedCash(raw ? parseInt(raw, 10) : 0);
                    }}
                    placeholder="Nhập số tiền khách đưa (VD: 500.000)..."
                    className="h-11 text-lg font-bold bg-white text-[#202124] pr-8 focus:border-[#315C4C]"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#737373] pointer-events-none">
                    ₫
                  </span>
                </div>
              </div>

              {/* Quick suggestions: Exact & Denominations */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#737373]">
                  <span>Gợi ý mệnh giá nhanh:</span>
                  <button
                    type="button"
                    onClick={() => setTenderedCash(cartTotal)}
                    className={`font-bold hover:underline ${tenderedCash === cartTotal ? 'text-[#315C4C]' : 'text-[#202124]'}`}
                  >
                    ⚡ Khách trả vừa đủ
                  </button>
                </div>

                {/* Banknotes presets */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[cartTotal, 100000, 200000, 500000].map((preset, idx) => {
                    const isSelected = tenderedCash === preset;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTenderedCash(preset)}
                        className={`py-1.5 px-1 rounded text-center font-bold text-xs transition-colors border ${
                          isSelected
                            ? 'bg-[#315C4C] text-white border-[#315C4C]'
                            : 'bg-white text-[#202124] border-[#E8E8E5] hover:bg-[#F0F0ED]'
                        }`}
                      >
                        {preset === cartTotal ? 'Vừa đủ' : `${(preset / 1000).toLocaleString('vi-VN')}k`}
                      </button>
                    );
                  })}
                </div>

                {/* Additive quick buttons (+10k, +20k, +50k, +100k, +200k, +500k) */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 pt-1">
                  <span className="text-[10px] text-[#737373] shrink-0 font-medium mr-0.5">Cộng thêm:</span>
                  {[10000, 20000, 50000, 100000, 200000, 500000].map((addAmount) => (
                    <button
                      key={addAmount}
                      type="button"
                      onClick={() => setTenderedCash((prev) => (prev || 0) + addAmount)}
                      className="px-1.5 py-0.5 rounded bg-white border border-[#E8E8E5] text-[10px] font-semibold text-[#315C4C] hover:bg-[#EBF1EE] shrink-0"
                    >
                      +{(addAmount / 1000).toLocaleString('vi-VN')}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Change / Shortage Status Display */}
              {tenderedCash === 0 ? (
                <div className="p-2.5 rounded-[6px] bg-white border border-dashed border-[#D2D2CE] text-center text-[#737373] text-[11px]">
                  💡 Nhập số tiền khách đưa hoặc chọn mệnh giá để tính tiền thối tự động
                </div>
              ) : isCashUnderpaid ? (
                <div className="p-3 bg-[#FDF2E9] border border-[#C5221F]/30 rounded-[6px] space-y-0.5 text-xs text-[#C5221F]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Chưa đủ tiền khách đưa!</span>
                    </span>
                    <span className="text-sm font-extrabold">
                      Thiếu {formatCurrency(cashShortage, activeWorkspace?.currency || 'VND')}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#C5221F]/80">
                    Khách đưa {formatCurrency(tenderedCash, activeWorkspace?.currency || 'VND')} / Cần thu {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-[#EAF4EE] border border-[#2F7D55]/30 rounded-[6px] space-y-1 text-xs text-[#2F7D55]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#202124]">Tiền cần thối lại khách:</span>
                    <span className="text-lg font-extrabold text-[#2F7D55]">
                      {cashChange === 0 ? '0 ₫ (Khách đưa vừa đủ)' : formatCurrency(cashChange, activeWorkspace?.currency || 'VND')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#737373] pt-0.5 border-t border-[#2F7D55]/20">
                    <span>Đã nhận: {formatCurrency(tenderedCash, activeWorkspace?.currency || 'VND')}</span>
                    <span>Đơn: {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Gateway */}
          {paymentMethod === 'gateway' && (
            <div className="p-4 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[6px] text-center text-xs space-y-2">
              <CreditCard className="w-8 h-8 text-[#315C4C] mx-auto" />
              <p className="font-semibold text-[#202124]">Thanh toán qua POS / Cổng đối tác</p>
              <p className="text-[11px] text-[#737373]">
                Yêu cầu khách quẹt thẻ hoặc chạm thiết bị NFC vào máy thanh toán.
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="order-note" className="text-xs">
              Ghi chú đơn hàng (tùy chọn)
            </Label>
            <Input
              id="order-note"
              placeholder="VD: Khách lấy thêm túi giấy, đổi size sau..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="h-8 text-xs bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0ED]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCheckoutOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isSubmitting || isCashUnderpaid}
              isLoading={isSubmitting}
              onClick={handleCompleteOrder}
              className="gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isCashUnderpaid
                  ? `Chưa đủ tiền (Thiếu ${formatCurrency(cashShortage, activeWorkspace?.currency || 'VND')})`
                  : 'Xác nhận & Hoàn tất đơn'}
              </span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Order Confirmed Screen Modal */}
      <Modal
        isOpen={!!confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        title="Đơn hàng thành công!"
        description="Giao dịch đã được ghi nhận và trừ hạn mức tồn kho tại quầy."
      >
        {confirmedOrder && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EAF4EE] text-[#2F7D55] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <p className="text-xs text-[#737373]">Mã đơn hàng</p>
              <h3 className="text-xl font-bold font-mono text-[#202124]">
                {confirmedOrder.order_number}
              </h3>
              <p className="text-xs text-[#315C4C] font-semibold mt-0.5">
                {confirmedOrder.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản QR'} •{' '}
                {formatCurrency(
                  confirmedOrder.final_amount,
                  activeWorkspace?.currency || 'VND'
                )}
              </p>
            </div>

            {confirmedOrder.payment_method === 'cash' && confirmedOrder.tendered_amount != null && (
              <div className="p-3 bg-[#EAF4EE] border border-[#2F7D55]/30 rounded-[6px] text-xs space-y-1">
                <div className="flex justify-between text-[#737373]">
                  <span>Tiền khách đưa:</span>
                  <span className="font-semibold text-[#202124]">
                    {formatCurrency(confirmedOrder.tendered_amount, activeWorkspace?.currency || 'VND')}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#2F7D55]">
                  <span>Tiền thối lại:</span>
                  <span>
                    {formatCurrency(confirmedOrder.change_amount || 0, activeWorkspace?.currency || 'VND')}
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] text-left text-xs space-y-1.5 max-h-40 overflow-y-auto">
              {confirmedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.variant_id}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(item.total_price, activeWorkspace?.currency || 'VND')}
                  </span>
                </div>
              ))}
            </div>

            {!isOnline && (
              <div className="p-2.5 bg-[#FEF7EC] border border-[#F8E3C3] text-[#B7791F] rounded-[4px] text-xs">
                ⚠️ Đơn hàng đã được lưu ngoại tuyến an toàn vào thiết bị (IndexedDB). Sẽ tự động tải lên khi có mạng.
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs gap-1"
                onClick={() => window.print()}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In hóa đơn</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="flex-1 text-xs font-bold"
                onClick={() => setConfirmedOrder(null)}
              >
                Tạo đơn tiếp theo
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Preorder Pickup Modal with Mandatory Photo Proof */}
      <PreorderPickupModal
        isOpen={isPreorderPickupOpen}
        onClose={() => setIsPreorderPickupOpen(false)}
        currentBoothId={selectedBoothId}
        currentBoothName={selectedBooth?.name}
      />

      {/* POS Bug Report / Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        defaultType="bug"
      />
    </div>
  );
}
