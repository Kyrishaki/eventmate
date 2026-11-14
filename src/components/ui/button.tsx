import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gold' | 'red';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  elevation?: 'none' | 'low' | 'med' | 'high';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      elevation = 'none',
      disabled,
      type = 'button',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'astryx-button relative inline-flex items-center justify-center font-semibold text-center select-none transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer rounded-xl';

    const variants = {
      primary:
        'bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs border border-primary/20 dark:bg-primary dark:hover:bg-primary-hover',
      gold:
        'bg-primary hover:bg-primary-hover text-primary-foreground font-bold border border-primary',
      secondary:
        'bg-surface hover:bg-surface-hover text-foreground border border-border dark:bg-surface dark:hover:bg-surface-hover dark:border-border dark:text-foreground shadow-2xs',
      red:
        'bg-error-bg hover:bg-error-bg/80 text-error font-bold border border-error/40',
      outline:
        'border border-border dark:border-border bg-transparent text-foreground hover:bg-surface-hover dark:text-foreground dark:hover:bg-surface-hover',
      ghost:
        'bg-transparent text-muted hover:text-foreground hover:bg-surface-hover dark:text-muted dark:hover:text-white dark:hover:bg-surface-hover',
      destructive:
        'bg-error-bg text-error border border-error/40 hover:bg-error-bg/80',
    };

    const elevations = {
      none: '',
      low: 'shadow-xs',
      med: 'shadow-md',
      high: 'shadow-xl',
    };

    const sizes = {
      sm: 'min-h-11 px-3 text-sm gap-1.5',
      md: 'min-h-11 px-4 text-sm gap-2',
      lg: 'min-h-14 px-5 text-base gap-2.5',
      icon: 'min-h-11 min-w-11 p-0 aspect-square',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        data-astryx-component="button"
        data-variant={variant}
        data-size={size}
        data-elevation={elevation}
        className={cn(baseStyles, variants[variant], sizes[size], elevations[elevation], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
