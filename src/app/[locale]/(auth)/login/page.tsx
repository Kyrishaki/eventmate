'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { AlertCircle, Lock, User, Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsGuest, isAuthenticated, user } = useAuthStore();
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // If already authenticated with a valid session, can jump straight to dashboard
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'cashier') {
        router.push('/pos');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập hoặc email.');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      const res = login(identifier, password);
      if (res.success) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.role === 'cashier') {
          router.push('/pos');
        } else {
          router.push('/dashboard');
        }
      } else {
        setErrorMessage(res.message || 'Đăng nhập không thành công.');
      }
    } catch {
      setErrorMessage('Có lỗi xảy ra trong quá trình đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleGuestLogin() {
    loginAsGuest();
    router.push('/dashboard');
  }

  function fillPreset(u: string, p: string) {
    setIdentifier(u);
    setPassword(p);
    setErrorMessage(null);
  }

  return (
    <Card className="border-[#E8E8E5] bg-white shadow-xs">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight text-[#202124]">
          Đăng nhập EventMate
        </CardTitle>
        <CardDescription className="text-xs text-[#737373]">
          Nhập tài khoản Quản trị viên hoặc tài khoản Nhân viên được cấp để tiếp tục.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-[#C44536] bg-[#FDF1F0] border border-[#FADBD8] rounded-[6px] animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Identifier Input */}
          <div className="space-y-1.5">
            <Label htmlFor="identifier" className="text-xs font-semibold text-[#202124]">
              Tên đăng nhập hoặc Email
            </Label>
            <div className="relative">
              <User className="w-4 h-4 text-[#9E9E9C] absolute left-3 top-2.5" />
              <Input
                id="identifier"
                type="text"
                placeholder="Tuanadminvippro666, HKT87@123..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-9 h-10 text-xs bg-white"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-[#202124]">
                Mật khẩu
              </Label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9E9E9C] absolute left-3 top-2.5" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 h-10 text-xs bg-white"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#9E9E9C] hover:text-[#202124]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Master Admin Fast Fill Preset Pill Box */}
          <div className="p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#315C4C] text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tài khoản Quản trị viên chính:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillPreset('Tuanadminvippro666', 'Tu@n1121314151')}
                className="p-2 rounded bg-white border border-[#E8E8E5] hover:border-[#315C4C] text-left transition-colors"
              >
                <p className="font-semibold text-[#202124] text-[11px] truncate">Tuanadminvippro666</p>
                <p className="text-[10px] text-[#737373] mt-0.5 font-mono">Tu@n1121314151</p>
              </button>
              <button
                type="button"
                onClick={() => fillPreset('HKT87@123', 'HKT@997804')}
                className="p-2 rounded bg-white border border-[#E8E8E5] hover:border-[#315C4C] text-left transition-colors"
              >
                <p className="font-semibold text-[#202124] text-[11px] truncate">HKT87@123</p>
                <p className="text-[10px] text-[#737373] mt-0.5 font-mono">HKT@997804</p>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full h-11 text-sm font-bold shadow-xs active:scale-[0.99] transition-transform"
            isLoading={isLoading}
          >
            Đăng nhập hệ thống
          </Button>

          {/* Guest Access Alternative */}
          <div className="pt-2 text-center">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#E8E8E5]"></div>
              <span className="flex-shrink mx-3 text-[11px] text-[#737373] uppercase tracking-wider">Hoặc</span>
              <div className="flex-grow border-t border-[#E8E8E5]"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleGuestLogin}
              className="w-full text-xs text-[#737373] hover:text-[#202124] gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Truy cập với tư cách Khách xem (Chế độ Chỉ đọc)</span>
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
