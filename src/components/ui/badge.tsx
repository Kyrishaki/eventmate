import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'neutral';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#EBF1EE] dark:bg-emerald-950/60 text-[#315C4C] dark:text-emerald-300 border border-[#D5E2DC] dark:border-emerald-800',
    success: 'bg-[#EAF4EE] dark:bg-emerald-950/60 text-[#2F7D55] dark:text-emerald-300 border border-[#CEE6D7] dark:border-emerald-700',
    warning: 'bg-[#FEF7EC] dark:bg-amber-950/60 text-[#B7791F] dark:text-amber-300 border border-[#F8E3C3] dark:border-amber-700',
    error: 'bg-[#FDF1F0] dark:bg-red-950/60 text-[#C44536] dark:text-red-300 border border-[#FADBD8] dark:border-red-700',
    outline: 'border border-[#E8E8E5] dark:border-neutral-700 text-[#202124] dark:text-neutral-200 bg-white dark:bg-neutral-900',
    neutral: 'bg-[#F0F0ED] dark:bg-neutral-800 text-[#737373] dark:text-neutral-300 border border-[#E8E8E5] dark:border-neutral-700',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[4px] px-2 py-0.5 text-xs font-medium tracking-wide leading-none transition-colors select-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
