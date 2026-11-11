'use client';

import * as React from 'react';
import { usePreorderStore } from '@/stores/preorder-store';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PreorderReservation } from '@/types/database';
import {
  Package,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Search,
  User,
  Phone,
  Clock,
  ShieldCheck,
  Image as ImageIcon,
  X,
  RotateCcw,
  Sparkles,
  Bookmark,
  Globe,
  Check,
  Ban,
  XCircle,
} from 'lucide-react';

interface PreorderPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoothId?: string;
  currentBoothName?: string;
}

export function PreorderPickupModal({
  isOpen,
  onClose,
  currentBoothId,
  currentBoothName,
}: PreorderPickupModalProps) {
  const { user } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { preorders, fulfillPreorder, cancelPreorder } = usePreorderStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterTab, setFilterTab] = React.useState<'pending' | 'picked_up' | 'cancelled' | 'all'>('pending');

  // Active Fulfill Dialog state
  const [selectedPreorder, setSelectedPreorder] = React.useState<PreorderReservation | null>(null);
  const [proofImage, setProofImage] = React.useState<string | null>(null);
  const [cashierNotes, setCashierNotes] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Active Reject / Cancel Reservation Dialog state
  const [rejectTarget, setRejectTarget] = React.useState<PreorderReservation | null>(null);
  const [rejectReason, setRejectReason] = React.useState('Khách không đến nhận / Quá giờ hẹn');
  const [customRejectReason, setCustomRejectReason] = React.useState('');
  const [isRejecting, setIsRejecting] = React.useState(false);

  // View existing photo proof modal
  const [viewProofUrl, setViewProofUrl] = React.useState<string | null>(null);

  // Hidden file input refs for Camera and Gallery
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Filter Preorders
  const filteredPreorders = React.useMemo(() => {
    return preorders.filter((p) => {
      // Filter by booth if provided
      if (currentBoothId && p.booth_id && p.booth_id !== currentBoothId) {
        // Keep showing if no booth match to allow cross-booth fulfillment
      }

      // Filter by tab
      if (filterTab === 'pending' && p.status !== 'pending_pickup') return false;
      if (filterTab === 'picked_up' && p.status !== 'picked_up') return false;
      if (filterTab === 'cancelled' && p.status !== 'cancelled') return false;

      // Filter by query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = p.code.toLowerCase().includes(q);
        const matchName = p.customer_name.toLowerCase().includes(q);
        const matchPhone = p.customer_phone?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone) return false;
      }

      return true;
    });
  }, [preorders, currentBoothId, filterTab, searchQuery]);

  const pendingCount = preorders.filter((p) => p.status === 'pending_pickup').length;
  const pickedUpCount = preorders.filter((p) => p.status === 'picked_up').length;
  const cancelledCount = preorders.filter((p) => p.status === 'cancelled').length;

  // Handle Photo Capture / Upload to Base64
  function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Kích thước ảnh quá lớn (tối đa 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofImage(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  }

  // Handle Confirm Pick-up with MANDATORY Proof
  function handleConfirmPickup() {
    if (!selectedPreorder) return;

    if (!proofImage) {
      setErrorMessage('BẮT BUỘC: Bạn phải chụp lại ảnh minh chứng nhận hàng trước khi xác nhận!');
      return;
    }

    setIsSubmitting(true);
    const res = fulfillPreorder({
      preorderId: selectedPreorder.id,
      proofImageUrl: proofImage,
      cashierName: user?.fullName || 'Thu ngân POS',
      cashierNotes: cashierNotes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.message || 'Lỗi khi xác nhận nhận hàng');
      return;
    }

    // Reset and close
    setSelectedPreorder(null);
    setProofImage(null);
    setCashierNotes('');
    setErrorMessage(null);
  }

  // Handle Confirm Reject / Cancel Reservation with reason & auto inventory release
  function handleConfirmReject() {
    if (!rejectTarget) return;

    const finalReason =
      rejectReason === 'Lý do khác...'
        ? customRejectReason.trim() || 'Khác'
        : rejectReason;

    setIsRejecting(true);
    cancelPreorder({
      preorderId: rejectTarget.id,
      reason: finalReason,
      actorName: user?.fullName || 'Thu ngân POS',
      actorRole: user?.role || 'cashier',
    });

    setIsRejecting(false);
    setRejectTarget(null);
    setCustomRejectReason('');

    // If photo fulfill modal was open for this preorder, close it too
    if (selectedPreorder?.id === rejectTarget.id) {
      setSelectedPreorder(null);
      setProofImage(null);
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Trả hàng đặt trước"
        description="Kiểm tra thông tin và chụp ảnh minh chứng nhận hàng."
      >
        <div className="space-y-4">
          {/* Top Search & Filter Tabs */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9E9E9C] absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Tìm mã đơn, tên, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-[#F0F0ED] dark:bg-neutral-800 rounded-[6px] text-xs">
              <button
                type="button"
                onClick={() => setFilterTab('pending')}
                className={`flex-1 py-1 px-2 rounded-[4px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                  filterTab === 'pending'
                    ? 'bg-white dark:bg-neutral-700 text-[#B7791F] dark:text-amber-300 shadow-2xs'
                    : 'text-[#737373] dark:text-neutral-400 hover:text-[#202124] dark:hover:text-neutral-200'
                }`}
              >
                <span>Chờ nhận</span>
                <span className="text-[10px] bg-[#FEF7EC] dark:bg-amber-950/60 px-1.5 py-0.2 rounded font-mono text-[#B7791F] dark:text-amber-300">
                  {pendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('picked_up')}
                className={`flex-1 py-1 px-2 rounded-[4px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                  filterTab === 'picked_up'
                    ? 'bg-white dark:bg-neutral-700 text-[#2F7D55] dark:text-emerald-300 shadow-2xs'
                    : 'text-[#737373] dark:text-neutral-400 hover:text-[#202124] dark:hover:text-neutral-200'
                }`}
              >
                <span>Đã nhận</span>
                <span className="text-[10px] bg-[#EBF1EE] dark:bg-emerald-950/60 px-1.5 py-0.2 rounded font-mono text-[#2F7D55] dark:text-emerald-300">
                  {pickedUpCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('cancelled')}
                className={`flex-1 py-1 px-2 rounded-[4px] font-semibold transition-colors flex items-center justify-center gap-1 ${
                  filterTab === 'cancelled'
                    ? 'bg-white dark:bg-neutral-700 text-red-600 dark:text-red-400 shadow-2xs'
                    : 'text-[#737373] dark:text-neutral-400 hover:text-[#202124] dark:hover:text-neutral-200'
                }`}
              >
                <span>Đã từ chối</span>
                <span className="text-[10px] bg-red-50 dark:bg-red-950/60 px-1.5 py-0.2 rounded font-mono text-red-600 dark:text-red-300">
                  {cancelledCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`py-1 px-2.5 rounded-[4px] font-medium transition-colors ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-neutral-700 text-[#202124] dark:text-neutral-100 shadow-2xs font-semibold'
                    : 'text-[#737373] dark:text-neutral-400 hover:text-[#202124] dark:hover:text-neutral-200'
                }`}
              >
                Tất cả ({preorders.length})
              </button>
            </div>
          </div>

          {/* Preorders List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F0F0ED] dark:divide-neutral-800 border border-[#E8E8E5] dark:border-neutral-800 rounded-[8px]">
            {filteredPreorders.length === 0 ? (
              <div className="p-8 text-center space-y-1.5 text-xs text-[#737373] dark:text-neutral-400">
                <Package className="w-8 h-8 text-[#9E9E9C] dark:text-neutral-500 mx-auto mb-1" />
                <p className="font-semibold text-[#202124] dark:text-neutral-100">Không tìm thấy đơn đặt trước nào</p>
                <p>Thử tìm theo tên khách hoặc mã đơn khác.</p>
              </div>
            ) : (
              filteredPreorders.map((po) => {
                const isPickedUp = po.status === 'picked_up';
                const isCancelled = po.status === 'cancelled';

                return (
                  <div
                    key={po.id}
                    className="p-3 hover:bg-[#FBFBFA] dark:hover:bg-neutral-850 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#202124] dark:text-neutral-200 bg-[#F0F0ED] dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-[#E8E8E5] dark:border-neutral-700">
                          #{po.code}
                        </span>

                        {po.preorder_type === 'vip_hold' ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#8C5D17] dark:text-amber-300 bg-[#FEF7EC] dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-[#B7791F]/20 dark:border-amber-800/60">
                            <Bookmark className="w-2.5 h-2.5 text-[#B7791F] dark:text-amber-400" />
                            Giữ chỗ VIP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#1D4ED8] dark:text-blue-300 bg-[#EFF6FF] dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-[#3B82F6]/20 dark:border-blue-800/60">
                            <Globe className="w-2.5 h-2.5 text-[#3B82F6] dark:text-blue-400" />
                            Đơn Đặt Online
                          </span>
                        )}

                        {isPickedUp ? (
                          <Badge variant="success" className="text-[10px] gap-1 font-bold">
                            <Check className="w-3 h-3" />
                            <span>Đã nhận hàng</span>
                          </Badge>
                        ) : isCancelled ? (
                          <Badge variant="error" className="text-[10px] gap-1 font-bold">
                            <XCircle className="w-3 h-3" />
                            <span>Đã từ chối / Hủy</span>
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px] gap-1 font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Chờ nhận tại quầy</span>
                          </Badge>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[#737373] dark:text-neutral-400">
                        <span className="font-bold text-[#202124] dark:text-neutral-100 flex items-center gap-1">
                          <User className="w-3 h-3 text-[#9E9E9C] dark:text-neutral-400" />
                          {po.customer_name}
                        </span>
                        {po.customer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#9E9E9C] dark:text-neutral-400" />
                            {po.customer_phone}
                          </span>
                        )}
                      </div>

                      {/* Merch Items */}
                      <div className="text-[11px] text-[#202124] dark:text-neutral-200 font-medium pt-0.5">
                        {po.items.map((i, idx) => (
                          <span key={idx} className="mr-2 inline-block">
                            • <strong className="text-[#315C4C] dark:text-emerald-400">{i.quantity}x</strong> {i.product_name} ({i.variant_name})
                          </span>
                        ))}
                      </div>

                      {po.notes && (
                        <p className="text-[10px] text-[#737373] dark:text-neutral-400 italic">Ghi chú: {po.notes}</p>
                      )}

                      {/* Picked up info */}
                      {isPickedUp && po.picked_up_at && (
                        <div className="text-[10px] text-[#2F7D55] dark:text-emerald-400 font-medium flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã giao lúc: {formatDate(po.picked_up_at)} ({po.picked_up_by})</span>
                        </div>
                      )}

                      {/* Cancelled / Rejected info */}
                      {isCancelled && (
                        <div className="text-[10px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 pt-0.5">
                          <Ban className="w-3 h-3 shrink-0" />
                          <span>
                            Từ chối: <strong>{po.cancellation_reason || 'Đã hủy giữ chỗ'}</strong>{' '}
                            {po.cancelled_by ? `(Bởi: ${po.cancelled_by})` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 sm:self-center">
                      {isPickedUp ? (
                        po.proof_image_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 border-[#2F7D55]/30 dark:border-emerald-800 text-[#2F7D55] dark:text-emerald-400 hover:bg-[#EBF1EE] dark:hover:bg-emerald-950/40"
                            onClick={() => setViewProofUrl(po.proof_image_url!)}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Xem minh chứng</span>
                          </Button>
                        )
                      ) : isCancelled ? (
                        <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold px-2 py-1 rounded bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã hoàn kho</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 border-red-200 dark:border-red-900/70 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 font-semibold cursor-pointer"
                            title="Từ chối trả hàng và hoàn lại số lượng về kho"
                            onClick={() => {
                              setRejectTarget(po);
                              setRejectReason('Khách không đến nhận / Quá giờ hẹn');
                              setCustomRejectReason('');
                            }}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </Button>

                          <Button
                            variant="primary"
                            size="sm"
                            className="h-8 text-xs gap-1.5 bg-[#B7791F] hover:bg-[#975F16] dark:bg-amber-600 dark:hover:bg-amber-700 border-none text-white font-bold shadow-xs cursor-pointer"
                            onClick={() => {
                              setSelectedPreorder(po);
                              setProofImage(null);
                              setCashierNotes('');
                              setErrorMessage(null);
                            }}
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Xác nhận trả hàng</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-[#737373] pt-1">
            <span>Toàn bộ hàng đặt trước đã được giữ riêng trong kho, không bán lẻ tại quầy.</span>
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* STEP 2: CONFIRM PICKUP WITH MANDATORY PHOTO PROOF MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={Boolean(selectedPreorder)}
        onClose={() => {
          setSelectedPreorder(null);
          setProofImage(null);
          setErrorMessage(null);
        }}
        title={`Xác Nhận Trả Hàng #${selectedPreorder?.code}`}
        description="Bắt buộc phải chụp lại minh chứng nhận hàng trước khi nhấn nút xác nhận."
      >
        {selectedPreorder && (
          <div className="space-y-4 text-xs">
            {/* Customer & Item Summary */}
            <div className="p-3 bg-[#F7F7F5] dark:bg-neutral-800 rounded-[6px] border border-[#E8E8E5] dark:border-neutral-700 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-sm text-[#202124] dark:text-neutral-100">
                <span>Khách hàng: {selectedPreorder.customer_name}</span>
                <span className="text-[#315C4C] dark:text-emerald-400">
                  {formatCurrency(selectedPreorder.total_amount, activeWorkspace?.currency || 'VND')}
                </span>
              </div>
              <p className="text-[#737373] dark:text-neutral-400">
                Điện thoại: {selectedPreorder.customer_phone || 'Chưa cung cấp'}
              </p>
              <div className="pt-1 border-t border-[#E8E8E5] dark:border-neutral-700">
                <span className="font-semibold text-[#202124] dark:text-neutral-100 block mb-1">Mặt hàng bàn giao:</span>
                <ul className="space-y-0.5 list-disc pl-4 text-[#202124] dark:text-neutral-200">
                  {selectedPreorder.items.map((i, idx) => (
                    <li key={idx}>
                      <strong>{i.quantity} món</strong> — {i.product_name} ({i.variant_name})
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* MANDATORY PROOF CAPTURE SECTION */}
            <div className="space-y-2">
              <Label required className="text-xs font-bold text-[#202124] dark:text-neutral-100 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#C44536]" />
                <span>Ảnh Minh Chứng Nhận Hàng (BẮT BUỘC)</span>
              </Label>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageSelected}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelected}
              />

              {proofImage ? (
                /* Photo Preview */
                <div className="relative rounded-[8px] border-2 border-[#2F7D55] dark:border-emerald-600 p-2 bg-[#EBF1EE]/40 dark:bg-emerald-950/20 text-center space-y-2">
                  <div className="relative max-h-48 overflow-hidden rounded-[6px] flex items-center justify-center bg-black/5 dark:bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofImage}
                      alt="Minh chứng nhận hàng"
                      className="max-h-48 w-auto object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setProofImage(null)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                      title="Xóa và chụp lại"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[#2F7D55] dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã ghi nhận ảnh minh chứng hợp lệ!</span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 gap-1"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Chụp lại ảnh khác</span>
                  </Button>
                </div>
              ) : (
                /* Photo Capture Buttons */
                <div className="p-4 border-2 border-dashed border-[#B7791F]/40 dark:border-amber-800/60 rounded-[8px] bg-[#FEF7EC]/50 dark:bg-amber-950/20 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#FEF7EC] dark:bg-amber-950/60 text-[#B7791F] dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Camera className="w-5 h-5" />
                  </div>

                  <div>
                    <p className="font-bold text-[#8C5D17] dark:text-amber-300 text-xs">
                      Chụp ảnh khách nhận hàng / Biên lai đối chiếu
                    </p>
                    <p className="text-[11px] text-[#737373] dark:text-neutral-400 mt-0.5 max-w-xs mx-auto">
                      Để tránh khiếu nại hoặc mất mát, hệ thống yêu cầu ảnh minh chứng trước khi kích hoạt nút xác nhận.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto text-xs gap-1.5 bg-[#B7791F] hover:bg-[#975F16] dark:bg-amber-600 dark:hover:bg-amber-700 border-none text-white font-bold"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Mở Camera chụp ngay</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-xs gap-1.5 bg-white dark:bg-neutral-800"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Chọn ảnh từ thiết bị</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 bg-[#FDF1F0] border border-[#F8B4AF] text-[#C44536] rounded-[6px] font-semibold text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Cashier Notes */}
            <div className="space-y-1">
              <Label htmlFor="cashier-pickup-notes">Ghi chú đối soát (tùy chọn):</Label>
              <Input
                id="cashier-pickup-notes"
                placeholder="VD: Đã kiểm tra CCCD 4 số đuôi 8912, nhận đủ 2 áo..."
                value={cashierNotes}
                onChange={(e) => setCashierNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F0F0ED] dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1 border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                onClick={() => {
                  setRejectTarget(selectedPreorder);
                  setRejectReason('Thông tin đối chiếu không khớp (Nghi vấn giả mạo)');
                  setCustomRejectReason('');
                }}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Từ chối đơn này</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPreorder(null);
                    setProofImage(null);
                  }}
                >
                  Đóng
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!proofImage || isSubmitting}
                  className={`font-bold text-xs gap-1.5 ${
                    proofImage
                      ? 'bg-[#2F7D55] hover:bg-[#256344] text-white'
                      : 'bg-[#E8E8E5] dark:bg-neutral-800 text-[#9E9E9C] dark:text-neutral-500 cursor-not-allowed'
                  }`}
                  onClick={handleConfirmPickup}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {proofImage
                      ? 'Xác Nhận Đã Nhận Hàng'
                      : 'Chụp ảnh minh chứng để kích hoạt nút'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===================================================================== */}
      {/* STEP 3: REJECT / CANCEL PREORDER CONFIRMATION MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title={`Từ Chối Trả Hàng #${rejectTarget?.code}`}
        description="Xác nhận từ chối bàn giao hoặc hủy giữ chỗ đơn đặt trước này."
      >
        {rejectTarget && (
          <div className="space-y-4 text-xs">
            {/* Target Customer Info */}
            <div className="p-3 bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-[8px] space-y-1.5">
              <div className="flex items-center justify-between font-bold text-sm text-red-900 dark:text-red-200">
                <span>Khách hàng: {rejectTarget.customer_name}</span>
                <span>{formatCurrency(rejectTarget.total_amount, activeWorkspace?.currency || 'VND')}</span>
              </div>
              <p className="text-red-700 dark:text-red-300">
                SĐT: {rejectTarget.customer_phone || 'Chưa cung cấp'}
              </p>
              <div className="pt-1 border-t border-red-200/60 dark:border-red-800/60 text-neutral-800 dark:text-neutral-200">
                <span className="font-semibold block mb-0.5">Sản phẩm đang giữ chỗ:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {rejectTarget.items.map((i, idx) => (
                    <li key={idx}>
                      <strong>{i.quantity}x</strong> {i.product_name} ({i.variant_name})
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Warning Alert */}
            <div className="flex items-start gap-2 p-2.5 rounded-[6px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Lưu ý:</strong> Khi xác nhận từ chối, toàn bộ số lượng sản phẩm trên sẽ được <strong>tự động hoàn trả về kho khả dụng</strong> ngay lập tức để tiếp tục bán tại quầy hoặc cho khách khác.
              </p>
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <Label className="font-bold text-neutral-800 dark:text-neutral-200">
                Lý do từ chối bàn giao / hủy giữ chỗ:
              </Label>
              <div className="space-y-1.5">
                {[
                  'Khách không đến nhận / Quá thời gian quy định',
                  'Thông tin đối chiếu không khớp (Nghi vấn giả mạo)',
                  'Khách chủ động yêu cầu hủy nhận hàng',
                  'Hàng hóa bị lỗi / Không đủ điều kiện bàn giao',
                  'Lý do khác...',
                ].map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-2 p-2 rounded-[6px] border cursor-pointer transition-colors ${
                      rejectReason === r
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reject-reason"
                      checked={rejectReason === r}
                      onChange={() => setRejectReason(r)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-xs">{r}</span>
                  </label>
                ))}
              </div>

              {rejectReason === 'Lý do khác...' && (
                <div className="pt-1">
                  <Input
                    placeholder="Nhập chi tiết lý do từ chối..."
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    className="text-xs h-9"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectTarget(null)}
                disabled={isRejecting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 cursor-pointer"
                onClick={handleConfirmReject}
                isLoading={isRejecting}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Xác Nhận Từ Chối & Hoàn Kho</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===================================================================== */}
      {/* VIEW PROOF PHOTO MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={Boolean(viewProofUrl)}
        onClose={() => setViewProofUrl(null)}
        title="Ảnh Minh Chứng Bàn Giao Hàng"
        description="Hình ảnh chụp thực tế lúc bàn giao hàng cho khách hàng tại quầy sự kiện."
      >
        {viewProofUrl && (
          <div className="space-y-3 text-center">
            <div className="max-h-[450px] overflow-hidden rounded-[8px] border border-[#E8E8E5] dark:border-neutral-800 bg-[#F7F7F5] dark:bg-neutral-900 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewProofUrl}
                alt="Minh chứng nhận hàng"
                className="max-h-[420px] w-auto object-contain rounded"
              />
            </div>
            <div className="flex items-center justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewProofUrl(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
