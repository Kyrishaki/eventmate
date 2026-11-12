'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useShiftStore, CashierShift } from '@/stores/shift-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  Banknote,
  Coins,
  CheckCircle2,
  Printer,
  Copy,
  Lock,
  Sparkles,
  Send,
  AlertCircle,
  Settings2,
} from 'lucide-react';
import {
  sendTelegramMessage,
  getSavedTelegramConfig,
  saveTelegramConfig,
  TelegramConfig,
} from '@/lib/telegram-service';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  boothId: string;
  boothName: string;
  eventId: string;
  eventName: string;
}

export function ShiftModal({
  isOpen,
  onClose,
  boothId,
  boothName,
  eventId,
  eventName,
}: ShiftModalProps) {
  const { user } = useAuthStore();
  const { activeShift, openShift, closeShift, initShifts } = useShiftStore();

  const [startingFloatStr, setStartingFloatStr] = React.useState('0');
  const [closingCashStr, setClosingCashStr] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [lastClosedShift, setLastClosedShift] = React.useState<CashierShift | null>(null);
  const [showZReport, setShowZReport] = React.useState(false);
  const [copiedZReport, setCopiedZReport] = React.useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = React.useState(false);
  const [telegramStatus, setTelegramStatus] = React.useState<{ success: boolean; text: string } | null>(null);
  const [showTelegramConfig, setShowTelegramConfig] = React.useState(false);
  const [telegramBotToken, setTelegramBotToken] = React.useState(() => getSavedTelegramConfig().botToken);
  const [telegramChatId, setTelegramChatId] = React.useState(() => getSavedTelegramConfig().chatId);

  React.useEffect(() => {
    initShifts();
  }, [initShifts]);

  const handleSendTelegram = async () => {
    if (!lastClosedShift) return;
    const config = getSavedTelegramConfig();
    if (!config.botToken || !config.chatId) {
      setShowTelegramConfig(true);
      return;
    }

    setIsSendingTelegram(true);
    setTelegramStatus(null);

    const s = lastClosedShift;
    const msg = [
      `📊 <b>BÁO CÁO CHỐT CA BÁN HÀNG (Z-REPORT)</b>`,
      `🏢 Sự kiện: <b>${s.eventName}</b>`,
      `🛒 Gian hàng: <b>${s.boothName}</b>`,
      `👤 Thu ngân: <b>${s.cashierName}</b>`,
      `🕒 Bắt đầu: ${formatDate(s.startTime)}`,
      `🕒 Chốt ca: ${formatDate(s.endTime || '')}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `📦 Số đơn hàng: <b>${s.ordersCount} đơn</b>`,
      `💵 Tiền mặt: <b>+${formatCurrency(s.totalCashSales, 'VND')}</b>`,
      `💳 Chuyển khoản VietQR: <b>+${formatCurrency(s.totalQrSales, 'VND')}</b>`,
      `💰 <b>TỔNG DOANH THU: ${formatCurrency(s.totalSales, 'VND')}</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `💼 Tiền mặt đầu ca: ${formatCurrency(s.startingCashFloat, 'VND')}`,
      `🏦 Tiền thực đếm: <b>${formatCurrency(s.closingCashCount || 0, 'VND')}</b>`,
      `⚖️ Lệch két: <b>${s.cashDifference === 0 ? '✅ Khớp 100% (0 đ)' : formatCurrency(s.cashDifference || 0, 'VND')}</b>`,
      s.notes ? `📝 Ghi chú: <i>${s.notes}</i>` : '',
      `\n<i>Gửi tự động từ EventMate HikaruStore POS</i>`,
    ].filter(Boolean).join('\n');

    const res = await sendTelegramMessage(msg);
    setTelegramStatus({ success: res.success, text: res.message });
    setIsSendingTelegram(false);
    setTimeout(() => setTelegramStatus(null), 5000);
  };

  const handleSaveTelegramConfig = () => {
    saveTelegramConfig({
      botToken: telegramBotToken.trim(),
      chatId: telegramChatId.trim(),
      enabled: true,
    });
    setShowTelegramConfig(false);
    handleSendTelegram();
  };

  if (!isOpen) return null;

  const isShiftOpen = activeShift && activeShift.status === 'open';

  // Handle Open Shift
  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const floatAmount = parseFloat(startingFloatStr.replace(/\D/g, '')) || 0;
    openShift({
      boothId,
      boothName,
      eventId,
      eventName,
      cashierId: user?.id || 'cashier-current',
      cashierName: user?.fullName || 'Thu ngân',
      startingCashFloat: floatAmount,
      notes,
    });
    setNotes('');
    onClose();
  };

  // Handle Close Shift
  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const countedCash = parseFloat(closingCashStr.replace(/\D/g, '')) || 0;
    const closed = closeShift(countedCash, notes);
    if (closed) {
      setLastClosedShift(closed);
      setShowZReport(true);
    }
  };

  const handleCopyZReport = () => {
    if (!lastClosedShift) return;
    const s = lastClosedShift;
    const text = [
      `=== BÁO CÁO CHỐT CA BÁN HÀNG (Z-REPORT) ===`,
      `Sự kiện: ${s.eventName}`,
      `Quầy: ${s.boothName}`,
      `Thu ngân: ${s.cashierName}`,
      `Bắt đầu: ${formatDate(s.startTime)}`,
      `Kết thúc: ${formatDate(s.endTime || '')}`,
      `------------------------------------------`,
      `Số đơn hàng trong ca: ${s.ordersCount} đơn`,
      `Tiền mặt đầu ca (Float): ${formatCurrency(s.startingCashFloat, 'VND')}`,
      `Doanh thu Tiền mặt: +${formatCurrency(s.totalCashSales, 'VND')}`,
      `Doanh thu VietQR: +${formatCurrency(s.totalQrSales, 'VND')}`,
      `TỔNG DOANH THU CA: ${formatCurrency(s.totalSales, 'VND')}`,
      `------------------------------------------`,
      `Tiền mặt kỳ vọng trong két: ${formatCurrency(s.expectedCashTotal || 0, 'VND')}`,
      `Tiền mặt thực đếm trong két: ${formatCurrency(s.closingCashCount || 0, 'VND')}`,
      `Chênh lệch (Lệch két): ${s.cashDifference! >= 0 ? `+${formatCurrency(s.cashDifference!, 'VND')}` : formatCurrency(s.cashDifference!, 'VND')}`,
      s.notes ? `Ghi chú bàn giao: ${s.notes}` : '',
      `Xác nhận bàn giao: Ký tên ....................`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopiedZReport(true);
    setTimeout(() => setCopiedZReport(false), 2500);
  };

  // Calculation for Closing Form
  const countedNum = parseFloat(closingCashStr.replace(/\D/g, '')) || 0;
  const expectedNum = (activeShift?.startingCashFloat || 0) + (activeShift?.totalCashSales || 0);
  const diffNum = countedNum - expectedNum;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setShowZReport(false);
        onClose();
      }}
      title={
        showZReport
          ? 'Báo Cáo Bàn Giao Ca (Z-Report)'
          : isShiftOpen
          ? 'Chốt Ca Bán Hàng & Bàn Giao Két Tiền'
          : 'Mở Ca Thu Ngân Mới'
      }
      maxWidth="md"
    >
      {/* View 1: Z-Report Printed Summary after closing */}
      {showZReport && lastClosedShift ? (
        <div className="space-y-4">
          <div className="p-3 bg-[#EAF4EE] text-[#2F7D55] rounded-[6px] text-xs flex items-center gap-2 border border-[#CEE6D7]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Ca bán hàng đã được chốt và lưu vào nhật ký đối soát an toàn!</span>
          </div>

          <div
            id="thermal-receipt"
            className="p-4 bg-[#FAFAF8] dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-800 rounded font-mono text-xs space-y-2 text-[#202124] dark:text-neutral-100"
          >
            <div className="text-center pb-2 border-b border-dashed border-[#D6D6D2] dark:border-neutral-700">
              <div className="h-9 w-auto mx-auto mb-1 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="HikaruStore Logo" className="h-9 w-auto max-w-[80px] object-contain mx-auto" />
              </div>
              <p className="font-bold text-sm uppercase">BÁO CÁO CHỐT CA (Z-REPORT)</p>
              <p className="text-[10px] text-[#737373] dark:text-neutral-400">{lastClosedShift.eventName}</p>
              <p className="text-[11px] font-semibold text-[#315C4C]">{lastClosedShift.boothName}</p>
            </div>

            <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-[#D6D6D2] dark:border-neutral-700">
              <div className="flex justify-between">
                <span className="text-[#737373] dark:text-neutral-400">Thu ngân:</span>
                <span className="font-bold">{lastClosedShift.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373] dark:text-neutral-400">Thời gian ca:</span>
                <span>{formatDate(lastClosedShift.startTime)} → {formatDate(lastClosedShift.endTime || '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373] dark:text-neutral-400">Số đơn hoàn thành:</span>
                <span className="font-bold">{lastClosedShift.ordersCount} đơn</span>
              </div>
            </div>

            <div className="space-y-1.5 py-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#737373] dark:text-neutral-400">Tiền thối đầu ca (Float):</span>
                <span>{formatCurrency(lastClosedShift.startingCashFloat, 'VND')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373] dark:text-neutral-400">Doanh thu Tiền mặt:</span>
                <span className="font-semibold">+{formatCurrency(lastClosedShift.totalCashSales, 'VND')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373] dark:text-neutral-400">Doanh thu VietQR:</span>
                <span className="font-semibold">+{formatCurrency(lastClosedShift.totalQrSales, 'VND')}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-[#E8E8E5] text-[#315C4C]">
                <span>TỔNG DOANH THU CA:</span>
                <span>{formatCurrency(lastClosedShift.totalSales, 'VND')}</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-white dark:bg-neutral-950 border border-[#E8E8E5] dark:border-neutral-800 space-y-1 text-xs">
              <div className="flex justify-between text-[#737373] dark:text-neutral-400">
                <span>Tiền mặt kỳ vọng trong két:</span>
                <span className="font-semibold text-[#202124] dark:text-neutral-100">
                  {formatCurrency(lastClosedShift.expectedCashTotal || 0, 'VND')}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Tiền mặt thực đếm bàn giao:</span>
                <span className="text-[#202124] dark:text-neutral-100">
                  {formatCurrency(lastClosedShift.closingCashCount || 0, 'VND')}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-dashed border-[#E8E8E5] text-[11px]">
                <span>Chênh lệch két:</span>
                <span
                  className={
                    lastClosedShift.cashDifference === 0
                      ? 'text-[#2F7D55]'
                      : lastClosedShift.cashDifference! > 0
                      ? 'text-[#B7791F]'
                      : 'text-[#C44536]'
                  }
                >
                  {lastClosedShift.cashDifference === 0
                    ? '✅ Khớp 100% (0 đ)'
                    : lastClosedShift.cashDifference! > 0
                    ? `Thừa +${formatCurrency(lastClosedShift.cashDifference!, 'VND')}`
                    : `Thiếu hụt ${formatCurrency(lastClosedShift.cashDifference!, 'VND')}`}
                </span>
              </div>
            </div>

            {lastClosedShift.notes && (
              <p className="text-[10px] text-[#737373] italic">
                Ghi chú: {lastClosedShift.notes}
              </p>
            )}
          </div>

          {/* Telegram Status Banner */}
          {telegramStatus && (
            <div
              className={`p-2.5 rounded-[6px] text-xs flex items-center gap-2 animate-in fade-in ${
                telegramStatus.success
                  ? 'bg-[#EAF4EE] text-[#2F7D55] border border-[#CEE6D7]'
                  : 'bg-[#FDF1F0] text-[#C44536] border border-[#FADBD8]'
              }`}
            >
              {telegramStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{telegramStatus.text}</span>
            </div>
          )}

          {/* Quick Telegram Bot Setup Drawer */}
          {showTelegramConfig && (
            <div className="p-3 bg-[#F0F8FF] dark:bg-blue-950/40 border border-[#2AABEE]/40 rounded-[8px] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0088cc] flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>Cấu hình Telegram Bot nhận báo cáo</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowTelegramConfig(false)}
                  className="text-[#737373] hover:text-[#202124]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5">
                <div>
                  <Label htmlFor="tg-token" className="text-[11px]">
                    Telegram Bot Token (từ @BotFather)
                  </Label>
                  <Input
                    id="tg-token"
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    placeholder="VD: 123456789:ABCdefGHIjklMNO..."
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="tg-chat-id" className="text-[11px]">
                    Telegram Chat ID / Group ID (từ @userinfobot hoặc -100xxx)
                  </Label>
                  <Input
                    id="tg-chat-id"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="VD: -100123456789 hoặc 987654321"
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTelegramConfig(false)}
                  className="h-7 text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveTelegramConfig}
                  className="h-7 text-xs bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold"
                >
                  Lưu &amp; Gửi Báo Cáo
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#F0F0ED]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyZReport}
              className="gap-1.5 text-xs h-8"
            >
              {copiedZReport ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D55]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedZReport ? 'Đã sao chép' : 'Sao chép'}</span>
            </Button>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSendingTelegram}
                isLoading={isSendingTelegram}
                onClick={handleSendTelegram}
                className="gap-1.5 text-xs h-8 border-[#2AABEE]/40 text-[#0088cc] hover:bg-[#EFF8FF]"
                title="Gửi báo cáo chốt ca về nhóm Telegram của Quản lý / Chủ shop"
              >
                <Send className="w-3.5 h-3.5 text-[#0088cc]" />
                <span>Gửi Telegram</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs h-8"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Z-Report</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowZReport(false);
                  onClose();
                }}
                className="text-xs h-8 bg-[#315C4C] text-white"
              >
                Hoàn tất
              </Button>
            </div>
          </div>
        </div>
      ) : isShiftOpen ? (
        /* View 2: Form Chốt Ca Bán Hàng */
        <form onSubmit={handleCloseShift} className="space-y-4">
          <div className="p-3 bg-[#F7F7F5] dark:bg-neutral-900 rounded-[6px] border border-[#E8E8E5] dark:border-neutral-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#737373]">Thu ngân hiện tại:</span>
              <span className="font-bold text-[#202124]">{activeShift.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Giờ mở ca:</span>
              <span className="font-semibold text-[#202124]">{formatDate(activeShift.startTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Tiền thối đầu ca:</span>
              <span className="font-semibold text-[#202124]">
                {formatCurrency(activeShift.startingCashFloat, 'VND')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737373]">Doanh thu tiền mặt thu được:</span>
              <span className="font-bold text-[#2F7D55]">
                +{formatCurrency(activeShift.totalCashSales, 'VND')} ({activeShift.ordersCount} đơn)
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#E8E8E5] text-xs">
              <span className="font-bold text-[#202124]">Tiền mặt kỳ vọng trong két:</span>
              <span className="font-extrabold text-[#315C4C] text-sm">
                {formatCurrency(expectedNum, 'VND')}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#202124] flex items-center justify-between">
              <span>Tiền mặt thực tế đếm được trong két:</span>
              <span className="text-[11px] font-normal text-[#737373]">Đếm toàn bộ tiền giấy</span>
            </Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Ví dụ: 3.500.000"
                value={closingCashStr}
                onChange={(e) => setClosingCashStr(e.target.value)}
                className="pl-8 text-sm font-bold h-10"
                required
              />
              <Banknote className="w-4 h-4 text-[#315C4C] absolute left-2.5 top-3" />
            </div>
          </div>

          {closingCashStr && (
            <div
              className={`p-3 rounded-[6px] text-xs font-medium border flex items-center justify-between ${
                diffNum === 0
                  ? 'bg-[#EAF4EE] text-[#2F7D55] border-[#CEE6D7]'
                  : diffNum > 0
                  ? 'bg-[#FEF7EC] text-[#B7791F] border-[#FBD38D]'
                  : 'bg-[#FDF1F0] text-[#C44536] border-[#FEB2B2]'
              }`}
            >
              <span>Đối soát chênh lệch:</span>
              <span className="font-bold text-sm">
                {diffNum === 0
                  ? '✅ Két tiền khớp 100%'
                  : diffNum > 0
                  ? `Thừa: +${formatCurrency(diffNum, 'VND')}`
                  : `Thiếu hụt: ${formatCurrency(diffNum, 'VND')}`}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-[#737373]">Ghi chú bàn giao / Giải trình chênh lệch:</Label>
            <Input
              placeholder="Ghi chú người nhận bàn giao ca kế tiếp hoặc lý do lệch tiền..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E8E5]">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!closingCashStr}
              className="text-xs bg-[#C44536] hover:bg-[#A83224] text-white gap-1.5 font-bold"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Xác Nhận Chốt Ca & Xuất Z-Report</span>
            </Button>
          </div>
        </form>
      ) : (
        /* View 3: Form Mở Ca Mới */
        <form onSubmit={handleOpenShift} className="space-y-4">
          <div className="p-3 bg-[#EBF1EE] text-[#315C4C] rounded-[6px] text-xs flex items-center gap-2 border border-[#315C4C]/20">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              Chào <strong>{user?.fullName || 'Thu ngân'}</strong>! Hãy nhập số tiền thối ban đầu (tiền lót két) để bắt đầu ca bán hàng tại quầy.
            </span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#202124]">
              Tiền mặt nhận bàn giao đầu ca (Tiền thối / Float):
            </Label>
            <div className="relative">
              <Input
                type="text"
                placeholder="1.000.000"
                value={startingFloatStr}
                onChange={(e) => setStartingFloatStr(e.target.value)}
                className="pl-8 text-sm font-bold h-10"
                required
              />
              <Coins className="w-4 h-4 text-[#315C4C] absolute left-2.5 top-3" />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              {[500000, 1000000, 2000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setStartingFloatStr(String(amt))}
                  className="px-2 py-0.5 rounded text-[11px] bg-[#F0F0ED] hover:bg-[#E8E8E5] text-[#202124] font-mono cursor-pointer transition-colors"
                >
                  {formatCurrency(amt, 'VND')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[#737373]">Ghi chú ca mở:</Label>
            <Input
              placeholder="Ca sáng / Nhận ca từ bạn An..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E8E5]">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Để sau
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="text-xs bg-[#315C4C] hover:bg-[#254639] text-white gap-1.5 font-bold"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bắt Đầu Mở Ca Bán Hàng</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
