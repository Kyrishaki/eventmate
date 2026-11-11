import { create } from 'zustand';
import { logActivity } from './audit-store';

export interface CashierShift {
  id: string;
  boothId: string;
  boothName: string;
  eventId: string;
  eventName: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  startingCashFloat: number; // Tiền thối/két bàn giao đầu ca (VND)
  closingCashCount?: number; // Tiền mặt thực tế đếm được khi chốt ca
  expectedCashTotal?: number; // Tiền kỳ vọng trong két (đầu ca + doanh thu tiền mặt)
  cashDifference?: number; // Lệch két: thực tế - kỳ vọng (Âm: thiếu tiền, Dương: thừa tiền)
  totalCashSales: number;
  totalQrSales: number;
  totalSales: number;
  ordersCount: number;
  status: 'open' | 'closed';
  notes?: string;
}

interface ShiftState {
  activeShift: CashierShift | null;
  pastShifts: CashierShift[];
  openShift: (params: {
    boothId: string;
    boothName: string;
    eventId: string;
    eventName: string;
    cashierId: string;
    cashierName: string;
    startingCashFloat: number;
    notes?: string;
  }) => CashierShift;
  recordOrderInShift: (paymentMethod: string, amount: number) => void;
  closeShift: (closingCashCount: number, notes?: string) => CashierShift | null;
  initShifts: () => void;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  activeShift: null,
  pastShifts: [],

  initShifts: () => {
    if (typeof window === 'undefined') return;
    try {
      const savedActive = localStorage.getItem('eventmate-active-shift');
      const savedPast = localStorage.getItem('eventmate-past-shifts');
      set({
        activeShift: savedActive ? JSON.parse(savedActive) : null,
        pastShifts: savedPast ? JSON.parse(savedPast) : [],
      });
    } catch {
      // fallback
    }
  },

  openShift: ({
    boothId,
    boothName,
    eventId,
    eventName,
    cashierId,
    cashierName,
    startingCashFloat,
    notes,
  }) => {
    const newShift: CashierShift = {
      id: `shift-${Date.now()}`,
      boothId,
      boothName,
      eventId,
      eventName,
      cashierId,
      cashierName,
      startTime: new Date().toISOString(),
      startingCashFloat: Math.max(0, startingCashFloat),
      totalCashSales: 0,
      totalQrSales: 0,
      totalSales: 0,
      ordersCount: 0,
      status: 'open',
      notes,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('eventmate-active-shift', JSON.stringify(newShift));
    }

    logActivity({
      actor_name: cashierName,
      actor_role: 'cashier',
      action_type: 'login',
      entity_type: 'booth',
      entity_name: boothName,
      event_name: eventName,
      booth_name: boothName,
      description: `Mở ca thu ngân mới tại "${boothName}". Tiền mặt đầu ca: ${startingCashFloat.toLocaleString('vi-VN')} đ.`,
    });

    set({ activeShift: newShift });
    return newShift;
  },

  recordOrderInShift: (paymentMethod: string, amount: number) => {
    const { activeShift } = get();
    if (!activeShift || activeShift.status !== 'open') return;

    const isCash = paymentMethod === 'cash';
    const isQr = paymentMethod === 'qr_manual' || paymentMethod === 'vietqr' || paymentMethod === 'gateway';

    const updated: CashierShift = {
      ...activeShift,
      totalCashSales: activeShift.totalCashSales + (isCash ? amount : 0),
      totalQrSales: activeShift.totalQrSales + (isQr ? amount : 0),
      totalSales: activeShift.totalSales + amount,
      ordersCount: activeShift.ordersCount + 1,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('eventmate-active-shift', JSON.stringify(updated));
    }

    set({ activeShift: updated });
  },

  closeShift: (closingCashCount: number, notes?: string) => {
    const { activeShift, pastShifts } = get();
    if (!activeShift) return null;

    const expectedCash = activeShift.startingCashFloat + activeShift.totalCashSales;
    const difference = closingCashCount - expectedCash;

    const closedShift: CashierShift = {
      ...activeShift,
      endTime: new Date().toISOString(),
      closingCashCount,
      expectedCashTotal: expectedCash,
      cashDifference: difference,
      status: 'closed',
      notes: notes || activeShift.notes,
    };

    const newPast = [closedShift, ...pastShifts];

    if (typeof window !== 'undefined') {
      localStorage.removeItem('eventmate-active-shift');
      localStorage.setItem('eventmate-past-shifts', JSON.stringify(newPast));
    }

    logActivity({
      actor_name: activeShift.cashierName,
      actor_role: 'cashier',
      action_type: 'order_create',
      entity_type: 'booth',
      entity_name: activeShift.boothName,
      event_name: activeShift.eventName,
      booth_name: activeShift.boothName,
      description: `Chốt ca thu ngân (Z-Report). Doanh thu: ${closedShift.totalSales.toLocaleString('vi-VN')} đ (${closedShift.ordersCount} đơn). Thực đếm két: ${closingCashCount.toLocaleString('vi-VN')} đ (Lệch: ${difference > 0 ? `+${difference.toLocaleString('vi-VN')}` : difference.toLocaleString('vi-VN')} đ).`,
    });

    set({ activeShift: null, pastShifts: newPast });
    return closedShift;
  },
}));
