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
      role="dialog"
      aria-modal="true"
      data-astryx-component="dialog"
      className={cn(
        'fixed inset-0 z-50 flex justify-center',
        sheetOnMobile ? 'items-end sm:items-center p-0 sm:p-4' : 'items-center p-3 sm:p-4'
      )}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Surface */}
      <div
        className={cn(
          'astryx-dialog relative w-full border border-[var(--color-border,#E8E8E5)] dark:border-[#2C3038] bg-[var(--color-surface,#FFFFFF)] dark:bg-[#1B1D22] text-[var(--color-text-primary,#202124)] dark:text-[#F2F3F5] shadow-2xl z-10 overflow-y-auto flex flex-col',
          sheetOnMobile
            ? 'max-sm:fixed max-sm:bottom-0 max-sm:inset-x-0 max-sm:rounded-t-[20px] max-sm:rounded-b-none max-sm:border-b-0 max-sm:max-h-[92dvh] max-sm:p-5 max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] max-sm:animate-in max-sm:slide-in-from-bottom-4 max-sm:duration-250 sm:relative sm:rounded-[var(--radius-container,14px)] sm:p-6 sm:max-h-[90vh] sm:animate-in sm:zoom-in-95 sm:duration-150'
            : 'rounded-[var(--radius-container,14px)] p-4 sm:p-6 max-h-[90dvh] animate-in zoom-in-95',
          maxWidths[maxWidth],
          className
        )}
      >
        {/* Mobile Drag Handle */}
        {sheetOnMobile && (
          <div className="sm:hidden w-12 h-1.5 bg-[var(--color-border-strong,#D6D6D2)] dark:bg-neutral-700 rounded-full mx-auto mb-3.5 shrink-0 opacity-70" />
        )}

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[var(--color-border,#E8E8E5)]/70 dark:border-[#2C3038]/70 mb-4 shrink-0">
          <div className="min-w-0 pr-3">
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary,#202124)] dark:text-[#F2F3F5] tracking-tight leading-snug">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-[var(--color-text-secondary,#737373)] dark:text-[#9BA1A6] mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-full text-[var(--color-text-secondary,#737373)] hover:text-[var(--color-text-primary,#202124)] dark:hover:text-white hover:bg-[var(--color-surface-hover,#F0F0ED)] dark:hover:bg-[#25282F] transition-colors shrink-0 cursor-pointer"
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
