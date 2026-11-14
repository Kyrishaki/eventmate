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
            'astryx-text-input flex min-h-12 w-full rounded-xl border bg-surface dark:bg-surface px-3.5 py-2 text-sm text-foreground dark:text-foreground placeholder:text-muted shadow-2xs transition-all duration-150',
            'border-border dark:border-border',
            'focus-visible:outline-none focus-visible:border-primary dark:focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/20',
            'disabled:cursor-not-allowed disabled:bg-muted-light dark:disabled:bg-surface-hover disabled:opacity-60',
            error &&
              'border-error dark:border-error focus-visible:border-error focus-visible:ring-error/20',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
