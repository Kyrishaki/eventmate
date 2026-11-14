'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore, useAuthHydrated } from '@/stores/auth-store';
import { getBankDisplayName, useOrdersStore, CartItem, normalizeVietQrBankId } from '@/stores/orders-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { SyncStatusBadge, SyncState } from '@/components/ui/sync-status-badge';
import { formatCurrency, compressImage } from '@/lib/utils';
import { PaymentMethod, Product, ProductVariant, Order } from '@/types/database';
import { calculateVariantStock } from '@/lib/stock-status';
import { PreorderPickupModal } from '@/components/pos/preorder-pickup-modal';
import { ShiftModal } from '@/components/pos/shift-modal';
import { ReceiptModal } from '@/components/pos/receipt-modal';
import { CameraBarcodeScanner } from '@/components/pos/camera-barcode-scanner';
import { useShiftStore } from '@/stores/shift-store';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePreorderStore } from '@/stores/preorder-store';
import { useRealtimeCartSync } from '@/stores/realtime-cart-sync';
import { initCloudSync, fetchCloudSnapshot } from '@/lib/cloud-sync';
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
  Camera,
  Image as ImageIcon,
  AlertCircle,
  Bug,
  Info,
  SlidersHorizontal,
  Copy,
  CopyCheck,
  Volume2,
  Radio,
  Scan,
  Barcode,
  ChevronDown,
  Tag,
  ArrowUpDown,
  Filter,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { playSuccessChime } from '@/lib/sound';
import { FeedbackModal } from '@/components/feedback/feedback-modal';

