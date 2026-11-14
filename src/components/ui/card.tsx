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
      'bg-surface dark:bg-surface text-foreground dark:text-foreground border border-border dark:border-border',
    transparent: 'bg-transparent border border-border dark:border-border',
    muted:
      'bg-muted-light dark:bg-surface-hover border border-border dark:border-border',
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
        'astryx-card rounded-xl transition-all duration-200',
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
      className={cn('flex flex-col space-y-1.5 p-4 sm:p-5 border-b border-border/60 dark:border-border/60', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-base font-semibold text-foreground dark:text-foreground tracking-tight leading-snug',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-muted dark:text-muted leading-relaxed', className)}
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
        'flex items-center p-4 sm:p-5 border-t border-border/60 dark:border-border/60 bg-surface-hover/30 dark:bg-surface/[0.02] rounded-b-[var(--radius-container,10px)]',
        className
      )}
      {...props}
    />
  );
}
