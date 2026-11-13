import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type={type}
          ref={ref}
          data-astryx-component="text-input"
          data-status={error ? 'error' : undefined}
          className={cn(
            'astryx-text-input flex h-10 w-full rounded-[var(--radius-container,8px)] border bg-[var(--color-surface,#FFFFFF)] dark:bg-[#1B1D22] px-3.5 py-2 text-sm text-[var(--color-text-primary,#202124)] dark:text-[#F2F3F5] placeholder:text-[var(--color-text-secondary,#9BA1A6)] shadow-2xs transition-all duration-150',
            'border-[var(--color-border,#E8E8E5)] dark:border-[#2C3038]',
            'focus-visible:outline-none focus-visible:border-[var(--color-accent,#315C4C)] dark:focus-visible:border-[#3E7A65] focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#315C4C)]/20 dark:focus-visible:ring-[#3E7A65]/20',
            'disabled:cursor-not-allowed disabled:bg-[var(--color-muted-light,#F0F0ED)] dark:disabled:bg-[#25282F] disabled:opacity-60',
            error &&
              'border-[#C44536] dark:border-[#E5534B] focus-visible:border-[#C44536] focus-visible:ring-[#C44536]/20',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
