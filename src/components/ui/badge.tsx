import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'neutral';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#EBF1EE] text-[#315C4C] border border-[#D5E2DC]',
    success: 'bg-[#EAF4EE] text-[#2F7D55] border border-[#CEE6D7]',
    warning: 'bg-[#FEF7EC] text-[#B7791F] border border-[#F8E3C3]',
    error: 'bg-[#FDF1F0] text-[#C44536] border border-[#FADBD8]',
    outline: 'border border-[#E8E8E5] text-[#202124] bg-white',
    neutral: 'bg-[#F0F0ED] text-[#737373] border border-[#E8E8E5]',
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
