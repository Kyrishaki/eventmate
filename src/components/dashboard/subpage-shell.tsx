import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubpageShellProps {
  title: string;
  description: string;
  badge?: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  actionNode?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function SubpageShell({
  title,
  description,
  badge,
  icon: Icon,
  actionLabel,
  onAction,
  actionNode,
  children,
  className,
}: SubpageShellProps) {
  return (
    <div className={cn('space-y-5 sm:space-y-6', className)}>
      {/* Astryx Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-[var(--color-border,#E8E8E5)] dark:border-[#2C3038]">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-[var(--radius-container,8px)] bg-[var(--color-accent,#315C4C)]/10 dark:bg-[#3E7A65]/20 text-[var(--color-accent,#315C4C)] dark:text-[#5ED69D] flex items-center justify-center shrink-0 border border-[var(--color-accent,#315C4C)]/20">
              <Icon className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary,#202124)] dark:text-[#F2F3F5]">
              {title}
            </h1>
            {badge && (
              <Badge variant="outline" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary,#737373)] dark:text-[#9BA1A6] mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actionNode}
          {actionLabel && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
              className="text-xs font-semibold shadow-xs"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>

      {children || (
        <Card className="shadow-xs">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-12 h-12 rounded-[var(--radius-container,10px)] bg-[var(--color-muted-light,#F0F0ED)] dark:bg-[#25282F] border border-[var(--color-border,#E8E8E5)] dark:border-[#2C3038] text-[var(--color-accent,#315C4C)] dark:text-[#5ED69D] flex items-center justify-center mx-auto mb-3">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary,#202124)] dark:text-[#F2F3F5]">{title}</h3>
            <p className="text-xs text-[var(--color-text-secondary,#737373)] dark:text-[#9BA1A6] mt-1 max-w-sm mx-auto">
              {description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
