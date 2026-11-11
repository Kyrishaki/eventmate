'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Order } from '@/types/database';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { Printer, Copy, CheckCircle2, QrCode } from 'lucide-react';

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
        <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E5] no-print">
          <p className="text-xs text-[#737373]">
            Hóa đơn nhiệt chuẩn khổ 58mm / 80mm hoặc xem biên nhận điện tử
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="text-xs gap-1.5 h-8"
              title="Sao chép toàn bộ biên lai dạng văn bản"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D55]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5 h-8 bg-[#315C4C] text-white hover:bg-[#254639]"
              title="In hóa đơn ra máy in nhiệt di động hoặc lưu file PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Hóa Đơn</span>
            </Button>
          </div>
        </div>

        {/* Thermal Receipt Preview Paper */}
        <div className="bg-[#FAFAF8] dark:bg-neutral-900 p-4 sm:p-6 rounded-[8px] border border-[#E8E8E5] dark:border-neutral-800 flex justify-center">
          <div
            id="thermal-receipt"
            className="w-full max-w-[340px] bg-white dark:bg-neutral-950 p-5 rounded-[4px] shadow-sm border border-[#E8E8E5] dark:border-neutral-800 font-mono text-[11px] leading-relaxed text-[#202124] dark:text-neutral-100 space-y-3"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-[#D6D6D2] dark:border-neutral-700 space-y-1">
              <div className="w-9 h-9 mx-auto rounded-[6px] overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <p className="font-bold text-sm uppercase tracking-wider">{activeWorkspace?.name || 'HIKARUSTORE'}</p>
              {activeWorkspace?.owner_name && (
                <p className="text-[10px] text-[#737373] dark:text-neutral-400">Đại diện: {activeWorkspace.owner_name}</p>
              )}
              {activeWorkspace?.phone && (
                <p className="text-[10px] text-[#737373] dark:text-neutral-400">Hotline: {activeWorkspace.phone}</p>
              )}
              {activeWorkspace?.address && (
                <p className="text-[9.5px] text-[#737373] dark:text-neutral-400 leading-tight px-2">{activeWorkspace.address}</p>
              )}
              <p className="text-[11px] font-semibold text-[#315C4C] pt-1">{currentEvent}</p>
              <p className="text-[10px] text-[#737373] dark:text-neutral-400">{currentBooth}</p>
            </div>

            {/* Meta Info */}
            <div className="text-[10px] space-y-1 pb-2 border-b border-dashed border-[#D6D6D2] dark:border-neutral-700">
              <div className="flex justify-between">
                <span className="text-[#737373] dark:text-neutral-400">Mã đơn hàng:</span>
                <span className="font-bold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373] dark:text-neutral-400">Thời gian:</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373] dark:text-neutral-400">Hình thức:</span>
                <span className="font-semibold uppercase">
                  {order.payment_method === 'cash' ? 'Tiền mặt' : 'VietQR Chuyển khoản'}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 py-2 border-b border-dashed border-[#D6D6D2] dark:border-neutral-700">
              <div className="flex justify-between font-bold text-[10px] text-[#737373] dark:text-neutral-400 pb-1">
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
                          <span className="text-[9px] text-[#B7791F] ml-1 font-normal">[Collab: {collabPartner}]</span>
                        )}
                      </span>
                      <span className="shrink-0">
                        {formatCurrency(it.unit_price * it.quantity, activeWorkspace?.currency || 'VND')}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#737373] dark:text-neutral-400">
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
              <div className="flex justify-between text-[11px] text-[#737373] dark:text-neutral-400">
                <span>Tạm tính:</span>
                <span>{formatCurrency(order.subtotal_amount, activeWorkspace?.currency || 'VND')}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-[11px] text-[#C44536]">
                  <span>Giảm giá:</span>
                  <span>-{formatCurrency(order.discount_amount, activeWorkspace?.currency || 'VND')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-[#315C4C] pt-1 border-t border-[#E8E8E5] dark:border-neutral-700">
                <span>TỔNG THANH TOÁN:</span>
                <span>{formatCurrency(order.final_amount, activeWorkspace?.currency || 'VND')}</span>
              </div>
            </div>

            {/* Footer QR & Message */}
            <div className="text-center pt-3 border-t border-dashed border-[#D6D6D2] dark:border-neutral-700 space-y-2">
              <p className="text-[10px] text-[#737373] dark:text-neutral-400 italic">
                {activeWorkspace?.slogan || 'Cảm ơn bạn đã đồng hành và ủng hộ nghệ sĩ!'}
                <br />
                Vui lòng kiểm tra hàng hóa kỹ trước khi rời quầy.
              </p>
              <div className="w-16 h-16 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-600">
                <QrCode className="w-10 h-10 text-neutral-600 dark:text-neutral-300" />
              </div>
              <p className="text-[9px] text-[#9E9E9C] font-mono">#{order.id}</p>
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
