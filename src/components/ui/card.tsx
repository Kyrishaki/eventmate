import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'transparent' | 'muted';
  elevation?: 'none' | 'low' | 'med' | 'high';
}

export function Card({
  className,
  variant = 'default',
  elevation = 'none',
  ...props
}: CardProps) {
  const variantStyles = {
    default:
      'bg-[var(--color-surface,#FFFFFF)] dark:bg-[#1B1D22] text-[var(--color-text-primary,#202124)] dark:text-[#F2F3F5] border border-[var(--color-border,#E8E8E5)] dark:border-[#2C3038]',
    transparent: 'bg-transparent border border-[var(--color-border,#E8E8E5)] dark:border-[#2C3038]',
    muted:
      'bg-[var(--color-muted-light,#F0F0ED)] dark:bg-[#25282F] border border-[var(--color-border,#E8E8E5)] dark:border-[#2C3038]',
  };

  const elevationStyles = {
    none: 'shadow-2xs',
    low: 'shadow-xs',
    med: 'shadow-md',
    high: 'shadow-xl',
  };

  return (
    <div
      data-astryx-component="card"
      data-variant={variant}
      data-elevation={elevation}
      className={cn(
        'astryx-card rounded-[var(--radius-container,10px)] transition-all duration-200',
        variantStyles[variant],
        elevationStyles[elevation],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-4 sm:p-5 border-b border-[var(--color-border,#E8E8E5)]/60 dark:border-[#2C3038]/60', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-base font-semibold text-[var(--color-text-primary,#202124)] dark:text-[#F2F3F5] tracking-tight leading-snug',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-[var(--color-text-secondary,#737373)] dark:text-[#9BA1A6] leading-relaxed', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center p-4 sm:p-5 border-t border-[var(--color-border,#E8E8E5)]/60 dark:border-[#2C3038]/60 bg-[var(--color-surface-hover,#F0F0ED)]/30 dark:bg-white/[0.02] rounded-b-[var(--radius-container,10px)]',
        className
      )}
      {...props}
    />
  );
}
