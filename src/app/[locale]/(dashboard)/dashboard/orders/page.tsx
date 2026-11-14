'use client';

import * as React from 'react';
import { getBankDisplayName, useOrdersStore } from '@/stores/orders-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { useAuthStore, canManageOrderLifecycle } from '@/stores/auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, formatTimeOnly } from '@/lib/utils';
import { ProductImageUploader } from '@/components/ui/product-image-uploader';
import { Order, OrderStatus } from '@/types/database';
import {
  ShoppingCart,
  Search,
  Eye,
  Camera,
  FlaskConical,
  Download,
  Printer,
  Ban,
  RotateCcw,
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  QrCode,
  Banknote,
  Save,
  ShieldCheck,
  Radio,
  Volume2,
  Copy,
  RefreshCw,
  Zap,
  AlertCircle,
  Wallet,
  WifiOff,
} from 'lucide-react';
import { ReceiptModal } from '@/components/pos/receipt-modal';
import {
  isTestEvent,
  isTestOrder,
  isNetRevenueOrder,
  filterRealOrders,
  filterRealEvents,
  getEffectiveOrderStatus,
} from '@/lib/test-data-filter';
import { exportEventToExcel } from '@/lib/export-excel';

const CANCEL_PRESET_REASONS = [
  'Khách đổi ý / Không lấy hàng nữa',
  'Thu ngân nhập nhầm món hoặc sai số lượng',
  'Khách hủy thanh toán / chưa nhận được tiền',
  'Đơn tạo trùng lặp trên máy POS',
];

const REFUND_PRESET_REASONS = [
  'Hoàn tiền đơn chuyển khoản VietQR theo đối soát',
  'Khách trả hàng do lỗi sản phẩm / nhầm size',
  'Khách chuyển khoản thừa / sai số tiền cần hoàn lại',
  'Hoàn tiền theo phê duyệt của BTC / Quản lý',
];

