'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { EventStatus } from '@/types/database';
import {
  Sparkles,
  Upload,
  Loader2,
  CheckCircle2,
  Calendar,
  MapPin,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';

interface AiEventPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Compress image file to reasonable resolution and size for fast upload & storage
 */
function compressPosterImage(file: File, maxDim = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Định dạng hình ảnh không hợp lệ'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function AiEventPosterModal({
  isOpen,
  onClose,
  onSuccess,
}: AiEventPosterModalProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { createEvent } = useDataStore();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [extractedData, setExtractedData] = React.useState<{
    name: string;
    startDate: string;
    endDate: string;
    location: string;
    description: string;
  } | null>(null);

  // Form fields for review & editing
  const [name, setName] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<EventStatus>('upcoming');
  const [useAsBanner, setUseAsBanner] = React.useState(true);

  // Reset state when opening/closing
  React.useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setPreviewImage(null);
        setIsAnalyzing(false);
        setErrorMessage(null);
        setExtractedData(null);
        setName('');
        setStartDate('');
        setEndDate('');
        setLocation('');
        setDescription('');
        setStatus('upcoming');
        setUseAsBanner(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle file processing and AI call
  const processPosterFile = React.useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP).');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      // 1. Compress image client-side
      const compressedDataUrl = await compressPosterImage(file);
      setPreviewImage(compressedDataUrl);

      // 2. Call AI extraction API
      const res = await fetch('/api/events/extract-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedDataUrl }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Không thể nhận diện nội dung trên ảnh poster.');
      }

      const data = json.data;
      setExtractedData(data);
      setName(data.name || '');
      setStartDate(data.startDate || new Date().toISOString().substring(0, 16));
      setEndDate(data.endDate || new Date(Date.now() + 24 * 3600000).toISOString().substring(0, 16));
      setLocation(data.location || '');
      setDescription(data.description || '');
      setStatus('upcoming');
    } catch (err: unknown) {
      console.error('Error analyzing poster:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi phân tích ảnh poster.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Support paste from clipboard (Ctrl + V)
  React.useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processPosterFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, processPosterFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPosterFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processPosterFile(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeWorkspace) return;

    createEvent({
      workspace_id: activeWorkspace.id,
      name: name.trim(),
      location: location.trim() || null,
      description: description.trim() || null,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      status,
      banner_url: useAsBanner && previewImage ? previewImage : null,
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tự động thêm sự kiện từ ảnh Poster / Banner (AI)"
      description="Tải hoặc dán ảnh poster sự kiện để AI tự động trích xuất tên sự kiện, ngày tháng năm và địa điểm."
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload Dropzone if no image yet */}
        {!previewImage && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[8px] p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#315C4C] bg-[#EAF4EE]'
                : 'border-[#D6D6D2] hover:border-[#315C4C] bg-[#FAFAF8] hover:bg-[#F2F7F4]'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#EAF4EE] text-[#315C4C] flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#202124]">
              Kéo thả hoặc bấm để chọn ảnh Poster sự kiện
            </p>
            <p className="text-xs text-[#737373] mt-1 max-w-md mx-auto">
              Hỗ trợ PNG, JPG, WebP. Bạn cũng có thể bấm <b>Ctrl + V</b> để dán trực tiếp ảnh từ bộ nhớ tạm.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-[#315C4C]/40 text-[#315C4C]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Chọn ảnh từ máy tính</span>
              </Button>
            </div>
          </div>
        )}

        {/* Loading state during analysis */}
        {isAnalyzing && (
          <div className="p-6 bg-[#FAFAF8] rounded-[8px] border border-[#E8E8E5] text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#315C4C] animate-spin mx-auto" />
            <div>
              <p className="text-sm font-bold text-[#202124]">
                Đang quét và nhận diện sự kiện từ poster...
              </p>
              <p className="text-xs text-[#737373] mt-0.5">
                AI đang trích xuất: Tên sự kiện, Thời gian (Ngày / Tháng / Năm), Địa điểm
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-[#FDF1F0] border border-[#E8988E] rounded-[6px] flex items-start gap-2.5 text-xs text-[#C44536]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="mt-0.5 text-[11px] text-[#A3382B]">
                Vui lòng thử lại với ảnh rõ nét hơn hoặc điền thông tin sự kiện thủ công.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-xs gap-1 border-[#C44536]/30 text-[#C44536] hover:bg-[#FBE8E6]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Thử lại</span>
            </Button>
          </div>
        )}

        {/* Extracted Data & Confirmation Form */}
        {previewImage && !isAnalyzing && (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Poster Preview Banner & Quick Change */}
            <div className="relative rounded-[8px] overflow-hidden border border-[#E8E8E5] bg-[#121212] group">
              <img
                src={previewImage}
                alt="Poster preview"
                className="w-full max-h-48 object-contain mx-auto"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 text-xs bg-white/90 hover:bg-white text-[#202124] shadow-xs gap-1 backdrop-blur-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Đổi ảnh khác</span>
                </Button>
              </div>
            </div>

            {extractedData && (
              <div className="p-2.5 bg-[#EAF4EE] border border-[#2F7D55]/20 rounded-[6px] flex items-center justify-between text-xs text-[#254639]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F7D55] shrink-0" />
                  <span>
                    <b>AI đã trích xuất thành công:</b> Vui lòng kiểm tra lại thông tin dưới đây và nhấn xác nhận.
                  </span>
                </div>
              </div>
            )}

            {/* Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="ai-evt-name" required className="text-xs font-semibold">
                  Tên sự kiện
                </Label>
                <Input
                  id="ai-evt-name"
                  required
                  placeholder="Ví dụ: BEYOND FESTIVAL 2027"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ai-evt-start" required className="text-xs font-semibold">
                  Ngày bắt đầu
                </Label>
                <Input
                  id="ai-evt-start"
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ai-evt-end" required className="text-xs font-semibold">
                  Ngày kết thúc
                </Label>
                <Input
                  id="ai-evt-end"
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="ai-evt-location" className="text-xs font-semibold">
                  Địa điểm tổ chức
                </Label>
                <Input
                  id="ai-evt-location"
                  placeholder="Ví dụ: SECC Quận 7, TP. Hồ Chí Minh"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ai-evt-status" className="text-xs font-semibold">
                  Trạng thái
                </Label>
                <select
                  id="ai-evt-status"
                  className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EventStatus)}
                >
                  <option value="upcoming">Sắp diễn ra</option>
                  <option value="active">Đang diễn ra</option>
                  <option value="draft">Bản nháp</option>
                  <option value="completed">Đã kết thúc</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-5">
                <input
                  type="checkbox"
                  id="useAsBanner"
                  checked={useAsBanner}
                  onChange={(e) => setUseAsBanner(e.target.checked)}
                  className="rounded border-[#D6D6D2] text-[#315C4C] focus:ring-[#315C4C] h-4 w-4"
                />
                <label
                  htmlFor="useAsBanner"
                  className="text-xs text-[#202124] cursor-pointer font-medium"
                >
                  Lưu ảnh này làm Banner đại diện sự kiện
                </label>
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="ai-evt-desc" className="text-xs font-semibold">
                  Mô tả / Slogan
                </Label>
                <textarea
                  id="ai-evt-desc"
                  rows={2}
                  className="flex w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-2 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
                  placeholder="Ghi chú, thông điệp sự kiện..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#F0F0ED]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="gap-1.5 font-bold shadow-xs px-4"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Xác nhận & Thêm sự kiện</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
