'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  sheetOnMobile?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  sheetOnMobile = true,
  className,
}: ModalProps) {
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

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-center',
        sheetOnMobile ? 'items-end sm:items-center p-0 sm:p-4' : 'items-center p-3 sm:p-4'
      )}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog Surface */}
      <div
        className={cn(
          'relative w-full border border-[#E8E8E5] dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[#202124] dark:text-neutral-100 shadow-xl z-10 overflow-y-auto flex flex-col',
          sheetOnMobile
            ? 'max-sm:fixed max-sm:bottom-0 max-sm:inset-x-0 max-sm:rounded-t-[20px] max-sm:rounded-b-none max-sm:border-b-0 max-sm:max-h-[92dvh] max-sm:p-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:animate-in max-sm:slide-in-from-bottom-4 max-sm:duration-200 sm:relative sm:rounded-xl sm:p-6 sm:max-h-[90vh] sm:animate-in sm:zoom-in-95 sm:duration-150'
            : 'rounded-xl p-4 sm:p-6 max-h-[90dvh] animate-in zoom-in-95',
          maxWidths[maxWidth],
          className
        )}
      >
        {/* Mobile Drag Handle */}
        {sheetOnMobile && (
          <div className="sm:hidden w-10 h-1 bg-[#D6D6D2] dark:bg-neutral-700 rounded-full mx-auto mb-2.5 shrink-0" />
        )}

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#F0F0ED] dark:border-neutral-800 mb-4 shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-base font-bold text-[#202124] dark:text-neutral-100 tracking-tight leading-snug">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-[#737373] dark:text-neutral-400 mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-full text-[#737373] hover:text-[#202124] dark:hover:text-white hover:bg-[#F0F0ED] dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}
