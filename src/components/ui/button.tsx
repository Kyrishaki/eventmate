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
      'astryx-button relative inline-flex items-center justify-center font-semibold text-center select-none transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent,#315C4C)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer rounded-[var(--radius-container,8px)]';

    const variants = {
      primary:
        'bg-[#315C4C] hover:bg-[#284A3D] text-white shadow-xs border border-[#315C4C]/20 dark:bg-[#3E7A65] dark:hover:bg-[#4C8E77]',
      gold:
        'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-bold shadow-xs border border-amber-600/30 dark:bg-amber-500 dark:hover:bg-amber-400',
      secondary:
        'bg-[var(--color-surface,#FFFFFF)] hover:bg-[var(--color-surface-hover,#F0F0ED)] text-[var(--color-text-primary,#202124)] border border-[var(--color-border,#E8E8E5)] dark:bg-[#1B1D22] dark:hover:bg-[#24272E] dark:border-[#2C3038] dark:text-[#F2F3F5] shadow-2xs',
      red:
        'bg-[#C44536] hover:bg-[#AB3C2E] active:bg-[#923326] text-white font-bold shadow-xs border border-[#C44536]/30',
      outline:
        'border border-[var(--color-border,#E8E8E5)] dark:border-[#2C3038] bg-transparent text-[var(--color-text-primary,#202124)] hover:bg-[var(--color-surface-hover,#F0F0ED)] dark:text-[#F2F3F5] dark:hover:bg-[#24272E]',
      ghost:
        'bg-transparent text-[var(--color-text-secondary,#737373)] hover:text-[var(--color-text-primary,#202124)] hover:bg-[var(--color-surface-hover,#F0F0ED)] dark:text-[#9BA1A6] dark:hover:text-white dark:hover:bg-[#24272E]',
      destructive:
        'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 active:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/70',
    };

    const elevations = {
      none: '',
      low: 'shadow-xs',
      med: 'shadow-md',
      high: 'shadow-xl',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-base gap-2.5',
      icon: 'h-9 w-9 p-0 aspect-square',
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
