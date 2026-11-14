'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useOrdersStore } from '@/stores/orders-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getEffectiveOrderStatus } from '@/lib/test-data-filter';
import { Order, OrderItem, Product, ProductVariant } from '@/types/database';
import { ReceiptModal } from '@/components/pos/receipt-modal';
import { playSuccessChime } from '@/lib/sound';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  QrCode,
  Banknote,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  RotateCcw,
  Package,
  AlertTriangle,
  X,
  Check,
  FileText,
  Boxes,
} from 'lucide-react';

const REFUND_PRESET_REASONS = [
  'Khách đổi ý (Không có nhu cầu)',
  'Sản phẩm bị lỗi kĩ thuật / bể vỡ',
  'Đổi sang mẫu mã / kích cỡ khác',
  'Thu ngân tính nhầm / trùng đơn',
  'Khác (Nhập lý do chi tiết)',
];

function resolveOrderItem(it: OrderItem, variants: ProductVariant[], products: Product[]) {
  const v = variants.find((item) => item.id === it.variant_id);
  const p = v ? products.find((prod) => prod.id === v.product_id) : null;
  return {
    productName: p?.name || 'Sản phẩm',
    variantName: v?.name || '',
    sku: v?.sku || '',
    quantity: it.quantity,
    unitPrice: it.unit_price,
    totalPrice: it.total_price || it.unit_price * it.quantity,
  };
}

