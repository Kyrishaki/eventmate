import * as React from 'react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Link } from '@/i18n/routing';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background dark:bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto py-3">
        <Link href="/login" className="flex items-center gap-3 text-foreground group">
          <div className="h-13 sm:h-15 w-auto flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="HikaruStore Logo"
              className="h-13 sm:h-15 w-auto max-w-[125px] object-contain transition-transform group-hover:scale-105"
            />
          </div>
          <span className="font-black text-xl sm:text-2xl tracking-tight text-foreground">
            HikaruStore
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Centered Auth Form */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted py-4">
        <p>© 2026 HikaruStore. Quản lý gian hàng & bán hàng sự kiện.</p>
      </footer>
    </div>
  );
}
