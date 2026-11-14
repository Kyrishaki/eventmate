import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'neutral' | 'gold' | 'red' | 'blue' | 'purple';
  hasDot?: boolean;
}

export function Badge({ className, variant = 'default', hasDot = false, children, ...props }: BadgeProps) {
  const variants = {
    default:
      'bg-primary/10 dark:bg-primary/20 text-primary dark:text-success border border-primary/25 font-semibold',
    gold:
      'bg-primary/15 dark:bg-primary/20 text-gold-text dark:text-gold-text border border-primary/40 font-bold',
    red:
      'bg-error/10 dark:bg-error/20 text-error dark:text-[#F87171] border border-error/30 font-bold',
    success:
      'bg-[var(--success-bg,#EAF4EE)] dark:bg-[#152A20] text-[var(--success,#2F7D55)] dark:text-[#3EB378] border border-primary/25 font-semibold',
    warning:
      'bg-[var(--warning-bg,#FEF7EC)] dark:bg-[#2E1F0E] text-[var(--warning,#B7791F)] dark:text-[#D9822B] border border-warning/30 font-semibold',
    error:
      'bg-[var(--error-bg,#FDF1F0)] dark:bg-[#2E1515] text-[var(--error,#C44536)] dark:text-error border border-error/30 font-semibold',
    blue:
      'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-semibold',
    purple:
      'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-semibold',
    outline:
      'border border-border dark:border-border text-foreground dark:text-foreground bg-transparent font-medium',
    neutral:
      'bg-muted-light dark:bg-surface-hover text-muted dark:text-muted border border-border dark:border-border font-medium',
  };

  const dotColors = {
    default: 'bg-primary dark:bg-success',
    gold: 'bg-primary',
    red: 'bg-error dark:bg-[#F87171]',
    success: 'bg-[var(--success,#2F7D55)] dark:bg-[#3EB378]',
    warning: 'bg-[var(--warning,#B7791F)] dark:bg-[#D9822B]',
    error: 'bg-[var(--error,#C44536)] dark:bg-error',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    outline: 'bg-surface-hover',
    neutral: 'bg-surface-hover dark:bg-surface-hover',
  };

  return (
    <div
      data-astryx-component="badge"
      data-variant={variant}
      className={cn(
        'astryx-badge inline-flex items-center gap-1.5 rounded-[var(--radius-sm,4px)] px-2 py-0.5 text-xs tracking-wide leading-none select-none transition-colors duration-150',
        variants[variant],
        className
      )}
      {...props}
    >
      {hasDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </div>
  );
}
