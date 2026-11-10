'use client';

import * as React from 'react';
import { useFeedbackStore, FeedbackType, FeedbackSeverity } from '@/stores/feedback-store';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductImageUploader } from '@/components/ui/product-image-uploader';
import {
  Bug,
  Lightbulb,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Info,
  Laptop,
  HelpCircle,
  Send,
  Camera,
  X,
  MessageSquarePlus,
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: FeedbackType;
}

export function FeedbackModal({ isOpen, onClose, defaultType = 'bug' }: FeedbackModalProps) {
  const { user } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { submitFeedback } = useFeedbackStore();

  const [type, setType] = React.useState<FeedbackType>(defaultType);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [module, setModule] = React.useState('POS Bán hàng');
  const [severity, setSeverity] = React.useState<FeedbackSeverity>('medium');
  const [screenshotUrl, setScreenshotUrl] = React.useState<string | null>(null);
  const [reporterName, setReporterName] = React.useState(user?.fullName || '');
  const [reporterEmail, setReporterEmail] = React.useState(user?.email || '');
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Capture device diagnostics
  const getDeviceInfo = () => {
    if (typeof window === 'undefined') return undefined;
    return {
      browser: navigator.userAgent.includes('Chrome')
        ? 'Chrome'
        : navigator.userAgent.includes('Safari')
        ? 'Safari'
        : navigator.userAgent.includes('Firefox')
        ? 'Firefox'
        : 'Other',
      os: navigator.userAgent.includes('Windows')
        ? 'Windows'
        : navigator.userAgent.includes('Mac')
        ? 'macOS'
        : navigator.userAgent.includes('iPhone')
        ? 'iOS'
        : navigator.userAgent.includes('Android')
        ? 'Android'
        : 'Other',
      screen: `${window.innerWidth}x${window.innerHeight}`,
      user_agent: navigator.userAgent,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);

    try {
      submitFeedback({
        workspace_id: activeWorkspace?.id,
        type,
        title: title.trim(),
        description: description.trim(),
        module,
        severity,
        screenshot_url: screenshotUrl,
        page_url: typeof window !== 'undefined' ? window.location.href : '',
        device_info: getDeviceInfo(),
        reporter_name: reporterName.trim() || 'Người dùng ẩn danh',
        reporter_role: (user?.role as string) || 'guest',
        reporter_email: reporterEmail.trim() || undefined,
      });

      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setTitle('');
    setDescription('');
    setScreenshotUrl(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={isSuccess ? 'Gửi thành công!' : 'Góp ý & Báo lỗi'}
      description={
        isSuccess
          ? 'Ý kiến của bạn đã được ghi nhận vào hệ thống.'
          : 'Gửi phản hồi hoặc báo lỗi để chúng tôi cải thiện hệ thống.'
      }
      maxWidth="lg"
    >
      {isSuccess ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#EBF1EE] text-[#2F7D55] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-[#202124]">
              Cảm ơn bạn đã đóng góp!
            </h3>
            <p className="text-xs text-[#737373]">
              Báo cáo của bạn đã được chuyển tới Admin để tổng hợp và xử lý.
            </p>
          </div>

          <div className="pt-3">
            <Button variant="primary" size="md" onClick={handleResetAndClose} className="px-6">
              Đóng
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setType('bug')}
              className={`p-2.5 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === 'bug'
                  ? 'border-[#C44536] bg-[#C44536]/10 text-[#C44536]'
                  : 'border-[#E8E8E5] bg-white text-[#737373] hover:text-[#202124]'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Báo lỗi</span>
            </button>

            <button
              type="button"
              onClick={() => setType('feature')}
              className={`p-2.5 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === 'feature'
                  ? 'border-[#315C4C] bg-[#315C4C]/10 text-[#315C4C]'
                  : 'border-[#E8E8E5] bg-white text-[#737373] hover:text-[#202124]'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Tính năng</span>
            </button>

            <button
              type="button"
              onClick={() => setType('ux')}
              className={`p-2.5 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === 'ux'
                  ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                  : 'border-[#E8E8E5] bg-white text-[#737373] hover:text-[#202124]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trải nghiệm</span>
            </button>

            <button
              type="button"
              onClick={() => setType('other')}
              className={`p-2.5 rounded-[6px] border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === 'other'
                  ? 'border-[#737373] bg-[#737373]/10 text-[#202124]'
                  : 'border-[#E8E8E5] bg-white text-[#737373] hover:text-[#202124]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Khác</span>
            </button>
          </div>

          {/* Module & Severity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fb-module" required className="text-xs">
                Khu vực / Chức năng gặp vấn đề:
              </Label>
              <select
                id="fb-module"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
              >
                <option value="POS Bán hàng">POS Bán hàng (Thu ngân, giỏ hàng, quét QR)</option>
                <option value="Kho & Phân bổ">Quản lý Kho & Phân bổ hàng hóa</option>
                <option value="Sản phẩm & Biến thể">Sản phẩm, biến thể & Ảnh chụp</option>
                <option value="Đơn hàng & Thanh toán">Đơn hàng, tiền mặt & Đối soát</option>
                <option value="Sự kiện & Gian hàng">Sự kiện, tour diễn & Quầy bán</option>
                <option value="Cổng Collab Hợp tác">Cổng Collab (Đối tác bán chung)</option>
                <option value="Giao diện & Hiển thị">Giao diện Sáng / Tối (Theme) & Font chữ</option>
                <option value="Đăng nhập & Quyền">Đăng nhập, phân quyền & Tài khoản</option>
                <option value="Tính năng khác">Tính năng khác</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-severity" required className="text-xs">
                Mức độ ưu tiên / Ảnh hưởng:
              </Label>
              <select
                id="fb-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as FeedbackSeverity)}
                className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
              >
                <option value="low">Thấp — Ý kiến tham khảo / Cải tiến nhỏ</option>
                <option value="medium">Bình thường — Cần cải thiện trong bản tới</option>
                <option value="high">Cao — Ảnh hưởng đến thao tác sử dụng</option>
                <option value="critical">Khẩn cấp — Lỗi nghiêm trọng / Chặn đứng bán hàng</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="fb-title" required className="text-xs">
              {type === 'bug' ? 'Tóm tắt lỗi gặp phải:' : 'Tiêu đề góp ý / Ý tưởng mới:'}
            </Label>
            <Input
              id="fb-title"
              required
              placeholder={
                type === 'bug'
                  ? 'VD: Bấm thanh toán bằng VietQR nhưng không hiện mã QR...'
                  : 'VD: Cần thêm tính năng in hóa đơn khổ 80mm...'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="fb-desc" required className="text-xs">
              Mô tả chi tiết & các bước xảy ra:
            </Label>
            <textarea
              id="fb-desc"
              required
              rows={3}
              placeholder="Vui lòng mô tả cụ thể bạn đang thao tác ở bước nào, lỗi hiển thị ra sao hoặc bạn mong muốn hệ thống hoạt động như thế nào..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-2 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
            />
          </div>

          {/* Screenshot / Photo Proof using ProductImageUploader */}
          <div>
            <ProductImageUploader
              value={screenshotUrl}
              onChange={(val) => setScreenshotUrl(val)}
              label="Ảnh chụp màn hình lỗi / Ảnh minh họa (tùy chọn):"
            />
          </div>

          {/* Reporter Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="fb-name" className="text-[11px] text-[#737373]">
                Người gửi (Họ tên):
              </Label>
              <Input
                id="fb-name"
                placeholder="VD: Tuấn Admin, Thu ngân Linh..."
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-email" className="text-[11px] text-[#737373]">
                Email / SĐT liên hệ lại (nếu cần):
              </Label>
              <Input
                id="fb-email"
                placeholder="email@example.com / 090..."
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0ED]">
            <Button type="button" variant="outline" size="sm" onClick={handleResetAndClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi phản hồi cho Admin</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/**
 * Floating Quick-Access Feedback Widget
 * Renders a compact floating button in the bottom-right corner of the screen
 */
export function FloatingFeedbackWidget() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40 print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#315C4C] text-white hover:bg-[#284A3D] px-3.5 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 border border-white/20 text-xs font-semibold group cursor-pointer"
          title="Báo cáo lỗi hoặc đóng góp ý kiến cải thiện website"
        >
          <MessageSquarePlus className="w-4 h-4 text-[#F3B05C] group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Góp ý & Báo lỗi</span>
        </button>
      </div>

      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
