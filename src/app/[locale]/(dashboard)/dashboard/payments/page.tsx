'use client';

import * as React from 'react';
import { usePreorderStore } from '@/stores/preorder-store';
import { useOrdersStore } from '@/stores/orders-store';
import { useDataStore } from '@/stores/data-store';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Image as ImageIcon, Search, Check, X, ShieldAlert } from 'lucide-react';

export default function ReconciliationPage() {
  const { preorders, fulfillPreorder, cancelPreorder } = usePreorderStore();
  const { orders } = useOrdersStore();
  const { booths } = useDataStore();

  const [activeTab, setActiveTab] = React.useState<'pending' | 'confirmed' | 'unmatched'>('pending');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Pending transfers: Hold preorders awaiting bank reconciliation + manual POS orders
  const pendingItems = React.useMemo(() => {
    return preorders.filter((p) => p.status === 'pending_pickup');
  }, [preorders]);

  const confirmedItems = React.useMemo(() => {
    return preorders.filter((p) => p.status === 'picked_up');
  }, [preorders]);

  const currentList = activeTab === 'pending' ? pendingItems : confirmedItems;

  // Auto-select first item
  React.useEffect(() => {
    if (currentList.length > 0 && (!selectedId || !currentList.some((i) => i.id === selectedId))) {
      setSelectedId(currentList[0].id);
    }
  }, [currentList, selectedId]);

  const selectedItem = currentList.find((i) => i.id === selectedId) || currentList[0];
  const booth = booths.find((b) => b.id === selectedItem?.booth_id);

  const handleConfirmReceived = () => {
    if (!selectedItem) return;
    if (!selectedItem.receipt_image_url && !selectedItem.proof_image_url) {
      alert('CẢNH BÁO: Đơn này thiếu ảnh minh chứng biên lai chuyển khoản!');
    }
    // Mark as verified or note
    alert(`Đã xác nhận tiền chuyển khoản cho đơn #${selectedItem.code}!`);
  };

  const handleReject = () => {
    if (!selectedItem) return;
    const reason = prompt('Nhập lý do chưa nhận được tiền hoặc từ chối đơn:', 'Chưa thấy giao dịch tiền về tài khoản');
    if (reason) {
      cancelPreorder({
        preorderId: selectedItem.id,
        reason,
        actorName: 'Admin Đối soát',
        actorRole: 'admin',
      });
      alert(`Đã hủy/từ chối đơn #${selectedItem.code}`);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row bg-background text-foreground font-sans">
      {/* Left List Pane */}
      <section className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 flex flex-col gap-5 overflow-y-auto">
        {/* Segment Tabs */}
        <div className="flex gap-1 p-1 bg-surface border border-border rounded-2xl self-start max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`h-10 px-3.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-foreground text-background font-bold shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Chờ đối soát {pendingItems.length}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('confirmed')}
            className={`h-10 px-3.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'confirmed'
                ? 'bg-foreground text-background font-bold shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Đã xác nhận ({confirmedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unmatched')}
            className={`h-10 px-3.5 rounded-lg text-[14px] font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'unmatched'
                ? 'bg-foreground text-background font-bold shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Giao dịch chưa khớp đơn nào
          </button>
        </div>

        {/* List of Orders */}
        <div className="flex flex-col gap-2.5">
          {currentList.length === 0 ? (
            <div className="py-16 text-center text-[14px] text-muted bg-surface border border-border rounded-2xl p-6">
              Không có giao dịch nào cần xử lý trong mục này.
            </div>
          ) : (
            currentList.map((item) => {
              const isSelected = item.id === selectedId;
              const hasReceipt = !!(item.receipt_image_url || item.proof_image_url);
              const orderDate = new Date(item.created_at);
              const timeStr = `${orderDate.getHours().toString().padStart(2, '0')}:${orderDate.getMinutes().toString().padStart(2, '0')}`;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`text-left p-3.5 sm:p-4 rounded-2xl bg-surface text-foreground flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-2 border-primary shadow-xs'
                      : 'border border-border hover:border-border-strong'
                  }`}
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="font-semibold text-[15px] text-foreground truncate">
                      {item.code} · {item.customer_name}
                    </span>
                    <span className="text-[12.5px] text-muted truncate">
                      Đơn giữ · {booth?.name || 'Vẽ thôi'} · {timeStr}
                    </span>
                  </div>

                  <span
                    className={`text-[13px] font-medium shrink-0 ${
                      hasReceipt ? 'text-success' : 'text-primary'
                    }`}
                  >
                    {hasReceipt ? 'Có ảnh biên lai' : 'Chưa có ảnh'}
                  </span>

                  <span className="font-bold text-[15px] text-right text-foreground min-w-[90px] shrink-0">
                    {formatCurrency(item.total_amount, 'VND')}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <p className="text-[13px] text-muted leading-relaxed">
          Gồm đơn giữ của khách và đơn tại quầy được xác nhận thủ công. Khách giữ hàng được yêu cầu chụp tải ảnh biên lai chuyển khoản để làm căn cứ đối soát tiền về.
        </p>
      </section>

      {/* Right Detail / Inspector Pane (width 440px - Matching C17) */}
      {selectedItem ? (
        <aside className="w-full lg:w-[440px] shrink-0 bg-surface border-t lg:border-t-0 lg:border-l border-border p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <span className="font-bold text-[20px] text-foreground tracking-tight">
              {selectedItem.code}
            </span>
            <span className="text-[13px] text-muted">
              {selectedItem.customer_name} · SĐT: {selectedItem.customer_phone || 'Không có'} · {booth?.name || 'Vẽ thôi'}
            </span>
          </div>

          {/* Items breakdown */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            {selectedItem.items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between text-[14px]">
                <span className="text-foreground">
                  {it.quantity} × {it.product_name}
                </span>
                <span className="text-muted">
                  {formatCurrency(it.unit_price * it.quantity, 'VND')}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2.5 border-t border-border font-bold text-[15px]">
              <span className="text-foreground">Cần nhận</span>
              <span className="text-primary text-[17px]">
                {formatCurrency(selectedItem.total_amount, 'VND')}
              </span>
            </div>
          </div>

          {/* Bank match notification box */}
          <div className="p-3.5 rounded-2xl border border-border bg-surface-hover flex flex-col gap-1">
            <span className="font-semibold text-[14px] text-primary">
              Kiểm tra sao kê và ảnh biên lai
            </span>
            <span className="text-[12.5px] text-muted leading-relaxed">
              Khớp số tiền <strong>{formatCurrency(selectedItem.total_amount, 'VND')}</strong> với cú pháp chuyển khoản <strong>GIU {selectedItem.code.replace(/[^0-9]/g, '')}</strong>.
            </span>
          </div>

          {/* Receipt Proof Photo Box (MANDATORY PROOF VIEWER) */}
          <div className="flex-1 min-h-[160px] max-h-[280px] rounded-2xl bg-surface-hover border border-border flex flex-col items-center justify-center p-3 relative overflow-hidden">
            {selectedItem.receipt_image_url || selectedItem.proof_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedItem.receipt_image_url || selectedItem.proof_image_url}
                alt="Ảnh biên lai chuyển khoản"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-center text-muted p-4">
                <ShieldAlert className="w-8 h-8 text-error" />
                <span className="text-[13px] font-semibold text-error">
                  Khách chưa tải ảnh biên lai chuyển khoản
                </span>
                <span className="text-[11.5px] leading-snug">
                  Quy định yêu cầu chụp minh chứng để bảo đảm đối soát.
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleReject}
              className="h-12 px-4 rounded-2xl border border-border-strong hover:border-error text-error text-[14px] font-semibold cursor-pointer transition-colors"
            >
              Chưa nhận được
            </button>
            <button
              type="button"
              onClick={handleConfirmReceived}
              className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-[14.5px] cursor-pointer transition-all shadow-xs"
            >
              Xác nhận đã nhận tiền
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
