'use client';

import * as React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useDataStore } from '@/stores/data-store';
import { useOrdersStore, normalizeVietQrBankId } from '@/stores/orders-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, compressImage } from '@/lib/utils';
import { isNetRevenueOrder } from '@/lib/test-data-filter';
import { Booth, EventItem, Product, ProductVariant, InventoryAllocation, Order, PaymentMethod } from '@/types/database';
import {
  Store,
  Calendar,
  Users2,
  Handshake,
  Share2,
  Copy,
  Check,
  Plus,
  Minus,
  Boxes,
  Package,
  ShoppingCart,
  QrCode,
  Banknote,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  FileText,
  CheckCircle2,
  Download,
  Upload,
  Percent,
  Sparkles,
  TrendingUp,
  CreditCard,
  Layers,
  Trash2,
  Info,
  Bookmark,
  Globe,
  Eye,
  EyeOff,
  Coins,
  AlertCircle,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { playSuccessChime } from '@/lib/sound';
import { calculateVariantStock } from '@/lib/stock-status';
import { logActivity } from '@/stores/audit-store';
import { PreorderPickupModal } from '@/components/pos/preorder-pickup-modal';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useRealtimeCartSync } from '@/stores/realtime-cart-sync';
import { initCloudSync } from '@/lib/cloud-sync';
import { ProductImageUploader } from '@/components/ui/product-image-uploader';

