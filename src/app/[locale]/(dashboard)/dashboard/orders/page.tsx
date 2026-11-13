'use client';

import * as React from 'react';
import { useOrdersStore } from '@/stores/orders-store';
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
import { playSuccessChime, speakPaymentReceived } from '@/lib/sound';
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

interface WebhookLogItem {
  id: string;
  gateway: string;
  accountNumber: string;
  amount: number;
  content: string;
  referenceCode: string;
  transactionDate: string;
  source: string;
  receivedAt: string;
}

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
  const [autoCheckEnabled, setAutoCheckEnabled] = React.useState(
    activeBankConfig.autoCheckEnabled !== false
  );
  const [provider, setProvider] = React.useState<'sepay' | 'casso' | 'webhook_only'>(
    activeBankConfig.provider || 'sepay'
  );
  const [apiToken, setApiToken] = React.useState(activeBankConfig.apiToken || '');
  const [voiceAnnouncement, setVoiceAnnouncement] = React.useState(
    activeBankConfig.voiceAnnouncement !== false
  );
  const [offlineQrImageUrl, setOfflineQrImageUrl] = React.useState(
    activeBankConfig.offlineQrImageUrl || ''
  );
  const [isSaved, setIsSaved] = React.useState(false);

  const [isTestingApi, setIsTestingApi] = React.useState(false);
  const [apiTestResult, setApiTestResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [recentWebhooks, setRecentWebhooks] = React.useState<WebhookLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = React.useState(false);
  const [simCode, setSimCode] = React.useState('EM8899');
  const [simAmount, setSimAmount] = React.useState('150000');
  const [webhookCopied, setWebhookCopied] = React.useState(false);

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/payments/webhook`
      : 'https://your-domain.com/api/payments/webhook';

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (activeBankConfig) {
        setBankId(activeBankConfig.bankId || 'MB');
        setAccountNo(activeBankConfig.accountNo || '');
        setAccountName(activeBankConfig.accountName || '');
        setAutoCheckEnabled(activeBankConfig.autoCheckEnabled !== false);
        setProvider(activeBankConfig.provider || 'sepay');
        setApiToken(activeBankConfig.apiToken || '');
        setVoiceAnnouncement(activeBankConfig.voiceAnnouncement !== false);
        setOfflineQrImageUrl(activeBankConfig.offlineQrImageUrl || '');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeBankConfig]);

  const fetchWebhookLogs = React.useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/payments/webhook');
      if (res.ok) {
        const data = await res.json();
        setRecentWebhooks(Array.isArray(data?.transactions) ? data.transactions : []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab !== 'payments') return;
    const timer = setTimeout(() => {
      void fetchWebhookLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchWebhookLogs]);

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
    (o) => !activeWorkspace || o.workspace_id === activeWorkspace.id || o.workspace_id === 'ws-hac-cam-studio'
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
      autoCheckEnabled,
      provider,
      apiToken: apiToken.trim(),
      voiceAnnouncement,
      offlineQrImageUrl: offlineQrImageUrl.trim() || null,
    };
    setBankConfig(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  }

  async function handleTestApiConnection() {
    setIsTestingApi(true);
    setApiTestResult(null);
    try {
      const res = await fetch('/api/payments/check-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testConnection: true,
          provider,
          apiToken: apiToken.trim(),
          accountNo: accountNo.trim(),
        }),
      });
      const data = await res.json();
      setApiTestResult({
        success: !!data.success,
        message: data.message || data.error || 'Không thể kết nối API',
      });
    } catch (err: unknown) {
      setApiTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Lỗi kết nối máy chủ',
      });
    } finally {
      setIsTestingApi(false);
    }
  }

  async function handleSendSimulatedWebhook() {
    const numAmount = parseInt(simAmount.replace(/\D/g, ''), 10) || 150000;
    try {
      await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: bankId,
          accountNumber: accountNo,
          transferType: 'in',
          transferAmount: numAmount,
          content: `Chuyen khoan don hang ${simCode.trim().toUpperCase()}`,
          referenceCode: `FT${Date.now().toString().slice(-8)}`,
          source: 'simulated',
        }),
      });
      playSuccessChime();
      if (voiceAnnouncement) {
        speakPaymentReceived(numAmount);
      }
      await fetchWebhookLogs();
    } catch {
      alert('Không thể gửi tín hiệu thử nghiệm');
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">Đơn hàng &amp; Thanh toán</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {filterEvent === 'all'
                ? `${realOrders.length} đơn thực tế`
                : isTestEvent(filterEvent)
                ? `${testOrders.length} đơn test`
                : `${filteredOrders.length} đơn`}
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Quản lý toàn bộ giao dịch bán hàng POS, đối soát dòng tiền &amp; cấu hình tự động nhận tiền VietQR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 text-xs text-[#2F7D55] border-[#2F7D55]/30 hover:bg-[#EAF4EE] h-8 font-semibold shadow-2xs"
            title="Xuất danh sách đơn hàng và dữ liệu vận hành ra file Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#2F7D55]" />
            <span>Xuất Excel (.xlsx)</span>
          </Button>
        </div>
      </div>

      {/* Unified Financial KPI Strip (Cash vs VietQR vs Total Net) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <div className="flex items-center justify-between text-[#737373] mb-1">
            <span className="text-xs font-medium">Tổng doanh thu thực tế</span>
            <Wallet className="w-4 h-4 text-[#315C4C]" />
          </div>
          <div className="text-xl font-bold text-[#202124] font-mono">
            {formatCurrency(totalNetRevenue, activeWorkspace?.currency || 'VND')}
          </div>
          <p className="text-[10px] text-[#737373] mt-0.5">
            {netRealOrders.length} đơn hợp lệ (đã loại đơn test &amp; hủy/hoàn)
          </p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <div className="flex items-center justify-between text-[#737373] mb-1">
            <span className="text-xs font-medium">Chuyển khoản VietQR</span>
            <QrCode className="w-4 h-4 text-[#315C4C]" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl font-bold text-[#315C4C] font-mono">
              {formatCurrency(qrRevenue, activeWorkspace?.currency || 'VND')}
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className="text-[10.5px] font-semibold text-[#315C4C] hover:underline cursor-pointer"
            >
              Cấu hình QR &rarr;
            </button>
          </div>
          <p className="text-[10px] text-[#737373] mt-0.5">
            TK: {activeBankConfig.bankId} • {activeBankConfig.accountNo}
          </p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <div className="flex items-center justify-between text-[#737373] mb-1">
            <span className="text-xs font-medium">Tiền mặt tại két (Cash)</span>
            <Banknote className="w-4 h-4 text-[#B7791F]" />
          </div>
          <div className="text-xl font-bold text-[#B7791F] font-mono">
            {formatCurrency(cashRevenue, activeWorkspace?.currency || 'VND')}
          </div>
          <p className="text-[10px] text-[#737373] mt-0.5">Thu ngân giữ tại quầy thực tế</p>
        </Card>
      </div>

      {/* Unified Segmented Tabs: Orders vs Payment Settings */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F7F7F5] rounded-xl border border-[#E8E8E5] w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-white text-[#315C4C] shadow-2xs'
              : 'text-[#737373] hover:text-[#202124]'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Đơn hàng &amp; Giao dịch</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EBF1EE] text-[#315C4C] font-mono">
            {realOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-white text-[#315C4C] shadow-2xs'
              : 'text-[#737373] hover:text-[#202124]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Cấu hình VietQR &amp; Tự động nhận tiền</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EAF4EE] text-[#2F7D55] font-mono">
            Auto-Bank
          </span>
        </button>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-5">

      {/* Sandbox Test Mode Notice Banner */}
      {isTestEvent(filterEvent) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-[8px] bg-[#FEF7EC] border border-[#B7791F]/30 text-xs text-[#B7791F] shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <FlaskConical className="w-4 h-4 shrink-0 text-[#B7791F] mt-0.5 sm:mt-0" />
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
          className={`flex items-center justify-between gap-2 p-3 rounded-[8px] border text-xs ${
            actionFeedback.type === 'success'
              ? 'bg-[#EAF4EE] border-[#CEE6D7] text-[#2F7D55]'
              : 'bg-[#FDF1F0] border-[#F8B4AF] text-[#C44536]'
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
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[6px] bg-[#F7F7F5] border border-[#E8E8E5] text-[11px] text-[#555555]">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#315C4C] shrink-0" />
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
          <Search className="w-4 h-4 text-[#9E9E9C] absolute left-3 top-2.5" />
          <Input
            placeholder="Tìm theo mã đơn, ghi chú, lý do..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-white"
          />
        </div>

        {/* Event Filter */}
        <select
          className="h-8 rounded-[6px] border border-[#E8E8E5] bg-white px-2.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
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
          className="h-8 rounded-[6px] border border-[#E8E8E5] bg-white px-2.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
        >
          <option value="all">Tất cả hình thức</option>
          <option value="cash">Tiền mặt</option>
          <option value="qr_manual">Chuyển khoản VietQR</option>
        </select>

        {/* Order Lifecycle Status Filter */}
        <select
          className="h-8 rounded-[6px] border border-[#E8E8E5] bg-white px-2.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
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
        <Card className="border-[#E8E8E5] shadow-xs">
          <CardContent className="p-12 text-center text-xs text-[#737373]">
            <ShoppingCart className="w-10 h-10 text-[#9E9E9C] mx-auto mb-2" />
            <p className="font-semibold text-[#202124]">Chưa có đơn hàng nào phù hợp</p>
            <p className="text-[11px] text-[#737373] mt-1">
              Đơn hàng tạo từ POS tại các quầy bán sẽ tự động tổng hợp tại đây.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#E8E8E5] bg-white shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F7F7F5] border-b border-[#E8E8E5] text-[#737373] uppercase text-[10px] tracking-wider">
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
              <tbody className="divide-y divide-[#F0F0ED]">
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
                          ? 'bg-[#FDF1F0]/40 opacity-65 hover:opacity-85'
                          : isRefunded
                          ? 'bg-[#FEF7EC]/50 opacity-80 hover:opacity-95'
                          : 'hover:bg-[#FBFBFA]'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#202124]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={isCancelled ? 'line-through text-[#737373]' : ''}>
                              {ord.order_number}
                            </span>
                            {isTestOrder(ord) && (
                              <Badge variant="outline" className="text-[9px] border-[#B7791F] text-[#B7791F] bg-[#B7791F]/10">
                                Thử nghiệm
                              </Badge>
                            )}
                          </div>
                          {ord.proof_image_url && (
                            <span className="inline-flex items-center gap-1 text-[9px] text-[#2F7D55] bg-[#EBF1EE] px-1 py-0.2 rounded font-semibold border border-[#2F7D55]/20 w-fit">
                              <Camera className="w-2.5 h-2.5" />
                              Ảnh nhận hàng
                            </span>
                          )}
                          {isCancelled && ord.cancellation_reason && (
                            <span className="font-sans font-normal text-[10px] text-[#C44536] truncate max-w-[180px]" title={ord.cancellation_reason}>
                              Lý do hủy: {ord.cancellation_reason}
                            </span>
                          )}
                          {isRefunded && (
                            <span className="font-sans font-normal text-[10px] text-[#B7791F] truncate max-w-[180px]" title={ord.refund_reason || ''}>
                              {ord.refund_record_number || 'Hoàn tiền'}: {ord.refund_reason}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#737373] whitespace-nowrap">
                        {formatDate(ord.created_at)}
                      </td>

                      <td className="py-3 px-4 text-[#202124]">
                        <p className="font-medium truncate max-w-[180px]">{event?.name}</p>
                        <p className="text-[11px] text-[#737373]">
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
                              ord.sync_status === 'synced' ? 'text-[#2F7D55]' : 'text-[#B7791F]'
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
                            isVoidOrRefund ? 'line-through text-[#9E9E9C]' : 'text-[#315C4C]'
                          }`}
                        >
                          {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                        </span>
                        {isRefunded && (
                          <span className="text-[10px] font-semibold text-[#B7791F]">
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
                                className="h-7 px-2 text-xs text-[#C44536] hover:bg-[#FDF1F0]"
                                title="Hủy đơn (Void) & Hoàn kho"
                                onClick={() => openCancelModal(ord)}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-[#B7791F] hover:bg-[#FEF7EC]"
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
          <div className="md:hidden divide-y divide-[#F0F0ED]">
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
                    isCancelled ? 'bg-[#FDF1F0]/40 opacity-75' : isRefunded ? 'bg-[#FEF7EC]/40 opacity-85' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-mono font-bold text-sm text-[#202124] ${isCancelled ? 'line-through text-[#737373]' : ''}`}>
                        {ord.order_number}
                      </span>
                      {isTestOrder(ord) && (
                        <Badge variant="outline" className="text-[9px] border-[#B7791F] text-[#B7791F] bg-[#B7791F]/10">
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

                  <div className="flex items-center justify-between text-xs text-[#737373]">
                    <div className="truncate pr-2">
                      <p className="font-medium text-[#202124] truncate">{event?.name}</p>
                      <p className="text-[11px] text-[#737373]">
                        {booth?.name} ({booth?.code})
                      </p>
                      {isCancelled && ord.cancellation_reason && (
                        <p className="text-[10px] text-[#C44536] truncate mt-0.5">
                          Lý do hủy: {ord.cancellation_reason}
                        </p>
                      )}
                      {isRefunded && ord.refund_reason && (
                        <p className="text-[10px] text-[#B7791F] truncate mt-0.5">
                          {ord.refund_record_number || 'Hoàn tiền'}: {ord.refund_reason}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px]">{formatDate(ord.created_at)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F0F0ED]">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {ord.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR'}
                      </Badge>
                      <span
                        className={`text-base font-bold ${
                          isVoidOrRefund ? 'line-through text-[#9E9E9C]' : 'text-[#315C4C]'
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
                            className="h-8 px-2 text-xs text-[#C44536] border-[#C44536]/40 hover:bg-[#FDF1F0]"
                            onClick={() => openCancelModal(ord)}
                            title="Hủy đơn"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs text-[#B7791F] border-[#B7791F]/40 hover:bg-[#FEF7EC]"
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
            <div className="flex items-center justify-between p-3 rounded-[6px] bg-[#FEF7EC] border border-[#B7791F]/30 text-xs text-[#B7791F] shadow-xs">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 shrink-0 text-[#B7791F]" />
                <span>
                  Hệ thống đã tự động cách ly <strong>{netTestOrders.length} đơn hàng thử nghiệm ({formatCurrency(testCashAmount, 'VND')})</strong> khỏi dòng tiền thực tế tại quầy để đảm bảo số liệu kế toán chính xác.
                </span>
              </div>
            </div>
          )}

          {isSaved && (
            <div className="flex items-center gap-2 p-3 text-xs text-[#2F7D55] bg-[#EAF4EE] border border-[#CEE6D7] rounded-[6px] shadow-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2F7D55]" />
              <span>
                <strong>Đã lưu cấu hình VietQR &amp; Tự động nhận tiền thành công!</strong> Toàn bộ các màn hình POS của thu ngân đã được đồng bộ tức thì.
              </span>
            </div>
          )}

          <form onSubmit={handleSaveBankConfig} className="space-y-6">
            <Card className="border-[#E8E8E5] bg-white shadow-xs">
              <CardHeader className="border-b border-[#F0F0ED] pb-4">
                <CardTitle className="text-sm font-semibold text-[#202124] flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#315C4C]" />
                  1. Tài khoản Ngân hàng Nhận tiền (VietQR) &amp; QR Dự phòng Offline
                </CardTitle>
                <CardDescription className="text-xs">
                  Hệ thống tự động nhúng số tiền và mã phiên <code className="font-mono font-bold text-[#315C4C]">EMxxxx</code> vào mã QR. Khách quét là hiện sẵn đúng số tiền và nội dung chuyển khoản.
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
                      className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-sm text-[#202124] focus:outline-none focus:border-[#315C4C]"
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
                <div className="p-4 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[6px] flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-28 h-28 bg-white p-1 rounded border border-[#E8E8E5] shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=50000&addInfo=EM8899&accountName=${encodeURIComponent(
                        accountName
                      )}`}
                      alt="VietQR Demo"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-xs text-[#737373] space-y-1">
                    <p className="font-semibold text-[#202124]">Xem trước mã VietQR động tại quầy</p>
                    <p>
                      Khi thu ngân bấm thanh toán trên POS, mã QR sẽ gắn sẵn nội dung riêng (ví dụ: <strong>EM8899</strong>) để máy tự động đối soát xem đơn nào đã được thanh toán.
                    </p>
                    <div className="flex items-center gap-1.5 text-[#2F7D55] text-[11px] pt-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Chuẩn VietQR liên ngân hàng Napas247</span>
                    </div>
                  </div>
                </div>

                {/* Offline Fallback Static QR Image */}
                <div className="p-3.5 rounded-[8px] border border-dashed border-[#B7791F]/40 bg-[#FEF7EC]/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C5D17]">
                    <WifiOff className="w-3.5 h-3.5 text-[#B7791F]" />
                    <span>Ảnh QR tĩnh dự phòng khi mất mạng (Offline Backup QR)</span>
                  </div>
                  <p className="text-[11px] text-[#737373]">
                    Tải lên ảnh chụp mã QR ngân hàng của bạn (lưu cục bộ dạng Base64). Khi máy POS mất Wi-Fi/4G không tải được mã VietQR động, POS sẽ tự động hiển thị ảnh QR tĩnh này để khách quét chuyển khoản ngay lập tức.
                  </p>
                  <ProductImageUploader
                    value={offlineQrImageUrl}
                    onChange={(val) => setOfflineQrImageUrl(val || '')}
                    label="Tải ảnh mã QR ngân hàng dự phòng (tùy chọn)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Auto-Banking Verification without Phone */}
            <Card className="border-[#315C4C]/30 bg-white shadow-xs">
              <CardHeader className="border-b border-[#F0F0ED] pb-4 bg-[#F7FAF8]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold text-[#202124] flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#2F7D55] animate-pulse" />
                      2. Tự động nhận diện Tiền về &amp; Báo thành công trên Web (Không cần cầm ĐT)
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Dành cho trường hợp thu ngân tại quầy không cầm điện thoại nhận thông báo ngân hàng. Khi khách chuyển khoản xong, web POS sẽ tự động phát loa đọc số tiền và chuyển sang màn hình <strong>Thanh toán thành công!</strong>
                    </CardDescription>
                  </div>
                  <Badge className="bg-[#EAF4EE] text-[#2F7D55] border border-[#CEE6D7] shrink-0">
                    Quét 2 giây / lần
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-3 p-3 rounded-[8px] border border-[#E8E8E5] bg-[#FAFAF8] cursor-pointer hover:border-[#315C4C]/40">
                    <input
                      type="checkbox"
                      checked={autoCheckEnabled}
                      onChange={(e) => setAutoCheckEnabled(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-[#D5D5D0] text-[#315C4C] focus:ring-[#315C4C]"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-[#202124]">Tự động nhảy &quot;Thanh toán thành công&quot;</p>
                      <p className="text-[11px] text-[#737373] mt-0.5">
                        Màn hình POS tự động kiểm tra giao dịch khớp mã <code className="font-mono">EMxxxx</code> và tự động hoàn tất đơn hàng ngay khi nhận được tiền.
                      </p>
                    </div>
                  </label>

                  <div className="flex items-start justify-between gap-2 p-3 rounded-[8px] border border-[#E8E8E5] bg-[#FAFAF8]">
                    <label className="flex items-start gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={voiceAnnouncement}
                        onChange={(e) => setVoiceAnnouncement(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-[#D5D5D0] text-[#315C4C] focus:ring-[#315C4C]"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-[#202124]">Loa đọc thông báo tiền về tại quầy</p>
                        <p className="text-[11px] text-[#737373] mt-0.5">
                          Phát tiếng &quot;Ting-ting&quot; và giọng đọc tiếng Việt: <em>&quot;Đã nhận chuyển khoản 150.000 đồng&quot;</em>.
                        </p>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        playSuccessChime();
                        speakPaymentReceived(150000);
                      }}
                      className="shrink-0 px-2.5 py-1.5 rounded-[6px] bg-white border border-[#D5D5D0] hover:bg-[#F0F0ED] text-[11px] font-semibold text-[#315C4C] flex items-center gap-1 cursor-pointer"
                      title="Nghe thử âm thanh báo nhận tiền"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe thử</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="auto-provider">Nguồn đọc biến động số dư</Label>
                    <select
                      id="auto-provider"
                      className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-xs font-semibold text-[#202124] focus:outline-none focus:border-[#315C4C]"
                      value={provider}
                      onChange={(e) =>
                        setProvider(e.target.value as 'sepay' | 'casso' | 'webhook_only')
                      }
                    >
                      <option value="sepay">SePay.vn (Khuyên dùng - Miễn phí)</option>
                      <option value="casso">Casso.vn (API &amp; Webhook)</option>
                      <option value="webhook_only">Webhook trực tiếp / App đọc thông báo ĐT</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="api-token">
                      {provider === 'casso'
                        ? 'Casso API Key (Hoặc để trống nếu chỉ dùng Webhook)'
                        : 'SePay API Token (Lấy tại my.sepay.vn -> Cấu hình Công ty -> API Access)'}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="api-token"
                        type="password"
                        placeholder={
                          provider === 'webhook_only'
                            ? 'Chế độ Webhook không bắt buộc nhập Token'
                            : 'Nhập API Token để web tự động đọc giao dịch (hoạt động cả trên localhost)...'
                        }
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        className="font-mono text-xs flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestApiConnection}
                        disabled={isTestingApi}
                        isLoading={isTestingApi}
                        className="shrink-0 text-xs font-semibold"
                      >
                        Kiểm tra kết nối
                      </Button>
                    </div>
                  </div>
                </div>

                {apiTestResult && (
                  <div
                    className={`p-3 rounded-[6px] border text-xs flex items-center gap-2 ${
                      apiTestResult.success
                        ? 'bg-[#EAF4EE] border-[#CEE6D7] text-[#2F7D55]'
                        : 'bg-[#FDF2E9] border-[#C5221F]/30 text-[#C5221F]'
                    }`}
                  >
                    {apiTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{apiTestResult.message}</span>
                  </div>
                )}

                <div className="p-3.5 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[8px] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#202124]">
                        Địa chỉ Webhook nhận thông báo tiền vào (Tức thì):
                      </p>
                      <p className="text-[11px] text-[#737373]">
                        Dán link này vào mục <strong>Tích hợp Webhooks</strong> trên SePay.vn, Casso.vn hoặc ứng dụng đọc thông báo ngân hàng trên điện thoại của bạn.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined') {
                          navigator.clipboard.writeText(webhookUrl);
                          setWebhookCopied(true);
                          setTimeout(() => setWebhookCopied(false), 2500);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-[6px] bg-white border border-[#D5D5D0] hover:bg-[#F0F0ED] text-xs font-mono font-bold text-[#315C4C] flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{webhookCopied ? 'Đã sao chép!' : 'Sao chép Webhook URL'}</span>
                    </button>
                  </div>
                  <div className="px-3 py-1.5 rounded bg-white border border-[#E8E8E5] font-mono text-xs text-[#202124] select-all overflow-x-auto">
                    {webhookUrl}
                  </div>
                </div>

                <div className="p-3.5 bg-[#EAF4EE]/60 border border-[#CEE6D7] rounded-[8px] text-xs space-y-1.5">
                  <p className="font-bold text-[#202124]">
                    💡 Hướng dẫn 3 bước để không cầm điện thoại vẫn tự nhảy đơn trên Web:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[#333] text-[11.5px]">
                    <li>
                      Tạo tài khoản miễn phí tại <strong>my.sepay.vn</strong> (hoặc <strong>casso.vn</strong>) và liên kết với số tài khoản ngân hàng nhận tiền của bạn (chỉ cần làm 1 lần trên điện thoại chủ TK).
                    </li>
                    <li>
                      Vào mục <strong>API Access</strong> trên SePay copy <strong>API Token</strong> dán vào ô bên trên (hoặc dán <strong>Webhook URL</strong> bên trên vào mục Webhooks của SePay).
                    </li>
                    <li>
                      Bấm <strong>Lưu cấu hình</strong> bên dưới. Từ lúc này, tại quầy POS, khi khách quét mã QR và chuyển khoản xong, <strong>màn hình POS sẽ tự động phát loa báo tiền về và nhảy sang &quot;Thanh toán thành công&quot;</strong> sau 1–2 giây!
                    </li>
                  </ol>
                </div>

                <div className="pt-1">
                  <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu toàn bộ cấu hình Thanh toán &amp; Tự động</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Section 3: Live Webhook / Bank Feed & Simulator */}
          <Card className="border-[#E8E8E5] bg-white shadow-xs">
            <CardHeader className="border-b border-[#F0F0ED] pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold text-[#202124] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#B7791F]" />
                  3. Bảng theo dõi Tín hiệu Tiền về &amp; Giả lập Chuyển khoản
                </CardTitle>
                <CardDescription className="text-xs">
                  Bạn có thể bắn thử một tín hiệu chuyển khoản tại đây trong khi đang mở màn hình POS ở tab bên cạnh để kiểm chứng tính năng tự động nhảy đơn.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchWebhookLogs}
                disabled={isLoadingLogs}
                className="text-xs gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="p-3 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[6px] flex flex-col sm:flex-row items-end gap-3">
                <div className="w-full sm:w-44 space-y-1">
                  <Label htmlFor="sim-code" className="text-xs">
                    Mã nội dung trên QR POS
                  </Label>
                  <Input
                    id="sim-code"
                    value={simCode}
                    onChange={(e) => setSimCode(e.target.value.toUpperCase())}
                    placeholder="VD: EM8899"
                    className="h-8 font-mono text-xs bg-white uppercase"
                  />
                </div>
                <div className="w-full sm:w-44 space-y-1">
                  <Label htmlFor="sim-amount" className="text-xs">
                    Số tiền chuyển (VND)
                  </Label>
                  <Input
                    id="sim-amount"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    placeholder="VD: 150000"
                    className="h-8 font-mono text-xs bg-white"
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSendSimulatedWebhook}
                  className="w-full sm:w-auto gap-1.5 bg-[#2F7D55] hover:bg-[#256343] text-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Bắn tín hiệu tiền về (Test)</span>
                </Button>
              </div>

              {recentWebhooks.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#737373] border border-dashed border-[#E8E8E5] rounded-[6px]">
                  Chưa có giao dịch chuyển khoản nào được ghi nhận trong phiên này.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {recentWebhooks.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-[6px] border border-[#E8E8E5] bg-white flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#2F7D55]">
                            +{formatCurrency(tx.amount, 'VND')}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {tx.gateway}
                          </Badge>
                          <span className="text-[10px] text-[#737373]">
                            {formatTimeOnly(tx.receivedAt)}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-[#202124]">{tx.content}</p>
                      </div>
                      <span className="text-[10px] font-mono text-[#737373]">{tx.referenceCode}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
            <div className="p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#737373]">Thời gian tạo:</span>
                <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Hình thức thanh toán:</span>
                <span className="font-semibold capitalize">
                  {selectedOrder.payment_method === 'cash' ? 'Tiền mặt' : 'Quét mã VietQR'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Trạng thái đơn:</span>
                <span className="font-semibold">
                  {getEffectiveOrderStatus(selectedOrder) === 'cancelled'
                    ? 'Đã hủy (Void)'
                    : getEffectiveOrderStatus(selectedOrder) === 'refunded'
                    ? `Đã hoàn tiền (${selectedOrder.refund_record_number || 'Refund'})`
                    : 'Hoàn thành'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Mã Idempotency:</span>
                <span className="font-mono text-[10px] truncate max-w-[200px]">
                  {selectedOrder.idempotency_key}
                </span>
              </div>
            </div>

            {getEffectiveOrderStatus(selectedOrder) === 'cancelled' && (
              <div className="p-3 bg-[#FDF1F0] border border-[#F8B4AF] rounded-[6px] space-y-1 text-[#C44536]">
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
              <div className="p-3 bg-[#FEF7EC] border border-[#FDE68A] rounded-[6px] space-y-1 text-[#B7791F]">
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
              <p className="font-bold text-[#202124] mb-2 uppercase text-[10px] tracking-wider">
                Sản phẩm trong đơn
              </p>
              <div className="divide-y divide-[#F0F0ED] border border-[#E8E8E5] rounded-[6px]">
                {selectedOrder.items?.map((item) => {
                  const variant = variants.find((v) => v.id === item.variant_id);
                  const product = products.find((p) => p.id === variant?.product_id);
                  return (
                    <div key={item.id} className="p-2.5 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-[#202124]">
                          {product?.name || item.variant_id}
                        </p>
                        <p className="text-[11px] text-[#737373]">
                          {variant?.name} • Mã loại: {variant?.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#202124]">
                          {formatCurrency(item.total_price, activeWorkspace?.currency || 'VND')}
                        </p>
                        <p className="text-[10px] text-[#737373]">
                          {item.quantity} x {formatCurrency(item.unit_price, activeWorkspace?.currency || 'VND')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E8E8E5] space-y-1.5">
              <div className="flex justify-between text-sm font-bold">
                <span>Tổng thanh toán:</span>
                <span className="text-[#315C4C]">
                  {formatCurrency(selectedOrder.final_amount, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              {selectedOrder.payment_method === 'cash' && selectedOrder.tendered_amount != null && (
                <div className="p-2.5 bg-[#F7F7F5] rounded border border-[#E8E8E5] space-y-1 text-xs">
                  <div className="flex justify-between text-[#737373]">
                    <span>Tiền mặt khách đưa:</span>
                    <span className="font-semibold text-[#202124]">
                      {formatCurrency(selectedOrder.tendered_amount, activeWorkspace?.currency || 'VND')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#2F7D55] font-bold">
                    <span>Tiền đã thối lại:</span>
                    <span>
                      {formatCurrency(selectedOrder.change_amount || 0, activeWorkspace?.currency || 'VND')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {selectedOrder.proof_image_url && (
              <div className="p-3 bg-[#EBF1EE]/50 border border-[#2F7D55]/30 rounded-[6px] space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#2F7D55]">
                  <Camera className="w-4 h-4" />
                  <span>Ảnh Minh Chứng Nhận Hàng (Đơn Đặt Trước):</span>
                </div>
                <div className="max-h-52 overflow-hidden rounded-[6px] border border-[#E8E8E5] flex items-center justify-center bg-white p-1">
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
                <div className="p-3 rounded-[6px] bg-[#FAFAF8] border border-[#E8E8E5] space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#202124]">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#B7791F]" />
                    <span>Thao tác kiểm toán đơn hàng (Chỉ Owner / Admin):</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openCancelModal(selectedOrder)}
                      className="gap-1.5 text-xs border-[#C44536]/40 text-[#C44536] hover:bg-[#FDF1F0]"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Hủy đơn (Void) &amp; Hoàn kho</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openRefundModal(selectedOrder)}
                      className="gap-1.5 text-xs border-[#B7791F]/40 text-[#B7791F] hover:bg-[#FEF7EC]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Lập Biên Bản Hoàn Tiền / Trả Hàng</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-[6px] bg-[#F7F7F5] border border-[#E8E8E5] flex items-center gap-2 text-[11px] text-[#737373]">
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
                className="gap-1.5 text-xs text-[#315C4C] border-[#315C4C]/40 hover:bg-[#EAF4EE]"
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
            <div className="p-3 rounded-[6px] bg-[#F7F7F5] border border-[#E8E8E5] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#737373]">Giá trị đơn gốc:</span>
                <span className="font-bold text-[#202124]">
                  {formatCurrency(cancelTargetOrder.final_amount, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Số lượng hoàn kho dự kiến:</span>
                <span className="font-bold text-[#2F7D55]">
                  +{cancelTargetOrder.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0} sản phẩm
                </span>
              </div>
            </div>

            {cancelTargetOrder.payment_method !== 'cash' && (
              <div className="p-3 rounded-[6px] bg-[#FEF7EC] border border-[#FDE68A] text-[#B7791F] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Đơn này thanh toán qua <strong>VietQR / Thẻ</strong>. Nếu tiền đã ghi nhận vào tài khoản ngân hàng, bạn nên dùng chức năng <strong>Hoàn tiền / Trả hàng</strong> để xuất biên bản đối soát kế toán.
                </span>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-semibold text-[#202124] block">
                Lý do hủy đơn <span className="text-[#C44536]">*</span>
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
                        ? 'bg-[#FDF1F0] border-[#C44536] text-[#C44536] font-semibold'
                        : 'bg-white border-[#E8E8E5] text-[#555555] hover:bg-[#F7F7F5]'
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
                className="w-full rounded-[6px] border border-[#E8E8E5] p-2.5 text-xs focus:outline-none focus:border-[#C44536]"
              />
              {cancelError && <p className="text-[11px] font-medium text-[#C44536]">{cancelError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E8E5]">
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
                className="bg-[#C44536] hover:bg-[#A63628] text-white gap-1.5"
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
            <div className="p-3 rounded-[6px] bg-[#F7F7F5] border border-[#E8E8E5] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#737373]">Tổng đơn đã thu:</span>
                <span className="font-bold text-[#202124]">
                  {formatCurrency(refundTargetOrder.final_amount, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Phương thức gốc:</span>
                <span className="font-semibold text-[#202124]">
                  {refundTargetOrder.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản VietQR'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#202124] block">
                Số tiền hoàn trả khách (VND) <span className="text-[#C44536]">*</span>
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

            <label className="flex items-start gap-2.5 p-2.5 rounded-[6px] border border-[#E8E8E5] bg-[#FAFAF8] cursor-pointer">
              <input
                type="checkbox"
                checked={refundRestock}
                onChange={(e) => setRefundRestock(e.target.checked)}
                className="mt-0.5 accent-[#315C4C]"
              />
              <div>
                <p className="font-semibold text-[#202124]">
                  Hoàn trả +{refundTargetOrder.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0} sản phẩm vào tồn kho bán tại quầy
                </p>
                <p className="text-[11px] text-[#737373]">
                  Bỏ chọn nếu sản phẩm bị lỗi, hư hỏng không thể tiếp tục bán.
                </p>
              </div>
            </label>

            <div className="space-y-2">
              <label className="font-semibold text-[#202124] block">
                Lý do hoàn tiền / trả hàng <span className="text-[#C44536]">*</span>
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
                        ? 'bg-[#FEF7EC] border-[#B7791F] text-[#B7791F] font-semibold'
                        : 'bg-white border-[#E8E8E5] text-[#555555] hover:bg-[#F7F7F5]'
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
                className="w-full rounded-[6px] border border-[#E8E8E5] p-2.5 text-xs focus:outline-none focus:border-[#B7791F]"
              />
              {refundError && <p className="text-[11px] font-medium text-[#C44536]">{refundError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E8E5]">
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
                className="bg-[#B7791F] hover:bg-[#966318] text-white gap-1.5"
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
