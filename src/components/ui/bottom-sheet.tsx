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
          'relative w-full max-w-lg mx-auto bg-surface dark:bg-surface rounded-t-[20px] border-t border-border dark:border-border shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-200 z-10 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          maxHeight,
          className
        )}
      >
        {/* Drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-border-strong dark:bg-surface-hover" />
        </div>

        {/* Header if title is present */}
        {title && (
          <div className="px-4 py-2.5 border-b border-border dark:border-border flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground dark:text-foreground truncate">
                {title}
              </h3>
              {description && (
                <p className="text-[11px] text-muted dark:text-muted mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-muted hover:text-foreground dark:hover:text-white hover:bg-surface-hover dark:hover:bg-surface-hover transition-colors shrink-0 cursor-pointer"
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