function subscribeOnline(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
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
  const { events, booths, categories, products, variants, allocations } = useDataStore();
  const {
    orders,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    discountAmount,
    setDiscountAmount,
    submitOrder,
    syncPendingOrders,
    hydrateOfflineDb,
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

  // Real-time Multi-seller Cart & Cloud Synchronization
  const { initSync, broadcastMyCart, getRemoteHeldQty } = useRealtimeCartSync();

  React.useEffect(() => {
    initSync();
    initCloudSync();
  }, [initSync]);

  // Broadcast local cart changes immediately so other cashiers see updated stock
  React.useEffect(() => {
    if (selectedBoothId) {
      broadcastMyCart(selectedBoothId, cart);
    }
  }, [cart, selectedBoothId, broadcastMyCart]);

  // Online / Offline State Listener with Simulated Offline Support
  const isHardwareOnline = useOnlineStatus();
  const [isSimulatedOffline, setIsSimulatedOffline] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_simulated_offline') === 'true';
    }
    return false;
  });
  const isOnline = isHardwareOnline && !isSimulatedOffline;

  const handleToggleOfflineMode = React.useCallback((offline: boolean) => {
    setIsSimulatedOffline(offline);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_simulated_offline', offline ? 'true' : 'false');
    }
  }, []);

  const [isOfflineModalOpen, setIsOfflineModalOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [syncToast, setSyncToast] = React.useState<string | null>(null);
  const [isSyncingNow, setIsSyncingNow] = React.useState(false);
  const prevOnlineRef = React.useRef(isOnline);

  const pendingOrdersCount = React.useMemo(
    () => orders.filter((o) => o.sync_status === 'pending_sync').length,
    [orders]
  );

  const triggerManualSync = React.useCallback(async () => {
    if (!isOnline) {
      alert('Không có kết nối mạng để đồng bộ. Vui lòng kết nối Internet trước.');
      return;
    }
    setIsSyncingNow(true);
    try {
      const res = await syncPendingOrders();
      if (res.successCount > 0) {
        setSyncToast(`Đã đồng bộ thành công ${res.successCount} đơn hàng lên máy chủ!`);
      } else {
        setSyncToast('Tất cả đơn hàng đã ở trạng thái đồng bộ mới nhất.');
      }
    } catch {
      setSyncToast('Lỗi đồng bộ dữ liệu. Vui lòng kiểm tra lại mạng.');
    } finally {
      setIsSyncingNow(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  }, [isOnline, syncPendingOrders]);

  // Re-hydrate local Dexie IndexedDB orders on mount
  React.useEffect(() => {
    if (hydrateOfflineDb) {
      hydrateOfflineDb();
    }
  }, [hydrateOfflineDb]);

  // Auto-sync when reconnecting (or turning off simulated offline)
  React.useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      triggerManualSync();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, triggerManualSync]);

  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = React.useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
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

  // Extended POS Sorting & Filtering States
  const [posSortBy, setPosSortBy] = React.useState<
    'default' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_desc' | 'stock_asc' | 'reserved_desc' | 'newest'
  >('default');
  const [posTagFilter, setPosTagFilter] = React.useState('');
  const [hideSoldOut, setHideSoldOut] = React.useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = React.useState(false);

  const isPosFilterActive =
    posSortBy !== 'default' ||
    posTagFilter !== '' ||
    posSourceFilter !== 'all' ||
    selectedCategory !== 'all' ||
    Boolean(searchQuery.trim()) ||
    hideSoldOut;

  const resetPosFilters = React.useCallback(() => {
    setPosSortBy('default');
    setPosTagFilter('');
    setPosSourceFilter('all');
    setSelectedCategory('all');
    setSearchQuery('');
    setHideSoldOut(false);
  }, []);

  // Selected Variant state per Product & Mobile Variant Picker Modal
  const [selectedVariantMap, setSelectedVariantMap] = React.useState<Record<string, string>>({});
  const [variantPickerProduct, setVariantPickerProduct] = React.useState<Product | null>(null);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [qrSessionRef, setQrSessionRef] = React.useState('8899');
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('qr_manual');
  const [tenderedCash, setTenderedCash] = React.useState<number>(0);
  const [cashInputValue, setCashInputValue] = React.useState('');
  const [qrTemplate, setQrTemplate] = React.useState<'compact2' | 'qr_only'>('compact2');
  const [isQrZoomOpen, setIsQrZoomOpen] = React.useState(false);

  const applyCashPreset = React.useCallback((amount: number) => {
    setTenderedCash(amount);
    if (amount <= 0) {
      setCashInputValue('');
    } else if (amount % 1000 === 0) {
      setCashInputValue(String(amount / 1000));
    } else {
      setCashInputValue((amount / 1000).toFixed(1).replace(/\.0$/, ''));
    }
  }, []);

  const [orderNotes, setOrderNotes] = React.useState('');
  const [proofImage, setProofImage] = React.useState<string | null>(null);
  const [isCapturingProof, setIsCapturingProof] = React.useState(false);

  const handleProofFileChange = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCapturingProof(true);
      const compressed = await compressImage(file, 900, 0.75);
      setProofImage(compressed);
    } catch (err) {
      console.error('Lỗi xử lý ảnh minh chứng:', err);
    } finally {
      setIsCapturingProof(false);
      e.target.value = '';
    }
  }, []);

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

  const openCheckoutModal = React.useCallback(() => {
    setQrSessionRef(Math.floor(1000 + Math.random() * 9000).toString());
    setProofImage(null);
    if (cartTotal > 0) {
      applyCashPreset(cartTotal);
    } else {
      setCashInputValue('');
      setTenderedCash(0);
    }
    setIsCheckoutOpen(true);
  }, [cartTotal, applyCashPreset]);

  // Cash Change & Shortage Calculations
  const cashChange = Math.max(0, (tenderedCash || 0) - cartTotal);
  const cashShortage = Math.max(0, cartTotal - (tenderedCash || 0));
  const isCashUnderpaid = paymentMethod === 'cash' && cartTotal > 0 && (tenderedCash || 0) < cartTotal;

  // Calculate available stock for a variant at currently selected booth
  // (strictly respecting booth allocation, true offline remaining inventory, my current cart, and other cashiers' active carts in real time)
  function getVariantAvailableStock(variantId: string) {
    const effectiveBoothId = selectedBoothId || effectiveBooths[0]?.id || booths[0]?.id;
    if (!effectiveBoothId) return 0;
    const alloc = allocations.find(
      (a) => a.booth_id === effectiveBoothId && a.variant_id === variantId && !a.is_test
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
        .filter((a) => a.variant_id === variantId && !a.is_test)
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

  const normalizeSearchText = (value: string) => value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  const matchesProductSearch = (p: Product) => {
    const query = normalizeSearchText(searchQuery.trim().replace(/^#/, ''));
    if (!query) return true;
    const categoryName = categories.find((category) => category.id === p.category_id)?.name || '';
    return [p.name, categoryName, ...(p.tags || [])].some((value) => normalizeSearchText(value).includes(query)) ||
      variants.some((variant) => variant.product_id === p.id &&
        [variant.sku, variant.barcode || ''].some((value) => normalizeSearchText(value).includes(query)));
  };

  // Each selector shows counts after applying the other selector and shared filters.
  const matchesSharedFilters = (p: Product) => {
    if (posSourceFilter === 'store' && p.collab_partner) return false;
    if (posSourceFilter === 'collab' && !p.collab_partner) return false;
    if (hideSoldOut && !variants.some((v) => v.product_id === p.id && getVariantAvailableStock(v.id) > 0)) return false;
    return matchesProductSearch(p);
  };
  const sharedProducts = activeProducts.filter(matchesSharedFilters);
  const categoryProducts = sharedProducts.filter((p) => !posTagFilter || p.tags?.includes(posTagFilter));
  const tagProducts = sharedProducts.filter((p) =>
    selectedCategory === 'all' || (selectedCategory === 'uncategorized' ? !p.category_id : p.category_id === selectedCategory)
  );
  const categoryCounts = new Map<string, number>();
  categoryProducts.forEach((p) => {
    if (p.category_id) categoryCounts.set(p.category_id, (categoryCounts.get(p.category_id) || 0) + 1);
  });
  const workspaceCategories = {
    list: categories
      .filter((c) => (!activeWorkspace || c.workspace_id === activeWorkspace.id) && (categoryCounts.has(c.id) || c.id === selectedCategory))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({ id: c.id, name: c.name, count: categoryCounts.get(c.id) || 0 })),
    total: categoryProducts.length,
    uncategorizedCount: categoryProducts.filter((p) => !p.category_id).length,
  };
  const tagCounts = new Map<string, number>();
  tagProducts.forEach((product) => {
    new Set(product.tags || []).forEach((tag) => {
      if (tag) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  const productTags = [...new Set([...tagCounts.keys(), ...(posTagFilter ? [posTagFilter] : [])])]
    .sort((a, b) => a.localeCompare(b, 'vi', { sensitivity: 'base' }));

  const filteredProducts = React.useMemo(() => {
    const list = activeProducts.filter((p) => {
      // 1. Source filter
      if (posSourceFilter === 'store' && p.collab_partner) return false;
      if (posSourceFilter === 'collab' && !p.collab_partner) return false;

      // 2. Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'uncategorized') {
          if (p.category_id) return false;
        } else if (p.category_id !== selectedCategory) {
          return false;
        }
      }

      const prodVariants = variants.filter((v) => v.product_id === p.id);
      const totalAvailable = prodVariants.reduce((sum, v) => sum + getVariantAvailableStock(v.id), 0);

      // 3. Hide sold out toggle
      if (hideSoldOut && totalAvailable <= 0) {
        return false;
      }

      // Filter by the product's existing tags.
      if (posTagFilter && !p.tags?.includes(posTagFilter)) return false;

      if (!matchesProductSearch(p)) return false;

      return true;
    });

    // Sắp xếp (Sorting)
    return list.sort((a, b) => {
      const aVariants = variants.filter((v) => v.product_id === a.id);
      const bVariants = variants.filter((v) => v.product_id === b.id);

      // Always keep sellable products ahead of sold-out products.
      const aInStock = aVariants.some((v) => getVariantAvailableStock(v.id) > 0);
      const bInStock = bVariants.some((v) => getVariantAvailableStock(v.id) > 0);
      if (aInStock !== bInStock) return aInStock ? -1 : 1;

      if (posSortBy === 'name_asc') {
        return a.name.localeCompare(b.name, 'vi');
      }
      if (posSortBy === 'name_desc') {
        return b.name.localeCompare(a.name, 'vi');
      }
      if (posSortBy === 'price_asc') {
        const aMin = aVariants.length > 0 ? Math.min(...aVariants.map((v) => v.price)) : 0;
        const bMin = bVariants.length > 0 ? Math.min(...bVariants.map((v) => v.price)) : 0;
        return aMin - bMin;
      }
      if (posSortBy === 'price_desc') {
        const aMax = aVariants.length > 0 ? Math.max(...aVariants.map((v) => v.price)) : 0;
        const bMax = bVariants.length > 0 ? Math.max(...bVariants.map((v) => v.price)) : 0;
        return bMax - aMax;
      }
      if (posSortBy === 'stock_desc') {
        const aStock = aVariants.reduce((sum, v) => sum + getVariantAvailableStock(v.id), 0);
        const bStock = bVariants.reduce((sum, v) => sum + getVariantAvailableStock(v.id), 0);
        return bStock - aStock;
      }
      if (posSortBy === 'stock_asc') {
        const aStock = aVariants.reduce((sum, v) => sum + getVariantAvailableStock(v.id), 0);
        const bStock = bVariants.reduce((sum, v) => sum + getVariantAvailableStock(v.id), 0);
        return aStock - bStock;
      }
      if (posSortBy === 'reserved_desc') {
        const aRes = aVariants.reduce((sum, v) => sum + (v.reserved_quantity || 0), 0);
        const bRes = bVariants.reduce((sum, v) => sum + (v.reserved_quantity || 0), 0);
        return bRes - aRes;
      }
      if (posSortBy === 'newest') {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      }
      return 0;
    });
  }, [
    activeProducts,
    posSourceFilter,
    selectedCategory,
    variants,
    hideSoldOut,
    posTagFilter,
    searchQuery,
    posSortBy,
    allocations,
    cart,
    getRemoteHeldQty,
    selectedBoothId,
    effectiveBooths,
    booths,
  ]);

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

  async function handleCompleteOrder(autoVerifyNote?: string) {
    if (user?.role === 'viewer') {
      alert('Tài khoản của bạn là Khách xem (Chỉ đọc), không thể xác nhận thanh toán đơn hàng.');
      return;
    }
    if (!selectedBooth || !selectedEvent || cart.length === 0) return;
    if (paymentMethod === 'qr_manual' && (!proofImage || !proofImage.trim())) {
      alert('BẮT BUỘC: Vui lòng chụp hoặc tải ảnh minh chứng chuyển khoản trước khi xác nhận đơn!');
      return;
    }
    if (paymentMethod === 'cash' && cartTotal > 0 && (tenderedCash || 0) < cartTotal) {
      alert(`Số tiền khách đưa chưa đủ! Còn thiếu ${cashShortage.toLocaleString('vi-VN')} VND.`);
      return;
    }
    setIsSubmitting(true);

    try {
      const mergedNote = [orderNotes.trim(), autoVerifyNote].filter(Boolean).join(' • ');
      const order = await submitOrder({
        workspaceId: selectedBooth.workspace_id,
        eventId: selectedEvent.id,
        boothId: selectedBooth.id,
        cashierId: user?.id || 'cashier-pos-demo',
        paymentMethod,
        orderNumber: paymentMethod === 'qr_manual' ? `HKTS-${qrSessionRef}` : undefined,
        tenderedAmount: paymentMethod === 'cash' ? (tenderedCash || cartTotal) : undefined,
        changeAmount: paymentMethod === 'cash' ? cashChange : undefined,
        notes: mergedNote || undefined,
        isOnline,
        proofImageUrl: proofImage || undefined,
      });

      setConfirmedOrder(order);
      setProofImage(null);
      useShiftStore.getState().recordOrderInShift(paymentMethod, order.final_amount);
      playSuccessChime();
      setIsCheckoutOpen(false);
      setIsMobileCartOpen(false);
      setTenderedCash(0);
      setCashInputValue('');
      setOrderNotes('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi tạo đơn hàng');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Keyboard Shortcut: Enter to confirm QR payment (only after transfer proof photo is captured)
  React.useEffect(() => {
    if (!isCheckoutOpen || paymentMethod !== 'qr_manual' || isSubmitting || !proofImage) return;

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
  }, [isCheckoutOpen, paymentMethod, isSubmitting, proofImage]);

  const hasAuthHydrated = useAuthHydrated();

  if (!hasAuthHydrated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted mt-3 font-medium">Đang khôi phục ca bán hàng...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-surface border border-border rounded-lg p-6 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-warning-bg text-primary flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Màn hình Bán hàng</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
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
              className="w-full text-xs text-muted gap-1.5"
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
    <div className="min-h-screen lg:h-[100dvh] lg:overflow-hidden bg-background flex flex-col select-none">
      {/* POS Top Navigation Bar */}
      <header className="bg-surface border-b border-border sticky top-0 z-30 shadow-2xs shrink-0">
        {/* Main Bar */}
        <div className="h-14 sm:h-16 px-3 sm:px-5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group" title="Về trang quản lý">
              <div className="h-10 sm:h-12 w-auto flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="HikaruStore Logo"
                  className="h-10 sm:h-12 w-auto max-w-[90px] sm:max-w-[110px] object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <div className="hidden md:flex flex-col">
                <span className="font-extrabold text-sm sm:text-base text-foreground leading-tight">HikaruStore</span>
                <span className="text-[10.5px] text-primary font-bold leading-none">Bán hàng</span>
              </div>
            </Link>

            <Link href="/dashboard" title="Về trang Quản lý">
              <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs text-muted hover:text-foreground gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="font-semibold hidden sm:inline">Quản lý</span>
              </Button>
            </Link>

            {/* Desktop selectors */}
            <div className="hidden sm:flex items-center gap-2 border-l border-border pl-2.5 min-w-0">
              <select
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary max-w-[170px] truncate"
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
                className="h-8 rounded-lg border border-primary/40 bg-background px-2 text-xs font-bold text-primary focus:outline-none focus:border-primary max-w-[150px] truncate"
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

          {/* Mobile Right Controls (< sm) */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            {/* Online / Offline Status Badge */}
            <button
              type="button"
              onClick={() => setIsOfflineModalOpen(true)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                isOnline
                  ? 'bg-success-bg text-primary border-[#CEE6D7]'
                  : 'bg-warning-bg text-warning border-[#F8E3C3]'
              }`}
              title="Xem trạng thái mạng & đồng bộ ngoại tuyến"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-primary' : 'bg-warning'}`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
              {pendingOrdersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-warning text-white text-[9px] font-mono flex items-center justify-center">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            {/* Mobile Quick Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-border bg-surface text-muted hover:text-foreground active:bg-surface-hover transition-colors cursor-pointer"
              aria-label="Menu tác vụ POS"
              title="Menu tác vụ POS"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Mobile Cart Button Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="relative p-2 rounded-lg bg-primary text-primary-foreground font-bold active:scale-95 transition-transform cursor-pointer border border-primary/30"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalCartUnits > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-2xs">
                  {totalCartUnits}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Right Actions (>= sm) */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Real-time Connection Indicator */}
            <button
              type="button"
              onClick={() => setIsOfflineModalOpen(true)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border cursor-pointer ${
                isOnline
                  ? 'bg-success-bg text-primary border-[#CEE6D7]'
                  : 'bg-warning-bg text-warning border-[#F8E3C3]'
              }`}
              title="Trạng thái mạng & Đồng bộ dữ liệu ngoại tuyến"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-primary' : 'bg-warning'}`} />
              <span className="text-[11px] font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-warning text-white font-mono">
                  {pendingOrdersCount} chờ đẩy
                </span>
              )}
            </button>

            {/* Pre-order Pickup Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5 border-warning/40 text-warning hover:bg-warning-bg font-bold shadow-2xs"
              onClick={() => setIsPreorderPickupOpen(true)}
              title="Giao hàng cho khách đặt trước (Keep hàng - Cần chụp ảnh minh chứng)"
            >
              <Package className="w-3.5 h-3.5 text-warning" />
              <span>Giao Keep</span>
              {pendingPreordersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-warning text-white font-mono">
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
                  ? 'border-primary/40 text-primary bg-success-bg hover:bg-[#D8EDE0]'
                  : 'border-warning/40 text-warning bg-warning-bg hover:bg-warning-bg'
              }`}
              title={
                activeShift && activeShift.status === 'open'
                  ? `Ca đang mở (Két: ${(activeShift.startingCashFloat + activeShift.totalCashSales).toLocaleString('vi-VN')} đ) — Nhấn để Chốt ca / Bàn giao`
                  : 'Chưa mở ca — Nhấn để nhập tiền đầu ca'
              }
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>
                {activeShift && activeShift.status === 'open' ? 'Chốt ca' : 'Mở ca'}
              </span>
              {activeShift && activeShift.status === 'open' && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Button>

            <Link href="/pos/orders">
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1">
                <History className="w-3.5 h-3.5" />
                <span>Lịch sử</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs gap-1 text-error border-error/30 hover:bg-error-bg"
              onClick={() => setIsFeedbackOpen(true)}
              title="Góp ý hoặc báo lỗi hệ thống"
            >
              <Bug className="w-3.5 h-3.5 text-error" />
              <span>Góp ý</span>
            </Button>

            <ThemeToggle />

          </div>
        </div>

        {/* Offline Notice Banner */}
        {!isOnline && (
          <div className="bg-warning-bg border-t border-b border-[#F8E3C3] px-3 sm:px-5 py-1.5 text-xs text-warning flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <WifiOff className="w-3.5 h-3.5 shrink-0 text-warning" />
              <span className="font-medium truncate">
                Đang ở chế độ Bán Hàng Ngoại Tuyến (Offline) — Đơn hàng sẽ được lưu vào thiết bị (IndexedDB).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOfflineModalOpen(true)}
              className="font-bold underline shrink-0 text-[11px] hover:text-foreground ml-2 cursor-pointer"
            >
              Chi tiết ({pendingOrdersCount} đơn chờ)
            </button>
          </div>
        )}

        {/* Auto-Sync Reconnection Toast */}
        {syncToast && (
          <div className="bg-success-bg border-t border-b border-[#CEE6D7] px-3 sm:px-5 py-1.5 text-xs text-primary flex items-center gap-2 animate-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{syncToast}</span>
          </div>
        )}

        {/* Mobile Sub-bar: Event & Booth Pickers (large touch targets) */}
        <div className="sm:hidden px-3 py-2 bg-background dark:bg-surface border-t border-border dark:border-border grid grid-cols-2 gap-2">
          <div>
            <span className="text-[9px] font-bold text-muted dark:text-muted uppercase tracking-wider block mb-0.5">
              Sự kiện
            </span>
            <select
              className="w-full h-8 rounded-lg border border-border dark:border-border bg-surface dark:bg-surface-hover px-2 text-xs font-semibold text-foreground dark:text-foreground focus:outline-none focus:border-primary truncate"
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
            <span className="text-[9px] font-bold text-muted dark:text-muted uppercase tracking-wider block mb-0.5">
              Gian hàng
            </span>
            <select
              className="w-full h-8 rounded-lg border border-primary/40 dark:border-emerald-600/40 bg-surface dark:bg-surface-hover px-2 text-xs font-bold text-primary dark:text-success focus:outline-none focus:border-primary truncate"
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
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Product Catalog */}
        <main className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-5 flex flex-col pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-5">
          {/* Search bar & Sold Out Filter Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 sm:mb-4">
            <div className="relative flex-1 w-full sm:max-w-md flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                <Input
                  placeholder="Tìm sản phẩm, mã loại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-surface dark:bg-surface w-full"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="h-9 px-2.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground flex items-center gap-1.5 text-xs font-semibold shrink-0 shadow-2xs active:scale-95 transition-transform cursor-pointer"
                title="Quét mã vạch / QR sản phẩm bằng Camera"
                aria-label="Quét mã vạch Camera"
              >
                <Scan className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
              {/* Toggle: Tự động ẩn hàng bán hết */}
              <button
                type="button"
                onClick={() => setHideSoldOut(!hideSoldOut)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0 ${
                  hideSoldOut
                    ? 'bg-warning-bg dark:bg-success-bg/40 border-primary/40 text-primary dark:text-success font-semibold'
                    : 'bg-surface dark:bg-surface-hover border-border dark:border-border text-muted dark:text-muted hover:text-foreground'
                }`}
                title="Tự động ẩn sản phẩm hết hàng"
              >
                {hideSoldOut ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-primary dark:text-success" />
                    <span>Ẩn hết ({soldOutPosCount})</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-muted" />
                    <span>Hiện tất cả</span>
                  </>
                )}
              </button>

              {selectedBooth?.collab_partner && (
                <Badge variant="warning" className="text-xs shrink-0 whitespace-nowrap">
                  Collab: {selectedBooth.collab_partner}
                </Badge>
              )}
            </div>
          </div>

          {/* Bảng Sắp xếp & Bộ lọc Chi Tiết (Toàn bộ dùng Dropdown chuẩn) */}
          <div className="bg-surface dark:bg-surface border border-border dark:border-border/80 rounded-lg p-2.5 mb-3 shadow-2xs space-y-2">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
              <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-start lg:items-center gap-2 flex-1 min-w-0 w-full">
                {/* 1. Phân loại / Danh mục (Dropdown) */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-1 min-w-0 w-full lg:w-auto lg:flex-none">
                  <Tag className="w-3.5 h-3.5 text-primary dark:text-success shrink-0" />
                  <span className="text-[11px] font-bold text-muted dark:text-muted shrink-0">Phân loại:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-9 lg:h-8 rounded-lg border border-border dark:border-border bg-background dark:bg-surface-hover px-2 text-xs font-semibold text-foreground dark:text-foreground focus:outline-none focus:border-primary w-full min-w-0 lg:w-auto"
                  >
                    <option value="all">Tất cả phân loại ({workspaceCategories.total})</option>
                    {workspaceCategories.list.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.count})
                      </option>
                    ))}
                    {workspaceCategories.uncategorizedCount > 0 && (
                      <option value="uncategorized">
                        Khác / Chưa phân loại ({workspaceCategories.uncategorizedCount})
                      </option>
                    )}
                  </select>
                </div>

                <label className="flex flex-col lg:flex-row items-stretch lg:items-center gap-1 min-w-0 w-full lg:w-auto lg:flex-none">
                  <Tag className="w-3.5 h-3.5 text-primary dark:text-success shrink-0" />
                  <span className="text-[11px] font-bold text-muted dark:text-muted shrink-0">Tag:</span>
                  <select
                    value={posTagFilter}
                    onChange={(e) => setPosTagFilter(e.target.value)}
                    className="h-9 lg:h-8 rounded-lg border border-border dark:border-border bg-background dark:bg-surface-hover px-2 text-xs font-semibold text-foreground dark:text-foreground focus:outline-none focus:border-primary w-full min-w-0 lg:w-auto"
                  >
                    <option value="">Tất cả tag ({tagProducts.length})</option>
                    {productTags.map((tag) => (
                      <option key={tag} value={tag}>{tag} ({tagCounts.get(tag)})</option>
                    ))}
                  </select>
                </label>

                {/* 2. Sắp xếp (Sorting Dropdown) */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-1 min-w-0 w-full lg:w-auto lg:flex-none">
                  <ArrowUpDown className="w-3.5 h-3.5 text-primary dark:text-success shrink-0" />
                  <span className="text-[11px] font-bold text-muted dark:text-muted shrink-0">Sắp xếp:</span>
                  <select
                    value={posSortBy}
                    onChange={(e) => setPosSortBy(e.target.value as any)}
                    className="h-9 lg:h-8 rounded-lg border border-border dark:border-border bg-background dark:bg-surface-hover px-2 text-xs font-semibold text-foreground dark:text-foreground focus:outline-none focus:border-primary w-full min-w-0 lg:w-auto"
                  >
                    <option value="default">Mặc định</option>
                    <option value="name_asc">Tên: A → Z</option>
                    <option value="name_desc">Tên: Z → A</option>
                    <option value="price_asc">Giá: Thấp → Cao</option>
                    <option value="price_desc">Giá: Cao → Thấp</option>
                    <option value="stock_desc">Tồn khả dụng: Nhiều nhất</option>
                    <option value="stock_asc">Tồn khả dụng: Sắp hết (Ít nhất)</option>
                    <option value="reserved_desc">Hàng Keep / Preorder: Nhiều nhất</option>
                    <option value="newest">Mới cập nhật nhất</option>
                  </select>
                </div>

                {/* 3. Nguồn hàng (Source Dropdown) */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-1 min-w-0 w-full lg:w-auto lg:flex-none">
                  <Store className="w-3.5 h-3.5 text-muted dark:text-muted shrink-0" />
                  <span className="text-[11px] font-bold text-muted dark:text-muted shrink-0">Nguồn:</span>
                  <select
                    value={posSourceFilter}
                    onChange={(e) => setPosSourceFilter(e.target.value as any)}
                    className="h-9 lg:h-8 rounded-lg border border-border dark:border-border bg-background dark:bg-surface-hover px-2 text-xs font-semibold text-foreground dark:text-foreground focus:outline-none focus:border-primary w-full min-w-0 lg:w-auto"
                  >
                    <option value="all">Tất cả nguồn hàng</option>
                    <option value="store">👑 Shop chính (HikaruStore)</option>
                    <option value="collab">🤝 Đối tác Collab</option>
                  </select>
                </div>


              </div>

              {/* Result counter & Reset Filter */}
              <div className="flex items-center gap-2 self-end lg:self-center lg:ml-auto">
                <span className="text-xs text-muted dark:text-muted font-medium">
                  Hiển thị <strong className="text-primary dark:text-success font-bold">{filteredProducts.length}</strong> / {activeProducts.length} sản phẩm
                </span>

                {isPosFilterActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetPosFilters}
                    className="h-7 px-2 text-xs text-error hover:bg-error-bg border-[#F8B4AF] gap-1 font-semibold"
                    title="Đặt lại toàn bộ bộ lọc và sắp xếp về mặc định"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Đặt lại</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface border border-border rounded-lg my-auto">
              <Package className="w-12 h-12 text-muted mb-3" />
              {soldOutPosCount > 0 && hideSoldOut ? (
                <>
                  <h3 className="text-sm font-bold text-foreground">Tất cả sản phẩm đã hết hàng</h3>
                  <p className="text-xs text-muted mt-1 max-w-xs">
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
                  <h3 className="text-sm font-bold text-foreground">Chưa có sản phẩm nào tại quầy</h3>
                  <p className="text-xs text-muted mt-1 max-w-xs">
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
                const activeVarId = selectedVariantMap[prod.id] || prodVariants.find((v) => getVariantAvailableStock(v.id) > 0)?.id || prodVariants[0]?.id;
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
                    className="rounded-lg border border-border bg-surface overflow-hidden shadow-2xs hover:border-primary/40 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image: Aspect-Square 1:1 & Object-Contain to preserve original image format without cropping */}
                      <div className="relative w-full aspect-square bg-[#F8F9FA] dark:bg-surface-hover/80 overflow-hidden flex items-center justify-center p-2.5">
                        {prod.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-contain drop-shadow-2xs transition-transform duration-200 hover:scale-105"
                          />
                        ) : (
                          <Package className="w-10 h-10 text-muted" />
                        )}

                        {/* Origin Source Badge (Top Left - ONLY shown for Collab to keep Shop photos clean) */}
                        {prod.collab_partner && (
                          <div className="absolute top-1.5 left-1.5 z-10">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning-bg/95 text-warning border border-warning/30 backdrop-blur-[2px] shadow-2xs">
                              🤝 {prod.collab_partner}
                            </span>
                          </div>
                        )}

                        {/* Stock Badge */}
                        <div className="absolute top-1.5 right-1.5 z-10">
                          {availableStock > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/75 text-white backdrop-blur-[2px]">
                              Còn {availableStock}
                            </span>
                          ) : qtyInCart > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                              {qtyInCart} trong giỏ
                            </span>
                          ) : remoteHeldStock > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning text-white" title="Đang trong giỏ của quầy khác">
                              Quầy khác giữ {remoteHeldStock}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error text-white">
                              Hết hàng
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3">
                        <h4 className="text-xs sm:text-[13px] font-bold text-foreground line-clamp-2 leading-snug min-h-[2.1rem]">
                          {prod.name}
                        </h4>
                        <p className="text-sm sm:text-base font-extrabold text-primary mt-1 font-mono">
                          {formatCurrency(
                            activeVariant?.price || 0,
                            activeWorkspace?.currency || 'VND'
                          )}
                        </p>

                        {/* Mobile Variant Selector: Clean Single-Button Drawer Trigger instead of cramped pill stack! */}
                        {prodVariants.length > 1 ? (
                          <div className="sm:hidden mt-2">
                            <button
                              type="button"
                              onClick={() => setVariantPickerProduct(prod)}
                              className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border text-[11px] font-semibold text-foreground hover:border-primary/50 active:scale-[0.98] transition-all cursor-pointer"
                            >
                              <span className="truncate">{activeVariant?.name || 'Chọn mẫu'}</span>
                              <span className="inline-flex items-center gap-0.5 shrink-0 text-[10px] font-bold text-primary bg-success-bg px-1.5 py-0.2 rounded">
                                {prodVariants.length}
                                <ChevronDown className="w-3 h-3" />
                              </span>
                            </button>
                          </div>
                        ) : activeVariant ? (
                          <p className="sm:hidden text-[11px] text-muted truncate mt-1">
                            {activeVariant.name}
                          </p>
                        ) : null}

                        {/* Desktop Variant Selector Pills */}
                        {prodVariants.length > 1 && (
                          <div className="hidden sm:flex flex-wrap gap-1 mt-2">
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
                                  className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors cursor-pointer ${
                                    isVarSelected
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-surface-hover text-foreground hover:bg-surface-hover'
                                  }`}
                                >
                                  {v.name}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Stock Summary: Mobile Compact vs Desktop Detailed */}
                        {stockBreakdown && (
                          <>
                            {/* Mobile Compact Stock Chip */}
                            <div className="sm:hidden mt-2 px-2 py-1 bg-background rounded border border-border flex items-center justify-between text-[11px]">
                              <span className="text-primary font-bold">
                                Quầy: {availableStock}
                              </span>
                              <span className="text-muted">
                                Kho: <strong className="text-primary">{stockBreakdown.offlineAvailable}</strong>
                              </span>
                            </div>

                            {/* Desktop 5-State Breakdown */}
                            <div className="hidden sm:block mt-2 p-1.5 bg-background rounded-lg border border-border text-[10px] space-y-0.5">
                              <div className="flex items-center justify-between font-semibold">
                                <span className="text-primary">
                                  Tồn quầy: <strong>{availableStock}</strong>
                                </span>
                                <span className="text-muted">
                                  Số lượng: <strong>{stockBreakdown.total}</strong>
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[9px] text-muted">
                                <span>Onl: <strong className="text-foreground">{stockBreakdown.online}</strong></span>
                                <span>Preord: <strong className="text-warning">{stockBreakdown.preord}</strong></span>
                                <span>Đã bán: <strong className="text-primary">{stockBreakdown.offlineSold}</strong></span>
                              </div>
                              <div className="text-[9px] text-primary font-semibold pt-0.5 border-t border-border/60 flex justify-between">
                                <span>Tồn bán offline:</span>
                                <span>{stockBreakdown.offlineAvailable}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart / Inline Stepper Touch Action */}
                    <div className="p-2.5 sm:p-3 pt-0">
                      {qtyInCart > 0 ? (
                        <div className="flex items-center justify-between bg-warning-bg dark:bg-success-bg/40 border border-primary/40 dark:border-emerald-600/40 rounded-lg p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => handleDecrease(activeVariant.id)}
                            className="w-8 h-8 rounded bg-surface dark:bg-surface-hover text-foreground dark:text-foreground flex items-center justify-center font-bold text-sm shadow-2xs hover:bg-surface-hover active:scale-95 transition-transform shrink-0"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="text-center min-w-0 flex-1 px-0.5">
                            <span className="font-bold text-xs text-primary dark:text-success leading-none block truncate">
                              {qtyInCart}
                            </span>
                            <span className="text-[9px] text-muted dark:text-muted leading-none block truncate">trong giỏ</span>
                          </div>
                          <button
                            type="button"
                            disabled={availableStock <= 0}
                            onClick={() => handleIncrease(activeVariant.id)}
                            className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-2xs hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform shrink-0"
                            title={availableStock <= 0 ? 'Đã đạt giới hạn tồn khả dụng' : 'Thêm 1'}
                            aria-label="Tăng số lượng"
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

        {/* Right: Persistent Shopping Cart (Desktop - Fixed Checkout Footer) */}
        <aside className="w-80 lg:w-96 border-l border-border bg-surface flex-col justify-between hidden lg:flex h-full min-h-0 overflow-hidden">
          {/* Cart Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Giỏ hàng</h3>
              <Badge variant="neutral" className="text-[10px]">
                {totalCartUnits} món
              </Badge>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-error hover:underline"
              >
                Xóa giỏ
              </button>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted py-12">
                <ShoppingCart className="w-10 h-10 text-muted mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium text-foreground">Giỏ hàng trống</p>
                <p className="text-[11px] text-muted mt-0.5">
                  Chọn sản phẩm để thêm vào đơn
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.variantId}
                  className="p-2.5 rounded-lg border border-border bg-background flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {item.productName}
                    </p>
                    <p className="text-[11px] text-muted">
                      {item.variantName} • {item.sku}
                    </p>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      {formatCurrency(item.price, activeWorkspace?.currency || 'VND')}
                    </p>
                  </div>

                  {/* Quantity Stepper with Direct Input */}
                  <div className="flex items-center gap-1 shrink-0 bg-surface dark:bg-surface-hover border border-border dark:border-border rounded p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-1 hover:bg-surface-hover dark:hover:bg-surface-hover rounded text-foreground dark:text-foreground transition-colors"
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
                      className="w-10 h-6 text-center text-xs font-bold font-mono bg-transparent border-0 text-foreground dark:text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded"
                      title="Nhập trực tiếp số lượng mua"
                    />
                    <button
                      type="button"
                      disabled={getVariantAvailableStock(item.variantId) <= 0}
                      onClick={() => handleIncrease(item.variantId)}
                      className="p-1 hover:bg-surface-hover dark:hover:bg-surface-hover rounded text-foreground dark:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={getVariantAvailableStock(item.variantId) <= 0 ? 'Đã đạt số lượng tồn khả dụng' : 'Thêm 1'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.variantId)}
                    className="p-1 text-muted hover:text-error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Pricing Summary & Checkout Button (Pinned permanently at bottom) */}
          <div className="p-4 border-t border-border bg-background space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>Tạm tính:</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(cartSubtotal, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Giảm giá:</span>
                <input
                  type="number"
                  min={0}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-24 text-right px-1.5 py-0.5 text-xs border rounded bg-surface font-mono"
                />
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                <span>Tổng cộng:</span>
                <span className="text-base text-primary">
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
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-surface dark:bg-surface border-t border-border dark:border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg z-30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <div
            onClick={() => setIsMobileCartOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                {totalCartUnits}
              </span>
            </div>
            <div className="truncate">
              <p className="text-[11px] text-muted dark:text-muted leading-none">Giỏ hàng • {totalCartUnits} món</p>
              <p className="text-base font-bold text-primary dark:text-success leading-tight mt-1">
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
              className="h-10 px-4 text-xs font-bold bg-primary text-primary-foreground shadow-xs active:scale-95 transition-transform"
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
            <div className="text-center py-8 text-muted">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-muted" />
              <p className="text-xs">Chưa có sản phẩm nào trong giỏ hàng</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[45vh] overflow-y-auto -mx-2 px-2">
              {cart.map((item) => (
                <div key={item.variantId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{item.productName}</p>
                    <p className="text-[11px] text-muted">
                      {item.variantName} • {formatCurrency(item.price, activeWorkspace?.currency || 'VND')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-border rounded-lg bg-surface">
                      <button
                        type="button"
                        onClick={() => handleDecrease(item.variantId)}
                        className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground active:bg-surface-hover"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={getVariantAvailableStock(item.variantId) <= 0}
                        onClick={() => handleIncrease(item.variantId)}
                        className="w-7 h-7 flex items-center justify-center text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed active:bg-surface-hover"
                        title={getVariantAvailableStock(item.variantId) <= 0 ? 'Đã đạt số lượng tồn khả dụng' : 'Thêm 1'}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.variantId)}
                      className="p-1.5 text-error hover:bg-error-bg rounded"
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
            <div className="space-y-2 pt-3 border-t border-border text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>Tạm tính:</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(cartSubtotal, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Giảm giá:</span>
                <input
                  type="number"
                  min={0}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-24 text-right px-1.5 py-0.5 text-xs border rounded bg-surface font-mono"
                />
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                <span>Tổng cộng:</span>
                <span className="text-base text-primary">
                  {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="h-10 text-xs text-error"
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
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('qr_manual')}
              className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                paymentMethod === 'qr_manual'
                  ? 'border-primary bg-warning-bg text-primary'
                  : 'border-border bg-surface text-muted hover:bg-background'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>Chuyển khoản VietQR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMethod('cash');
                if (tenderedCash === 0 && cartTotal > 0) {
                  applyCashPreset(cartTotal);
                }
              }}
              className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                paymentMethod === 'cash'
                  ? 'border-primary bg-warning-bg text-primary'
                  : 'border-border bg-surface text-muted hover:bg-background'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>Tiền mặt</span>
            </button>
          </div>

          {/* Mode 1: VietQR Dynamic Code Generator */}
          {paymentMethod === 'qr_manual' && (
            <div className="p-4 bg-background border border-border rounded-lg text-center space-y-3.5">
              {/* Status badge */}
              <div
                className={`flex items-center justify-center gap-2 text-xs font-semibold py-1.5 px-3 rounded-full mx-auto w-fit border ${
                  proofImage
                    ? 'text-primary bg-success-bg border-primary/30'
                    : 'text-warning bg-warning-bg border-[#F5C27A]/50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    proofImage ? 'bg-primary' : 'bg-warning animate-pulse'
                  }`}
                />
                <span>
                  {proofImage
                    ? 'Đã có ảnh minh chứng CK • Bấm nút xanh hoặc [Enter] để hoàn tất'
                    : 'Quét mã VietQR • Chụp/tải ảnh minh chứng CK để xác nhận đơn'}
                </span>
              </div>

              {/* Real dynamic VietQR image with offline fallback */}
              {!isOnline ? (
                <figure className="flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/offline-transfer-qr.png"
                    alt="QR chuyển khoản VietinBank — NGUYEN BAO THUONG — 109876880260"
                    className="w-full max-w-sm rounded-xl object-contain"
                  />
                  <figcaption className="text-xs text-gold-text dark:text-gold-text text-center">
                    Đang offline: nhập số tiền và nội dung HKTS-{qrSessionRef} khi chuyển khoản.
                  </figcaption>
                </figure>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <div
                    onClick={() => setIsQrZoomOpen(true)}
                    className="w-full max-w-[320px] sm:max-w-[360px] aspect-square mx-auto bg-surface p-3 sm:p-4 rounded-2xl border-2 border-primary/40 shadow-md flex items-center justify-center relative cursor-pointer group hover:border-primary transition-all"
                    title="Nhấn để phóng to toàn màn hình cho khách quét"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.vietqr.io/image/${normalizeVietQrBankId(activeBankConfig.bankId)}-${activeBankConfig.accountNo}-${qrTemplate}.png?amount=${cartTotal}&addInfo=HKTS-${qrSessionRef}&accountName=${encodeURIComponent(
                        activeBankConfig.accountName
                      )}`}
                      alt="VietQR code"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-2.5 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-surface/90 text-white px-3 py-1 rounded-full shadow-md">
                        <Maximize2 className="w-3.5 h-3.5 text-gold-text" />
                        Chạm để phóng to QR
                      </span>
                    </div>
                  </div>

                  {/* QR Controls: Template Switcher & Fullscreen Trigger */}
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setQrTemplate('compact2')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        qrTemplate === 'compact2'
                          ? 'bg-primary text-primary-foreground shadow-2xs'
                          : 'bg-surface-hover dark:bg-surface-hover text-muted dark:text-muted hover:text-foreground'
                      }`}
                    >
                      Kèm logo ngân hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrTemplate('qr_only')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        qrTemplate === 'qr_only'
                          ? 'bg-primary text-primary-foreground shadow-2xs'
                          : 'bg-surface-hover dark:bg-surface-hover text-muted dark:text-muted hover:text-foreground'
                      }`}
                      title="Chỉ hiển thị ô mã QR to kín khung, không viền chữ để máy quét nhanh nhất"
                    >
                      Mã QR Siêu to (Dễ quét)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQrZoomOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/15 text-gold-text dark:text-gold-text hover:bg-primary/25 border border-primary/30 transition-colors cursor-pointer"
                      title="Mở toàn màn hình cho khách quét từ xa"
                    >
                      <Maximize2 className="w-3 h-3 text-gold-text dark:text-gold-text" />
                      <span>Phóng to</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-muted space-y-1 bg-surface p-2.5 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span>Ngân hàng:</span>
                  <span className="font-bold text-foreground">{getBankDisplayName(activeBankConfig.bankId)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Số tài khoản:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined') {
                        navigator.clipboard.writeText(activeBankConfig.accountNo);
                      }
                    }}
                    className="flex items-center gap-1 font-mono font-extrabold text-foreground hover:text-primary cursor-pointer"
                    title="Nhấn để sao chép"
                  >
                    <span>{activeBankConfig.accountNo}</span>
                    <Copy className="w-3 h-3 text-muted" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Chủ tài khoản:</span>
                  <span className="font-semibold text-foreground">{activeBankConfig.accountName}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="font-bold text-foreground">Số tiền cần CK:</span>
                  <span className="font-extrabold text-primary text-sm">
                    {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Nội dung chuyển:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-warning bg-warning-bg px-1.5 py-0.5 rounded border border-warning/20 select-all">
                      HKTS-{qrSessionRef}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined') {
                          navigator.clipboard.writeText(`HKTS-${qrSessionRef}`);
                        }
                      }}
                      className="p-0.5 px-1.5 rounded bg-background hover:bg-surface-hover text-muted text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Nhấn để sao chép nội dung CK"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Proof of Payment Photo Capture Section (MANDATORY for bank transfer orders) */}
              <div
                className={`p-3 rounded-lg border text-left space-y-2 ${
                  proofImage
                    ? 'bg-background dark:bg-surface-hover border-primary/40'
                    : 'bg-warning-bg/70 dark:bg-amber-950/20 border-warning/50 dark:border-amber-700/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground dark:text-foreground flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-primary dark:text-success" />
                    <span>Ảnh minh chứng chuyển khoản:</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      Bắt buộc
                    </span>
                  </span>
                  {proofImage && (
                    <button
                      type="button"
                      onClick={() => setProofImage(null)}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>

                {proofImage ? (
                  <div className="flex items-center gap-3 p-2 bg-success-bg dark:bg-success-bg/40 border border-primary/30 rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofImage}
                      alt="Minh chứng chuyển khoản"
                      className="w-16 h-16 object-cover rounded border border-primary/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-bold text-primary dark:text-success flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã đính kèm ảnh chuyển khoản</span>
                      </p>
                      <p className="text-[11px] text-muted dark:text-muted mt-0.5">
                        Ảnh sẽ được lưu kèm đơn hàng để Quản lý / Admin đối soát.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-warning dark:text-gold-text">
                      Vui lòng chụp màn hình hoặc bill chuyển khoản của khách trước khi bấm xác nhận đơn.
                    </p>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="pos-proof-camera-input"
                        className="flex-1 py-2 px-3 rounded-lg border border-primary bg-success-bg dark:bg-success-bg/40 text-primary dark:text-success text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#DDF0E4] cursor-pointer transition-colors shadow-2xs"
                      >
                        <Camera className="w-4 h-4 shrink-0" />
                        <span>{isCapturingProof ? 'Đang xử lý...' : 'Chụp ảnh màn hình CK'}</span>
                        <input
                          id="pos-proof-camera-input"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleProofFileChange}
                        />
                      </label>

                      <label
                        htmlFor="pos-proof-upload-input"
                        className="py-2 px-3 rounded-lg border border-border-strong dark:border-border bg-surface dark:bg-surface-hover text-[#494949] dark:text-muted text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-background cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5 shrink-0 text-muted" />
                        <span>Tải ảnh từ máy</span>
                        <input
                          id="pos-proof-upload-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProofFileChange}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Cashier direct confirmation action (requires transfer proof photo) */}
              <div className="pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting || !proofImage}
                  isLoading={isSubmitting}
                  onClick={() => handleCompleteOrder()}
                  className="w-full gap-2 bg-primary hover:bg-[#256343] text-primary-foreground font-extrabold text-xs py-3 shadow-sm transform active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>
                    {proofImage
                      ? `✓ ĐÃ NHẬN TIỀN (${formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}) - HOÀN TẤT ĐƠN [ENTER]`
                      : 'CHỤP / TẢI ẢNH MINH CHỨNG CK ĐỂ XÁC NHẬN'}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Mode 2: Cash Drawer & Change Calculator */}
          {paymentMethod === 'cash' && (
            <div className="p-4 bg-background border border-border rounded-lg space-y-3 text-xs">
              {/* Total required */}
              <div className="p-3 bg-surface border border-border rounded-lg flex items-center justify-between">
                <span className="font-semibold text-muted">Cần thu:</span>
                <span className="text-base font-extrabold text-primary">
                  {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                </span>
              </div>

              {/* Manual input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tendered-cash" className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                    <Coins className="w-3.5 h-3.5 text-primary" />
                    <span>Tiền khách đưa (Đơn vị nghìn đồng):</span>
                  </Label>
                  {tenderedCash > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setTenderedCash(0);
                        setCashInputValue('');
                      }}
                      className="text-[11px] font-semibold text-error hover:underline cursor-pointer"
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
                    value={cashInputValue}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      if (!val) {
                        setCashInputValue('');
                        setTenderedCash(0);
                        return;
                      }
                      const numVal = parseInt(val, 10);
                      // If cashier accidentally typed full zeros (e.g. 50000 or 100000)
                      if (numVal >= 10000 && numVal % 1000 === 0 && val.endsWith('000')) {
                        val = String(numVal / 1000);
                      }
                      setCashInputValue(val);
                      const parsedThousands = parseFloat(val) || 0;
                      setTenderedCash(Math.round(parsedThousands * 1000));
                    }}
                    onFocus={(e) => e.target.select()}
                    placeholder="Gõ số nghìn (VD: 1 = 1k, 50 = 50k, 100 = 100k)..."
                    className="h-12 text-xl font-mono font-extrabold bg-surface text-foreground pr-24 focus:border-primary"
                    autoFocus
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    <span className="font-mono font-black text-sm text-primary bg-success-bg px-2 py-1 rounded border border-primary/30">
                      .000 ₫
                    </span>
                  </div>
                </div>

                {/* Real converted amount indicator */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-muted flex items-center gap-1.5">
                    <span>Thực nhận:</span>
                    <strong className="text-sm font-extrabold text-foreground font-mono">
                      {formatCurrency(tenderedCash, activeWorkspace?.currency || 'VND')}
                    </strong>
                  </span>
                  <span className="text-[11px] text-primary font-semibold bg-success-bg px-2 py-0.5 rounded">
                    ⚡ Tự thêm 3 số 0 (1 = 1.000đ)
                  </span>
                </div>

                {/* Quick Cash Presets */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => applyCashPreset(cartTotal)}
                    className="h-8 px-2 rounded-lg border border-primary/40 bg-success-bg text-primary font-bold text-xs hover:bg-[#D8EDE0] active:scale-95 transition-all truncate cursor-pointer"
                  >
                    Đúng số tiền
                  </button>
                  {[50000, 100000, 200000, 500000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyCashPreset(preset)}
                      className="h-8 px-1.5 rounded-lg border border-border bg-surface text-foreground font-semibold text-xs hover:bg-background active:scale-95 transition-all truncate font-mono cursor-pointer"
                    >
                      {preset >= 1000 ? `${preset / 1000}k` : preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change / Shortage Status Display */}
              {tenderedCash === 0 ? (
                <div className="p-2 rounded-lg bg-surface border border-dashed border-border-strong text-center text-muted text-[11px]">
                  Nhập tiền khách đưa để tính tiền thối
                </div>
              ) : isCashUnderpaid ? (
                <div className="p-3 bg-warning-bg border border-error/30 rounded-lg space-y-0.5 text-xs text-error">
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
                <div className="p-3 bg-success-bg border border-primary/30 rounded-lg space-y-1 text-xs text-primary">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Tiền thối lại:</span>
                    <span className="text-lg font-extrabold text-primary">
                      {cashChange === 0 ? '0 ₫ (Vừa đủ)' : formatCurrency(cashChange, activeWorkspace?.currency || 'VND')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted pt-0.5 border-t border-primary/20">
                    <span>Đã nhận: {formatCurrency(tenderedCash, activeWorkspace?.currency || 'VND')}</span>
                    <span>Đơn: {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}</span>
                  </div>
                </div>
              )}
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
              className="h-8 text-xs bg-surface"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
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
              onClick={() => handleCompleteOrder()}
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

      {/* Modal Phóng To QR Siêu Lớn Cho Khách Quét */}
      {isQrZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none cursor-pointer"
          onClick={() => setIsQrZoomOpen(false)}
        >
          <div
            className="relative bg-surface rounded-3xl p-5 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsQrZoomOpen(false)}
              className="absolute top-3.5 right-3.5 p-2 rounded-full bg-surface-hover hover:bg-surface-hover text-muted transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Quét mã VietQR thanh toán
              </span>
              <h3 className="font-extrabold text-xl text-muted">
                {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
              </h3>
            </div>

            {/* Giant QR Matrix - Max Clear Resolution */}
            <div className="w-full max-w-[320px] sm:max-w-[360px] aspect-square bg-surface border-2 border-border rounded-2xl flex items-center justify-center p-2 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={isOnline
                  ? `https://img.vietqr.io/image/${normalizeVietQrBankId(activeBankConfig.bankId)}-${activeBankConfig.accountNo}-${qrTemplate}.png?amount=${cartTotal}&addInfo=HKTS-${qrSessionRef}&accountName=${encodeURIComponent(activeBankConfig.accountName)}`
                  : '/offline-transfer-qr.png'}
                alt="VietQR Fullscreen"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Bank details summary */}
            <div className="w-full bg-surface-hover border border-border rounded-xl p-3 text-muted space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Nội dung CK:</span>
                <span className="font-mono font-black text-sm bg-amber-100 text-amber-950 px-2 py-0.5 rounded border border-amber-300">
                  HKTS-{qrSessionRef}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-border">
                <span>{getBankDisplayName(activeBankConfig.bankId)} • {activeBankConfig.accountNo}</span>
                <span className="font-semibold">{activeBankConfig.accountName}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full font-black text-sm"
              onClick={() => setIsQrZoomOpen(false)}
            >
              Đóng phóng to [ESC]
            </Button>
          </div>
        </div>
      )}

      {/* Order Confirmed Screen Modal */}
      <Modal
        isOpen={!!confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        title="Thanh toán thành công!"
        description="Giao dịch đã được ghi nhận hoàn tất. Hệ thống đã tự động trừ số lượng sản phẩm khỏi tồn kho quầy."
      >
        {confirmedOrder && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-success-bg text-primary flex items-center justify-center mx-auto border border-primary/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <p className="text-xs text-muted">Mã đơn hàng</p>
              <h3 className="text-xl font-bold font-mono text-foreground">
                {confirmedOrder.order_number}
              </h3>
              <p className="text-xs text-primary font-semibold mt-0.5">
                {confirmedOrder.payment_method === 'cash' ? 'Tiền mặt tại quầy' : 'Chuyển khoản VietQR'} •{' '}
                {formatCurrency(
                  confirmedOrder.final_amount,
                  activeWorkspace?.currency || 'VND'
                )}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-success-bg text-primary text-xs font-semibold border border-primary/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Đã tự động trừ {confirmedOrder.items?.reduce((s, i) => s + i.quantity, 0)} sản phẩm ra khỏi tồn quầy!
                </span>
              </div>
            </div>

            {confirmedOrder.proof_image_url && (
              <div className="p-2.5 bg-background dark:bg-surface-hover rounded-lg border border-border dark:border-border flex items-center gap-3 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={confirmedOrder.proof_image_url}
                  alt="Minh chứng"
                  className="w-12 h-12 object-cover rounded border border-primary/30 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-primary dark:text-success block">
                    ✓ Đã lưu ảnh minh chứng CK
                  </span>
                  <span className="text-[10px] text-muted dark:text-muted">
                    Đã sẵn sàng trên Dashboard quản trị để đối soát
                  </span>
                </div>
              </div>
            )}

            {confirmedOrder.payment_method === 'cash' && confirmedOrder.tendered_amount != null && (
              <div className="p-3 bg-success-bg border border-primary/30 rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-muted">
                  <span>Tiền khách đưa:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(confirmedOrder.tendered_amount, activeWorkspace?.currency || 'VND')}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-primary">
                  <span>Tiền thối lại:</span>
                  <span>
                    {formatCurrency(confirmedOrder.change_amount || 0, activeWorkspace?.currency || 'VND')}
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 bg-background rounded-lg border border-border text-left text-xs space-y-1.5 max-h-40 overflow-y-auto">
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
              <div className="p-2.5 bg-warning-bg border border-[#F8E3C3] text-warning rounded-lg text-xs">
                ⚠️ Đơn hàng đã được lưu ngoại tuyến an toàn vào thiết bị (IndexedDB). Sẽ tự động tải lên khi có mạng.
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs gap-1 border-primary/40 text-primary hover:bg-success-bg"
                onClick={() => setIsReceiptModalOpen(true)}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Xem & In hóa đơn</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="flex-1 text-xs font-bold bg-primary text-primary-foreground"
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

      {/* Offline & Sync Control Center Modal */}
      <Modal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        title="Trung tâm Ngoại tuyến & Đồng bộ"
        description="Kiểm soát trạng thái mạng và lưu trữ ngoại tuyến của máy POS."
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Connection Status Card */}
          <div className="p-3.5 rounded-lg border border-border bg-background space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Đường truyền mạng vật lý:</span>
              <span
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  isHardwareOnline ? 'text-primary' : 'text-error'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHardwareOnline ? 'bg-primary' : 'bg-error'
                  }`}
                />
                {isHardwareOnline ? 'Có kết nối Internet' : 'Mất kết nối Internet'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted">Trạng thái hoạt động POS:</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  isOnline
                    ? 'bg-success-bg text-primary border-[#CEE6D7]'
                    : 'bg-warning-bg text-warning border-[#F8E3C3]'
                }`}
              >
                {isOnline ? '🟢 Online (Trực tuyến)' : '🟠 Offline (Lưu trữ cục bộ)'}
              </span>
            </div>
          </div>

          {/* Offline Testing Simulation Toggle */}
          <div className="p-3.5 rounded-lg border border-border bg-surface space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Mô phỏng Chế độ Ngoại tuyến</p>
                <p className="text-[11px] text-muted mt-0.5">
                  Thử nghiệm bán hàng khi mất mạng Internet.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSimulatedOffline}
                  onChange={(e) => handleToggleOfflineMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warning" />
              </label>
            </div>
            {isSimulatedOffline && (
              <p className="text-[11px] text-warning bg-warning-bg p-2 rounded border border-[#F8E3C3]">
                ⚡ Đang bật mô phỏng ngoại tuyến. Các đơn hàng tạo mới sẽ được lưu trữ vào IndexedDB và chuyển sang hàng đợi đồng bộ.
              </p>
            )}
          </div>

          {/* Pending Sync Queue Card */}
          <div className="p-3.5 rounded-lg border border-border bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">Đơn hàng chờ đồng bộ:</span>
                <p className="text-[11px] text-muted">Lưu trữ trong IndexedDB & LocalStorage</p>
              </div>
              <span className="text-lg font-mono font-bold text-primary">
                {pendingOrdersCount} đơn
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!isOnline || isSyncingNow || pendingOrdersCount === 0}
                isLoading={isSyncingNow}
                onClick={triggerManualSync}
                className="flex-1 text-xs font-bold gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đồng bộ ngay bây giờ</span>
              </Button>

              <Link href="/pos/sync" className="shrink-0" onClick={() => setIsOfflineModalOpen(false)}>
                <Button variant="outline" size="sm" className="text-xs">
                  Xem chi tiết
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-[11px] text-muted bg-background p-2.5 rounded border border-border space-y-1">
            <p className="font-semibold text-foreground">Cơ chế lưu trữ Offline của HikaruStore:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[#555]">
              <li>Hỗ trợ Service Worker (PWA) giúp tải lại trang ngay cả khi ngắt toàn bộ Wifi/4G.</li>
              <li>Mọi đơn hàng tạo khi mất mạng được bảo toàn 100% bằng Idempotency Key.</li>
              <li>Tự động đẩy dữ liệu lên máy chủ ngay khi thiết bị kết nối lại mạng.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Mobile Quick Action Drawer / Menu Modal */}
      <Modal
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Tác vụ nhanh POS"
        description="Menu các chức năng hỗ trợ bán hàng tại sự kiện."
        maxWidth="md"
      >
        <div className="space-y-3">
          {/* Camera Barcode Scanner */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsScannerOpen(true);
            }}
            className="w-full p-3 rounded-lg border border-primary/40 bg-success-bg hover:bg-[#D8EDE0] flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Quét mã vạch sản phẩm (Camera)</p>
                <p className="text-[11px] text-primary">Dùng camera điện thoại quét barcode/QR để thêm vào giỏ</p>
              </div>
            </div>
            <span className="text-xs font-bold text-primary">Quét ngay</span>
          </button>

          {/* Shift / Cash Float */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsShiftModalOpen(true);
            }}
            className="w-full p-3 rounded-lg border border-border bg-surface hover:bg-background flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-success-bg text-primary flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {activeShift && activeShift.status === 'open' ? 'Quản lý ca bán hàng (Đang mở)' : 'Mở ca bán hàng'}
                </p>
                <p className="text-[11px] text-muted">
                  {activeShift && activeShift.status === 'open'
                    ? `Két hiện tại: ${(activeShift.startingCashFloat + activeShift.totalCashSales).toLocaleString('vi-VN')} đ`
                    : 'Nhập tiền lẻ đầu ca để quản lý két'}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary">
              {activeShift && activeShift.status === 'open' ? 'Chốt ca' : 'Mở ca'}
            </span>
          </button>

          {/* Pre-order Pickup */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsPreorderPickupOpen(true);
            }}
            className="w-full p-3 rounded-lg border border-border bg-surface hover:bg-background flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-warning-bg text-warning flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Trả hàng đặt trước (Pre-order)</p>
                <p className="text-[11px] text-muted">Xác nhận và chụp ảnh minh chứng nhận hàng</p>
              </div>
            </div>
            {pendingPreordersCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-warning text-white">
                {pendingPreordersCount} chờ nhận
              </span>
            ) : (
              <span className="text-xs text-muted">0</span>
            )}
          </button>

          {/* Order History */}
          <Link
            href="/pos/orders"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full p-3 rounded-lg border border-border bg-surface hover:bg-background flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-surface-hover text-foreground flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Lịch sử đơn hàng POS</p>
                <p className="text-[11px] text-muted">Xem lại tất cả hóa đơn đã bán tại quầy</p>
              </div>
            </div>
            <span className="text-xs text-muted">Xem &rarr;</span>
          </Link>

          {/* Offline & Sync Center */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsOfflineModalOpen(true);
            }}
            className="w-full p-3 rounded-lg border border-border bg-surface hover:bg-background flex items-center justify-between text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-warning-bg text-primary flex items-center justify-center shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Trạng thái Ngoại tuyến & Đồng bộ</p>
                <p className="text-[11px] text-muted">
                  {isOnline ? '🟢 Đang có mạng' : '🟠 Đang ngoại tuyến'} • {pendingOrdersCount} đơn chờ đẩy
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary">Cài đặt</span>
          </button>

          {/* Display & Preferences */}
          <div className="p-3 rounded-lg border border-border bg-background space-y-2.5">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Tùy chỉnh hiển thị & Giao diện
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">Tỉ lệ màn hình:</span>
              </div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-xs text-foreground">Chế độ sáng / tối:</span>
              <ThemeToggle />
            </div>
          </div>

          {/* Back to Dashboard */}
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full p-2.5 rounded-lg border border-border bg-surface hover:bg-background text-foreground flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
            <span>Quay lại Trang Quản lý (Dashboard)</span>
          </Link>

          {/* Bug Report */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsFeedbackOpen(true);
            }}
            className="w-full p-2.5 rounded-lg border border-error/30 text-error hover:bg-error-bg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
          >
            <Bug className="w-4 h-4" />
            <span>Góp ý & Báo lỗi hệ thống</span>
          </button>
        </div>
      </Modal>

      {/* Camera Barcode & QR Scanner Modal */}
      <CameraBarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        variants={variants}
        onProductScanned={(scannedProd, scannedVariant) => {
          const available = getVariantAvailableStock(scannedVariant.id);
          if (available <= 0) {
            alert(`Sản phẩm "${scannedProd.name} - ${scannedVariant.name}" đã hết hàng khả dụng tại quầy!`);
            return;
          }
          addToCart({
            variantId: scannedVariant.id,
            productId: scannedProd.id,
            productName: scannedProd.name,
            variantName: scannedVariant.name,
            sku: scannedVariant.sku,
            price: scannedVariant.price,
            maxAvailable: available + (cart.find((c) => c.variantId === scannedVariant.id)?.quantity || 0),
            imageUrl: scannedProd.image_url,
          });
        }}
      />

      {/* Mobile Variant Picker Bottom Sheet / Modal */}
      <Modal
        isOpen={!!variantPickerProduct}
        onClose={() => setVariantPickerProduct(null)}
        title={variantPickerProduct?.name || 'Chọn phân loại sản phẩm'}
        description="Chọn mẫu / nhân vật / size để thêm vào giỏ hàng"
        maxWidth="md"
      >
        {variantPickerProduct && (() => {
          const modalVariants = variants.filter((v) => v.product_id === variantPickerProduct.id);
          return (
            <div className="space-y-3">
              {/* Product Summary Header */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-border">
                <div className="w-12 h-12 rounded-lg bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {variantPickerProduct.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={variantPickerProduct.image_url}
                      alt={variantPickerProduct.name}
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground line-clamp-2">
                    {variantPickerProduct.name}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {modalVariants.length} phân loại sản phẩm
                  </p>
                </div>
              </div>

              {/* Variants List */}
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-0.5">
                {modalVariants.map((v) => {
                  const stock = getVariantAvailableStock(v.id);
                  const inCart = getVariantInCartQty(v.id);
                  const isSelected = (selectedVariantMap[variantPickerProduct.id] || modalVariants[0]?.id) === v.id;

                  return (
                    <div
                      key={v.id}
                      onClick={() =>
                        setSelectedVariantMap({
                          ...selectedVariantMap,
                          [variantPickerProduct.id]: v.id,
                        })
                      }
                      className={`p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-success-bg/60 border-primary'
                          : 'bg-surface border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground leading-snug">
                          {v.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                          <span className="font-bold text-primary font-mono">
                            {formatCurrency(v.price, activeWorkspace?.currency || 'VND')}
                          </span>
                          <span className="text-[11px] font-mono text-muted">
                            {v.sku}
                          </span>
                          {stock > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-success-bg text-primary text-[10px] font-bold">
                              Còn {stock}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-error-bg text-error text-[10px] font-bold">
                              Hết hàng
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {inCart > 0 ? (
                          <div className="flex items-center gap-1.5 bg-warning-bg border border-primary/40 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleDecrease(v.id)}
                              className="w-8 h-8 rounded bg-surface text-foreground flex items-center justify-center font-bold border border-border"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center font-bold text-xs text-primary">
                              {inCart}
                            </span>
                            <button
                              type="button"
                              disabled={stock <= 0}
                              onClick={() => handleIncrease(v.id)}
                              className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold disabled:opacity-30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={stock <= 0}
                            onClick={() => {
                              setSelectedVariantMap({
                                ...selectedVariantMap,
                                [variantPickerProduct.id]: v.id,
                              });
                              addToCart({
                                variantId: v.id,
                                productId: variantPickerProduct.id,
                                productName: variantPickerProduct.name,
                                variantName: v.name,
                                sku: v.sku,
                                price: v.price,
                                maxAvailable: stock,
                                imageUrl: variantPickerProduct.image_url,
                              });
                            }}
                            className="h-9 px-3 text-xs font-bold gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVariantPickerProduct(null)}
                  className="w-full sm:w-auto h-9 text-xs font-semibold"
                >
                  Đóng
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
