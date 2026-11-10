'use client';

import * as React from 'react';
import { Camera, Image as ImageIcon, Link as LinkIcon, X, Check, Upload, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

interface ProductImageUploaderProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  label?: string;
}

/**
 * Resizes and compresses an image file using HTML5 Canvas to a crisp,
 * lightweight JPEG base64 data URL (< 150KB) to ensure lightning-fast loading
 * and prevent localStorage budget overflows on mobile devices.
 */
function compressImageFile(file: File, maxDim = 1000, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Tệp tải lên không phải định dạng ảnh hợp lệ'));
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
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ProductImageUploader({
  value,
  onChange,
  label = 'Ảnh sản phẩm / Merchandise',
}: ProductImageUploaderProps) {
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [urlInputValue, setUrlInputValue] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);

  // Process chosen or captured file
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP, HEIC).');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const compressedDataUrl = await compressImageFile(file);
      onChange(compressedDataUrl);
      setShowUrlInput(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể xử lý ảnh này.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input so re-selecting same file triggers change
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInputValue.trim()) return;
    onChange(urlInputValue.trim());
    setUrlInputValue('');
    setShowUrlInput(false);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-2">
      {/* Hidden file inputs for Camera and Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#202124] dark:text-[#F0F0F0] flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#315C4C]" />
          <span>{label}</span>
        </label>
        {!value && (
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-[#315C4C] hover:underline flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'Ẩn nhập link' : 'Hoặc nhập link URL'}</span>
          </button>
        )}
      </div>

      {/* Image Preview If Exists */}
      {value ? (
        <div className="p-3 bg-[#FBFBFA] dark:bg-[#252525] rounded-[8px] border border-[#E8E8E5] dark:border-[#333333] flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-28 h-28 rounded-[6px] overflow-hidden bg-black/5 dark:bg-white/5 border border-[#E8E8E5] dark:border-[#333333] shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
              title="Xóa ảnh"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#2F7D55] font-semibold">
              <Check className="w-4 h-4 text-[#2F7D55]" />
              <span>Đã có ảnh sản phẩm</span>
            </div>
            <p className="text-[11px] text-[#737373] dark:text-[#9E9E9C]">
              Ảnh sẽ hiển thị trên bảng điều khiển quản lý và màn hình máy bán hàng POS.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isProcessing}
                className="text-xs h-7.5 gap-1.5 bg-white dark:bg-[#1E1E1E]"
              >
                <Camera className="w-3.5 h-3.5 text-[#315C4C]" />
                <span>Chụp lại</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isProcessing}
                className="text-xs h-7.5 gap-1.5 bg-white dark:bg-[#1E1E1E]"
              >
                <Upload className="w-3.5 h-3.5 text-[#315C4C]" />
                <span>Chọn ảnh khác</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(null)}
                className="text-xs h-7.5 text-[#C44536] hover:bg-[#FDF1F0] dark:hover:bg-[#3E1F1D]"
              >
                <span>Xóa ảnh</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Upload / Capture Choices */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`p-4 rounded-[8px] border-2 border-dashed transition-all text-center space-y-3 ${
            isDragging
              ? 'border-[#315C4C] bg-[#315C4C]/5'
              : 'border-[#D5D5D0] dark:border-[#444444] bg-[#FBFBFA] dark:bg-[#252525]'
          }`}
        >
          {isProcessing ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#315C4C]" />
              <p className="text-xs font-semibold text-[#202124] dark:text-[#F0F0F0]">
                Đang xử lý & tối ưu hóa ảnh...
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#EBF1EE] dark:bg-[#2F3E37] text-[#315C4C] flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[#EBF1EE] dark:bg-[#2F3E37] text-[#315C4C] flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#202124] dark:text-[#F0F0F0]">
                  Tải lên ảnh từ điện thoại hoặc máy tính
                </p>
                <p className="text-[11px] text-[#737373] dark:text-[#9E9E9C] mt-0.5">
                  Chụp ảnh trực tiếp từ máy ảnh điện thoại hoặc chọn ảnh có sẵn trong thư viện
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {/* 1. Camera Capture Button */}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  className="text-xs gap-1.5 shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Chụp ảnh ngay</span>
                </Button>

                {/* 2. Gallery / File Upload Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-xs gap-1.5 bg-white dark:bg-[#1E1E1E]"
                >
                  <Upload className="w-3.5 h-3.5 text-[#315C4C]" />
                  <span>Chọn ảnh từ thiết bị</span>
                </Button>
              </div>

              {/* Paste URL Input Form if toggled */}
              {showUrlInput && (
                <div className="pt-2 border-t border-[#E8E8E5] dark:border-[#333333] flex items-center gap-2 max-w-md mx-auto">
                  <Input
                    placeholder="Dán link ảnh (https://...)"
                    value={urlInputValue}
                    onChange={(e) => setUrlInputValue(e.target.value)}
                    className="h-8 text-xs bg-white dark:bg-[#1E1E1E]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyUrl();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    onClick={handleApplyUrl}
                  >
                    Dùng link
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] text-[#C44536] font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
