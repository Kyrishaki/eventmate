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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-border dark:border-border">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-success flex items-center justify-center shrink-0 border border-primary/20">
              <Icon className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-foreground">
              {title}
            </h1>
            {badge && (
              <Badge variant="outline" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted dark:text-muted mt-1.5 leading-relaxed">
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
            <div className="w-12 h-12 rounded-xl bg-muted-light dark:bg-surface-hover border border-border dark:border-border text-primary dark:text-success flex items-center justify-center mx-auto mb-3">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground dark:text-foreground">{title}</h3>
            <p className="text-xs text-muted dark:text-muted mt-1 max-w-sm mx-auto">
              {description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
