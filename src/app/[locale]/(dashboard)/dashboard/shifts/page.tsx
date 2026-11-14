'use client';

import * as React from 'react';
import { useShiftStore } from '@/stores/shift-store';
import { useDataStore } from '@/stores/data-store';
import { formatCurrency } from '@/lib/utils';
import { Coins, Clock, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ShiftsPage() {
  const { activeShift, pastShifts, initShifts } = useShiftStore();
  const { events, booths } = useDataStore();
  const [selectedEventId, setSelectedEventId] = React.useState('all');

  React.useEffect(() => {
    initShifts();
  }, [initShifts]);

  // Combine active shift and past shifts
  const allShifts = React.useMemo(() => {
    const list = [...pastShifts];
    if (activeShift) {
      list.unshift(activeShift);
    }
    return list;
  }, [activeShift, pastShifts]);

  const filteredShifts = React.useMemo(() => {
    if (selectedEventId === 'all') return allShifts;
    return allShifts.filter((s) => s.eventId === selectedEventId);
  }, [allShifts, selectedEventId]);

  const openShiftsCount = activeShift ? 1 : 0;
  const cashAtBooths = activeShift ? activeShift.startingCashFloat + activeShift.totalCashSales : 0;
  const closedShiftsCount = pastShifts.length;
  const totalDifference = pastShifts.reduce((sum, s) => sum + (s.cashDifference || 0), 0);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 bg-background text-foreground font-sans">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="h-11 px-3.5 bg-surface border border-border rounded-lg text-foreground text-[14px] focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">Tất cả sự kiện</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>
          <span className="text-[13px] text-muted">
            Theo dõi dòng tiền mặt đầu ca và đối soát két đóng ca
          </span>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface border border-border rounded-2xl p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Ca đang mở</span>
          <span className="text-[28px] font-bold text-foreground">{openShiftsCount}</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Tiền mặt đang ở các quầy</span>
          <span className="text-[28px] font-bold text-foreground">
            {formatCurrency(cashAtBooths, 'VND')}
          </span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Ca đã chốt</span>
          <span className="text-[28px] font-bold text-foreground">{closedShiftsCount}</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4.5 flex flex-col gap-1.5">
          <span className="text-[13px] text-muted">Chênh lệch két</span>
          <span
            className={`text-[28px] font-bold ${
              totalDifference < 0
                ? 'text-error'
                : totalDifference > 0
                ? 'text-success'
                : 'text-foreground'
            }`}
          >
            {totalDifference !== 0
              ? `${totalDifference > 0 ? '+' : ''}${formatCurrency(totalDifference, 'VND')}`
              : '0 ₫'}
          </span>
        </div>
      </section>

      {/* Shifts Table */}
      <section className="bg-surface border border-border rounded-2xl px-5 py-2 overflow-x-auto">
        <div className="min-w-[840px]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_140px_100px_110px_120px_120px_120px_110px] gap-3 py-3 border-b border-border text-[13px] text-muted">
            <span>Quầy</span>
            <span>Thu ngân</span>
            <span>Mở ca</span>
            <span>Chốt ca</span>
            <span className="text-right">Tiền đầu ca</span>
            <span className="text-right">Bán tiền mặt</span>
            <span className="text-right">Két đếm được</span>
            <span className="text-right">Chênh lệch</span>
          </div>

          {/* Rows */}
          {filteredShifts.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-muted">
              Chưa có ca làm việc nào được mở. Thu ngân có thể mở ca trực tiếp tại màn hình POS.
            </div>
          ) : (
            filteredShifts.map((s) => {
              const isOpen = s.status === 'open';
              const openTime = new Date(s.startTime).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const closeTime = s.endTime
                ? new Date(s.endTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Đang mở';

              const diff = s.cashDifference ?? 0;

              return (
                <div
                  key={s.id}
                  className="grid grid-cols-[1fr_140px_100px_110px_120px_120px_120px_110px] gap-3 py-3.5 border-b border-border items-center text-[14.5px]"
                >
                  <span className="font-semibold text-foreground truncate">{s.boothName}</span>
                  <span className="text-muted truncate">{s.cashierName}</span>
                  <span>{openTime}</span>
                  <span className={isOpen ? 'text-success font-semibold' : 'text-foreground'}>
                    {closeTime}
                  </span>
                  <span className="text-right font-medium text-muted">
                    {formatCurrency(s.startingCashFloat, 'VND')}
                  </span>
                  <span className="text-right font-medium text-foreground">
                    {formatCurrency(s.totalCashSales, 'VND')}
                  </span>
                  <span className="text-right font-medium text-foreground">
                    {s.closingCashCount !== undefined ? formatCurrency(s.closingCashCount, 'VND') : '—'}
                  </span>
                  <span
                    className={`text-right font-bold ${
                      isOpen
                        ? 'text-muted'
                        : diff < 0
                        ? 'text-error'
                        : diff > 0
                        ? 'text-success'
                        : 'text-success'
                    }`}
                  >
                    {isOpen
                      ? '—'
                      : diff === 0
                      ? '0 ₫'
                      : `${diff > 0 ? '+' : ''}${formatCurrency(diff, 'VND')}`}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      <p className="text-[13px] text-muted leading-relaxed">
        Chênh lệch = két đếm được − (tiền đầu ca + bán tiền mặt). Khi chốt ca bị lệch tiền, thu ngân cần ghi rõ lý do giải trình; quản lý kiểm tra đối soát trực tiếp với két tiền quầy.
      </p>
    </div>
  );
}
