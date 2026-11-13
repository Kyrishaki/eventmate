import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'neutral' | 'gold' | 'red' | 'blue' | 'purple';
  hasDot?: boolean;
}

export function Badge({ className, variant = 'default', hasDot = false, children, ...props }: BadgeProps) {
  const variants = {
    default:
      'bg-[#315C4C]/10 dark:bg-[#3E7A65]/20 text-[#315C4C] dark:text-[#5ED69D] border border-[#315C4C]/25 font-semibold',
    gold:
      'bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold',
    red:
      'bg-[#C44536]/10 dark:bg-[#E5534B]/20 text-[#C44536] dark:text-[#F87171] border border-[#C44536]/30 font-bold',
    success:
      'bg-[var(--success-bg,#EAF4EE)] dark:bg-[#152A20] text-[var(--success,#2F7D55)] dark:text-[#3EB378] border border-[#2F7D55]/25 font-semibold',
    warning:
      'bg-[var(--warning-bg,#FEF7EC)] dark:bg-[#2E1F0E] text-[var(--warning,#B7791F)] dark:text-[#D9822B] border border-[#B7791F]/30 font-semibold',
    error:
      'bg-[var(--error-bg,#FDF1F0)] dark:bg-[#2E1515] text-[var(--error,#C44536)] dark:text-[#E5534B] border border-[#C44536]/30 font-semibold',
    blue:
      'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-semibold',
    purple:
      'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-semibold',
    outline:
      'border border-[var(--color-border,#E8E8E5)] dark:border-[#2C3038] text-[var(--color-text-primary,#202124)] dark:text-[#F2F3F5] bg-transparent font-medium',
    neutral:
      'bg-[var(--color-muted-light,#F0F0ED)] dark:bg-[#25282F] text-[var(--color-text-secondary,#737373)] dark:text-[#9BA1A6] border border-[var(--color-border,#E8E8E5)] dark:border-[#2C3038] font-medium',
  };

  const dotColors = {
    default: 'bg-[#315C4C] dark:bg-[#5ED69D]',
    gold: 'bg-amber-500',
    red: 'bg-[#C44536] dark:bg-[#F87171]',
    success: 'bg-[var(--success,#2F7D55)] dark:bg-[#3EB378]',
    warning: 'bg-[var(--warning,#B7791F)] dark:bg-[#D9822B]',
    error: 'bg-[var(--error,#C44536)] dark:bg-[#E5534B]',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    outline: 'bg-neutral-400',
    neutral: 'bg-neutral-400 dark:bg-neutral-500',
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
