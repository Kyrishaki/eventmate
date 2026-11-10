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
} from 'lucide-react';

export default function PosTerminalPage() {
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
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

  // Active Event & Booth Selection
  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );
  const [selectedEventId, setSelectedEventId] = React.useState<string>(
    workspaceEvents[0]?.id || ''
  );

  const eventBooths = booths.filter((b) => b.event_id === selectedEventId);
  const [selectedBoothId, setSelectedBoothId] = React.useState<string>(
    eventBooths[0]?.id || ''
  );

  // Online / Offline State Listener
  const [isOnline, setIsOnline] = React.useState<boolean>(true);
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

  // When event changes, auto-select first booth
  React.useEffect(() => {
    const available = booths.filter((b) => b.event_id === selectedEventId);
    if (available.length > 0 && !available.some((b) => b.id === selectedBoothId)) {
      setSelectedBoothId(available[0].id);
    }
  }, [selectedEventId, booths, selectedBoothId]);

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

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedBooth = booths.find((b) => b.id === selectedBoothId);

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const totalCartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cash Change
  const cashChange = Math.max(0, (tenderedCash || 0) - cartTotal);

  // Filtered Products
  const activeProducts = products.filter(
    (p) => (!activeWorkspace || p.workspace_id === activeWorkspace.id) && p.is_active
  );

  const filteredProducts = activeProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variants
        .filter((v) => v.product_id === p.id)
        .some((v) => v.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Calculate available stock for a variant at currently selected booth
  function getVariantAvailableStock(variantId: string) {
    if (!selectedBoothId) return 0;
    const alloc = allocations.find(
      (a) => a.booth_id === selectedBoothId && a.variant_id === variantId
    );
    if (!alloc) return 0;
    const inCart = cart.find((c) => c.variantId === variantId)?.quantity || 0;
    return Math.max(0, alloc.allocated_quantity - alloc.sold_quantity - inCart);
  }

  function handleAddToCart(product: Product) {
    const prodVariants = variants.filter((v) => v.product_id === product.id);
    if (prodVariants.length === 0) return;

    // Use currently selected variant or first
    const activeVarId = selectedVariantMap[product.id] || prodVariants[0].id;
    const variant = prodVariants.find((v) => v.id === activeVarId) || prodVariants[0];

    const available = getVariantAvailableStock(variant.id);
    if (available <= 0) return;

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
      alert('Đã đạt giới hạn hạn mức phân bổ cho quầy này.');
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
    if (!selectedBooth || !selectedEvent || cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const order = await submitOrder({
        workspaceId: selectedBooth.workspace_id,
        eventId: selectedEvent.id,
        boothId: selectedBooth.id,
        cashierId: user?.id || 'cashier-pos-demo',
        paymentMethod,
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
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {workspaceEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>

              <select
                className="h-8 rounded-[4px] border border-[#315C4C]/40 bg-[#F7F7F5] px-2 text-xs font-bold text-[#315C4C] focus:outline-none focus:border-[#315C4C] max-w-[150px] truncate"
                value={selectedBoothId}
                onChange={(e) => setSelectedBoothId(e.target.value)}
              >
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

            <Link href="/pos/orders">
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1">
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lịch sử</span>
              </Button>
            </Link>

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
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
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
              onChange={(e) => setSelectedBoothId(e.target.value)}
            >
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
          {/* Search bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#9E9E9C] absolute left-3 top-2.5" />
              <Input
                placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-white"
              />
            </div>
            {selectedBooth?.collab_partner && (
              <Badge variant="warning" className="text-xs shrink-0">
                Quầy Collab: {selectedBooth.collab_partner}
              </Badge>
            )}
          </div>

          {/* Product Cards Touch Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((prod) => {
              const prodVariants = variants.filter((v) => v.product_id === prod.id);
              const activeVarId = selectedVariantMap[prod.id] || prodVariants[0]?.id;
              const activeVariant =
                prodVariants.find((v) => v.id === activeVarId) || prodVariants[0];

              const availableStock = activeVariant
                ? getVariantAvailableStock(activeVariant.id)
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
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-[2px]">
                            Còn {availableStock}
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
                          className="w-8 h-8 rounded bg-[#315C4C] text-white flex items-center justify-center font-bold text-sm shadow-2xs hover:bg-[#284a3d] disabled:opacity-40 active:scale-95 transition-transform"
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
                        className="w-full h-9 text-xs font-semibold gap-1 active:scale-95 transition-transform"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{availableStock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
                      disabled={item.quantity >= item.maxAvailable}
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="p-1 hover:bg-[#F0F0ED] rounded text-[#202124] disabled:opacity-30"
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
                        onClick={() => handleIncrease(item.variantId)}
                        className="w-7 h-7 flex items-center justify-center text-[#737373] hover:text-[#202124] active:bg-[#F0F0ED]"
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
            <div className="p-4 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[6px] space-y-3 text-xs">
              <div className="flex items-center justify-between text-sm font-bold">
                <span>Cần thu của khách:</span>
                <span className="text-[#315C4C]">
                  {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tendered-cash">Tiền khách đưa (VND)</Label>
                <Input
                  id="tendered-cash"
                  type="number"
                  value={tenderedCash || ''}
                  onChange={(e) => setTenderedCash(Number(e.target.value))}
                  placeholder="Nhập số tiền..."
                  className="h-10 text-base font-bold bg-white"
                />
              </div>

              {/* Quick Cash Tender Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[cartTotal, 100000, 200000, 500000, 1000000].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTenderedCash(preset)}
                    className="px-2 py-1 rounded bg-white border border-[#E8E8E5] text-[11px] font-semibold text-[#202124] hover:bg-[#F0F0ED]"
                  >
                    {preset === cartTotal ? 'Vừa đủ' : `${(preset / 1000).toLocaleString()}k`}
                  </button>
                ))}
              </div>

              {/* Change to return */}
              <div className="p-3 bg-white border border-[#E8E8E5] rounded-[6px] flex items-center justify-between text-xs">
                <span className="text-[#737373]">Tiền thừa trả khách:</span>
                <span className="text-base font-bold text-[#2F7D55]">
                  {formatCurrency(cashChange, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
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
              disabled={isSubmitting}
              isLoading={isSubmitting}
              onClick={handleCompleteOrder}
              className="gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận & Hoàn tất đơn</span>
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
    </div>
  );
}
