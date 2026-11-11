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
import { calculateVariantStock } from '@/lib/stock-status';
import { PreorderPickupModal } from '@/components/pos/preorder-pickup-modal';
import { ShiftModal } from '@/components/pos/shift-modal';
import { ReceiptModal } from '@/components/pos/receipt-modal';
import { useShiftStore } from '@/stores/shift-store';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DensityToggle } from '@/components/ui/density-toggle';
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
  Zap,
  Info,
} from 'lucide-react';
import { playSuccessChime } from '@/lib/sound';
import { FeedbackModal } from '@/components/feedback/feedback-modal';

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function useOnlineStatus() {
  return React.useSyncExternalStore(
    subscribeOnline,
    () => (typeof navigator !== 'undefined' ? navigator.onLine : true),
    () => true
  );
}

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

  // Active Event & Booth Selection with localStorage Persistence & Anti-Flicker Fallbacks
  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );
  const effectiveEvents = workspaceEvents.length > 0 ? workspaceEvents : events;

  const [selectedEventId, setSelectedEventId] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const qBooth = urlParams.get('booth');
      const qEvent = urlParams.get('event');
      if (qBooth) {
        const b = booths.find((item) => item.id === qBooth);
        if (b) return b.event_id;
      }
      if (qEvent) return qEvent;
      if (user?.role === 'collab_partner' && user.collabBoothId) {
        const cb = booths.find((b) => b.id === user.collabBoothId);
        if (cb) return cb.event_id;
      }
      const saved = localStorage.getItem('eventmate_pos_selected_event');
      if (saved && (workspaceEvents.some((e) => e.id === saved) || events.some((e) => e.id === saved))) {
        return saved;
      }
    }
    return workspaceEvents[0]?.id || events[0]?.id || '';
  });

  const eventBooths = booths.filter((b) => b.event_id === selectedEventId);
  const effectiveBooths = eventBooths.length > 0 ? eventBooths : booths;

  const [selectedBoothId, setSelectedBoothId] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const qBooth = urlParams.get('booth');
      if (qBooth && booths.some((b) => b.id === qBooth)) {
        return qBooth;
      }
      if (user?.role === 'collab_partner' && user.collabBoothId && booths.some((b) => b.id === user.collabBoothId)) {
        return user.collabBoothId;
      }
      const saved = localStorage.getItem('eventmate_pos_selected_booth');
      if (saved && booths.some((b) => b.id === saved)) {
        return saved;
      }
    }
    return eventBooths[0]?.id || booths[0]?.id || '';
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

  // Online / Offline State Listener via useSyncExternalStore
  const isOnline = useOnlineStatus();
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = React.useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);
  const { activeShift, initShifts } = useShiftStore();

  React.useEffect(() => {
    initShifts();
  }, [initShifts]);

  // Ensure valid event and booth are ALWAYS selected (anti-flicker & F5 reload recovery)
  React.useEffect(() => {
    if (typeof window === 'undefined' || events.length === 0) return;

    const eventPool = workspaceEvents.length > 0 ? workspaceEvents : events;

    // 1. Resolve Event
    let activeEvtId = selectedEventId;
    if (!activeEvtId || !eventPool.some((e) => e.id === activeEvtId)) {
      const saved = localStorage.getItem('eventmate_pos_selected_event');
      if (saved && eventPool.some((e) => e.id === saved)) {
        activeEvtId = saved;
      } else {
        const evtWithBooths = eventPool.find((e) => booths.some((b) => b.event_id === e.id));
        activeEvtId = evtWithBooths?.id || eventPool[0]?.id || '';
      }
      if (activeEvtId) {
        queueMicrotask(() => {
          setSelectedEventId(activeEvtId);
          localStorage.setItem('eventmate_pos_selected_event', activeEvtId);
        });
      }
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
        queueMicrotask(() => {
          setSelectedBoothId(activeBthId);
          localStorage.setItem('eventmate_pos_selected_booth', activeBthId);
        });
      }
    } else {
      // Fallback if current event has no booths: auto-switch to an event that DOES have booths
      const anyValidBooth = booths.find((b) => eventPool.some((e) => e.id === b.event_id)) || booths[0];
      if (anyValidBooth) {
        queueMicrotask(() => {
          setSelectedEventId(anyValidBooth.event_id);
          setSelectedBoothId(anyValidBooth.id);
          localStorage.setItem('eventmate_pos_selected_event', anyValidBooth.event_id);
          localStorage.setItem('eventmate_pos_selected_booth', anyValidBooth.id);
        });
      }
    }
  }, [workspaceEvents, events, booths, selectedEventId, selectedBoothId]);

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

  // Search & Category Filtering
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [posSourceFilter, setPosSourceFilter] = React.useState<'all' | 'store' | 'collab'>('all');

  // Selected Variant state per Product
  const [selectedVariantMap, setSelectedVariantMap] = React.useState<Record<string, string>>({});

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [qrSessionRef, setQrSessionRef] = React.useState('8899');
  const [autoConfirmQr, setAutoConfirmQr] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_auto_confirm_qr') === 'true';
    }
    return false;
  });
  const [qrCountdown, setQrCountdown] = React.useState<number | null>(null);

  const handleToggleAutoConfirm = React.useCallback((checked: boolean) => {
    setAutoConfirmQr(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_auto_confirm_qr', checked ? 'true' : 'false');
    }
    if (checked) {
      setQrCountdown(5);
    } else {
      setQrCountdown(null);
    }
  }, []);

  const openCheckoutModal = React.useCallback(() => {
    setQrSessionRef(Math.floor(1000 + Math.random() * 9000).toString());
    const isAuto = typeof window !== 'undefined' && localStorage.getItem('pos_auto_confirm_qr') === 'true';
    setQrCountdown(isAuto ? 5 : null);
    setIsCheckoutOpen(true);
  }, []);
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
  // (strictly respecting booth allocation, true offline remaining inventory, my current cart, and other cashiers' active carts in real time)
  function getVariantAvailableStock(variantId: string) {
    const effectiveBoothId = selectedBoothId || effectiveBooths[0]?.id || booths[0]?.id;
    if (!effectiveBoothId) return 0;
    const alloc = allocations.find(
      (a) => a.booth_id === effectiveBoothId && a.variant_id === variantId
    );
    if (!alloc) return 0;
    const inCart = cart.find((c) => c.variantId === variantId)?.quantity || 0;
    const remoteHeld = getRemoteHeldQty(effectiveBoothId, variantId);

    // Safeguard: strictly clamp against warehouse true offline availability (excluding Online orders & VIP preorders)
    const variant = variants.find((v) => v.id === variantId);
    let maxOfflineAvailable = 999999;
    if (variant) {
      const maxOfflineLimit = Math.max(
        0,
        variant.total_inventory - (variant.online_preorder_quantity || 0) - (variant.reserved_quantity || 0)
      );
      const totalSoldOffline = allocations
        .filter((a) => a.variant_id === variantId)
        .reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
      maxOfflineAvailable = Math.max(0, maxOfflineLimit - totalSoldOffline);
    }

    const boothAvailable = Math.max(0, alloc.allocated_quantity - alloc.sold_quantity - inCart - remoteHeld);
    return Math.min(boothAvailable, Math.max(0, maxOfflineAvailable - inCart - remoteHeld));
  }

  function getVariantRemoteHeldQty(variantId: string) {
    const effectiveBoothId = selectedBoothId || effectiveBooths[0]?.id || booths[0]?.id;
    if (!effectiveBoothId) return 0;
    return getRemoteHeldQty(effectiveBoothId, variantId);
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
    if (posSourceFilter === 'store' && p.collab_partner) return false;
    if (posSourceFilter === 'collab' && !p.collab_partner) return false;

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
      useShiftStore.getState().recordOrderInShift(paymentMethod, order.final_amount);
      playSuccessChime();
      setIsCheckoutOpen(false);
      setIsMobileCartOpen(false);
      setQrCountdown(null);
      setTenderedCash(0);
      setOrderNotes('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi tạo đơn hàng');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Simulation / Webhook Auto-Detection Countdown Timer
  React.useEffect(() => {
    if (!isCheckoutOpen || paymentMethod !== 'qr_manual' || !autoConfirmQr) {
      return;
    }

    if (qrCountdown === null) {
      const initTimer = setTimeout(() => {
        setQrCountdown(5);
      }, 0);
      return () => clearTimeout(initTimer);
    }

    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev === null) return 5;
        if (prev <= 1) {
          clearInterval(timer);
          handleCompleteOrder();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isCheckoutOpen, paymentMethod, autoConfirmQr, qrCountdown]);

  // Keyboard Shortcut: Enter to confirm QR payment
  React.useEffect(() => {
    if (!isCheckoutOpen || paymentMethod !== 'qr_manual' || isSubmitting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'textarea' || (tag === 'input' && (e.target as HTMLElement)?.id === 'order-note')) {
          return;
        }
        e.preventDefault();
        handleCompleteOrder();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckoutOpen, paymentMethod, isSubmitting]);

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
        <div className="h-14 sm:h-16 px-3 sm:px-5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group" title="Về trang quản lý">
              <div className="h-9 sm:h-11 w-auto flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="HikaruStore Logo"
                  className="h-9 sm:h-11 w-auto max-w-[85px] sm:max-w-[95px] object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <div className="hidden md:flex flex-col">
                <span className="font-bold text-sm text-[#202124] leading-tight">HikaruStore</span>
                <span className="text-[10px] text-[#315C4C] font-semibold leading-none">POS Terminal</span>
              </div>
            </Link>

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
                {effectiveEvents.length === 0 && <option value="">(Chưa có sự kiện)</option>}
                {effectiveEvents.map((evt) => (
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
                {effectiveBooths.length === 0 && <option value="">(Chưa có gian hàng)</option>}
                {effectiveBooths.map((b) => (
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
              title="Trả hàng cho khách đặt trước (Cần chụp ảnh minh chứng)"
            >
              <Package className="w-3.5 h-3.5 text-[#B7791F]" />
              <span>Trả hàng</span>
              {pendingPreordersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#B7791F] text-white font-mono">
                  {pendingPreordersCount}
                </span>
              )}
            </Button>

            {/* Shift & Cash Drawer Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShiftModalOpen(true)}
              className={`h-8 px-2 sm:px-2.5 text-xs gap-1.5 font-semibold shadow-2xs ${
                activeShift && activeShift.status === 'open'
                  ? 'border-[#2F7D55]/40 text-[#2F7D55] bg-[#EAF4EE] hover:bg-[#D8EDE0]'
                  : 'border-[#B7791F]/40 text-[#8C5D17] bg-[#FEF7EC] hover:bg-[#FDF2E9]'
              }`}
              title={
                activeShift && activeShift.status === 'open'
                  ? `Ca đang mở (Két: ${(activeShift.startingCashFloat + activeShift.totalCashSales).toLocaleString('vi-VN')} đ) — Nhấn để Chốt ca / Bàn giao`
                  : 'Chưa mở ca — Nhấn để nhập tiền đầu ca'
              }
            >
              <Banknote className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {activeShift && activeShift.status === 'open' ? 'Chốt ca' : 'Mở ca'}
              </span>
              {activeShift && activeShift.status === 'open' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D55] animate-pulse" />
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
              className="h-8 px-2 text-xs gap-1 text-[#C44536] border-[#C44536]/30 hover:bg-[#FDF1F0]"
              onClick={() => setIsFeedbackOpen(true)}
              title="Góp ý hoặc báo lỗi hệ thống"
            >
              <Bug className="w-3.5 h-3.5 text-[#C44536]" />
              <span className="hidden sm:inline">Góp ý</span>
            </Button>

            <ThemeToggle />

            <DensityToggle />

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
              {effectiveEvents.length === 0 && <option value="">(Chưa có sự kiện)</option>}
              {effectiveEvents.map((evt) => (
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
              {effectiveBooths.length === 0 && <option value="">(Chưa có gian hàng)</option>}
              {effectiveBooths.map((b) => (
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
                placeholder="Tìm sản phẩm, mã loại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-white"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Origin Source Filter Pills */}
              <div className="flex items-center gap-1 bg-[#E8E8E5] dark:bg-neutral-800 p-0.5 rounded-[6px]">
                <button
                  type="button"
                  onClick={() => setPosSourceFilter('all')}
                  className={`text-xs px-2.5 py-1 rounded-[4px] font-bold transition-colors ${
                    posSourceFilter === 'all'
                      ? 'bg-white text-[#202124] shadow-2xs'
                      : 'text-[#737373] hover:text-[#202124]'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setPosSourceFilter('store')}
                  className={`text-xs px-2.5 py-1 rounded-[4px] font-bold transition-colors ${
                    posSourceFilter === 'store'
                      ? 'bg-[#2F7D55] text-white shadow-2xs'
                      : 'text-[#2F7D55] hover:bg-white/50'
                  }`}
                >
                  👑 Shop
                </button>
                <button
                  type="button"
                  onClick={() => setPosSourceFilter('collab')}
                  className={`text-xs px-2.5 py-1 rounded-[4px] font-bold transition-colors ${
                    posSourceFilter === 'collab'
                      ? 'bg-[#B7791F] text-white shadow-2xs'
                      : 'text-[#8C5D17] hover:bg-white/50'
                  }`}
                >
                  🤝 Collab
                </button>
              </div>

              {/* Toggle: Tự động ẩn hàng bán hết */}
              <button
                type="button"
                onClick={() => setHideSoldOut(!hideSoldOut)}
                className={`text-xs px-2.5 py-1.5 rounded-[6px] border font-medium transition-colors flex items-center gap-1.5 shadow-2xs ${
                  hideSoldOut
                    ? 'bg-[#EBF1EE] border-[#315C4C]/40 text-[#315C4C] font-semibold'
                    : 'bg-white border-[#E8E8E5] text-[#737373] hover:text-[#202124]'
                }`}
                title="Tự động ẩn sản phẩm hết hàng"
              >
                {hideSoldOut ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-[#315C4C]" />
                    <span>Ẩn hết hàng ({soldOutPosCount})</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[#737373]" />
                    <span>Hiện tất cả</span>
                  </>
                )}
              </button>

              {selectedBooth?.collab_partner && (
                <Badge variant="warning" className="text-xs shrink-0">
                  Collab: {selectedBooth.collab_partner}
                </Badge>
              )}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white border border-[#E8E8E5] rounded-[8px] my-auto">
              <Package className="w-12 h-12 text-[#9E9E9C] mb-3" />
              {soldOutPosCount > 0 && hideSoldOut ? (
                <>
                  <h3 className="text-sm font-bold text-[#202124]">Tất cả sản phẩm đã hết hàng</h3>
                  <p className="text-xs text-[#737373] mt-1 max-w-xs">
                    Có {soldOutPosCount} sản phẩm tại quầy này đã bán hết hoặc đang được giữ trong giỏ hàng.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHideSoldOut(false)}
                    className="mt-3 text-xs"
                  >
                    Hiển thị sản phẩm hết hàng
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          ) : (
            /* Product Cards Touch Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
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

                // Calculate exact 5-state stock breakdown for active variant
                const variantAllocs = activeVariant
                  ? allocations.filter((a) => a.variant_id === activeVariant.id && !a.is_test)
                  : [];
                const varSoldOffline = variantAllocs.reduce((sum, a) => sum + (a.sold_quantity || 0), 0);
                const varAllocated = variantAllocs.reduce((sum, a) => sum + (a.allocated_quantity || 0), 0);
                const stockBreakdown = activeVariant
                  ? calculateVariantStock(activeVariant, varSoldOffline, varAllocated)
                  : null;

                return (
                  <div
                    key={prod.id}
                    className="rounded-[8px] border border-[#E8E8E5] bg-white overflow-hidden shadow-2xs hover:border-[#315C4C]/40 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative h-24 sm:h-36 bg-[#F7F7F5] overflow-hidden flex items-center justify-center">
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

                        {/* Origin Source Badge (Top Left) */}
                        <div className="absolute top-2 left-2">
                          {prod.collab_partner ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FEF7EC]/95 text-[#8C5D17] border border-[#B7791F]/30 backdrop-blur-[2px] shadow-2xs">
                              🤝 {prod.collab_partner}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EAF4EE]/95 text-[#2F7D55] border border-[#2F7D55]/30 backdrop-blur-[2px] shadow-2xs">
                              👑 {activeWorkspace?.name || 'Shop'}
                            </span>
                          )}
                        </div>

                        {/* Stock Badge */}
                        <div className="absolute top-2 right-2">
                          {availableStock > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-[2px]">
                              Còn {availableStock}
                            </span>
                          ) : qtyInCart > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#315C4C] text-white">
                              {qtyInCart} trong giỏ
                            </span>
                          ) : remoteHeldStock > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#B7791F] text-white" title="Đang trong giỏ của quầy khác">
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
                        {prod.collab_partner && (
                          <span className="text-[9.5px] font-semibold text-[#8C5D17] block mb-0.5 truncate">
                            🤝 Collab: {prod.collab_partner}
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-[#202124] line-clamp-2 leading-tight">
                          {prod.name}
                        </h4>
                        <p className="text-sm font-bold text-[#315C4C] mt-1">
                          {formatCurrency(
                            activeVariant?.price || 0,
                            activeWorkspace?.currency || 'VND'
                          )}
                        </p>

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

                        {/* 5-State Stock Status Breakdown */}
                        {stockBreakdown && (
                          <div className="mt-2 p-1.5 bg-[#F7F7F5] rounded-[4px] border border-[#E8E8E5] text-[10px] space-y-0.5">
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-[#315C4C]">
                                Tồn quầy: <strong>{availableStock}</strong>
                              </span>
                              <span className="text-[#737373]">
                                Số lượng: <strong>{stockBreakdown.total}</strong>
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-[#737373]">
                              <span>Onl: <strong className="text-[#202124]">{stockBreakdown.online}</strong></span>
                              <span>Preord: <strong className="text-[#B7791F]">{stockBreakdown.preord}</strong></span>
                              <span>Đã bán: <strong className="text-[#2F7D55]">{stockBreakdown.offlineSold}</strong></span>
                            </div>
                            <div className="text-[9px] text-[#2F7D55] font-semibold pt-0.5 border-t border-[#E8E8E5]/60 flex justify-between">
                              <span>Tồn bán offline:</span>
                              <span>{stockBreakdown.offlineAvailable}</span>
                            </div>
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
                            title={availableStock <= 0 ? 'Đã đạt giới hạn tồn khả dụng' : 'Thêm 1'}
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
                            {availableStock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
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
              <h3 className="text-sm font-bold text-[#202124]">Giỏ hàng</h3>
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
                Xóa giỏ
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#737373] py-12">
                <ShoppingCart className="w-10 h-10 text-[#9E9E9C] mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium text-[#202124]">Giỏ hàng trống</p>
                <p className="text-[11px] text-[#737373] mt-0.5">
                  Chọn sản phẩm để thêm vào đơn
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

                  {/* Quantity Stepper with Direct Input */}
                  <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-neutral-800 border border-[#E8E8E5] dark:border-neutral-700 rounded p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-1 hover:bg-[#F0F0ED] dark:hover:bg-neutral-700 rounded text-[#202124] dark:text-neutral-200 transition-colors"
                      title="Giảm 1"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={item.quantity + getVariantAvailableStock(item.variantId)}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (isNaN(val) || val <= 0) {
                          updateQuantity(item.variantId, 1);
                        } else {
                          const maxLimit = item.quantity + getVariantAvailableStock(item.variantId);
                          updateQuantity(item.variantId, Math.min(val, Math.max(1, maxLimit)));
                        }
                      }}
                      className="w-10 h-6 text-center text-xs font-bold font-mono bg-transparent border-0 text-[#202124] dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#315C4C] rounded"
                      title="Nhập trực tiếp số lượng mua"
                    />
                    <button
                      type="button"
                      disabled={getVariantAvailableStock(item.variantId) <= 0}
                      onClick={() => handleIncrease(item.variantId)}
                      className="p-1 hover:bg-[#F0F0ED] dark:hover:bg-neutral-700 rounded text-[#202124] dark:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
            </div>

            <Button
              type="button"
              variant="primary"
              disabled={cart.length === 0}
              onClick={() => {
                setTenderedCash(cartTotal);
                openCheckoutModal();
              }}
              className="w-full h-11 text-sm font-semibold tracking-wide gap-2 shadow-xs"
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
                openCheckoutModal();
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
                    openCheckoutModal();
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
        title="Thanh toán"
        maxWidth="lg"
        description="Chọn phương thức thanh toán"
      >
        <div className="space-y-4">
          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('qr_manual')}
              className={`p-2.5 rounded-[6px] border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors ${
                paymentMethod === 'qr_manual'
                  ? 'border-[#315C4C] bg-[#EBF1EE] text-[#315C4C]'
                  : 'border-[#E8E8E5] bg-white text-[#737373] hover:bg-[#F7F7F5]'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>VietQR</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-2.5 rounded-[6px] border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors ${
                paymentMethod === 'cash'
                  ? 'border-[#315C4C] bg-[#EBF1EE] text-[#315C4C]'
                  : 'border-[#E8E8E5] bg-white text-[#737373] hover:bg-[#F7F7F5]'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>Tiền mặt</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('gateway')}
              className={`p-2.5 rounded-[6px] border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors ${
                paymentMethod === 'gateway'
                  ? 'border-[#315C4C] bg-[#EBF1EE] text-[#315C4C]'
                  : 'border-[#E8E8E5] bg-white text-[#737373] hover:bg-[#F7F7F5]'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Thẻ POS</span>
            </button>
          </div>

          {/* Mode 1: VietQR Dynamic Code Generator */}
          {paymentMethod === 'qr_manual' && (
            <div className="p-4 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[8px] text-center space-y-3.5">
              {/* Pulsating status badge */}
              <div
                className={`flex items-center justify-center gap-2 text-xs font-semibold py-1.5 px-3 rounded-full mx-auto w-fit border ${
                  autoConfirmQr
                    ? 'text-[#2F7D55] bg-[#EAF4EE] border-[#2F7D55]/30'
                    : 'text-[#8C5D17] bg-[#FEF7EC] border-[#F5C27A]/50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    autoConfirmQr ? 'bg-[#2F7D55] animate-ping' : 'bg-[#B7791F]'
                  }`}
                />
                <span>
                  {autoConfirmQr && qrCountdown !== null && qrCountdown > 0
                    ? `⚡ Đang tự động khớp lệnh sau ${qrCountdown}s...`
                    : 'Đang hiển thị mã VietQR • Bấm nút xanh hoặc [Enter] khi đã nhận tiền'}
                </span>
              </div>

              {/* Real dynamic VietQR image with instant amount embedding */}
              <div className="w-52 h-52 mx-auto bg-white p-2.5 rounded-[10px] border-2 border-[#315C4C]/20 shadow-xs flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.vietqr.io/image/${activeBankConfig.bankId}-${activeBankConfig.accountNo}-compact2.png?amount=${cartTotal}&addInfo=EM${qrSessionRef}&accountName=${encodeURIComponent(
                    activeBankConfig.accountName
                  )}`}
                  alt="VietQR code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-[11px] text-[#737373] space-y-1 bg-white p-2.5 rounded-[6px] border border-[#E8E8E5]">
                <div className="flex items-center justify-between">
                  <span>Ngân hàng:</span>
                  <span className="font-bold text-[#202124]">{activeBankConfig.bankId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Số tài khoản:</span>
                  <span className="font-mono font-extrabold text-[#202124]">{activeBankConfig.accountNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Chủ tài khoản:</span>
                  <span className="font-semibold text-[#202124]">{activeBankConfig.accountName}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#F0F0ED]">
                  <span className="font-bold text-[#202124]">Số tiền cần CK:</span>
                  <span className="font-extrabold text-[#2F7D55] text-sm">
                    {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Nội dung chuyển:</span>
                  <span className="font-mono font-bold text-[#8C5D17] bg-[#FEF7EC] px-1.5 py-0.5 rounded border border-[#B7791F]/20">
                    EM{qrSessionRef}
                  </span>
                </div>
              </div>

              {/* Explanatory banner */}
              <div className="p-2.5 rounded-[6px] bg-[#FEF7EC] border border-[#F5C27A]/40 text-[#8C5D17] text-[11px] leading-relaxed text-left flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#B7791F]" />
                <div>
                  <p className="font-semibold text-[#202124]">Vì sao sau khi chuyển tiền màn hình chưa tự nhảy?</p>
                  <p className="text-[#685023] mt-0.5">
                    Mã VietQR chuyển thẳng trực tiếp vào tài khoản ngân hàng của bạn. Khi điện thoại bạn nổ thông báo <strong>&quot;ting ting&quot;</strong>, hãy bấm nút <strong>&quot;✓ ĐÃ NHẬN TIỀN&quot;</strong> bên dưới (hoặc phím <strong>Enter</strong>) để máy lưu đơn và trừ kho. Hoặc bạn có thể tích chọn <strong>&quot;⚡ Tự động khớp sau 5s&quot;</strong> để máy tự động chuyển màn hình!
                  </p>
                </div>
              </div>

              {/* Cashier direct confirmation action */}
              <div className="pt-1 space-y-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  onClick={handleCompleteOrder}
                  className="w-full gap-2 bg-[#2F7D55] hover:bg-[#256343] text-white font-extrabold text-xs py-3 shadow-sm transform active:scale-[0.99] transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>
                    ✓ ĐÃ NHẬN TIỀN ({formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}) - HOÀN TẤT ĐƠN [ENTER]
                  </span>
                </Button>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleCompleteOrder}
                    disabled={isSubmitting}
                    className="flex-1 py-1.5 px-2.5 rounded-[6px] border border-[#D5D5D0] bg-white hover:bg-[#F0F0ED] text-[#202124] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    title="Bấm để hoàn tất đơn ngay lập tức khi test hoặc khi đã thấy biến động số dư"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#315C4C]" />
                    <span>Khớp lệnh nhanh (Tức thì)</span>
                  </button>

                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#494949] cursor-pointer select-none bg-white py-1.5 px-2.5 rounded-[6px] border border-[#D5D5D0] hover:bg-[#F7F7F5]">
                    <input
                      type="checkbox"
                      checked={autoConfirmQr}
                      onChange={(e) => handleToggleAutoConfirm(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#D5D5D0] text-[#315C4C] focus:ring-[#315C4C]"
                    />
                    <span>⚡ Tự động khớp sau 5s</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Cash Drawer & Change Calculator */}
          {paymentMethod === 'cash' && (
            <div className="p-4 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[8px] space-y-3 text-xs">
              {/* Total required */}
              <div className="p-3 bg-white border border-[#E8E8E5] rounded-[6px] flex items-center justify-between">
                <span className="font-semibold text-[#737373]">Cần thu:</span>
                <span className="text-base font-extrabold text-[#315C4C]">
                  {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                </span>
              </div>

              {/* Manual input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tendered-cash" className="font-bold text-[#202124] flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#315C4C]" />
                    <span>Tiền khách đưa:</span>
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
                    placeholder="Nhập số tiền..."
                    className="h-11 text-lg font-bold bg-white text-[#202124] pr-8 focus:border-[#315C4C]"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#737373] pointer-events-none">
                    ₫
                  </span>
                </div>
              </div>

              {/* Change / Shortage Status Display */}
              {tenderedCash === 0 ? (
                <div className="p-2 rounded-[6px] bg-white border border-dashed border-[#D2D2CE] text-center text-[#737373] text-[11px]">
                  Nhập tiền khách đưa để tính tiền thối
                </div>
              ) : isCashUnderpaid ? (
                <div className="p-3 bg-[#FDF2E9] border border-[#C5221F]/30 rounded-[6px] space-y-0.5 text-xs text-[#C5221F]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Khách đưa chưa đủ tiền</span>
                    </span>
                    <span className="text-sm font-extrabold">
                      Thiếu {formatCurrency(cashShortage, activeWorkspace?.currency || 'VND')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#EAF4EE] border border-[#2F7D55]/30 rounded-[6px] space-y-1 text-xs text-[#2F7D55]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#202124]">Tiền thối lại:</span>
                    <span className="text-lg font-extrabold text-[#2F7D55]">
                      {cashChange === 0 ? '0 ₫ (Vừa đủ)' : formatCurrency(cashChange, activeWorkspace?.currency || 'VND')}
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
              <p className="font-semibold text-[#202124]">Thanh toán thẻ POS</p>
              <p className="text-[11px] text-[#737373]">
                Quẹt thẻ hoặc chạm thiết bị vào máy POS.
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="order-note" className="text-xs">
              Ghi chú (tùy chọn)
            </Label>
            <Input
              id="order-note"
              placeholder="Ghi chú đơn hàng..."
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
                  ? `Thiếu ${formatCurrency(cashShortage, activeWorkspace?.currency || 'VND')}`
                  : 'Hoàn tất đơn hàng'}
              </span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Order Confirmed Screen Modal */}
      <Modal
        isOpen={!!confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        title="Thanh toán thành công!"
        description="Giao dịch đã được ghi nhận hoàn tất. Hệ thống đã tự động trừ số lượng sản phẩm khỏi tồn kho quầy."
      >
        {confirmedOrder && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EAF4EE] text-[#2F7D55] flex items-center justify-center mx-auto border border-[#2F7D55]/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <p className="text-xs text-[#737373]">Mã đơn hàng</p>
              <h3 className="text-xl font-bold font-mono text-[#202124]">
                {confirmedOrder.order_number}
              </h3>
              <p className="text-xs text-[#315C4C] font-semibold mt-0.5">
                {confirmedOrder.payment_method === 'cash' ? 'Tiền mặt tại quầy' : 'Chuyển khoản VietQR'} •{' '}
                {formatCurrency(
                  confirmedOrder.final_amount,
                  activeWorkspace?.currency || 'VND'
                )}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#EAF4EE] text-[#2F7D55] text-xs font-semibold border border-[#2F7D55]/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Đã tự động trừ {confirmedOrder.items?.reduce((s, i) => s + i.quantity, 0)} sản phẩm ra khỏi tồn quầy!
                </span>
              </div>
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
                className="flex-1 text-xs gap-1 border-[#315C4C]/40 text-[#315C4C] hover:bg-[#EAF4EE]"
                onClick={() => setIsReceiptModalOpen(true)}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Xem & In hóa đơn</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="flex-1 text-xs font-bold bg-[#315C4C] text-white"
                onClick={() => setConfirmedOrder(null)}
              >
                Tạo đơn tiếp theo
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cashier Shift & Z-Report Modal */}
      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        boothId={selectedBoothId}
        boothName={selectedBooth?.name || 'Quầy POS'}
        eventId={selectedEventId}
        eventName={selectedEvent?.name || 'Sự kiện'}
      />

      {/* Thermal & Digital Receipt Modal */}
      <ReceiptModal
        order={confirmedOrder}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        eventName={selectedEvent?.name}
        boothName={selectedBooth?.name}
      />

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
