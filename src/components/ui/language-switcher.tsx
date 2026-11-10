'use client';

import * as React from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  function toggleLanguage(nextLocale: 'vi' | 'en') {
    if (nextLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[6px] border border-[#E8E8E5] bg-white p-0.5 text-xs text-[#737373]',
        className
      )}
    >
      <div className="flex items-center px-1.5 py-0.5 text-[#9E9E9C]">
        <Languages className="w-3.5 h-3.5" />
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => toggleLanguage('vi')}
        className={cn(
          'px-2 py-0.5 rounded-[4px] font-medium transition-colors',
          locale === 'vi'
            ? 'bg-[#315C4C] text-white'
            : 'text-[#737373] hover:text-[#202124] hover:bg-[#F0F0ED]'
        )}
      >
        VI
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => toggleLanguage('en')}
        className={cn(
          'px-2 py-0.5 rounded-[4px] font-medium transition-colors',
          locale === 'en'
            ? 'bg-[#315C4C] text-white'
            : 'text-[#737373] hover:text-[#202124] hover:bg-[#F0F0ED]'
        )}
      >
        EN
      </button>
    </div>
  );
}
