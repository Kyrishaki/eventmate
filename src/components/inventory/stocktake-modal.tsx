'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDataStore } from '@/stores/data-store';
import { useAuthStore } from '@/stores/auth-store';
import { logActivity } from '@/stores/audit-store';
import { AuditActorRole, Booth, EventItem } from '@/types/database';
import {
  ClipboardCheck,
  CheckCircle2,
  Save,
} from 'lucide-react';

interface StocktakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  booth: Booth | null;
  event: EventItem | null;
}

export function StocktakeModal({
  isOpen,
  onClose,
  booth,
  event,
}: StocktakeModalProps) {
  const { user } = useAuthStore();
  const { variants, products, allocations, quickTransferStock } = useDataStore();

  const [actualCounts, setActualCounts] = React.useState<Record<string, number>>({});
  const [reasons, setReasons] = React.useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Booth allocations
  const boothId = booth?.id;
  const boothAllocs = React.useMemo(() => {
    if (!boothId || !isOpen) return [];
    return allocations.filter((a) => a.booth_id === boothId && !a.is_test);
  }, [allocations, boothId, isOpen]);

  // Initialize actual counts when modal opens for a booth
  React.useEffect(() => {
    if (!isOpen || !boothId) return;
    const currentAllocs = useDataStore
      .getState()
      .allocations.filter((a) => a.booth_id === boothId && !a.is_test);
    const initialCounts: Record<string, number> = {};
    const initialReasons: Record<string, string> = {};
    currentAllocs.forEach((a) => {
      const systemQty = Math.max(0, a.allocated_quantity - a.sold_quantity);
      initialCounts[a.variant_id] = systemQty;
      initialReasons[a.variant_id] = 'loss';
    });
    setActualCounts(initialCounts);
    setReasons(initialReasons);
  }, [isOpen, boothId]);

  if (!isOpen || !booth) return null;

  const handleCountChange = (variantId: string, val: string) => {
    const num = parseInt(val, 10);
    setActualCounts((prev) => ({
      ...prev,
      [variantId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleReasonChange = (variantId: string, val: string) => {
    setReasons((prev) => ({
      ...prev,
      [variantId]: val,
    }));
  };

  const reasonLabels: Record<string, string> = {
    loss: 'Thất thoát / Không rõ nguyên nhân',
    damaged: 'Hư hỏng / Lỗi tem mác / Rách',
    gift: 'Tặng nghệ sĩ / VIP / Ban tổ chức',
    unrecorded_return: 'Khách đổi trả chưa vào máy',
    count_error: 'Sai lệch kiểm đếm khi nhận kho',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const changesSummary: string[] = [];
    let totalDelta = 0;

    boothAllocs.forEach((alloc) => {
      const variant = variants.find((v) => v.id === alloc.variant_id);
      const product = products.find((p) => p.id === variant?.product_id);
      const systemAvailable = Math.max(0, alloc.allocated_quantity - alloc.sold_quantity);
      const actual = actualCounts[alloc.variant_id] ?? systemAvailable;
      const delta = actual - systemAvailable;

      if (delta !== 0) {
        totalDelta += delta;
        quickTransferStock(booth.id, alloc.variant_id, delta);
        const reasonText = reasonLabels[reasons[alloc.variant_id] || 'loss'];
        changesSummary.push(
          `${product?.name} (${variant?.name}): lệch ${delta > 0 ? `+${delta}` : delta} món (Lý do: ${reasonText})`
        );
      }
    });

    logActivity({
      actor_name: user?.fullName || 'Nhân viên kiểm kho',
      actor_role: (user?.role as AuditActorRole) || 'inventory_staff',
      action_type: 'stock_adjust',
      entity_type: 'inventory',
      entity_name: `Kiểm kê quầy ${booth.name}`,
      event_name: event?.name,
      booth_name: booth.name,
      description: `Kiểm kê thực tế quầy "${booth.name}". Tổng chênh lệch: ${totalDelta > 0 ? `+${totalDelta}` : totalDelta} món.${
        generalNotes ? ` Ghi chú: ${generalNotes}.` : ''
      } Chi tiết: ${changesSummary.join('; ') || 'Không có lệch kho'}.`,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kiểm Kê Tồn Kho Quầy: ${booth.name}`}
      description={`Đối chiếu số lượng hàng thực tế tại quầy với số liệu hệ thống (${event?.name || 'Sự kiện'})`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSuccess ? (
          <div className="p-4 bg-[#EAF4EE] text-[#2F7D55] rounded-[6px] text-xs flex items-center gap-2 border border-[#CEE6D7]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">
              Đã ghi nhận kết quả kiểm kê và tự động cân bằng tồn kho quầy thành công!
            </span>
          </div>
        ) : (
          <>
            <div className="p-3 bg-[#EBF1EE] text-[#315C4C] rounded-[6px] text-xs flex items-center gap-2 border border-[#315C4C]/20">
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span>
                Nhập số lượng thực đếm tại quầy. Hệ thống sẽ tự động tính độ lệch và lưu vết giải trình vào Nhật ký hoạt động.
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {boothAllocs.length === 0 ? (
                <p className="text-xs text-[#737373] text-center py-6">
                  Quầy này chưa được phân bổ món hàng nào.
                </p>
              ) : (
                boothAllocs.map((alloc) => {
                  const variant = variants.find((v) => v.id === alloc.variant_id);
                  const product = products.find((p) => p.id === variant?.product_id);
                  const systemAvailable = Math.max(0, alloc.allocated_quantity - alloc.sold_quantity);
                  const actual = actualCounts[alloc.variant_id] ?? systemAvailable;
                  const delta = actual - systemAvailable;

                  return (
                    <div
                      key={alloc.id}
                      className="p-3 rounded-[6px] border border-[#E8E8E5] bg-[#FBFBFA] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#202124]">{product?.name}</p>
                          <p className="text-[11px] text-[#737373]">
                            Phân loại: <span className="font-semibold text-[#202124]">{variant?.name}</span> • Mã loại: {variant?.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-[#737373]">Tồn hệ thống: </span>
                          <span className="font-bold text-[#202124]">{systemAvailable} món</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#E8E8E5]">
                        <div className="flex items-center gap-2">
                          <Label className="text-[11px] text-[#737373] shrink-0">Thực đếm:</Label>
                          <Input
                            type="number"
                            min="0"
                            value={actual}
                            onChange={(e) => handleCountChange(alloc.variant_id, e.target.value)}
                            className="h-8 text-xs font-bold text-center w-24 bg-white"
                          />
                          <span
                            className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                              delta === 0
                                ? 'text-[#2F7D55] bg-[#EAF4EE]'
                                : delta > 0
                                ? 'text-[#B7791F] bg-[#FEF7EC]'
                                : 'text-[#C44536] bg-[#FDF1F0]'
                            }`}
                          >
                            {delta === 0 ? 'Khớp' : delta > 0 ? `+${delta}` : delta}
                          </span>
                        </div>

                        {delta !== 0 && (
                          <div className="flex items-center gap-1.5">
                            <Label className="text-[11px] text-[#737373] shrink-0">Lý do lệch:</Label>
                            <select
                              value={reasons[alloc.variant_id] || 'loss'}
                              onChange={(e) => handleReasonChange(alloc.variant_id, e.target.value)}
                              className="h-8 text-xs rounded border border-[#E8E8E5] bg-white px-2 text-[#202124] focus:outline-none focus:border-[#315C4C] flex-1"
                            >
                              <option value="loss">Thất thoát / Chưa rõ</option>
                              <option value="damaged">Hư hỏng / Lỗi tem</option>
                              <option value="gift">Tặng nghệ sĩ / VIP</option>
                              <option value="unrecorded_return">Khách đổi chưa nhập</option>
                              <option value="count_error">Sai lệch đếm ban đầu</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#737373]">Ghi chú đợt kiểm kê:</Label>
              <Input
                placeholder="Kiểm kê đầu ngày / Cuối show..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="text-xs h-8.5"
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
                className="text-xs bg-[#315C4C] text-white hover:bg-[#254639] gap-1.5 font-bold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Xác Nhận & Cân Bằng Kho</span>
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
