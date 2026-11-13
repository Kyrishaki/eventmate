import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'neutral' | 'gold' | 'red';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-semibold',
    gold: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold',
    red: 'bg-red-500/15 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40 font-bold',
    success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700',
    error: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60',
    outline: 'border border-[#E5E7EB] dark:border-neutral-800 text-[#111827] dark:text-neutral-200 bg-white dark:bg-neutral-900',
    neutral: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700',
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
