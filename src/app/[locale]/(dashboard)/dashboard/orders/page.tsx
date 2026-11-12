'use client';

import * as React from 'react';
import { useOrdersStore } from '@/stores/orders-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { useAuthStore, canManageOrderLifecycle } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate } from '@/lib/utils';
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
} from 'lucide-react';
import { ReceiptModal } from '@/components/pos/receipt-modal';
import {
  isTestEvent,
  isTestOrder,
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
  const { orders, cancelOrder, refundOrder } = useOrdersStore();
  const { events, booths, variants, products } = useDataStore();
  const { user } = useAuthStore();

  const canControlOrders = canManageOrderLifecycle(user?.role);

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
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">Đơn hàng & Giao dịch</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {filterEvent === 'all'
                ? `${realOrders.length} đơn thực tế`
                : isTestEvent(filterEvent)
                ? `${testOrders.length} đơn test`
                : `${filteredOrders.length} đơn`}
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Lịch sử toàn bộ các giao dịch phát sinh qua máy POS từ tất cả quầy bán của sự kiện.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          className="gap-1.5 text-xs text-[#2F7D55] border-[#2F7D55]/30 hover:bg-[#EAF4EE] h-8 font-semibold shadow-2xs self-start sm:self-auto"
          title="Xuất danh sách đơn hàng và dữ liệu vận hành ra file Excel"
        >
          <Download className="w-3.5 h-3.5 text-[#2F7D55]" />
          <span>Xuất Excel (.xlsx)</span>
        </Button>
      </div>

      {/* Sandbox Test Mode Notice Banner */}
      {isTestEvent(filterEvent) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-[8px] bg-[#FEF7EC] border border-[#B7791F]/30 text-xs text-[#B7791F] shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <FlaskConical className="w-4 h-4 shrink-0 text-[#B7791F] mt-0.5 sm:mt-0" />
            <span>
              <strong>Dữ liệu thử nghiệm (Sandbox):</strong> Bạn đang xem {filteredOrders.length} đơn hàng TEST phát sinh khi chạy thử POS. Các đơn hàng này <strong>hoàn toàn không được tính vào doanh thu thực tế</strong>.
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
            <strong>Nguyên tắc kiểm toán POS:</strong> Không cho phép xóa vĩnh viễn đơn hàng đã phát sinh.{' '}
            {canControlOrders
              ? 'Bạn có quyền Quản trị tối cao (Owner/Admin) để Hủy đơn (tự động hoàn kho) hoặc Lập biên bản Hoàn tiền.'
              : 'Nhân viên không có quyền Hủy đơn / Hoàn tiền — liên hệ Owner hoặc Admin khi cần xử lý sai sót.'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-[#9E9E9C] absolute left-3 top-2.5" />
          <Input
            placeholder="Tìm theo mã đơn, ghi chú, lý do..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-white dark:bg-neutral-900 w-full"
          />
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2 flex-1 sm:flex-none min-w-0">
          {/* Event Filter */}
          <select
            className="h-8 w-full max-w-full truncate rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 text-xs text-[#202124] dark:text-neutral-100 focus:outline-none focus:border-[#315C4C]"
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
          >
            <option value="all">Tất cả sự kiện</option>
            <optgroup label="Sự kiện thực tế">
              {realEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </optgroup>
            {testEvents.length > 0 && (
              <optgroup label="Thử nghiệm / Sandbox (Tách biệt)">
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
            className="h-8 w-full max-w-full truncate rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 text-xs text-[#202124] dark:text-neutral-100 focus:outline-none focus:border-[#315C4C]"
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
          >
            <option value="all">Tất cả hình thức</option>
            <option value="cash">Tiền mặt</option>
            <option value="qr_manual">Chuyển khoản VietQR</option>
          </select>

          {/* Order Lifecycle Status Filter */}
          <select
            className="h-8 w-full max-w-full truncate rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 text-xs text-[#202124] dark:text-neutral-100 focus:outline-none focus:border-[#315C4C]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | OrderStatus)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Hoàn thành (Hợp lệ)</option>
            <option value="cancelled">Đã hủy (Void)</option>
            <option value="refunded">Đã hoàn tiền (Refund)</option>
          </select>
        </div>
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

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#F0F0ED] dark:border-neutral-800">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {ord.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR'}
                        </Badge>
                        <span className={`text-[10px] font-medium ${ord.sync_status === 'synced' ? 'text-[#2F7D55]' : 'text-[#B7791F]'}`}>
                          {ord.sync_status === 'synced' ? '• Đã đồng bộ' : '• Chờ đồng bộ'}
                        </span>
                      </div>
                      <span
                        className={`text-base font-extrabold sm:hidden ${
                          isVoidOrRefund ? 'line-through text-[#9E9E9C]' : 'text-[#315C4C] dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <span
                        className={`text-base font-extrabold hidden sm:block mr-2 ${
                          isVoidOrRefund ? 'line-through text-[#9E9E9C]' : 'text-[#315C4C] dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(ord.final_amount, activeWorkspace?.currency || 'VND')}
                      </span>

                      <div className="flex items-center gap-1.5 flex-1 sm:flex-none justify-end">
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
                              <span className="sm:hidden text-[11px] ml-1">Hủy</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs text-[#B7791F] border-[#B7791F]/40 hover:bg-[#FEF7EC]"
                              onClick={() => openRefundModal(ord)}
                              title="Hoàn tiền"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="sm:hidden text-[11px] ml-1">Hoàn</span>
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs gap-1 font-semibold flex-1 sm:flex-none justify-center"
                          onClick={() => setSelectedOrder(ord)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
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
        description="Ghi nhận hoàn tiền / trả hàng đối với giao dịch đã thanh toán, giữ nguyên đơn gốc và lưu biên bản hoàn tiền trong Audit Log."
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
