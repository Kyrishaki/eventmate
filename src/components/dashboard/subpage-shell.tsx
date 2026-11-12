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
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-2 border-b border-[#E8E8E5] dark:border-neutral-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#202124] dark:text-neutral-100">
              {title}
            </h1>
            {badge && (
              <Badge variant="outline" className="text-[11px]">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#737373] dark:text-neutral-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {actionNode}
          {actionLabel && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
              className="h-8 text-xs font-semibold"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>

      {children || (
        <Card className="border-[#E8E8E5] dark:border-neutral-800 shadow-xs">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-12 h-12 rounded-[8px] bg-[#F7F7F5] dark:bg-neutral-800 border border-[#E8E8E5] dark:border-neutral-700 text-[#315C4C] dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#202124] dark:text-neutral-100">{title}</h3>
            <p className="text-xs text-[#737373] dark:text-neutral-400 mt-1 max-w-sm mx-auto">
              {description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