export default function PosOrdersPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const { orders, retryOrderSync, refundOrder } = useOrdersStore();
  const { events, booths, products, variants } = useDataStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterTab, setFilterTab] = React.useState<'all' | 'completed' | 'refunded' | 'pending' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  // Refund Modal State
  const [refundTargetOrder, setRefundTargetOrder] = React.useState<Order | null>(null);
  const [refundReason, setRefundReason] = React.useState(REFUND_PRESET_REASONS[0]);
  const [refundCustomNote, setRefundCustomNote] = React.useState('');
  const [refundAmountInput, setRefundAmountInput] = React.useState('');
  const [refundRestock, setRefundRestock] = React.useState(true);
  const [refundError, setRefundError] = React.useState<string | null>(null);
  const [isRefunding, setIsRefunding] = React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const completedCount = orders.filter((o) => getEffectiveOrderStatus(o) === 'completed').length;
  const refundedCount = orders.filter((o) => getEffectiveOrderStatus(o) === 'refunded').length;
  const pendingCount = orders.filter((o) => o.sync_status === 'pending_sync').length;
  const cancelledCount = orders.filter((o) => getEffectiveOrderStatus(o) === 'cancelled').length;

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const effectiveStatus = getEffectiveOrderStatus(o);
    const matchesSearch =
      !q ||
      o.order_number.toLowerCase().includes(q) ||
      (o.notes && o.notes.toLowerCase().includes(q)) ||
      (o.refund_record_number && o.refund_record_number.toLowerCase().includes(q)) ||
      (o.refund_reason && o.refund_reason.toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q));

    let matchesTab = true;
    if (filterTab === 'completed') matchesTab = effectiveStatus === 'completed';
    else if (filterTab === 'refunded') matchesTab = effectiveStatus === 'refunded';
    else if (filterTab === 'pending') matchesTab = o.sync_status === 'pending_sync';
    else if (filterTab === 'cancelled') matchesTab = effectiveStatus === 'cancelled';

    return matchesSearch && matchesTab;
  });

  const openRefundModal = (ord: Order) => {
    setRefundTargetOrder(ord);
    setRefundReason(REFUND_PRESET_REASONS[0]);
    setRefundCustomNote('');
    setRefundAmountInput(String(ord.final_amount));
    setRefundRestock(true);
    setRefundError(null);
  };

  const handleConfirmRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetOrder) return;

    const parsedAmount = parseInt(refundAmountInput.replace(/\D/g, ''), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setRefundError('Vui lòng nhập số tiền hoàn hợp lệ lớn hơn 0.');
      return;
    }
    if (parsedAmount > refundTargetOrder.final_amount) {
      setRefundError(
        `Số tiền hoàn không thể vượt quá ${formatCurrency(
          refundTargetOrder.final_amount,
          activeWorkspace?.currency || 'VND'
        )}.`
      );
      return;
    }

    const finalReason =
      refundReason === 'Khác (Nhập lý do chi tiết)'
        ? refundCustomNote.trim() || 'Khách yêu cầu hoàn tiền / trả hàng'
        : refundCustomNote.trim()
        ? `${refundReason} - ${refundCustomNote.trim()}`
        : refundReason;

    setIsRefunding(true);
    const actorRole = user?.role || 'cashier';
    const actorName = user?.fullName || 'Thu ngân Quầy';
    const actorUsername = user?.username || 'pos_cashier';

    const res = refundOrder({
      orderId: refundTargetOrder.id,
      reason: finalReason,
      refundAmount: parsedAmount,
      restockItems: refundRestock,
      actorName,
      actorRole,
      actorUsername,
    });

    setIsRefunding(false);

    if (!res.ok) {
      setRefundError(res.error || 'Không thể lập biên bản hoàn tiền.');
      return;
    }

    try {
      playSuccessChime();
    } catch {
      // ignore
    }

    const recordNumber = res.order?.refund_record_number || 'RF';
    setActionFeedback({
      type: 'success',
      message: `Đã lập biên bản hoàn tiền ${recordNumber} cho đơn #${refundTargetOrder.order_number} (${formatCurrency(
        parsedAmount,
        activeWorkspace?.currency || 'VND'
      )})${refundRestock ? ` và hoàn ${res.restoredUnits || 0} sản phẩm vào tồn kho quầy` : ''}.`,
    });

    setRefundTargetOrder(null);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-surface flex flex-col">
      {/* Top Header */}
      <header className="h-14 sm:h-16 bg-surface dark:bg-surface border-b border-border dark:border-border/80 px-3 sm:px-4 flex items-center justify-between gap-2 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/pos">
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Bán hàng</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo" className="h-8 w-auto max-w-[44px] object-contain hidden sm:block shrink-0" />
            <div>
              <h1 className="text-sm font-bold text-foreground dark:text-foreground truncate">Lịch sử Đơn hàng tại Quầy</h1>
              <p className="text-[11px] text-muted dark:text-muted hidden sm:block">Tra cứu hóa đơn, in lại biên nhận và xử lý trả hàng / hoàn tiền</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[11px] font-mono hidden sm:inline-flex">
            {orders.length} đơn
          </Badge>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs font-semibold text-primary dark:text-success">
              Quản lý
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
              actionFeedback.type === 'success'
                ? 'bg-success-bg dark:bg-success-bg/40 border-primary/30 text-primary dark:text-success'
                : 'bg-error-bg dark:bg-rose-950/40 border-error/30 text-error dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-error" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-muted hover:text-foreground p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative max-w-full sm:max-w-xs w-full">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <Input
              placeholder="Tìm theo mã đơn (HKTS-...), mã hoàn (RF-...)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-surface dark:bg-surface-hover dark:border-border w-full"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 text-xs rounded font-semibold whitespace-nowrap shrink-0 transition-colors ${
                filterTab === 'all'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-surface dark:bg-surface-hover border border-border dark:border-border text-muted dark:text-muted'
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1.5 text-xs rounded font-semibold whitespace-nowrap shrink-0 transition-colors ${
                filterTab === 'completed'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-surface dark:bg-surface-hover border border-border dark:border-border text-muted dark:text-muted'
              }`}
            >
              Hoàn tất ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('refunded')}
              className={`px-3 py-1.5 text-xs rounded font-semibold whitespace-nowrap shrink-0 transition-colors ${
                filterTab === 'refunded'
                  ? 'bg-warning text-white shadow-2xs'
                  : 'bg-surface dark:bg-surface-hover border border-border dark:border-border text-muted dark:text-muted'
              }`}
            >
              Đã trả hàng ({refundedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 text-xs rounded font-semibold whitespace-nowrap shrink-0 transition-colors ${
                filterTab === 'pending'
                  ? 'bg-muted text-white shadow-2xs'
                  : 'bg-surface dark:bg-surface-hover border border-border dark:border-border text-muted dark:text-muted'
              }`}
            >
              Chờ đồng bộ ({pendingCount})
            </button>
            {cancelledCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterTab('cancelled')}
                className={`px-3 py-1.5 text-xs rounded font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  filterTab === 'cancelled'
                    ? 'bg-error text-white shadow-2xs'
                    : 'bg-surface dark:bg-surface-hover border border-border dark:border-border text-muted dark:text-muted'
                }`}
              >
                Đã hủy ({cancelledCount})
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <Card className="border-border dark:border-border/80 bg-surface dark:bg-surface shadow-xs">
            <CardContent className="p-12 text-center text-xs text-muted dark:text-muted">
              <ShoppingCart className="w-10 h-10 text-muted mx-auto mb-2" />
              <p className="font-semibold text-foreground dark:text-foreground">Không tìm thấy đơn hàng nào</p>
              <p className="text-[11px] mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bấm tab &ldquo;Tất cả&rdquo;.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((ord) => {
              const event = events.find((e) => e.id === ord.event_id);
              const booth = booths.find((b) => b.id === ord.booth_id);
              const effectiveStatus = getEffectiveOrderStatus(ord);
              const itemCount = ord.items?.reduce((s, it) => s + (it.quantity || 1), 0) || ord.items?.length || 1;

              return (
                <Card
                  key={ord.id}
                  className="border-border dark:border-border/80 bg-surface dark:bg-surface p-3.5 sm:p-4 shadow-2xs hover:border-primary/40 dark:hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-sm text-foreground dark:text-foreground">
                          {ord.order_number}
                        </span>
                        <Badge
                          variant={ord.sync_status === 'synced' ? 'success' : 'warning'}
                          className="text-[10px]"
                        >
                          {ord.sync_status === 'synced' ? 'Đã đồng bộ' : 'Chờ đồng bộ'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {ord.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR'}
                        </Badge>

                        {effectiveStatus === 'completed' && (
                          <Badge variant="success" className="text-[10px]">
                            Hoàn tất
                          </Badge>
                        )}
                        {effectiveStatus === 'cancelled' && (
                          <Badge variant="error" className="text-[10px]">
                            Đã hủy
                          </Badge>
                        )}
                        {effectiveStatus === 'refunded' && (
                          <Badge variant="warning" className="text-[10px] bg-warning-bg text-warning border-warning/40 font-bold">
                            Đã trả hàng / Hoàn tiền
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted dark:text-muted">
                        {event?.name || 'Sự kiện'} • {booth?.name || 'Quầy bán'} {booth?.code ? `(${booth.code})` : ''} • {formatDate(ord.created_at)}
                      </p>

                      {/* Purchased Items List Summary */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {ord.items.map((it, idx) => {
                            const details = resolveOrderItem(it, variants, products);
                            return (
                              <span
                                key={`${it.variant_id}-${idx}`}
                                className="inline-flex items-center gap-1 text-[11px] bg-background dark:bg-surface-hover text-muted dark:text-muted px-2 py-0.5 rounded border border-border dark:border-border"
                              >
                                <span className="font-medium text-foreground dark:text-foreground truncate max-w-[180px]">
                                  {details.productName}
                                </span>
                                {details.variantName && details.variantName !== 'Default' && details.variantName !== 'Mặc định' && (
                                  <span className="text-[#888888]">({details.variantName})</span>
                                )}
                                <span className="font-bold font-mono text-primary dark:text-success">x{details.quantity}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {ord.notes && (
                        <p className="text-[11px] text-muted dark:text-muted italic">
                          Ghi chú: {ord.notes}
                        </p>
                      )}

                      {/* Refund Detail Callout if Refunded */}
                      {effectiveStatus === 'refunded' && (
                        <div className="mt-2 p-2.5 bg-warning-bg dark:bg-amber-950/30 border border-warning/30 rounded-lg text-xs space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-warning dark:text-gold-text flex items-center gap-1.5">
                              <RotateCcw className="w-3.5 h-3.5" />
                              Biên bản hoàn tiền: {ord.refund_record_number || 'RF'}
                            </span>
                            <span className="font-bold text-error dark:text-rose-400 font-mono">
                              - {formatCurrency(ord.refund_amount ?? ord.final_amount, activeWorkspace?.currency || 'VND')}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted dark:text-muted flex flex-wrap items-center gap-x-3 gap-y-1">
                            {ord.refund_reason && (
                              <span>
                                Lý do: <span className="font-medium text-foreground dark:text-foreground">{ord.refund_reason}</span>
                              </span>
                            )}
                            {ord.refunded_by && (
                              <span>
                                Người duyệt: <span className="font-medium text-foreground dark:text-foreground">{ord.refunded_by}</span>
                              </span>
                            )}
                            {ord.refunded_at && (
                              <span>
                                Thời gian: <span className="font-medium text-foreground dark:text-foreground">{formatDate(ord.refunded_at)}</span>
                              </span>
                            )}
                            <span className={`font-semibold ${ord.refund_restocked ? 'text-primary dark:text-success' : 'text-error dark:text-rose-400'}`}>
                              {ord.refund_restocked ? '✓ Đã hoàn kho quầy' : '✕ Không nhập lại kho (hàng hỏng)'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border dark:border-border">
                      <div className="text-left sm:text-right">
                        <span
                          className={`text-base font-bold ${
                            effectiveStatus === 'cancelled'
                              ? 'line-through text-muted'
                              : effectiveStatus === 'refunded'
                              ? 'text-warning'
                              : 'text-primary dark:text-success'
                          }`}
                        >
                          {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                        </span>
                        <span className="text-[10px] text-muted dark:text-muted block font-medium">
                          {itemCount} món hàng
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Trả hàng Button (Only for completed orders) */}
                        {effectiveStatus === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 border-error/40 text-error hover:bg-error-bg dark:hover:bg-rose-950/40 font-semibold"
                            onClick={() => openRefundModal(ord)}
                            title="Lập biên bản trả hàng & hoàn tiền"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Trả hàng</span>
                          </Button>
                        )}

                        {/* View Refund Receipt (For refunded orders) */}
                        {effectiveStatus === 'refunded' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 border-warning/40 text-warning hover:bg-warning-bg dark:hover:bg-amber-950/40 font-semibold"
                            onClick={() => setSelectedOrder(ord)}
                            title="Xem và in biên bản hoàn tiền nhiệt"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Biên bản</span>
                          </Button>
                        )}

                        {/* View Thermal Receipt */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 border-primary/40 text-primary dark:text-success hover:bg-success-bg dark:hover:bg-success-bg/40"
                          onClick={() => setSelectedOrder(ord)}
                          title="Xem biên nhận và in hóa đơn nhiệt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Hóa đơn</span>
                        </Button>

                        {/* Sync retry */}
                        {ord.sync_status === 'pending_sync' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => retryOrderSync(ord.id)}
                            title="Đồng bộ ngay với máy chủ"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Đồng bộ</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Lập Biên Bản Trả Hàng & Hoàn Tiền POS */}
      <Modal
        isOpen={!!refundTargetOrder}
        onClose={() => {
          if (!isRefunding) {
            setRefundTargetOrder(null);
            setRefundError(null);
          }
        }}
        title={`Trả Hàng & Hoàn Tiền: ${refundTargetOrder?.order_number || ''}`}
        description="Xử lý trả lại hàng từ khách, cập nhật tồn kho bán tại quầy và ghi nhận hoàn tiền vào ca làm việc."
      >
        {refundTargetOrder && (
          <form onSubmit={handleConfirmRefund} className="space-y-4 text-xs">
            {refundError && (
              <div className="p-2.5 rounded-lg bg-error-bg dark:bg-rose-950/40 border border-error/30 text-error dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{refundError}</span>
              </div>
            )}

            {/* Thông tin đơn gốc */}
            <div className="p-3 rounded-lg bg-background dark:bg-surface-hover border border-border dark:border-border space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-muted dark:text-muted">Tổng tiền đã thanh toán:</span>
                <span className="font-bold text-sm text-foreground dark:text-foreground font-mono">
                  {formatCurrency(refundTargetOrder.final_amount, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted dark:text-muted">Phương thức thanh toán:</span>
                <span className="font-semibold text-foreground dark:text-foreground">
                  {refundTargetOrder.payment_method === 'cash' ? '💵 Tiền mặt' : '📱 Chuyển khoản VietQR'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted dark:text-muted">Thời gian tạo:</span>
                <span className="text-muted dark:text-muted font-medium">
                  {formatDate(refundTargetOrder.created_at)}
                </span>
              </div>
            </div>

            {/* Chi tiết danh sách món hàng */}
            {refundTargetOrder.items && refundTargetOrder.items.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground dark:text-foreground flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  <span>Sản phẩm trong đơn ({refundTargetOrder.items.length} món)</span>
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 border border-border dark:border-border rounded-lg p-2 bg-surface dark:bg-surface">
                  {refundTargetOrder.items.map((it, idx) => {
                    const details = resolveOrderItem(it, variants, products);
                    return (
                      <div
                        key={`${it.variant_id}-${idx}`}
                        className="flex items-center justify-between text-xs py-1 border-b border-border dark:border-border last:border-b-0"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-semibold text-foreground dark:text-foreground truncate">
                            {details.productName}
                          </p>
                          <p className="text-[10px] text-muted dark:text-muted">
                            {details.variantName || 'Mặc định'} {details.sku ? `• SKU: ${details.sku}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-primary dark:text-success font-mono">
                            x{details.quantity}
                          </span>
                          <span className="text-[10px] text-muted dark:text-muted block font-mono">
                            {formatCurrency(details.totalPrice, activeWorkspace?.currency || 'VND')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Checkbox Restock vào tồn quầy */}
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border dark:border-border bg-background dark:bg-surface-hover cursor-pointer">
              <input
                type="checkbox"
                checked={refundRestock}
                onChange={(e) => setRefundRestock(e.target.checked)}
                className="mt-0.5 accent-primary h-4 w-4 rounded"
              />
              <div>
                <p className="font-bold text-foreground dark:text-foreground flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-primary dark:text-success" />
                  <span>
                    Hoàn trả +
                    {refundTargetOrder.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0} sản phẩm vào tồn
                    kho quầy bán
                  </span>
                </p>
                <p className="text-[11px] text-muted dark:text-muted mt-0.5">
                  Tự động cộng lại số lượng vào tồn kho quầy hiện tại để tiếp tục bán. (Bỏ chọn nếu hàng bị bể vỡ / rách
                  hỏng không thể bán lại).
                </p>
              </div>
            </label>

            {/* Số tiền hoàn trả */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground dark:text-foreground">
                  Số tiền hoàn trả khách (VND) <span className="text-error">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRefundAmountInput(String(refundTargetOrder.final_amount))}
                    className="text-[11px] px-2 py-0.5 rounded bg-success-bg text-primary font-semibold border border-primary/30 hover:bg-[#D8EDE0]"
                  >
                    Hoàn 100%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRefundAmountInput(String(Math.round(refundTargetOrder.final_amount / 2)))
                    }
                    className="text-[11px] px-2 py-0.5 rounded bg-background text-muted font-semibold border border-border hover:bg-surface-hover"
                  >
                    Hoàn 50%
                  </button>
                </div>
              </div>
              <Input
                type="number"
                min={1}
                max={refundTargetOrder.final_amount}
                value={refundAmountInput}
                onChange={(e) => {
                  setRefundAmountInput(e.target.value);
                  setRefundError(null);
                }}
                className="h-9 text-sm font-mono font-bold bg-surface dark:bg-surface-hover"
              />
              <p className="text-[11px] text-muted dark:text-muted">
                Tối đa: {formatCurrency(refundTargetOrder.final_amount, activeWorkspace?.currency || 'VND')}.
              </p>
            </div>

            {/* Lý do trả hàng */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground dark:text-foreground block">
                Lý do trả hàng & hoàn tiền <span className="text-error">*</span>
              </label>
              <select
                value={refundReason}
                onChange={(e) => {
                  setRefundReason(e.target.value);
                  setRefundError(null);
                }}
                className="w-full h-8 rounded-lg border border-border dark:border-border bg-surface dark:bg-surface-hover px-2.5 text-xs font-medium text-foreground dark:text-foreground focus:outline-none focus:border-primary"
              >
                {REFUND_PRESET_REASONS.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>

              <textarea
                rows={2}
                value={refundCustomNote}
                onChange={(e) => setRefundCustomNote(e.target.value)}
                placeholder="Ghi chú thêm về tình trạng hàng trả hoặc trao đổi với khách..."
                className="w-full p-2 rounded-lg border border-border dark:border-border bg-surface dark:bg-surface-hover text-xs text-foreground dark:text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Thông báo ca bán hàng nếu thanh toán tiền mặt */}
            {refundTargetOrder.payment_method === 'cash' && (
              <div className="p-2.5 rounded-lg bg-warning-bg dark:bg-amber-950/30 border border-warning/30 text-warning dark:text-gold-text text-[11px] flex items-center gap-2">
                <Banknote className="w-4 h-4 shrink-0" />
                <span>
                  Số tiền hoàn tiền mặt sẽ được tự động trừ vào số dư két tiền mặt trong ca bán hàng hiện tại.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-border dark:border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isRefunding}
                onClick={() => setRefundTargetOrder(null)}
                className="h-9 px-3 text-xs font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isRefunding}
                className="h-9 px-4 text-xs font-bold gap-1.5 bg-error hover:bg-[#A83224] text-white"
              >
                {isRefunding ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Xác nhận Trả hàng & Hoàn tiền</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Printable Thermal Receipt Modal */}
      <ReceiptModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
