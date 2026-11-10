'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type SyncState = 'online' | 'offline' | 'syncing' | 'synced' | 'pending' | 'syncFailed';

interface SyncStatusBadgeProps {
  status: SyncState;
  pendingCount?: number;
  className?: string;
}

export function SyncStatusBadge({ status, pendingCount = 0, className }: SyncStatusBadgeProps) {
  const t = useTranslations('common');

  const configs = {
    online: {
      icon: Wifi,
      label: t('online'),
      dotClass: 'bg-[#2F7D55]',
      badgeClass: 'text-[#2F7D55] bg-[#EAF4EE] border-[#CEE6D7]',
    },
    offline: {
      icon: WifiOff,
      label: t('offline'),
      dotClass: 'bg-[#B7791F]',
      badgeClass: 'text-[#B7791F] bg-[#FEF7EC] border-[#F8E3C3]',
    },
    syncing: {
      icon: RefreshCw,
      label: t('syncing'),
      dotClass: 'bg-[#315C4C] animate-pulse',
      badgeClass: 'text-[#315C4C] bg-[#EBF1EE] border-[#D5E2DC]',
    },
    synced: {
      icon: Wifi,
      label: t('synced'),
      dotClass: 'bg-[#2F7D55]',
      badgeClass: 'text-[#2F7D55] bg-[#EAF4EE] border-[#CEE6D7]',
    },
    pending: {
      icon: RefreshCw,
      label: `${t('pending')} (${pendingCount})`,
      dotClass: 'bg-[#B7791F]',
      badgeClass: 'text-[#B7791F] bg-[#FEF7EC] border-[#F8E3C3]',
    },
    syncFailed: {
      icon: AlertCircle,
      label: t('syncFailed'),
      dotClass: 'bg-[#C44536]',
      badgeClass: 'text-[#C44536] bg-[#FDF1F0] border-[#FADBD8]',
    },
  };

  const current = configs[status] || configs.online;
  const Icon = current.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] border text-xs font-medium tracking-tight select-none',
        current.badgeClass,
        className
      )}
      title={`Connection status: ${current.label}`}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', current.dotClass)} />
      <Icon className={cn('w-3 h-3 shrink-0', status === 'syncing' && 'animate-spin')} />
      <span>{current.label}</span>
    </div>
  );
}
