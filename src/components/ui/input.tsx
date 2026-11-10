import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-sm text-[#202124] placeholder:text-[#9E9E9C] shadow-2xs transition-colors',
          'focus-visible:outline-none focus-visible:border-[#315C4C] focus-visible:ring-1 focus-visible:ring-[#315C4C]',
          'disabled:cursor-not-allowed disabled:bg-[#F7F7F5] disabled:text-[#9E9E9C]',
          error && 'border-[#C44536] focus-visible:border-[#C44536] focus-visible:ring-[#C44536]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
