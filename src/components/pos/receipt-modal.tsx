'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order } from '@/types/database';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { getEffectiveOrderStatus } from '@/lib/test-data-filter';
import { Printer, Copy, CheckCircle2, QrCode, Bluetooth, AlertCircle } from 'lucide-react';
import { printReceiptViaBluetooth, isWebBluetoothSupported } from '@/lib/bluetooth-printer';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  eventName?: string;
  boothName?: string;
}

export function ReceiptModal({
  order,
  isOpen,
  onClose,
  eventName,
  boothName,
}: ReceiptModalProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { events, booths, variants, products } = useDataStore();
  const [copied, setCopied] = React.useState(false);
  const [isPrintingBt, setIsPrintingBt] = React.useState(false);
  const [btStatus, setBtStatus] = React.useState<{ success: boolean; text: string } | null>(null);

  if (!order || !isOpen) return null;

  const currentEvent = eventName || events.find((e) => e.id === order.event_id)?.name || 'Tour Merchandise';
  const currentBooth = boothName || booths.find((b) => b.id === order.booth_id)?.name || 'Quầy Bán Hàng';

  const getItemNames = (it: { variant_id: string }) => {
    const v = variants.find((variant) => variant.id === it.variant_id);
    const p = products.find((prod) => prod.id === v?.product_id);
    return {
      productName: p?.name || 'Sản phẩm Merchandise',
      variantName: v?.name || it.variant_id,
      collabPartner: p?.collab_partner || null,
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintBluetooth = async () => {
    setIsPrintingBt(true);
    setBtStatus(null);
    try {
      const itemDetails = (order.items || []).map((it) => {
        const { productName, variantName } = getItemNames(it);
        return {
          name: productName,
          variant: variantName,
          quantity: it.quantity,
          price: it.unit_price,
        };
      });

      const res = await printReceiptViaBluetooth({
        order,
        workspace: activeWorkspace,
        eventName: currentEvent,
        boothName: currentBooth,
        itemDetails,
      });

      setBtStatus({ success: res.success, text: res.message });
      setTimeout(() => setBtStatus(null), 5000);
    } catch (err: unknown) {
      setBtStatus({
        success: false,
        text: err instanceof Error ? err.message : 'Lỗi kết nối máy in Bluetooth.',
      });
    } finally {
      setIsPrintingBt(false);
    }
  };

  const handleCopyText = () => {
    const textReceipt = [
      `=== ${activeWorkspace?.name || 'HIKARUSTORE'} ===`,
      activeWorkspace?.owner_name ? `Đại diện: ${activeWorkspace.owner_name}` : '',
      activeWorkspace?.phone ? `Hotline: ${activeWorkspace.phone}` : '',
      activeWorkspace?.address ? `Địa chỉ: ${activeWorkspace.address}` : '',
      `Sự kiện: ${currentEvent}`,
      `Quầy: ${currentBooth}`,
      `Mã đơn: ${order.order_number}`,
      `Thời gian: ${formatDate(order.created_at)}`,
      `--------------------------------`,
      ...(order.items || []).map((it) => {
        const { productName, variantName, collabPartner } = getItemNames(it);
        const tag = collabPartner ? ` [Collab: ${collabPartner}]` : '';
        return `${productName} (${variantName})${tag} x${it.quantity}: ${formatCurrency(it.unit_price * it.quantity, activeWorkspace?.currency || 'VND')}`;
      }),
      `--------------------------------`,
      `Tạm tính: ${formatCurrency(order.subtotal_amount, activeWorkspace?.currency || 'VND')}`,
      order.discount_amount > 0 ? `Giảm giá: -${formatCurrency(order.discount_amount, activeWorkspace?.currency || 'VND')}` : '',
      `TỔNG CỘNG: ${formatCurrency(order.final_amount, activeWorkspace?.currency || 'VND')}`,
      `Hình thức: ${order.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản VietQR'}`,
      getEffectiveOrderStatus(order) === 'cancelled'
        ? `*** ĐƠN ĐÃ HỦY (VOID) - Lý do: ${order.cancellation_reason || ''} ***`
        : getEffectiveOrderStatus(order) === 'refunded'
        ? `*** ĐÃ HOÀN TIỀN (${order.refund_record_number || 'RF'}) - Số tiền: ${formatCurrency(order.refund_amount ?? order.final_amount, activeWorkspace?.currency || 'VND')} - Lý do: ${order.refund_reason || ''} ***`
        : '',
      activeWorkspace?.slogan || 'Cảm ơn quý khách đã ủng hộ!',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(textReceipt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hóa Đơn & Biên Nhận Thanh Toán" maxWidth="md">
      <div className="space-y-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border no-print">
          <p className="text-xs text-muted">
            Hóa đơn nhiệt chuẩn khổ 58mm / 80mm hoặc in Bluetooth
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="text-xs gap-1.5 h-8"
              title="Sao chép toàn bộ biên lai dạng văn bản"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPrintingBt}
              isLoading={isPrintingBt}
              onClick={handlePrintBluetooth}
              className="text-xs gap-1.5 h-8 border-primary/40 text-primary hover:bg-success-bg"
              title="In trực tiếp ra máy in nhiệt mini cầm tay qua Bluetooth không dây"
            >
              <Bluetooth className="w-3.5 h-3.5 text-primary" />
              <span>In Bluetooth</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5 h-8 bg-primary text-primary-foreground hover:bg-gold-text"
              title="In hóa đơn qua trình duyệt hoặc lưu file PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Trình Duyệt</span>
            </Button>
          </div>
        </div>

        {btStatus && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-center gap-2 no-print animate-in fade-in ${
              btStatus.success
                ? 'bg-success-bg text-primary border border-[#CEE6D7]'
                : 'bg-error-bg text-error border border-error-bg'
            }`}
          >
            {btStatus.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{btStatus.text}</span>
          </div>
        )}

        {/* Thermal Receipt Preview Paper */}
        <div className="bg-background dark:bg-surface p-4 sm:p-6 rounded-lg border border-border dark:border-border flex justify-center">
          <div
            id="thermal-receipt"
            className="w-full max-w-[340px] bg-surface dark:bg-background p-5 rounded-lg shadow-sm border border-border dark:border-border font-mono text-[11px] leading-relaxed text-foreground dark:text-foreground space-y-3"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-border-strong dark:border-border space-y-1">
              <div className="h-10 w-auto mx-auto flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Logo" className="h-10 w-auto max-w-[85px] object-contain mx-auto" />
              </div>
              <p className="font-bold text-sm uppercase tracking-wider">{activeWorkspace?.name || 'HIKARUSTORE'}</p>
              {activeWorkspace?.owner_name && (
                <p className="text-[10px] text-muted dark:text-muted">Đại diện: {activeWorkspace.owner_name}</p>
              )}
              {activeWorkspace?.phone && (
                <p className="text-[10px] text-muted dark:text-muted">Hotline: {activeWorkspace.phone}</p>
              )}
              {activeWorkspace?.address && (
                <p className="text-[9.5px] text-muted dark:text-muted leading-tight px-2">{activeWorkspace.address}</p>
              )}
              <p className="text-[11px] font-semibold text-primary pt-1">{currentEvent}</p>
              <p className="text-[10px] text-muted dark:text-muted">{currentBooth}</p>
            </div>

            {/* Meta Info */}
            <div className="text-[10px] space-y-1 pb-2 border-b border-dashed border-border-strong dark:border-border">
              <div className="flex justify-between">
                <span className="text-muted dark:text-muted">Mã đơn hàng:</span>
                <span className="font-bold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted dark:text-muted">Thời gian:</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted dark:text-muted">Hình thức:</span>
                <span className="font-semibold uppercase">
                  {order.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR Chuyển khoản'}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 py-2 border-b border-dashed border-border-strong dark:border-border">
              <div className="flex justify-between font-bold text-[10px] text-muted dark:text-muted pb-1">
                <span>MÓN HÀNG</span>
                <span>THÀNH TIỀN</span>
              </div>
              {(order.items || []).map((it, idx) => {
                const { productName, variantName, collabPartner } = getItemNames(it);
                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-semibold">
                      <span className="truncate pr-2">
                        {productName}
                        {collabPartner && (
                          <span className="text-[9px] text-warning ml-1 font-normal">[Collab: {collabPartner}]</span>
                        )}
                      </span>
                      <span className="shrink-0">
                        {formatCurrency(it.unit_price * it.quantity, activeWorkspace?.currency || 'VND')}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted dark:text-muted">
                      <span>
                        {variantName} x {it.quantity} @ {formatCurrency(it.unit_price, activeWorkspace?.currency || 'VND')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="space-y-1 pt-1 text-xs">
              <div className="flex justify-between text-[11px] text-muted dark:text-muted">
                <span>Tạm tính:</span>
                <span>{formatCurrency(order.subtotal_amount, activeWorkspace?.currency || 'VND')}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-[11px] text-error">
                  <span>Giảm giá:</span>
                  <span>-{formatCurrency(order.discount_amount, activeWorkspace?.currency || 'VND')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-primary pt-1 border-t border-border dark:border-border">
                <span>TỔNG THANH TOÁN:</span>
                <span className={getEffectiveOrderStatus(order) !== 'completed' ? 'line-through text-muted' : ''}>
                  {formatCurrency(order.final_amount, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              {getEffectiveOrderStatus(order) === 'cancelled' && (
                <div className="mt-2 p-2 border border-dashed border-error bg-error-bg text-error text-center space-y-0.5 rounded">
                  <p className="font-bold text-[11px]">*** ĐƠN HÀNG ĐÃ HỦY (VOID) ***</p>
                  {order.cancellation_reason && (
                    <p className="text-[9px]">Lý do: {order.cancellation_reason}</p>
                  )}
                </div>
              )}
              {getEffectiveOrderStatus(order) === 'refunded' && (
                <div className="mt-2 p-2 border border-dashed border-warning bg-warning-bg text-warning text-center space-y-0.5 rounded">
                  <p className="font-bold text-[11px]">
                    *** BIÊN BẢN HOÀN TIỀN ({order.refund_record_number || 'RF'}) ***
                  </p>
                  <p className="text-[10px] font-bold">
                    Số tiền đã hoàn: {formatCurrency(order.refund_amount ?? order.final_amount, activeWorkspace?.currency || 'VND')}
                  </p>
                  {order.refund_reason && (
                    <p className="text-[9px]">Lý do: {order.refund_reason}</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer QR & Message */}
            <div className="text-center pt-3 border-t border-dashed border-border-strong dark:border-border space-y-2">
              <p className="text-[10px] text-muted dark:text-muted italic">
                {activeWorkspace?.slogan || 'Cảm ơn bạn đã đồng hành và ủng hộ nghệ sĩ!'}
                <br />
                Vui lòng kiểm tra hàng hóa kỹ trước khi rời quầy.
              </p>
              <div className="w-16 h-16 mx-auto bg-surface-hover dark:bg-surface-hover rounded flex items-center justify-center border border-dashed border-border dark:border-border">
                <QrCode className="w-10 h-10 text-muted dark:text-muted" />
              </div>
              <p className="text-[9px] text-muted font-mono">#{order.id}</p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2 no-print">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
