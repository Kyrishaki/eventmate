import * as React from 'react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Link } from '@/i18n/routing';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto py-2">
        <Link href="/login" className="flex items-center gap-2.5 text-[#202124] group">
          <div className="w-8 h-8 rounded-[6px] bg-[#315C4C] text-white flex items-center justify-center font-bold text-sm tracking-wider">
            EM
          </div>
          <span className="font-semibold text-base tracking-tight text-[#202124]">
            EventMate
          </span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Main Centered Auth Form */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#737373] py-4">
        <p>© 2026 EventMate. Platform for Artists & Tour Crews.</p>
      </footer>
    </div>
  );
}
