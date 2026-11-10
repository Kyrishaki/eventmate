import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315C4C] focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none rounded-[6px]';

    const variants = {
      primary: 'bg-[#315C4C] text-white hover:bg-[#284A3D] active:bg-[#1E372D] shadow-xs',
      secondary: 'bg-[#F0F0ED] text-[#202124] hover:bg-[#E8E8E5] active:bg-[#DCDCD8]',
      outline: 'border border-[#E8E8E5] bg-white text-[#202124] hover:bg-[#F7F7F5] active:bg-[#F0F0ED]',
      ghost: 'text-[#737373] hover:text-[#202124] hover:bg-[#F0F0ED]',
      destructive: 'bg-[#FDF1F0] text-[#C44536] border border-[#FADBD8] hover:bg-[#F9D0CD]',
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
