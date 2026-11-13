import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gold' | 'red';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, type = 'button', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none rounded-[6px] cursor-pointer';

    const variants = {
      primary:
        'bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 active:bg-amber-600 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 shadow-xs border border-amber-600/20',
      gold:
        'bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 active:bg-amber-600 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 shadow-xs border border-amber-600/20',
      secondary:
        'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 border border-neutral-800 dark:border-neutral-700',
      red:
        'bg-red-600 text-white font-bold hover:bg-red-500 active:bg-red-700 shadow-xs border border-red-700/30',
      outline:
        'border border-[#E5E7EB] dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[#111827] dark:text-neutral-100 hover:bg-[#F3F4F6] dark:hover:bg-neutral-800/80 active:bg-[#E5E7EB]',
      ghost:
        'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800',
      destructive:
        'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 active:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/70',
    };

    const sizes = {
      sm: 'h-8 px-2.5 text-xs gap-1.5',
      md: 'h-9 px-3.5 text-sm gap-2',
      lg: 'h-10 px-4.5 text-sm gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
