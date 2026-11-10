import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface SubpageShellProps {
  title: string;
  description: string;
  badge?: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export function SubpageShell({
  title,
  description,
  badge,
  icon: Icon,
  actionLabel,
  onAction,
  children,
}: SubpageShellProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">{title}</h1>
            {badge && (
              <Badge variant="outline" className="text-[11px]">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#737373] mt-0.5">{description}</p>
        </div>

        {actionLabel && (
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>

      {children || (
        <Card className="border-[#E8E8E5] shadow-xs">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 rounded-[8px] bg-[#F7F7F5] border border-[#E8E8E5] text-[#315C4C] flex items-center justify-center mx-auto mb-3">
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#202124]">{title}</h3>
            <p className="text-xs text-[#737373] mt-1 max-w-sm mx-auto">
              {description}
            </p>
            <div className="mt-4">
              <Badge variant="neutral">Sẵn sàng triển khai trong Phase 2</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