function CollabPartnerPortalContent() {
  const tCommon = useTranslations('common');
  const params = useParams();
  const searchParams = useSearchParams();
  const boothId = params?.boothId as string;

  const { activeWorkspace } = useWorkspaceStore();
  const {
    booths,
    events,
    products,
    variants,
    allocations,
    createBooth,
    createEvent,
    addCollabProduct,
    restockCollabVariant,
    mergeCollabSyncPackage,
  } = useDataStore();

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
    activeBankConfig,
    mergeCollabOrders,
  } = useOrdersStore();

  // Active Tab state: 'inventory' | 'pos' | 'orders' | 'sync'
  const [activeTab, setActiveTab] = React.useState<'inventory' | 'pos' | 'orders' | 'sync'>('inventory');

  // Copy notification state
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedSync, setCopiedSync] = React.useState(false);

  // New Collab Product Modal
  const [isAddProductModalOpen, setIsAddProductModalOpen] = React.useState(false);
  const [productName, setProductName] = React.useState('');
  const [productPrice, setProductPrice] = React.useState<number>(0);
  const [productQty, setProductQty] = React.useState<number>(0);
  const [productReservedQty, setProductReservedQty] = React.useState<number>(0);
  const [productOnlineQty, setProductOnlineQty] = React.useState<number>(0);
  const [productVariantName, setProductVariantName] = React.useState('Tiêu chuẩn (Free size)');
  const [productSku, setProductSku] = React.useState('');
  const [productImageUrl, setProductImageUrl] = React.useState('');

  // POS Checkout State
  const [posSearch, setPosSearch] = React.useState('');
  const [hideSoldOut, setHideSoldOut] = React.useState(false);
  const [isPreorderPickupOpen, setIsPreorderPickupOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('qr_manual');
  const [tenderedCash, setTenderedCash] = React.useState<number>(0);
  const [proofImage, setProofImage] = React.useState<string | null>(null);
  const [isCapturingProof, setIsCapturingProof] = React.useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = React.useState(false);
  const [orderSuccess, setOrderSuccess] = React.useState<Order | null>(null);

  const handleCollabProofFileChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setIsCapturingProof(true);
        const compressed = await compressImage(file, 900, 0.75);
        setProofImage(compressed);
      } catch (err) {
        console.error('Lỗi xử lý ảnh minh chứng CK:', err);
      } finally {
        setIsCapturingProof(false);
        e.target.value = '';
      }
    },
    []
  );

  // Manual Sync Package JSON string for exchange
  const [importJson, setImportJson] = React.useState('');
  const [importStatus, setImportStatus] = React.useState<string | null>(null);

  // Locate current booth
  const currentBooth = booths.find((b) => b.id === boothId);

  // Real-time Multi-seller Cart Synchronization
  const { initSync, broadcastMyCart, getRemoteHeldQty } = useRealtimeCartSync();

  React.useEffect(() => {
    initSync();
    initCloudSync();
  }, [initSync]);

  React.useEffect(() => {
    if (boothId) {
      broadcastMyCart(boothId, cart);
    }
  }, [cart, boothId, broadcastMyCart]);

  // Locate current event
  const currentEvent = events.find((e) => e.id === currentBooth?.event_id);

  const bootstrappedBoothRef = React.useRef<string | null>(null);

  // Fallback bootstrap if partner opens link on a fresh device without local database
  React.useEffect(() => {
    if (!currentBooth && boothId && bootstrappedBoothRef.current !== boothId) {
      bootstrappedBoothRef.current = boothId;
      const partnerParam = searchParams.get('partner') || 'Đối tác Liên danh';
      const eventNameParam = searchParams.get('event') || 'Sự kiện Collab 2026';
      const ratioParam = Number(searchParams.get('ratio')) || 50;
      const boothNameParam = searchParams.get('name') || 'Gian hàng Hợp tác Collab';
      const evtIdParam = searchParams.get('evtId') || `evt-collab-${boothId}`;
      const wsId = activeWorkspace?.id || 'ws-hac-cam-studio';

      // Check if event exists by ID or matching name
      let evt =
        events.find((e) => e.id === evtIdParam) ||
        events.find((e) => e.name.trim().toLowerCase() === eventNameParam.trim().toLowerCase());
      if (!evt) {
        evt = createEvent({
          id: evtIdParam,
          workspace_id: wsId,
          name: eventNameParam,
          location: 'Địa điểm sự kiện',
          description: `Sự kiện hợp tác cùng đối tác ${partnerParam}`,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
          event_type: 'collab_event',
        });
      }

      createBooth({
        id: boothId,
        workspace_id: wsId,
        event_id: evt.id,
        name: boothNameParam,
        code: `COL-${partnerParam.slice(0, 3).toUpperCase()}`,
        status: 'active',
        booth_type: 'collab',
        collab_partner: partnerParam,
        revenue_share_ratio: ratioParam,
      });
    }
  }, [currentBooth, boothId, searchParams, activeWorkspace, events, createEvent, createBooth]);

  // Derived Values
  const partnerName = currentBooth?.collab_partner || searchParams.get('partner') || 'Đối tác Liên danh';
  const revenueShareRatio = currentBooth?.revenue_share_ratio ?? (Number(searchParams.get('ratio')) || 50);
  const eventName = currentEvent?.name || searchParams.get('event') || 'Sự kiện chung';

  // Allocations for this booth
  const boothAllocations = allocations.filter((a) => a.booth_id === boothId);

  // Variants in this booth
  const boothVariants = boothAllocations
    .map((alloc) => {
      const variant = variants.find((v) => v.id === alloc.variant_id);
      const product = products.find((p) => p.id === variant?.product_id);
      return {
        allocation: alloc,
        variant,
        product,
        isPartnerItem:
          product?.collab_partner?.toLowerCase() === partnerName.toLowerCase() ||
          Boolean(product?.collab_partner),
      };
    })
    .filter((item) => item.variant && item.product && !item.product.is_deleted);

  const partnerItems = boothVariants.filter((item) => item.isPartnerItem);
  const hostItems = boothVariants.filter((item) => !item.isPartnerItem);

  // Orders for this booth (exclude cancelled / refunded orders from gross sales)
  const boothOrders = orders.filter(
    (o) => o.booth_id === boothId && o.payment_status === 'completed' && isNetRevenueOrder(o)
  );

  // Total Gross Sales
  const totalBoothRevenue = boothOrders.reduce((sum, o) => sum + o.final_amount, 0);

  // Partner Revenue Share
  const partnerRevenue = (totalBoothRevenue * revenueShareRatio) / 100;
  const hostRevenue = totalBoothRevenue - partnerRevenue;

  // Total items sold at this booth
  const totalItemsSold = boothAllocations.reduce((sum, a) => sum + a.sold_quantity, 0);

  // Handler: Add new Collab Product
  function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim() || !currentBooth) return;

    addCollabProduct({
      workspaceId: currentBooth.workspace_id,
      eventId: currentBooth.event_id,
      boothId: currentBooth.id,
      partnerName: partnerName,
      name: productName,
      price: productPrice,
      quantity: productQty,
      reservedQuantity: productReservedQty,
      onlinePreorderQuantity: productOnlineQty,
      variantName: productVariantName,
      sku: productSku,
      imageUrl: productImageUrl,
    });

    // Record Audit Log for Admin tracing
    logActivity({
      actor_name: `Đối tác: ${partnerName}`,
      actor_role: 'collab_partner',
      action_type: 'collab_contribute',
      entity_type: 'product',
      entity_name: productName,
      booth_name: currentBooth.name,
      event_name: eventName,
      description: `Đối tác "${partnerName}" đã thêm sản phẩm mới "${productName}" (${productQty} món) vào gian hàng "${currentBooth.name}". Tự giữ chỗ: ${productReservedQty}, Đã đặt online: ${productOnlineQty}.`,
      changes: [
        { field: 'price', field_label: 'Giá niêm yết', new_value: `${productPrice.toLocaleString('vi-VN')} VND` },
        { field: 'quantity', field_label: 'Số lượng mang đến', new_value: productQty },
        { field: 'reserved_quantity', field_label: 'Tự giữ chỗ VIP', new_value: productReservedQty },
        { field: 'online_preorder_quantity', field_label: 'Đơn đặt mua online', new_value: productOnlineQty },
      ],
    });

    setIsAddProductModalOpen(false);
    setProductName('');
    setProductPrice(0);
    setProductQty(0);
    setProductReservedQty(0);
    setProductOnlineQty(0);
    setProductSku('');
    setProductImageUrl('');
  }

  // Handler: Quick Restock
  function handleQuickRestock(variantId: string, amount: number) {
    if (!currentBooth) return;
    restockCollabVariant(currentBooth.id, variantId, amount);

    const targetVariant = variants.find((v) => v.id === variantId);
    logActivity({
      actor_name: `Đối tác: ${partnerName}`,
      actor_role: 'collab_partner',
      action_type: 'stock_adjust',
      entity_type: 'inventory',
      entity_name: targetVariant?.name || 'Sản phẩm Collab',
      booth_name: currentBooth.name,
      event_name: eventName,
      description: `Đối tác "${partnerName}" đã bổ sung thêm +${amount} sản phẩm "${targetVariant?.name || 'Sản phẩm'}" vào quầy bán chung.`,
      changes: [
        { field: 'restock_amount', field_label: 'Số lượng bổ sung', new_value: `+${amount}` },
      ],
    });
  }

  // Handler: Copy Share Link
  function handleCopyShareLink() {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/vi/collab/${boothId}?partner=${encodeURIComponent(
      partnerName
    )}&event=${encodeURIComponent(eventName)}&ratio=${revenueShareRatio}&name=${encodeURIComponent(
      currentBooth?.name || 'Gian hàng Collab'
    )}`;

    const text = `🎪 CỔNG HỢP TÁC GIAN HÀNG SỰ KIỆN — EVENTMATE
• Sự kiện: ${eventName}
• Gian hàng liên danh: ${currentBooth?.name || 'Gian hàng Collab'}
• Đối tác: ${partnerName}
• Tỷ lệ chia sẻ doanh thu: ${revenueShareRatio}% cho Đối tác

👉 Nhấn vào liên kết sau để mở Cổng Đối tác, đồng bộ hàng hóa và xem doanh thu thời gian thực:
${url}`;

    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  // Handler: Export Sync Package
  function handleExportSync() {
    const pkg = {
      timestamp: new Date().toISOString(),
      booth: currentBooth,
      event: currentEvent,
      products: products.filter((p) => p.collab_partner === partnerName),
      variants: boothVariants.map((item) => item.variant).filter(Boolean),
      allocations: boothAllocations,
      orders: boothOrders,
    };
    const jsonStr = JSON.stringify(pkg, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedSync(true);
    setTimeout(() => setCopiedSync(false), 2500);
  }

  // Handler: Import Sync Package
  function handleImportSync() {
    try {
      const parsed = JSON.parse(importJson);
      if (parsed.products || parsed.variants || parsed.allocations) {
        mergeCollabSyncPackage(parsed);
      }
      if (parsed.orders && Array.isArray(parsed.orders)) {
        mergeCollabOrders(parsed.orders);
      }
      logActivity({
        actor_name: `Đối tác: ${partnerName}`,
        actor_role: 'collab_partner',
        action_type: 'collab_sync',
        entity_type: 'sync_package',
        entity_name: 'Gói đồng bộ dữ liệu Collab',
        booth_name: currentBooth?.name,
        event_name: eventName,
        description: `Đối tác "${partnerName}" đã nạp và hợp nhất gói đồng bộ dữ liệu vào gian hàng "${currentBooth?.name}".`,
      });
      setImportStatus('✅ Đã nạp và đồng bộ dữ liệu thành công!');
      setImportJson('');
      setTimeout(() => setImportStatus(null), 3500);
    } catch {
      setImportStatus('❌ Định dạng gói đồng bộ không hợp lệ. Vui lòng kiểm tra lại mã JSON.');
    }
  }

  // POS Cart Total Calculation
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const cashChange = Math.max(0, (tenderedCash || 0) - cartTotal);
  const cashShortage = Math.max(0, cartTotal - (tenderedCash || 0));
  const isCashUnderpaid = paymentMethod === 'cash' && cartTotal > 0 && (tenderedCash || 0) < cartTotal;

  // POS Checkout Handler
  async function handlePosCheckout() {
    if (cart.length === 0 || !currentBooth) return;
    if (paymentMethod === 'qr_manual' && (!proofImage || !proofImage.trim())) {
      alert('BẮT BUỘC: Vui lòng chụp hoặc tải ảnh minh chứng chuyển khoản trước khi xác nhận đơn!');
      return;
    }
    if (paymentMethod === 'cash' && cartTotal > 0 && (tenderedCash || 0) < cartTotal) {
      alert(`Số tiền khách đưa chưa đủ! Còn thiếu ${cashShortage.toLocaleString('vi-VN')} VND.`);
      return;
    }
    setIsSubmittingOrder(true);
    try {
      const order = await submitOrder({
        workspaceId: currentBooth.workspace_id,
        eventId: currentBooth.event_id,
        boothId: currentBooth.id,
        cashierId: `cashier-collab-${partnerName}`,
        paymentMethod: paymentMethod,
        tenderedAmount: paymentMethod === 'cash' ? (tenderedCash || cartTotal) : undefined,
        changeAmount: paymentMethod === 'cash' ? cashChange : undefined,
        notes: `Đơn hàng bán tại Quầy Collab: ${partnerName}`,
        isOnline: navigator.onLine,
        proofImageUrl: proofImage || undefined,
      });
      setOrderSuccess(order);
      setProofImage(null);
      setTenderedCash(0);
      playSuccessChime();
      clearCart();

      logActivity({
        actor_name: `Thu ngân Collab (${partnerName})`,
        actor_role: 'cashier',
        action_type: 'order_create',
        entity_type: 'order',
        entity_name: `Đơn hàng #${order.order_number}`,
        booth_name: currentBooth?.name,
        event_name: eventName,
        description: `Thu ngân quầy Collab hoàn tất đơn hàng #${order.order_number} trị giá ${order.final_amount.toLocaleString('vi-VN')} VND (Hình thức: ${order.payment_method}).`,
        changes: [
          { field: 'final_amount', field_label: 'Tổng tiền đơn', new_value: `${order.final_amount.toLocaleString('vi-VN')} VND` },
          { field: 'payment_method', field_label: 'Phương thức', new_value: order.payment_method },
        ],
      });
    } catch (err: unknown) {
      alert(`Lỗi khi tạo đơn: ${err instanceof Error ? err.message : 'Vui lòng kiểm tra lại tồn kho'}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  // Count sold-out variants at this collab booth
  const soldOutCollabPosCount = boothVariants.filter((item) => {
    const stock = calculateVariantStock(item.variant!, item.allocation.sold_quantity, item.allocation.allocated_quantity);
    return stock.availableForSale <= 0;
  }).length;

  // Filtered variants for POS view
  const posAvailableVariants = boothVariants.filter((item) => {
    if (hideSoldOut) {
      const stock = calculateVariantStock(item.variant!, item.allocation.sold_quantity, item.allocation.allocated_quantity);
      if (stock.availableForSale <= 0) return false;
    }
    const q = posSearch.toLowerCase();
    const matchName = item.product?.name.toLowerCase().includes(q);
    const matchVariant = item.variant?.name.toLowerCase().includes(q);
    const matchSku = item.variant?.sku.toLowerCase().includes(q);
    return matchName || matchVariant || matchSku;
  });

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-between">
      {/* Top Banner & Header */}
      <header className="border-b border-[#E8E8E5] bg-white sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Left: Brand & Partner Meta */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/booths"
                className="w-8 h-8 rounded-[6px] bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center text-[#737373] hover:text-[#202124] transition-colors shrink-0"
                title="Quay lại danh sách gian hàng"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div className="h-11 sm:h-12 w-auto flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="HikaruStore Logo"
                  className="h-11 sm:h-12 w-auto max-w-[100px] object-contain"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-[#202124]">
                    {currentBooth?.name || 'Gian hàng Liên danh'}
                  </span>
                  <Badge variant="warning" className="text-[11px] gap-1 font-semibold">
                    <Handshake className="w-3 h-3" />
                    <span>Collab: {partnerName}</span>
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2F7D55] bg-[#EBF1EE] px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D55] animate-pulse" />
                    Đồng bộ trực tiếp
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#737373] mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#9E9E9C]" />
                    {eventName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-[#B7791F]">
                    <Percent className="w-3 h-3" />
                    Chia sẻ doanh thu: {revenueShareRatio}% Đối tác / {100 - revenueShareRatio}% Ban tổ chức
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 border-[#B7791F]/40 text-[#8C5D17] hover:bg-[#FEF7EC] font-bold shadow-2xs"
                onClick={() => setIsPreorderPickupOpen(true)}
                title="Trả hàng cho khách đã đặt trước (Bắt buộc chụp ảnh minh chứng)"
              >
                <Package className="w-3.5 h-3.5 text-[#B7791F]" />
                <span className="hidden sm:inline">Trả Hàng Đặt Trước</span>
                <span className="sm:hidden">Trả hàng</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={handleCopyShareLink}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#2F7D55]" />
                    <span className="text-[#2F7D55]">Đã copy link!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Chia sẻ link Đối tác</span>
                  </>
                )}
              </Button>

              <Button
                variant={activeTab === 'pos' ? 'primary' : 'secondary'}
                size="sm"
                className="gap-1.5 text-xs h-8 shadow-xs"
                onClick={() => setActiveTab(activeTab === 'pos' ? 'inventory' : 'pos')}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{activeTab === 'pos' ? 'Đóng POS Bán Hàng' : 'Mở POS Bán Hàng'}</span>
              </Button>

              <ThemeToggle />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-t border-[#F0F0ED] mt-3 pt-2.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-[#315C4C] text-white shadow-xs'
                  : 'text-[#737373] hover:text-[#202124] hover:bg-[#F0F0ED]'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Kho & Sản Phẩm Đồng Bộ</span>
              <Badge variant={activeTab === 'inventory' ? 'outline' : 'neutral'} className="text-[10px] ml-1">
                {boothVariants.length}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'pos'
                  ? 'bg-[#315C4C] text-white shadow-xs'
                  : 'text-[#737373] hover:text-[#202124] hover:bg-[#F0F0ED]'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Máy POS Bán Hàng</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-[#315C4C] text-white shadow-xs'
                  : 'text-[#737373] hover:text-[#202124] hover:bg-[#F0F0ED]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Đối Soát Doanh Thu & Đơn Hàng</span>
              <Badge variant={activeTab === 'orders' ? 'outline' : 'neutral'} className="text-[10px] ml-1">
                {boothOrders.length}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sync')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                activeTab === 'sync'
                  ? 'bg-[#315C4C] text-white shadow-xs'
                  : 'text-[#737373] hover:text-[#202124] hover:bg-[#F0F0ED]'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đồng Bộ Dữ Liệu 2 Chiều</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Settlement Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-[#E8E8E5] bg-white shadow-2xs p-4">
            <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
              Tổng Doanh Số Quầy
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-[#202124]">
                {formatCurrency(totalBoothRevenue, activeWorkspace?.currency || 'VND')}
              </span>
              <TrendingUp className="w-4 h-4 text-[#315C4C]" />
            </div>
            <p className="text-[10px] text-[#737373] mt-1">Từ {boothOrders.length} giao dịch hoàn tất</p>
          </Card>

          <Card className="border-[#B7791F]/30 bg-[#FEF7EC] shadow-2xs p-4">
            <span className="text-[11px] font-bold text-[#B7791F] uppercase tracking-wider block">
              Phần Đối Tác Nhận ({revenueShareRatio}%)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-[#B7791F]">
                {formatCurrency(partnerRevenue, activeWorkspace?.currency || 'VND')}
              </span>
              <Handshake className="w-4 h-4 text-[#B7791F]" />
            </div>
            <p className="text-[10px] text-[#8C5D17] mt-1">Khoản đối tác được quyết toán</p>
          </Card>

          <Card className="border-[#E8E8E5] bg-white shadow-2xs p-4">
            <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
              Phần Ban Tổ Chức ({100 - revenueShareRatio}%)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-[#315C4C]">
                {formatCurrency(hostRevenue, activeWorkspace?.currency || 'VND')}
              </span>
              <Store className="w-4 h-4 text-[#315C4C]" />
            </div>
            <p className="text-[10px] text-[#737373] mt-1">Chi phí tổ chức & vận hành</p>
          </Card>

          <Card className="border-[#E8E8E5] bg-white shadow-2xs p-4">
            <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
              Hàng Hóa Đã Bán
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-[#202124]">
                {totalItemsSold} món
              </span>
              <Package className="w-4 h-4 text-[#737373]" />
            </div>
            <p className="text-[10px] text-[#737373] mt-1">
              Đang bày bán {boothVariants.length} mặt hàng
            </p>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: KHO & SẢN PHẨM ĐỒNG BỘ */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Header of Tab 1 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-[8px] border border-[#E8E8E5]">
              <div>
                <h2 className="text-base font-bold text-[#202124]">
                  Kho Hàng & Danh Mục Sản Phẩm Chung
                </h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Đồng bộ hàng hóa của Đối tác và Ban tổ chức để bày bán chung tại gian hàng sự kiện này.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs bg-[#B7791F] hover:bg-[#975F16] border-none text-white shadow-xs"
                onClick={() => setIsAddProductModalOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Đóng góp hàng của Đối tác vào quầy</span>
              </Button>
            </div>

            {/* Section 1: Hàng hóa do Đối tác đóng góp */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#B7791F] uppercase tracking-wider">
                    📦 Hàng hóa do Đối tác ({partnerName}) mang đến
                  </h3>
                  <Badge variant="warning" className="text-[10px]">
                    {partnerItems.length} sản phẩm
                  </Badge>
                </div>
              </div>

              {partnerItems.length === 0 ? (
                <Card className="border-dashed border-[#E8E8E5] p-8 text-center bg-white">
                  <Package className="w-8 h-8 text-[#9E9E9C] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#202124]">
                    Đối tác chưa đóng góp sản phẩm nào vào gian hàng
                  </p>
                  <p className="text-xs text-[#737373] mt-1 max-w-md mx-auto">
                    Nhấn vào nút bên dưới để thêm các mặt hàng bạn mang tới sự kiện (Áo merch, photocard, móc khóa, phụ kiện...).
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1.5 text-xs"
                    onClick={() => setIsAddProductModalOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm sản phẩm của bạn ngay</span>
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {partnerItems.map(({ allocation, variant, product }) => {
                    const stock = calculateVariantStock(variant!, allocation.sold_quantity, allocation.allocated_quantity);
                    const available = stock.availableForSale;
                    return (
                      <Card
                        key={allocation.id}
                        className="border-[#E8E8E5] bg-white shadow-2xs hover:border-[#B7791F]/50 transition-colors p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-[#202124]">{product?.name}</h4>
                              <p className="text-xs text-[#737373] mt-0.5">{variant?.name}</p>
                              <span className="font-mono text-[10px] text-[#737373] bg-[#F0F0ED] px-1.5 py-0.5 rounded inline-block mt-1">
                                {variant?.sku}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-[#B7791F]">
                              {formatCurrency(variant?.price || 0, activeWorkspace?.currency || 'VND')}
                            </span>
                          </div>

                          {/* Status Badge & Pre-order Indicators */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <Badge variant={stock.badgeVariant} className="text-[10px]">
                              {stock.statusLabel}
                            </Badge>
                            {stock.reserved > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#8C5D17] bg-[#FEF7EC] px-1.5 py-0.5 rounded border border-[#B7791F]/20 font-medium">
                                <Bookmark className="w-2.5 h-2.5 text-[#B7791F]" />
                                Giữ chỗ: {stock.reserved}
                              </span>
                            )}
                            {stock.onlinePreorder > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#1D4ED8] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#3B82F6]/20 font-medium">
                                <Globe className="w-2.5 h-2.5 text-[#3B82F6]" />
                                Đơn onl: {stock.onlinePreorder}
                              </span>
                            )}
                          </div>

                          {/* Inventory breakdown */}
                          <div className="grid grid-cols-4 gap-1.5 bg-[#F7F7F5] p-2.5 rounded-[6px] mt-2.5 text-xs text-center">
                            <div>
                              <span className="text-[#737373] text-[9px] block">Mang đến</span>
                              <span className="font-bold text-[#202124]">
                                {allocation.allocated_quantity}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#737373] text-[9px] block">Đang giữ</span>
                              <span className="font-bold text-[#B7791F]">
                                {stock.totalHeld}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#737373] text-[9px] block">Đã bán</span>
                              <span className="font-semibold text-[#2F7D55]">
                                {allocation.sold_quantity}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#737373] text-[9px] block">Bán tại quầy</span>
                              <span className="font-bold text-[#315C4C]">{available}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Restock Actions with Direct Input */}
                        <div className="border-t border-[#F0F0ED] dark:border-neutral-800 pt-3 mt-3 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#737373] dark:text-neutral-400 font-medium">Bổ sung hàng:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              id={`restock-qty-${variant!.id}`}
                              type="number"
                              min="0"
                              placeholder="0"
                              defaultValue=""
                              className="w-16 h-7 text-xs font-bold text-center border border-[#E8E8E5] dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded text-[#202124] dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#315C4C]"
                              title="Nhập trực tiếp số lượng bổ sung"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-7 px-2 text-xs font-semibold gap-1 bg-[#EBF1EE] dark:bg-emerald-950/60 text-[#315C4C] dark:text-emerald-300 hover:bg-[#D5E2DC]"
                              onClick={() => {
                                const input = document.getElementById(`restock-qty-${variant!.id}`) as HTMLInputElement;
                                const val = parseInt(input?.value || '0', 10);
                                if (val > 0) {
                                  handleQuickRestock(variant!.id, val);
                                }
                              }}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Bổ sung</span>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Hàng hóa do Ban Tổ Chức (Host) mang đến */}
            <div className="space-y-3 pt-4 border-t border-[#E8E8E5]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#315C4C] uppercase tracking-wider">
                    🎪 Hàng hóa do Ban Tổ Chức bán chung tại quầy
                  </h3>
                  <Badge variant="neutral" className="text-[10px]">
                    {hostItems.length} sản phẩm
                  </Badge>
                </div>
              </div>

              {hostItems.length === 0 ? (
                <p className="text-xs text-[#737373] italic">Chưa có sản phẩm nào của Ban tổ chức tại quầy này.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {hostItems.map(({ allocation, variant, product }) => {
                    const stock = calculateVariantStock(variant!, allocation.sold_quantity, allocation.allocated_quantity);
                    const available = stock.availableForSale;
                    return (
                      <Card
                        key={allocation.id}
                        className="border-[#E8E8E5] bg-white shadow-2xs p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-[#202124]">{product?.name}</h4>
                              <p className="text-xs text-[#737373] mt-0.5">{variant?.name}</p>
                              <span className="font-mono text-[10px] text-[#737373] bg-[#F0F0ED] px-1.5 py-0.5 rounded inline-block mt-1">
                                {variant?.sku}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-[#315C4C]">
                              {formatCurrency(variant?.price || 0, activeWorkspace?.currency || 'VND')}
                            </span>
                          </div>

                          {/* Status Badge & Pre-order Indicators */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <Badge variant={stock.badgeVariant} className="text-[10px]">
                              {stock.statusLabel}
                            </Badge>
                            {stock.reserved > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#8C5D17] bg-[#FEF7EC] px-1.5 py-0.5 rounded border border-[#B7791F]/20 font-medium">
                                <Bookmark className="w-2.5 h-2.5 text-[#B7791F]" />
                                Giữ chỗ: {stock.reserved}
                              </span>
                            )}
                            {stock.onlinePreorder > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#1D4ED8] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#3B82F6]/20 font-medium">
                                <Globe className="w-2.5 h-2.5 text-[#3B82F6]" />
                                Đơn onl: {stock.onlinePreorder}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-4 gap-1.5 bg-[#F7F7F5] p-2.5 rounded-[6px] mt-2.5 text-xs text-center">
                            <div>
                              <span className="text-[#737373] text-[9px] block">Hạn mức</span>
                              <span className="font-bold text-[#202124]">
                                {allocation.allocated_quantity}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#737373] text-[9px] block">Đang giữ</span>
                              <span className="font-bold text-[#B7791F]">
                                {stock.totalHeld}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#737373] text-[9px] block">Đã bán</span>
                              <span className="font-semibold text-[#2F7D55]">
                                {allocation.sold_quantity}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#737373] text-[9px] block">Bán tại quầy</span>
                              <span className="font-bold text-[#315C4C]">{available}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MÁY POS BÁN HÀNG TẠI QUẦY */}
        {/* ========================================================================= */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Product Selection Grid */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-[8px] border border-[#E8E8E5]">
                <Input
                  placeholder="Tìm sản phẩm bán tại quầy (tên, mã loại)..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="h-9 text-xs flex-1 max-w-md min-w-[200px]"
                />
                <button
                  type="button"
                  onClick={() => setHideSoldOut(!hideSoldOut)}
                  className={`text-xs px-2.5 py-1.5 rounded-[6px] border font-medium transition-colors flex items-center gap-1.5 shadow-2xs shrink-0 ${
                    hideSoldOut
                      ? 'bg-[#EBF1EE] border-[#315C4C]/40 text-[#315C4C] font-semibold'
                      : 'bg-white border-[#E8E8E5] text-[#737373] hover:text-[#202124]'
                  }`}
                  title="Tự động ẩn sản phẩm đã bán hết khỏi màn hình thu ngân"
                >
                  {hideSoldOut ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-[#315C4C]" />
                      <span>Đang ẩn hàng hết ({soldOutCollabPosCount})</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-[#737373]" />
                      <span>Hiện tất cả ({soldOutCollabPosCount} hết hàng)</span>
                    </>
                  )}
                </button>
              </div>

              {posAvailableVariants.length === 0 ? (
                <Card className="border-[#E8E8E5] p-12 text-center bg-white">
                  <Package className="w-8 h-8 text-[#9E9E9C] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#202124]">Không tìm thấy sản phẩm nào</p>
                  <p className="text-xs text-[#737373] mt-1">
                    Hãy thêm sản phẩm vào gian hàng ở tab &ldquo;Kho &amp; Sản Phẩm Đồng Bộ&rdquo; trước khi bán.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {posAvailableVariants.map(({ allocation, variant, product, isPartnerItem }) => {
                    const stock = calculateVariantStock(variant!, allocation.sold_quantity, allocation.allocated_quantity);
                    const myInCart = cart.find((c) => c.variantId === variant!.id)?.quantity || 0;
                    const remoteHeld = getRemoteHeldQty(boothId, variant!.id);
                    const available = Math.max(0, stock.availableForSale - myInCart - remoteHeld);
                    const isOutOfStock = available <= 0;

                    return (
                      <button
                        key={variant!.id}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => {
                          addToCart({
                            variantId: variant!.id,
                            productId: product!.id,
                            productName: product!.name,
                            variantName: variant!.name,
                            sku: variant!.sku,
                            price: variant!.price,
                            maxAvailable: available,
                            imageUrl: product!.image_url,
                          });
                        }}
                        className={`text-left p-3 rounded-[8px] border transition-all flex flex-col justify-between ${
                          isOutOfStock
                            ? 'bg-[#F7F7F5] border-[#E8E8E5] opacity-50 cursor-not-allowed'
                            : 'bg-white border-[#E8E8E5] hover:border-[#315C4C] hover:shadow-xs active:scale-[0.98]'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="font-bold text-xs text-[#202124] line-clamp-1">
                              {product!.name}
                            </h4>
                            <div className="flex items-center gap-1 shrink-0">
                              {stock.reserved > 0 && (
                                <span className="text-[9px] font-medium text-[#8C5D17] bg-[#FEF7EC] px-1 py-0.2 rounded border border-[#B7791F]/20">
                                  Giữ: {stock.reserved}
                                </span>
                              )}
                              {stock.onlinePreorder > 0 && (
                                <span className="text-[9px] font-medium text-[#1D4ED8] bg-[#EFF6FF] px-1 py-0.2 rounded border border-[#3B82F6]/20">
                                  Onl: {stock.onlinePreorder}
                                </span>
                              )}
                              <Badge
                                variant={isPartnerItem ? 'warning' : 'outline'}
                                className="text-[9px] shrink-0 px-1 py-0"
                              >
                                {isPartnerItem ? 'Collab' : 'Host'}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-[11px] text-[#737373] mt-0.5">{variant!.name}</p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#F0F0ED] flex items-center justify-between">
                          <span className="font-bold text-xs text-[#315C4C]">
                            {formatCurrency(variant!.price, activeWorkspace?.currency || 'VND')}
                          </span>
                          <span className={`text-[10px] font-semibold ${isOutOfStock ? 'text-[#C44536]' : 'text-[#737373]'}`}>
                            {isOutOfStock ? 'Hết hàng bán quầy' : `Bán quầy: ${available}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 4-5 Cols: Cart & Checkout */}
            <div className="lg:col-span-5 xl:col-span-4">
              <Card className="border-[#E8E8E5] bg-white shadow-2xs sticky top-20">
                <CardHeader className="p-4 pb-3 border-b border-[#F0F0ED]">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4 text-[#315C4C]" />
                      <span>Giỏ Hàng Quầy Collab</span>
                    </CardTitle>
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
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-[#737373]">
                      <ShoppingCart className="w-8 h-8 text-[#9E9E9C] mx-auto mb-2" />
                      <p className="text-xs">Chưa có món nào trong giỏ hàng</p>
                      <p className="text-[10px] text-[#9E9E9C] mt-0.5">Bấm vào sản phẩm bên trái để thêm</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F0F0ED] max-h-64 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.variantId} className="py-2.5 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#202124] truncate">{item.productName}</p>
                            <p className="text-[10px] text-[#737373]">{item.variantName}</p>
                            <p className="text-[11px] font-bold text-[#315C4C] mt-0.5">
                              {formatCurrency(item.price * item.quantity, activeWorkspace?.currency || 'VND')}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-6 w-6 p-0 text-xs"
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <input
                              type="number"
                              min={1}
                              max={item.maxAvailable}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (isNaN(val) || val <= 0) {
                                  updateQuantity(item.variantId, 1);
                                } else {
                                  updateQuantity(item.variantId, Math.min(val, item.maxAvailable));
                                }
                              }}
                              className="w-10 h-6 text-center text-xs font-bold font-mono bg-white dark:bg-neutral-800 border border-[#E8E8E5] dark:border-neutral-700 text-[#202124] dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#315C4C] rounded"
                              title="Nhập trực tiếp số lượng"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-6 w-6 p-0 text-xs"
                              disabled={item.quantity >= item.maxAvailable}
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-[#C44536]"
                              onClick={() => removeFromCart(item.variantId)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary & Payment selection */}
                  {cart.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-[#F0F0ED]">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-[#737373]">
                          <span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} món):</span>
                          <span>{formatCurrency(cartSubtotal, activeWorkspace?.currency || 'VND')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-[#202124] pt-1 border-t border-[#F0F0ED]">
                          <span>Tổng thanh toán:</span>
                          <span className="text-[#315C4C]">
                            {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#B7791F] pt-0.5">
                          Phần đối tác nhận ({revenueShareRatio}%):{' '}
                          <span className="font-bold">
                            {formatCurrency((cartTotal * revenueShareRatio) / 100, activeWorkspace?.currency || 'VND')}
                          </span>
                        </div>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('qr_manual')}
                          className={`p-2 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                            paymentMethod === 'qr_manual'
                              ? 'border-[#315C4C] bg-[#EBF1EE] text-[#315C4C]'
                              : 'border-[#E8E8E5] bg-white text-[#737373]'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Quét VietQR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cash')}
                          className={`p-2 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                            paymentMethod === 'cash'
                              ? 'border-[#315C4C] bg-[#EBF1EE] text-[#315C4C]'
                              : 'border-[#E8E8E5] bg-white text-[#737373]'
                          }`}
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Tiền mặt</span>
                        </button>
                      </div>

                      {/* QR Display if VietQR selected */}
                      {paymentMethod === 'qr_manual' && activeBankConfig.accountNo && (
                        <div className="p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] text-center space-y-2">
                          <p className="text-[11px] font-semibold text-[#202124]">
                            Tài khoản nhận: {activeBankConfig.bankId} • {activeBankConfig.accountNo}
                          </p>
                          <p className="text-[10px] text-[#737373]">{activeBankConfig.accountName}</p>
                          <div className="w-36 h-36 mx-auto bg-white p-2 rounded border border-[#E8E8E5] flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://img.vietqr.io/image/${normalizeVietQrBankId(activeBankConfig.bankId)}-${activeBankConfig.accountNo}-compact2.png?amount=${cartTotal}&addInfo=Collab%20${currentBooth?.code || 'EM'}&accountName=${encodeURIComponent(
                                activeBankConfig.accountName
                              )}`}
                              alt="VietQR Payment"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {/* Mandatory Proof Photo Capture */}
                          <div
                            className={`p-2.5 rounded-[6px] border text-left space-y-2 ${
                              proofImage
                                ? 'bg-[#EAF4EE] border-[#2F7D55]/40'
                                : 'bg-[#FEF7EC] border-[#B7791F]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-[#202124] flex items-center gap-1">
                                <Camera className="w-3.5 h-3.5 text-[#315C4C]" />
                                <span>Ảnh minh chứng CK (Bắt buộc)</span>
                              </span>
                              {proofImage && (
                                <button
                                  type="button"
                                  onClick={() => setProofImage(null)}
                                  className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
                                >
                                  Xóa ảnh
                                </button>
                              )}
                            </div>

                            {proofImage ? (
                              <div className="flex items-center gap-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={proofImage}
                                  alt="Minh chứng chuyển khoản"
                                  className="w-12 h-12 object-cover rounded border border-[#2F7D55]/40 shrink-0"
                                />
                                <span className="text-[11px] font-semibold text-[#2F7D55]">
                                  ✓ Đã đính kèm ảnh chuyển khoản
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <label
                                  htmlFor="collab-proof-camera-input"
                                  className="flex-1 py-1.5 px-2 rounded bg-white border border-[#315C4C] text-[#315C4C] text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-[#EBF1EE]"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>{isCapturingProof ? 'Đang xử lý...' : 'Chụp ảnh CK'}</span>
                                  <input
                                    id="collab-proof-camera-input"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handleCollabProofFileChange}
                                  />
                                </label>
                                <label
                                  htmlFor="collab-proof-upload-input"
                                  className="py-1.5 px-2 rounded bg-white border border-[#D5D5D0] text-[#494949] text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer hover:bg-[#F7F7F5]"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  <span>Chọn ảnh</span>
                                  <input
                                    id="collab-proof-upload-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleCollabProofFileChange}
                                  />
                                </label>
                              </div>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            className="w-full text-xs font-bold bg-[#2F7D55] hover:bg-[#256343] text-white gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmittingOrder || !proofImage}
                            onClick={handlePosCheckout}
                          >
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>
                              {proofImage
                                ? `✓ Đã nhận tiền (${formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}) - Hoàn tất ngay`
                                : 'Chụp / tải ảnh minh chứng CK để xác nhận'}
                            </span>
                          </Button>
                        </div>
                      )}

                      {/* Cash Drawer & Change Calculator for Collab */}
                      {paymentMethod === 'cash' && (
                        <div className="p-3 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[6px] space-y-2.5 text-xs">
                          <div className="p-2.5 bg-white border border-[#E8E8E5] rounded-[4px] flex items-center justify-between">
                            <span className="text-[#737373] font-medium">Tổng cần thu:</span>
                            <span className="font-bold text-[#315C4C] text-sm">
                              {formatCurrency(cartTotal, activeWorkspace?.currency || 'VND')}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="collab-tendered-cash" className="font-semibold text-[#202124] flex items-center gap-1 text-[11px]">
                                <Coins className="w-3 h-3 text-[#315C4C]" />
                                <span>Tiền khách đưa (Nhập thủ công):</span>
                              </Label>
                              {tenderedCash > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setTenderedCash(0)}
                                  className="text-[10px] text-[#C5221F] hover:underline"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <Input
                                id="collab-tendered-cash"
                                type="text"
                                inputMode="numeric"
                                value={tenderedCash ? tenderedCash.toLocaleString('vi-VN') : ''}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '');
                                  setTenderedCash(raw ? parseInt(raw, 10) : 0);
                                }}
                                placeholder="Nhập số tiền khách đưa..."
                                className="h-9 text-base font-bold bg-white text-[#202124] pr-7"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#737373] pointer-events-none">
                                ₫
                              </span>
                            </div>
                          </div>

                          {/* Result status */}
                          {tenderedCash === 0 ? (
                            <p className="text-[10px] text-center text-[#737373] italic">
                              Nhập số tiền khách đưa để tính tiền thối
                            </p>
                          ) : isCashUnderpaid ? (
                            <div className="p-2 bg-[#FDF2E9] border border-[#C5221F]/30 rounded text-[11px] text-[#C5221F] font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>Còn thiếu:</span>
                              </span>
                              <span>{formatCurrency(cashShortage, activeWorkspace?.currency || 'VND')}</span>
                            </div>
                          ) : (
                            <div className="p-2 bg-[#EAF4EE] border border-[#2F7D55]/30 rounded text-[11px] text-[#2F7D55] font-bold flex items-center justify-between">
                              <span>Tiền cần thối lại:</span>
                              <span className="text-sm">
                                {cashChange === 0 ? '0 ₫ (Vừa đủ)' : formatCurrency(cashChange, activeWorkspace?.currency || 'VND')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        variant="primary"
                        size="md"
                        className="w-full text-xs font-bold"
                        disabled={isSubmittingOrder || isCashUnderpaid}
                        onClick={handlePosCheckout}
                      >
                        {isSubmittingOrder
                          ? 'Đang hoàn tất đơn...'
                          : isCashUnderpaid
                          ? `Chưa đủ tiền (Thiếu ${formatCurrency(cashShortage, activeWorkspace?.currency || 'VND')})`
                          : 'Xác nhận Đã Thu Tiền & Bán Hàng'}
                      </Button>
                    </div>
                  )}

                  {/* Order success notification */}
                  {orderSuccess && (
                    <div className="p-3 rounded-[6px] bg-[#EBF1EE] border border-[#2F7D55]/30 text-xs space-y-1.5 text-[#2F7D55]">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã ghi nhận đơn {orderSuccess.order_number}!</span>
                      </div>
                      <p className="text-[11px] text-[#315C4C]">
                        Số tiền: {formatCurrency(orderSuccess.final_amount, activeWorkspace?.currency || 'VND')} •
                        Phần đối tác:{' '}
                        {formatCurrency(
                          (orderSuccess.final_amount * revenueShareRatio) / 100,
                          activeWorkspace?.currency || 'VND'
                        )}
                      </p>
                      {orderSuccess.payment_method === 'cash' && orderSuccess.tendered_amount != null && (
                        <div className="p-2 bg-white rounded border border-[#2F7D55]/20 text-[11px] space-y-0.5">
                          <div className="flex justify-between text-[#737373]">
                            <span>Tiền khách đưa:</span>
                            <span className="font-semibold text-[#202124]">
                              {formatCurrency(orderSuccess.tendered_amount, activeWorkspace?.currency || 'VND')}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-[#2F7D55]">
                            <span>Tiền thối lại:</span>
                            <span>
                              {formatCurrency(orderSuccess.change_amount || 0, activeWorkspace?.currency || 'VND')}
                            </span>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setOrderSuccess(null)}
                        className="text-[10px] underline pt-1 block"
                      >
                        Đóng thông báo
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ĐỐI SOÁT DOANH THU & ĐƠN HÀNG */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-[8px] border border-[#E8E8E5]">
              <div>
                <h2 className="text-base font-bold text-[#202124]">Đối Soát Doanh Số Bán Hàng Chi Tiết</h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Minh bạch toàn bộ giao dịch tại quầy. Cả 2 bên cùng theo dõi và đối soát chính xác theo thời gian thực.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  const csvRows = [
                    ['Mã đơn', 'Thời gian', 'Phương thức', 'Tổng tiền', `Phần đối tác (${revenueShareRatio}%)`],
                    ...boothOrders.map((o) => [
                      o.order_number,
                      new Date(o.created_at).toLocaleTimeString('vi-VN'),
                      o.payment_method === 'qr_manual' ? 'VietQR' : 'Tiền mặt',
                      o.final_amount,
                      (o.final_amount * revenueShareRatio) / 100,
                    ]),
                  ];
                  const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `Doi-soat-Collab-${partnerName}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất file đối soát (CSV)</span>
              </Button>
            </div>

            {boothOrders.length === 0 ? (
              <Card className="border-[#E8E8E5] p-12 text-center bg-white">
                <FileText className="w-8 h-8 text-[#9E9E9C] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#202124]">Chưa có đơn hàng nào được bán ra tại quầy</p>
                <p className="text-xs text-[#737373] mt-1">
                  Khi khách mua hàng qua POS tại quầy, hóa đơn và tiền chia sẻ sẽ lập tức nhảy vào đây.
                </p>
              </Card>
            ) : (
              <Card className="border-[#E8E8E5] bg-white shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E8E8E5] bg-[#F7F7F5] text-[#737373]">
                        <th className="py-2.5 px-4 font-semibold">Mã đơn</th>
                        <th className="py-2.5 px-4 font-semibold">Thời gian</th>
                        <th className="py-2.5 px-4 font-semibold">Hình thức</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Tổng tiền</th>
                        <th className="py-2.5 px-4 font-semibold text-right text-[#B7791F]">
                          Phần Đối tác ({revenueShareRatio}%)
                        </th>
                        <th className="py-2.5 px-4 font-semibold text-right text-[#315C4C]">
                          Phần Ban tổ chức ({100 - revenueShareRatio}%)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0ED]">
                      {boothOrders.map((ord) => {
                        const partnerShareAmount = (ord.final_amount * revenueShareRatio) / 100;
                        const hostShareAmount = ord.final_amount - partnerShareAmount;
                        return (
                          <tr key={ord.id} className="hover:bg-[#FBFBFA]">
                            <td className="py-3 px-4 font-bold text-[#202124]">{ord.order_number}</td>
                            <td className="py-3 px-4 text-[#737373]">
                              {new Date(ord.created_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-[10px]">
                                {ord.payment_method === 'qr_manual' ? 'VietQR' : 'Tiền mặt'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-[#202124]">
                              {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#B7791F]">
                              {formatCurrency(partnerShareAmount, activeWorkspace?.currency || 'VND')}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-[#315C4C]">
                              {formatCurrency(hostShareAmount, activeWorkspace?.currency || 'VND')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ĐỒNG BỘ DỮ LIỆU 2 CHIỀU */}
        {/* ========================================================================= */}
        {activeTab === 'sync' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Export Gói Đồng Bộ */}
            <Card className="border-[#E8E8E5] bg-white shadow-2xs p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#202124] flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#315C4C]" />
                  <span>1. Xuất Gói Dữ Liệu Đồng Bộ Sang Ban Tổ Chức</span>
                </h3>
                <p className="text-xs text-[#737373] mt-1">
                  Khi bạn thêm sản phẩm mới hoặc bán đơn hàng offline, bấm nút bên dưới để sao chép toàn bộ gói dữ liệu gửi cho Ban tổ chức qua Zalo/Telegram.
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full text-xs gap-1.5"
                onClick={handleExportSync}
              >
                {copiedSync ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Đã sao chép gói dữ liệu vào bộ nhớ tạm!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép Gói Dữ Liệu Đồng Bộ Mới Nhất</span>
                  </>
                )}
              </Button>

              <div className="p-3 bg-[#F7F7F5] rounded-[6px] text-[11px] text-[#737373] space-y-1">
                <p className="font-semibold text-[#202124]">Bao gồm trong gói:</p>
                <p>• {partnerItems.length} sản phẩm do đối tác đóng góp</p>
                <p>• {boothOrders.length} hóa đơn đã phát sinh tại quầy</p>
                <p>• Số lượng tồn kho và hạn mức quầy tính tới {new Date().toLocaleTimeString('vi-VN')}</p>
              </div>
            </Card>

            {/* Box 2: Import Gói Đồng Bộ */}
            <Card className="border-[#E8E8E5] bg-white shadow-2xs p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#202124] flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#B7791F]" />
                  <span>2. Nạp Gói Dữ Liệu Từ Ban Tổ Chức</span>
                </h3>
                <p className="text-xs text-[#737373] mt-1">
                  Dán chuỗi dữ liệu JSON do Ban tổ chức gửi cho bạn vào ô bên dưới để cập nhật lại danh mục hàng hóa hoặc hạn mức quầy mới nhất.
                </p>
              </div>

              <textarea
                rows={4}
                placeholder="Dán mã JSON gói đồng bộ tại đây..."
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full p-2.5 rounded-[6px] border border-[#E8E8E5] text-xs font-mono focus:outline-none focus:border-[#315C4C]"
              />

              {importStatus && (
                <p className="text-xs font-semibold">{importStatus}</p>
              )}

              <Button
                variant="outline"
                size="md"
                className="w-full text-xs gap-1.5"
                disabled={!importJson.trim()}
                onClick={handleImportSync}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Nạp và Hợp Nhất Dữ Liệu Ngay</span>
              </Button>
            </Card>
          </div>
        )}
      </main>

      {/* Modal: Thêm sản phẩm do Đối tác đóng góp */}
      <Modal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        title="Đóng Góp Sản Phẩm của Đối Tác Vào Gian Hàng"
        description={`Sản phẩm sẽ được ghi nhận dưới tên đối tác "${partnerName}" và tự động cấp vào quầy để mở bán trên POS.`}
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="collab-prod-name" required>
              Tên sản phẩm / Merchandise
            </Label>
            <Input
              id="collab-prod-name"
              required
              placeholder="VD: Áo Thun Collab Limited, Card Bo Góc, Poster..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="collab-prod-price">
                Giá bán niêm yết (VND)
              </Label>
              <Input
                id="collab-prod-price"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={productPrice === 0 ? '' : productPrice}
                onChange={(e) => setProductPrice(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="collab-prod-qty">
                Tổng số lượng mang đến
              </Label>
              <Input
                id="collab-prod-qty"
                type="number"
                min="0"
                placeholder="0"
                value={productQty === 0 ? '' : productQty}
                onChange={(e) => setProductQty(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5]">
            <div className="space-y-1.5">
              <Label htmlFor="collab-prod-reserved" className="text-xs flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-[#B7791F]" />
                <span>Tự giữ trước (VIP / Cọc)</span>
              </Label>
              <Input
                id="collab-prod-reserved"
                type="number"
                min="0"
                value={productReservedQty === 0 ? '' : productReservedQty}
                onChange={(e) => setProductReservedQty(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="h-8 text-xs bg-white"
              />
              <p className="text-[10px] text-[#737373]">Chủ động giữ riêng, không bán lẻ tại quầy</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="collab-prod-online" className="text-xs flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#3B82F6]" />
                <span>Đã đặt mua Online / App</span>
              </Label>
              <Input
                id="collab-prod-online"
                type="number"
                min="0"
                value={productOnlineQty === 0 ? '' : productOnlineQty}
                onChange={(e) => setProductOnlineQty(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="h-8 text-xs bg-white"
              />
              <p className="text-[10px] text-[#737373]">Khách đã đặt trước nhận tại sự kiện</p>
            </div>

            <div className="col-span-2 pt-2 border-t border-[#E8E8E5] flex items-center justify-between text-xs font-medium">
              <span className="text-[#737373]">Khả dụng mở bán tự do tại quầy POS:</span>
              <span className="font-bold text-[#315C4C] text-sm">
                {Math.max(0, productQty - (productReservedQty + productOnlineQty))} món
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="collab-prod-variant">
                Phân loại / Kích thước (Size/Màu)
              </Label>
              <Input
                id="collab-prod-variant"
                placeholder="VD: Size L, Màu Trắng..."
                value={productVariantName}
                onChange={(e) => setProductVariantName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="collab-prod-sku">Mã loại (tùy chọn)</Label>
              <Input
                id="collab-prod-sku"
                placeholder="VD: COL-TSHIRT-L"
                value={productSku}
                onChange={(e) => setProductSku(e.target.value)}
              />
            </div>
          </div>

          <div>
            <ProductImageUploader
              value={productImageUrl}
              onChange={(val) => setProductImageUrl(val || '')}
              label="Ảnh chụp sản phẩm (Chụp trực tiếp tại quầy hoặc chọn từ điện thoại)"
            />
          </div>

          <div className="p-3 bg-[#FEF7EC] rounded-[6px] border border-[#B7791F]/30 text-xs text-[#8C5D17] space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Chính sách chia sẻ doanh thu:</span>
            </p>
            <p>
              Mỗi món bán ra với giá {formatCurrency(productPrice, activeWorkspace?.currency || 'VND')} sẽ mang lại{' '}
              <strong className="text-[#B7791F]">
                {formatCurrency((productPrice * revenueShareRatio) / 100, activeWorkspace?.currency || 'VND')}
              </strong>{' '}
              ({revenueShareRatio}%) cho {partnerName}.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F0ED]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddProductModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-[#B7791F] hover:bg-[#975F16] border-none text-white font-bold"
            >
              Xác nhận Đồng bộ vào Gian hàng
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preorder Pickup Modal with Mandatory Photo Proof */}
      <PreorderPickupModal
        isOpen={isPreorderPickupOpen}
        onClose={() => setIsPreorderPickupOpen(false)}
        currentBoothId={currentBooth?.id}
        currentBoothName={currentBooth?.name}
      />

      {/* Footer */}
      <footer className="border-t border-[#E8E8E5] py-4 bg-white mt-12 text-center text-xs text-[#737373]">
        <p>
          HikaruStore Collab Partner Portal — Hệ thống quản lý và đồng bộ gian hàng sự kiện chuyên nghiệp.
        </p>
      </footer>
    </div>
  );
}

export default function CollabPartnerPortalPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-8 text-center text-xs text-[#737373]">
          Đang khởi tạo Cổng Đối Tác Hợp Tác...
        </div>
      }
    >
      <CollabPartnerPortalContent />
    </React.Suspense>
  );
}