export default function DashboardOrdersPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { orders, cancelOrder, refundOrder, activeBankConfig, setBankConfig } = useOrdersStore();
  const { events, booths, variants, products } = useDataStore();
  const { user } = useAuthStore();

  const canControlOrders = canManageOrderLifecycle(user?.role);

  const [activeTab, setActiveTab] = React.useState<'orders' | 'payments'>('orders');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'payments') {
      const timer = setTimeout(() => setActiveTab('payments'), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Payment Configuration States (merged from Payments page)
  const [bankId, setBankId] = React.useState(activeBankConfig.bankId || 'MB');
  const [accountNo, setAccountNo] = React.useState(activeBankConfig.accountNo || '');
  const [accountName, setAccountName] = React.useState(activeBankConfig.accountName || '');
  const [offlineQrImageUrl, setOfflineQrImageUrl] = React.useState(
    activeBankConfig.offlineQrImageUrl || ''
  );
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (activeBankConfig) {
        setBankId(activeBankConfig.bankId || 'MB');
        setAccountNo(activeBankConfig.accountNo || '');
        setAccountName(activeBankConfig.accountName || '');
        setOfflineQrImageUrl(activeBankConfig.offlineQrImageUrl || '');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeBankConfig]);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterEvent, setFilterEvent] = React.useState('all');
  const [filterPayment, setFilterPayment] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

  // Cancel / Void modal state
  const [cancelTargetOrder, setCancelTargetOrder] = React.useState<Order | null>(null);
  const [cancelReason, setCancelReason] = React.useState('');
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  // Refund / Return modal state
  const [refundTargetOrder, setRefundTargetOrder] = React.useState<Order | null>(null);
  const [refundReason, setRefundReason] = React.useState('');
  const [refundAmountInput, setRefundAmountInput] = React.useState('');
  const [refundRestock, setRefundRestock] = React.useState(true);
  const [refundError, setRefundError] = React.useState<string | null>(null);

  // Action feedback banner
  const [actionFeedback, setActionFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );
  const realEvents = filterRealEvents(workspaceEvents);
  const testEvents = workspaceEvents.filter((e) => isTestEvent(e));

  const workspaceOrders = orders.filter(
    (o) => !activeWorkspace || o.workspace_id === activeWorkspace.id
  );
  const realOrders = filterRealOrders(workspaceOrders);
  const testOrders = workspaceOrders.filter((o) => isTestOrder(o));

  // Net Revenue & Payment Method Breakdown (REAL PRODUCTION + NON-CANCELLED/NON-REFUNDED ONLY)
  const netRealOrders = realOrders.filter(isNetRevenueOrder);
  const netTestOrders = testOrders.filter(isNetRevenueOrder);
  const testCashAmount = netTestOrders
    .filter((o) => o.payment_method === 'cash')
    .reduce((sum, o) => sum + o.final_amount, 0);

  const cashRevenue = netRealOrders
    .filter((o) => o.payment_method === 'cash')
    .reduce((sum, o) => sum + o.final_amount, 0);

  const qrRevenue = netRealOrders
    .filter((o) => o.payment_method === 'qr_manual')
    .reduce((sum, o) => sum + o.final_amount, 0);

  const gatewayRevenue = netRealOrders
    .filter((o) => o.payment_method === 'gateway')
    .reduce((sum, o) => sum + o.final_amount, 0);

  const totalNetRevenue = cashRevenue + qrRevenue + gatewayRevenue;

  function handleSaveBankConfig(e: React.FormEvent) {
    e.preventDefault();
    const updated = {
      bankId: bankId.toUpperCase(),
      accountNo: accountNo.trim(),
      accountName: accountName.trim().toUpperCase(),
      offlineQrImageUrl: offlineQrImageUrl.trim() || null,
    };
    setBankConfig(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  }

  // Filter orders: Default 'all' excludes test transactions
  const filteredOrders = workspaceOrders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.notes && o.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.cancellation_reason && o.cancellation_reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.refund_reason && o.refund_reason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesEvent =
      filterEvent === 'all'
        ? !isTestOrder(o)
        : isTestEvent(filterEvent)
        ? o.event_id === filterEvent || isTestOrder(o)
        : o.event_id === filterEvent && !isTestOrder(o);

    const matchesPayment = filterPayment === 'all' || o.payment_method === filterPayment;
    const effectiveStatus = getEffectiveOrderStatus(o);
    const matchesStatus = filterStatus === 'all' || effectiveStatus === filterStatus;

    return matchesSearch && matchesEvent && matchesPayment && matchesStatus;
  });

  const openCancelModal = (ord: Order) => {
    setCancelTargetOrder(ord);
    setCancelReason('');
    setCancelError(null);
  };

  const openRefundModal = (ord: Order) => {
    setRefundTargetOrder(ord);
    setRefundReason('');
    setRefundAmountInput(String(ord.final_amount));
    setRefundRestock(true);
    setRefundError(null);
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTargetOrder || !user) return;
    const res = cancelOrder({
      orderId: cancelTargetOrder.id,
      reason: cancelReason,
      actorName: user.fullName,
      actorRole: user.role,
      actorUsername: user.username,
    });
    if (!res.ok) {
      setCancelError(res.error || 'Không thể hủy đơn hàng.');
      return;
    }
    if (selectedOrder?.id === cancelTargetOrder.id && res.order) {
      setSelectedOrder(res.order);
    }
    setActionFeedback({
      type: 'success',
      message: `Đã hủy đơn ${cancelTargetOrder.order_number} (trạng thái Đã hủy) và hoàn lại ${res.restoredUnits || 0} sản phẩm vào tồn kho quầy.`,
    });
    setCancelTargetOrder(null);
  };

  const handleConfirmRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetOrder || !user) return;
    const parsedAmount = parseInt(refundAmountInput.replace(/\D/g, ''), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setRefundError('Vui lòng nhập số tiền hoàn hợp lệ lớn hơn 0.');
      return;
    }
    if (parsedAmount > refundTargetOrder.final_amount) {
      setRefundError('Số tiền hoàn không thể vượt quá tổng thanh toán của đơn.');
      return;
    }
    const res = refundOrder({
      orderId: refundTargetOrder.id,
      reason: refundReason,
      refundAmount: parsedAmount,
      restockItems: refundRestock,
      actorName: user.fullName,
      actorRole: user.role,
      actorUsername: user.username,
    });
    if (!res.ok) {
      setRefundError(res.error || 'Không thể lập biên bản hoàn tiền.');
      return;
    }
    if (selectedOrder?.id === refundTargetOrder.id && res.order) {
      setSelectedOrder(res.order);
    }
    setActionFeedback({
      type: 'success',
      message: `Đã lập biên bản hoàn tiền ${res.order?.refund_record_number} cho đơn ${refundTargetOrder.order_number} (${formatCurrency(parsedAmount, activeWorkspace?.currency || 'VND')})${refundRestock ? ` và hoàn ${res.restoredUnits || 0} sản phẩm vào kho` : ''}.`,
    });
    setRefundTargetOrder(null);
  };

  const handleExportExcel = () => {
    const activeEvt = filterEvent === 'all' ? null : events.find((e) => e.id === filterEvent);
    exportEventToExcel({
      event: activeEvt,
      orders: filteredOrders,
      booths,
      products,
      variants,
      allocations: useDataStore.getState().allocations,
      workspaceName: activeWorkspace?.name || 'Gian hàng',
      currency: activeWorkspace?.currency || 'VND',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Đơn hàng &amp; Thanh toán</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {filterEvent === 'all'
                ? `${realOrders.length} đơn thực tế`
                : isTestEvent(filterEvent)
                ? `${testOrders.length} đơn test`
                : `${filteredOrders.length} đơn`}
            </Badge>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Quản lý giao dịch bán hàng POS và cấu hình mã chuyển khoản VietQR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-success-bg h-8 font-semibold shadow-2xs"
            title="Xuất danh sách đơn hàng và dữ liệu vận hành ra file Excel"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Xuất Excel (.xlsx)</span>
          </Button>
        </div>
      </div>

      {/* Unified Financial KPI Strip (Cash vs VietQR vs Total Net) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="p-4 bg-surface border-border shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-medium">Tổng doanh thu thực tế</span>
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground font-mono">
            {formatCurrency(totalNetRevenue, activeWorkspace?.currency || 'VND')}
          </div>
          <p className="text-[10px] text-muted mt-0.5">
            {netRealOrders.length} đơn hợp lệ (đã loại đơn test &amp; hủy/hoàn)
          </p>
        </Card>

        <Card className="p-4 bg-surface border-border shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-medium">Chuyển khoản VietQR</span>
            <QrCode className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl font-bold text-primary font-mono">
              {formatCurrency(qrRevenue, activeWorkspace?.currency || 'VND')}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className="text-[10.5px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Cấu hình QR &rarr;
            </button>
          </div>
          <p className="text-[10px] text-muted mt-0.5">
            TK: {getBankDisplayName(activeBankConfig.bankId)} • {activeBankConfig.accountNo}
          </p>
        </Card>

        <Card className="p-4 bg-surface border-border shadow-2xs">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-medium">Tiền mặt tại két (Cash)</span>
            <Banknote className="w-4 h-4 text-warning" />
          </div>
          <div className="text-xl font-bold text-warning font-mono">
            {formatCurrency(cashRevenue, activeWorkspace?.currency || 'VND')}
          </div>
          <p className="text-[10px] text-muted mt-0.5">Thu ngân giữ tại quầy thực tế</p>
        </Card>
      </div>

      {/* Unified Segmented Tabs: Orders vs Payment Settings */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-background rounded-xl border border-border w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-surface text-primary shadow-2xs'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Đơn hàng &amp; Giao dịch</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-warning-bg text-primary font-mono">
            {realOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-surface text-primary shadow-2xs'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Cấu hình VietQR &amp; Tự động nhận tiền</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-success-bg text-primary font-mono">
            Auto-Bank
          </span>
        </button>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-5">

      {/* Sandbox Test Mode Notice Banner */}
      {isTestEvent(filterEvent) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-lg bg-warning-bg border border-warning/30 text-xs text-warning shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <FlaskConical className="w-4 h-4 shrink-0 text-warning mt-0.5 sm:mt-0" />
            <span>
              <strong>Dữ liệu thử nghiệm:</strong> Bạn đang xem {filteredOrders.length} đơn hàng kiểm thử phát sinh khi chạy thử quầy bán hàng. Các đơn hàng này <strong>hoàn toàn không được tính vào doanh thu thực tế</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterEvent('all')}
              className="h-7 text-xs gap-1"
            >
              <span>Về đơn thực tế</span>
            </Button>
          </div>
        </div>
      )}

      {/* Feedback & RBAC Notice */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-xs ${
            actionFeedback.type === 'success'
              ? 'bg-success-bg border-[#CEE6D7] text-primary'
              : 'bg-error-bg border-[#F8B4AF] text-error'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Audit Policy Hint */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-background border border-border text-[11px] text-muted">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            <strong>Nguyên tắc kiểm tra bán hàng:</strong> Không cho phép xóa vĩnh viễn đơn hàng đã phát sinh.{' '}
            {canControlOrders
              ? 'Bạn có quyền Quản trị cao nhất (Chủ cửa hàng / Quản trị viên) để Hủy đơn (tự động hoàn kho) hoặc Lập biên bản Hoàn tiền.'
              : 'Nhân viên không có quyền Hủy đơn / Hoàn tiền — liên hệ Chủ cửa hàng hoặc Quản trị viên khi cần xử lý sai sót.'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <Input
            placeholder="Tìm theo mã đơn, ghi chú, lý do..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-surface"
          />
        </div>

        {/* Event Filter */}
        <select
          className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
        >
          <option value="all">Tất cả sự kiện (Dữ liệu thực tế)</option>
          <optgroup label="Sự kiện thực tế">
            {realEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </optgroup>
          {testEvents.length > 0 && (
            <optgroup label="Thử nghiệm (Tách biệt)">
              {testEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  🧪 {e.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {/* Payment Filter */}
        <select
          className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
        >
          <option value="all">Tất cả hình thức</option>
          <option value="cash">Tiền mặt</option>
          <option value="qr_manual">Chuyển khoản VietQR</option>
        </select>

        {/* Order Lifecycle Status Filter */}
        <select
          className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | OrderStatus)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="completed">Hoàn thành (Hợp lệ)</option>
          <option value="cancelled">Đã hủy (Void)</option>
          <option value="refunded">Đã hoàn tiền (Refund)</option>
        </select>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card className="border-border shadow-xs">
          <CardContent className="p-12 text-center text-xs text-muted">
            <ShoppingCart className="w-10 h-10 text-muted mx-auto mb-2" />
            <p className="font-semibold text-foreground">Chưa có đơn hàng nào phù hợp</p>
            <p className="text-[11px] text-muted mt-1">
              Đơn hàng tạo từ POS tại các quầy bán sẽ tự động tổng hợp tại đây.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-surface shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-background border-b border-border text-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold font-mono">Mã đơn</th>
                  <th className="py-3 px-4 font-semibold">Thời gian</th>
                  <th className="py-3 px-4 font-semibold">Sự kiện & Quầy</th>
                  <th className="py-3 px-4 font-semibold">Hình thức</th>
                  <th className="py-3 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold text-right">Tổng tiền</th>
                  <th className="py-3 px-4 font-semibold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((ord) => {
                  const event = events.find((e) => e.id === ord.event_id);
                  const booth = booths.find((b) => b.id === ord.booth_id);
                  const effectiveStatus = getEffectiveOrderStatus(ord);
                  const isCancelled = effectiveStatus === 'cancelled';
                  const isRefunded = effectiveStatus === 'refunded';
                  const isVoidOrRefund = isCancelled || isRefunded;

                  return (
                    <tr
                      key={ord.id}
                      className={`transition-colors ${
                        isCancelled
                          ? 'bg-error-bg/40 opacity-65 hover:opacity-85'
                          : isRefunded
                          ? 'bg-warning-bg/50 opacity-80 hover:opacity-95'
                          : 'hover:bg-background'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={isCancelled ? 'line-through text-muted' : ''}>
                              {ord.order_number}
                            </span>
                            {isTestOrder(ord) && (
                              <Badge variant="outline" className="text-[9px] border-warning text-warning bg-warning/10">
                                Thử nghiệm
                              </Badge>
                            )}
                          </div>
                          {ord.proof_image_url && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-primary bg-warning-bg px-1 py-0.2 rounded font-semibold border border-primary/20 w-fit">
                              <Camera className="w-2.5 h-2.5" />
                              Ảnh nhận hàng
                            </span>
                          )}
                          {isCancelled && ord.cancellation_reason && (
                            <span className="font-sans font-normal text-[10px] text-error truncate max-w-[180px]" title={ord.cancellation_reason}>
                              Lý do hủy: {ord.cancellation_reason}
                            </span>
                          )}
                          {isRefunded && (
                            <span className="font-sans font-normal text-[10px] text-warning truncate max-w-[180px]" title={ord.refund_reason || ''}>
                              {ord.refund_record_number || 'Hoàn tiền'}: {ord.refund_reason}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted whitespace-nowrap">
                        {formatDate(ord.created_at)}
                      </td>

                      <td className="py-3 px-4 text-foreground">
                        <p className="font-medium truncate max-w-[180px]">{event?.name}</p>
                        <p className="text-[11px] text-muted">
                          {booth?.name} ({booth?.code})
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="outline" className="text-[10px]">
                            {ord.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR'}
                          </Badge>
                          <span
                            className={`text-[9px] font-medium ${
                              ord.sync_status === 'synced' ? 'text-primary' : 'text-warning'
                            }`}
                          >
                            {ord.sync_status === 'synced' ? '• Đã đồng bộ' : '• Chờ đồng bộ'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isCancelled ? (
                          <Badge variant="error" className="text-[10px] gap-1">
                            <Ban className="w-2.5 h-2.5" />
                            <span>Đã hủy</span>
                          </Badge>
                        ) : isRefunded ? (
                          <Badge variant="warning" className="text-[10px] gap-1">
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Đã hoàn tiền</span>
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            Hoàn thành
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-bold text-sm block ${
                            isVoidOrRefund ? 'line-through text-muted' : 'text-primary'
                          }`}
                        >
                          {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                        </span>
                        {isRefunded && (
                          <span className="text-[10px] font-semibold text-warning">
                            Đã hoàn {formatCurrency(ord.refund_amount ?? ord.final_amount, activeWorkspace?.currency || 'VND')}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            title="Xem chi tiết & biên bản"
                            onClick={() => setSelectedOrder(ord)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {canControlOrders && !isVoidOrRefund && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-error hover:bg-error-bg"
                                title="Hủy đơn (Void) & Hoàn kho"
                                onClick={() => openCancelModal(ord)}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-warning hover:bg-warning-bg"
                                title="Hoàn tiền / Trả hàng (Refund)"
                                onClick={() => openRefundModal(ord)}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Orders Card View */}
          <div className="md:hidden divide-y divide-border">
            {filteredOrders.map((ord) => {
              const event = events.find((e) => e.id === ord.event_id);
              const booth = booths.find((b) => b.id === ord.booth_id);
              const effectiveStatus = getEffectiveOrderStatus(ord);
              const isCancelled = effectiveStatus === 'cancelled';
              const isRefunded = effectiveStatus === 'refunded';
              const isVoidOrRefund = isCancelled || isRefunded;

              return (
                <div
                  key={ord.id}
                  className={`p-3.5 space-y-2.5 ${
                    isCancelled ? 'bg-error-bg/40 opacity-75' : isRefunded ? 'bg-warning-bg/40 opacity-85' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-mono font-bold text-sm text-foreground ${isCancelled ? 'line-through text-muted' : ''}`}>
                        {ord.order_number}
                      </span>
                      {isTestOrder(ord) && (
                        <Badge variant="outline" className="text-[9px] border-warning text-warning bg-warning/10">
                          Thử nghiệm
                        </Badge>
                      )}
                    </div>
                    {isCancelled ? (
                      <Badge variant="error" className="text-[10px]">
                        Đã hủy
                      </Badge>
                    ) : isRefunded ? (
                      <Badge variant="warning" className="text-[10px]">
                        Đã hoàn tiền
                      </Badge>
                    ) : (
                      <Badge
                        variant={ord.sync_status === 'synced' ? 'success' : 'warning'}
                        className="text-[10px]"
                      >
                        {ord.sync_status === 'synced' ? 'Hoàn thành' : 'Chờ đồng bộ'}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted">
                    <div className="truncate pr-2">
                      <p className="font-medium text-foreground truncate">{event?.name}</p>
                      <p className="text-[11px] text-muted">
                        {booth?.name} ({booth?.code})
                      </p>
                      {isCancelled && ord.cancellation_reason && (
                        <p className="text-[10px] text-error truncate mt-0.5">
                          Lý do hủy: {ord.cancellation_reason}
                        </p>
                      )}
                      {isRefunded && ord.refund_reason && (
                        <p className="text-[10px] text-warning truncate mt-0.5">
                          {ord.refund_record_number || 'Hoàn tiền'}: {ord.refund_reason}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px]">{formatDate(ord.created_at)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {ord.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR'}
                      </Badge>
                      <span
                        className={`text-base font-bold ${
                          isVoidOrRefund ? 'line-through text-muted' : 'text-primary'
                        }`}
                      >
                        {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {canControlOrders && !isVoidOrRefund && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs text-error border-error/40 hover:bg-error-bg"
                            onClick={() => openCancelModal(ord)}
                            title="Hủy đơn"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs text-warning border-warning/40 hover:bg-warning-bg"
                            onClick={() => openRefundModal(ord)}
                            title="Hoàn tiền"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs gap-1 font-semibold"
                        onClick={() => setSelectedOrder(ord)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
        </div>
      ) : (
        /* =========================================================
           TAB 2: PAYMENT & AUTO-BANKING CONFIGURATION (MERGED)
           ========================================================= */
        <div className="space-y-6 max-w-4xl">
          {netTestOrders.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-warning-bg border border-warning/30 text-xs text-warning shadow-xs">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 shrink-0 text-warning" />
                <span>
                  Hệ thống đã tự động cách ly <strong>{netTestOrders.length} đơn hàng thử nghiệm ({formatCurrency(testCashAmount, 'VND')})</strong> khỏi dòng tiền thực tế tại quầy để đảm bảo số liệu kế toán chính xác.
                </span>
              </div>
            </div>
          )}

          {isSaved && (
            <div className="flex items-center gap-2 p-3 text-xs text-primary bg-success-bg border border-[#CEE6D7] rounded-lg shadow-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
              <span>
                <strong>Đã lưu cấu hình VietQR thành công!</strong> Toàn bộ các màn hình POS của thu ngân đã được đồng bộ tức thì.
              </span>
            </div>
          )}

          <form onSubmit={handleSaveBankConfig} className="space-y-6">
            <Card className="border-border bg-surface shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  1. Tài khoản Ngân hàng Nhận tiền (VietQR) &amp; QR Dự phòng Offline
                </CardTitle>
                <CardDescription className="text-xs">
                  Hệ thống nhúng sẵn số tiền và mã phiên <code className="font-mono font-bold text-primary">EMxxxx</code> vào mã QR. Sau khi khách chuyển khoản, thu ngân cần chụp bill làm minh chứng trước khi xác nhận đơn.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bank-id" required>
                      Mã Ngân hàng (BIN / Code)
                    </Label>
                    <select
                      id="bank-id"
                      className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                      value={bankId}
                      onChange={(e) => setBankId(e.target.value)}
                    >
                      <option value="MB">MB Bank (Quân Đội)</option>
                      <option value="VCB">Vietcombank</option>
                      <option value="TCB">Techcombank</option>
                      <option value="ACB">ACB</option>
                      <option value="VPB">VPBank</option>
                      <option value="TPB">TPBank</option>
                      <option value="BIDV">BIDV</option>
                      <option value="CTG">VietinBank</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="acc-no" required>
                      Số tài khoản nhận tiền
                    </Label>
                    <Input
                      id="acc-no"
                      required
                      placeholder="VD: 0987654321"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="acc-name" required>
                      Tên Chủ tài khoản (Không dấu)
                    </Label>
                    <Input
                      id="acc-name"
                      required
                      placeholder="VD: NGUYEN VAN A"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                      className="text-sm uppercase"
                    />
                  </div>
                </div>

                {/* Live QR Preview */}
                <div className="p-4 bg-background border border-border rounded-lg flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-28 h-28 bg-surface p-1 rounded border border-border shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=50000&addInfo=EM8899&accountName=${encodeURIComponent(
                        accountName
                      )}`}
                      alt="VietQR Demo"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-xs text-muted space-y-1">
                    <p className="font-semibold text-foreground">Xem trước mã VietQR động tại quầy</p>
                    <p>
                      Khi thu ngân bấm thanh toán trên POS, mã QR sẽ gắn sẵn nội dung riêng (ví dụ: <strong>EM8899</strong>) để thu ngân kiểm tra giao dịch khi xác nhận thanh toán.
                    </p>
                    <div className="flex items-center gap-1.5 text-primary text-[11px] pt-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Chuẩn VietQR liên ngân hàng Napas247</span>
                    </div>
                  </div>
                </div>

                {/* Offline Fallback Static QR Image */}
                <div className="p-3.5 rounded-lg border border-dashed border-warning/40 bg-warning-bg/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-warning">
                    <WifiOff className="w-3.5 h-3.5 text-warning" />
                    <span>Ảnh QR tĩnh dự phòng khi mất mạng (Offline Backup QR)</span>
                  </div>
                  <p className="text-[11px] text-muted">
                    Tải lên ảnh chụp mã QR ngân hàng của bạn (lưu cục bộ dạng Base64). Khi máy POS mất Wi-Fi/4G không tải được mã VietQR động, POS sẽ tự động hiển thị ảnh QR tĩnh này để khách quét chuyển khoản ngay lập tức.
                  </p>
                  <ProductImageUploader
                    value={offlineQrImageUrl}
                    onChange={(val) => setOfflineQrImageUrl(val || '')}
                    label="Tải ảnh mã QR ngân hàng dự phòng (tùy chọn)"
                  />
                </div>
                <div className="pt-1">
                  <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu cấu hình VietQR</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

          </form>

        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Chi tiết Đơn hàng: ${selectedOrder?.order_number}`}
        description="Thông tin chi tiết các món hàng và hình thức thanh toán."
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-background rounded-lg border border-border space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Thời gian tạo:</span>
                <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Hình thức thanh toán:</span>
                <span className="font-semibold capitalize">
                  {selectedOrder.payment_method === 'cash' ? 'Tiền mặt' : 'Quét mã VietQR'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Trạng thái đơn:</span>
                <span className="font-semibold">
                  {getEffectiveOrderStatus(selectedOrder) === 'cancelled'
                    ? 'Đã hủy (Void)'
                    : getEffectiveOrderStatus(selectedOrder) === 'refunded'
                    ? `Đã hoàn tiền (${selectedOrder.refund_record_number || 'Refund'})`
                    : 'Hoàn thành'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Mã Idempotency:</span>
                <span className="font-mono text-[10px] truncate max-w-[200px]">
                  {selectedOrder.idempotency_key}
                </span>
              </div>
            </div>

            {getEffectiveOrderStatus(selectedOrder) === 'cancelled' && (
              <div className="p-3 bg-error-bg border border-[#F8B4AF] rounded-lg space-y-1 text-error">
                <div className="flex items-center gap-1.5 font-bold">
                  <Ban className="w-3.5 h-3.5 shrink-0" />
                  <span>Đơn hàng đã bị Hủy (Void) — Không tính vào doanh thu</span>
                </div>
                <p>
                  <strong>Lý do hủy:</strong> {selectedOrder.cancellation_reason || 'Không ghi chú'}
                </p>
                <p className="text-[11px] opacity-90">
                  Xử lý bởi: <strong>{selectedOrder.cancelled_by || 'Admin'}</strong> •{' '}
                  {selectedOrder.cancelled_at ? formatDate(selectedOrder.cancelled_at) : ''} • Đã tự động hoàn lại sản phẩm vào tồn kho quầy.
                </p>
              </div>
            )}

            {getEffectiveOrderStatus(selectedOrder) === 'refunded' && (
              <div className="p-3 bg-warning-bg border border-gold-text rounded-lg space-y-1 text-warning">
                <div className="flex items-center gap-1.5 font-bold">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Biên bản Hoàn tiền / Trả hàng {selectedOrder.refund_record_number || ''}
                  </span>
                </div>
                <p>
                  <strong>Số tiền hoàn:</strong>{' '}
                  {formatCurrency(
                    selectedOrder.refund_amount ?? selectedOrder.final_amount,
                    activeWorkspace?.currency || 'VND'
                  )}
                </p>
                <p>
                  <strong>Lý do:</strong> {selectedOrder.refund_reason || 'Không ghi chú'}
                </p>
                <p className="text-[11px] opacity-90">
                  Xử lý bởi: <strong>{selectedOrder.refunded_by || 'Admin'}</strong> •{' '}
                  {selectedOrder.refunded_at ? formatDate(selectedOrder.refunded_at) : ''} •{' '}
                  {selectedOrder.refund_restocked ? 'Đã hoàn trả hàng về kho quầy.' : 'Không nhập lại kho.'}
                </p>
              </div>
            )}

            <div>
              <p className="font-bold text-foreground mb-2 uppercase text-[10px] tracking-wider">
                Sản phẩm trong đơn
              </p>
              <div className="divide-y divide-border border border-border rounded-lg">
                {selectedOrder.items?.map((item) => {
                  const variant = variants.find((v) => v.id === item.variant_id);
                  const product = products.find((p) => p.id === variant?.product_id);
                  return (
                    <div key={item.id} className="p-2.5 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-foreground">
                          {product?.name || item.variant_id}
                        </p>
                        <p className="text-[11px] text-muted">
                          {variant?.name} • Mã loại: {variant?.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          {formatCurrency(item.total_price, activeWorkspace?.currency || 'VND')}
                        </p>
                        <p className="text-[10px] text-muted">
                          {item.quantity} x {formatCurrency(item.unit_price, activeWorkspace?.currency || 'VND')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-1.5">
              <div className="flex justify-between text-sm font-bold">
                <span>Tổng thanh toán:</span>
                <span className="text-primary">
                  {formatCurrency(selectedOrder.final_amount, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              {selectedOrder.payment_method === 'cash' && selectedOrder.tendered_amount != null && (
                <div className="p-2.5 bg-background rounded border border-border space-y-1 text-xs">
                  <div className="flex justify-between text-muted">
                    <span>Tiền mặt khách đưa:</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(selectedOrder.tendered_amount, activeWorkspace?.currency || 'VND')}
                    </span>
                  </div>
                  <div className="flex justify-between text-primary font-bold">
                    <span>Tiền đã thối lại:</span>
                    <span>
                      {formatCurrency(selectedOrder.change_amount || 0, activeWorkspace?.currency || 'VND')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {selectedOrder.proof_image_url && (
              <div className="p-3 bg-warning-bg/50 border border-primary/30 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-primary">
                  <Camera className="w-4 h-4" />
                  <span>Ảnh Minh Chứng Nhận Hàng (Đơn Đặt Trước):</span>
                </div>
                <div className="max-h-52 overflow-hidden rounded-lg border border-border flex items-center justify-center bg-surface p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedOrder.proof_image_url}
                    alt="Minh chứng nhận hàng"
                    className="max-h-52 w-auto object-contain rounded"
                  />
                </div>
              </div>
            )}

            {/* RBAC Action Bar for Order Lifecycle */}
            {getEffectiveOrderStatus(selectedOrder) === 'completed' && (
              canControlOrders ? (
                <div className="p-3 rounded-lg bg-background border border-border space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                    <ShieldAlert className="w-3.5 h-3.5 text-warning" />
                    <span>Thao tác kiểm toán đơn hàng (Chỉ Owner / Admin):</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openCancelModal(selectedOrder)}
                      className="gap-1.5 text-xs border-error/40 text-error hover:bg-error-bg"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Hủy đơn (Void) &amp; Hoàn kho</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openRefundModal(selectedOrder)}
                      className="gap-1.5 text-xs border-warning/40 text-warning hover:bg-warning-bg"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Lập Biên Bản Hoàn Tiền / Trả Hàng</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-background border border-border flex items-center gap-2 text-[11px] text-muted">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Quyền hiện tại ({user?.role || 'viewer'}) chỉ được xem giao dịch. Chỉ Chủ sở hữu (Owner) hoặc Admin mới được hủy đơn / hoàn tiền.
                  </span>
                </div>
              )
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReceiptOpen(true)}
                className="gap-1.5 text-xs text-primary border-primary/40 hover:bg-success-bg"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Xem &amp; In Hóa Đơn Nhiệt</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel / Void Order Modal (Owner / Admin only) */}
      <Modal
        isOpen={!!cancelTargetOrder}
        onClose={() => setCancelTargetOrder(null)}
        title={`Hủy đơn hàng (Void): ${cancelTargetOrder?.order_number || ''}`}
        description="Đơn hàng sẽ chuyển sang trạng thái Đã hủy (vẫn lưu lịch sử kiểm toán) và tự động hoàn lại toàn bộ số lượng sản phẩm vào tồn kho quầy."
      >
        {cancelTargetOrder && (
          <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-background border border-border space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">Giá trị đơn gốc:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(cancelTargetOrder.final_amount, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Số lượng hoàn kho dự kiến:</span>
                <span className="font-bold text-primary">
                  +{cancelTargetOrder.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0} sản phẩm
                </span>
              </div>
            </div>

            {cancelTargetOrder.payment_method !== 'cash' && (
              <div className="p-3 rounded-lg bg-warning-bg border border-gold-text text-warning flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Đơn này thanh toán qua <strong>VietQR / Thẻ</strong>. Nếu tiền đã ghi nhận vào tài khoản ngân hàng, bạn nên dùng chức năng <strong>Hoàn tiền / Trả hàng</strong> để xuất biên bản đối soát kế toán.
                </span>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-semibold text-foreground block">
                Lý do hủy đơn <span className="text-error">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CANCEL_PRESET_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setCancelReason(preset);
                      setCancelError(null);
                    }}
                    className={`px-2.5 py-1 rounded-[5px] border text-[11px] transition-colors ${
                      cancelReason === preset
                        ? 'bg-error-bg border-error text-error font-semibold'
                        : 'bg-surface border-border text-muted hover:bg-background'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setCancelError(null);
                }}
                placeholder="Nhập chi tiết lý do hủy đơn (bắt buộc để lưu Audit Trail)..."
                className="w-full rounded-lg border border-border p-2.5 text-xs focus:outline-none focus:border-error"
              />
              {cancelError && <p className="text-[11px] font-medium text-error">{cancelError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCancelTargetOrder(null)}
              >
                Quay lại
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-error hover:bg-[#A63628] text-white gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Xác nhận Hủy đơn &amp; Hoàn kho</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Refund / Return Order Modal (Owner / Admin only) */}
      <Modal
        isOpen={!!refundTargetOrder}
        onClose={() => setRefundTargetOrder(null)}
        title={`Lập Biên Bản Hoàn Tiền: ${refundTargetOrder?.order_number || ''}`}
        description="Ghi nhận hoàn tiền / trả hàng đối với giao dịch đã thanh toán, giữ nguyên đơn gốc và lưu biên bản hoàn tiền vào Nhật ký hoạt động."
      >
        {refundTargetOrder && (
          <form onSubmit={handleConfirmRefund} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-background border border-border space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">Tổng đơn đã thu:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(refundTargetOrder.final_amount, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phương thức gốc:</span>
                <span className="font-semibold text-foreground">
                  {refundTargetOrder.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản VietQR'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">
                Số tiền hoàn trả khách (VND) <span className="text-error">*</span>
              </label>
              <Input
                type="number"
                min={1}
                max={refundTargetOrder.final_amount}
                value={refundAmountInput}
                onChange={(e) => {
                  setRefundAmountInput(e.target.value);
                  setRefundError(null);
                }}
                className="h-8 text-xs font-mono font-bold"
              />
            </div>

            <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-background cursor-pointer">
              <input
                type="checkbox"
                checked={refundRestock}
                onChange={(e) => setRefundRestock(e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <div>
                <p className="font-semibold text-foreground">
                  Hoàn trả +{refundTargetOrder.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0} sản phẩm vào tồn kho bán tại quầy
                </p>
                <p className="text-[11px] text-muted">
                  Bỏ chọn nếu sản phẩm bị lỗi, hư hỏng không thể tiếp tục bán.
                </p>
              </div>
            </label>

            <div className="space-y-2">
              <label className="font-semibold text-foreground block">
                Lý do hoàn tiền / trả hàng <span className="text-error">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {REFUND_PRESET_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setRefundReason(preset);
                      setRefundError(null);
                    }}
                    className={`px-2.5 py-1 rounded-[5px] border text-[11px] transition-colors ${
                      refundReason === preset
                        ? 'bg-warning-bg border-warning text-warning font-semibold'
                        : 'bg-surface border-border text-muted hover:bg-background'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={refundReason}
                onChange={(e) => {
                  setRefundReason(e.target.value);
                  setRefundError(null);
                }}
                placeholder="Ghi rõ lý do hoàn tiền và số tài khoản đối soát (nếu chuyển khoản lại)..."
                className="w-full rounded-lg border border-border p-2.5 text-xs focus:outline-none focus:border-warning"
              />
              {refundError && <p className="text-[11px] font-medium text-error">{refundError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRefundTargetOrder(null)}
              >
                Quay lại
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-warning hover:bg-[#966318] text-white gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xác nhận &amp; Tạo Biên Bản Hoàn Tiền</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Printable Thermal Receipt Modal */}
      <ReceiptModal
        order={selectedOrder}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
}
