'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxHeight = 'max-h-[88dvh]',
  className,
}: BottomSheetProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Sheet Surface */}
      <div
        className={cn(
          'relative w-full max-w-lg mx-auto bg-white dark:bg-neutral-900 rounded-t-[20px] border-t border-[#E8E8E5] dark:border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-200 z-10 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          maxHeight,
          className
        )}
      >
        {/* Drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#D6D6D2] dark:bg-neutral-700" />
        </div>

        {/* Header if title is present */}
        {title && (
          <div className="px-4 py-2.5 border-b border-[#F0F0ED] dark:border-neutral-800 flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#202124] dark:text-neutral-100 truncate">
                {title}
              </h3>
              {description && (
                <p className="text-[11px] text-[#737373] dark:text-neutral-400 mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-[#737373] hover:text-[#202124] dark:hover:text-white hover:bg-[#F0F0ED] dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sheet Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
