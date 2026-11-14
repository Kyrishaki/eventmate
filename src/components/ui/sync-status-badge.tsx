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
  onClick?: () => void;
}

export function SyncStatusBadge({ status, pendingCount = 0, className, onClick }: SyncStatusBadgeProps) {
  const t = useTranslations('common');

  const configs = {
    online: {
      icon: Wifi,
      label: t('online'),
      dotClass: 'bg-primary',
      badgeClass: 'text-primary bg-success-bg border-[#CEE6D7]',
    },
    offline: {
      icon: WifiOff,
      label: t('offline'),
      dotClass: 'bg-warning',
      badgeClass: 'text-warning bg-warning-bg border-[#F8E3C3]',
    },
    syncing: {
      icon: RefreshCw,
      label: t('syncing'),
      dotClass: 'bg-primary animate-pulse',
      badgeClass: 'text-primary bg-warning-bg border-[#D5E2DC]',
    },
    synced: {
      icon: Wifi,
      label: t('synced'),
      dotClass: 'bg-primary',
      badgeClass: 'text-primary bg-success-bg border-[#CEE6D7]',
    },
    pending: {
      icon: RefreshCw,
      label: `${t('pending')} (${pendingCount})`,
      dotClass: 'bg-warning',
      badgeClass: 'text-warning bg-warning-bg border-[#F8E3C3]',
    },
    syncFailed: {
      icon: AlertCircle,
      label: t('syncFailed'),
      dotClass: 'bg-error',
      badgeClass: 'text-error bg-error-bg border-error-bg',
    },
  };

  const current = configs[status] || configs.online;
  const Icon = current.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === 'syncing'}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium tracking-tight select-none transition-opacity',
        onClick && 'cursor-pointer hover:opacity-85 active:scale-95',
        current.badgeClass,
        className
      )}
      title={onClick ? `Trạng thái: ${current.label} (Bấm để đồng bộ đám mây ngay)` : `Connection status: ${current.label}`}
    >
      <span className={cn('w-2 h-2 rounded-full shrink-0', current.dotClass)} />
      <Icon className={cn('w-3 h-3 shrink-0', status === 'syncing' && 'animate-spin')} />
      <span className="hidden sm:inline">{current.label}</span>
      {pendingCount > 0 && (
        <span className="sm:hidden font-mono font-bold text-[10px]">({pendingCount})</span>
      )}
    </button>
  );
}
