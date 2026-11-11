'use client';

import * as React from 'react';
import { Scaling } from 'lucide-react';
import { useDensityStore, DisplayDensity } from '@/stores/density-store';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => {};
function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function DensityToggle({ className }: { className?: string }) {
  const { density, cycleDensity, initDensity } = useDensityStore();
  const mounted = useMounted();

  React.useEffect(() => {
    initDensity();
  }, [initDensity]);

  if (!mounted) {
    return (
      <div
        className={cn(
          'h-8 px-2 rounded-[6px] border border-[#E8E8E5] bg-white opacity-40 shrink-0',
          className
        )}
      />
    );
  }

  const densityMeta: Record<DisplayDensity, { label: string; pct: string; desc: string }> = {
    comfortable: { label: 'Vừa', pct: '100%', desc: 'Giao diện Tiêu chuẩn (100%)' },
    compact: { label: 'Gọn', pct: '90%', desc: 'Giao diện Thu gọn (90% - Nhiều không gian thao tác)' },
    'ultra-compact': { label: 'Rộng', pct: '80%', desc: 'Giao diện Siêu gọn (80% - Tối đa màn hình)' },
  };

  const current = densityMeta[density] || densityMeta.comfortable;

  return (
    <button
      type="button"
      onClick={cycleDensity}
      title={`${current.desc} — Nhấn để đổi tỉ lệ (100% → 90% → 80%)`}
      aria-label="Đổi tỉ lệ hiển thị"
      className={cn(
        'h-8 px-2 sm:px-2.5 rounded-[6px] border border-[#E8E8E5] bg-white text-[#737373] hover:text-[#202124] hover:bg-[#F0F0ED] transition-all flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer text-xs font-semibold',
        density !== 'comfortable' && 'text-[#315C4C] border-[#315C4C]/30 bg-[#315C4C]/5',
        className
      )}
    >
      <Scaling className="w-3.5 h-3.5 text-[#315C4C]" />
      <span className="text-[11px] font-mono leading-none">{current.pct}</span>
    </button>
  );
}
