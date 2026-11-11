'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { AlertCircle, Lock, User, Eye, EyeOff, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsGuest, logout, isAuthenticated, user } = useAuthStore();
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // If the user lands on login page with a Guest (viewer) session, reset it so they can log in freely
  React.useEffect(() => {
    if (isAuthenticated && user?.role === 'viewer') {
      logout();
    }
  }, [isAuthenticated, user, logout]);

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

  const isAlreadyLoggedIn = isAuthenticated && user && user.role !== 'viewer';

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
          {/* Active Session Notice if already logged in */}
          {isAlreadyLoggedIn && (
            <div className="p-3 bg-[#EAF4EE] border border-[#2F7D55]/30 rounded-[6px] text-xs text-[#254639] space-y-2">
              <div className="flex items-center justify-between">
                <span>
                  Đang đăng nhập: <b>{user.fullName}</b> ({user.role})
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-[11px] underline text-[#C44536] hover:text-[#962D20] font-medium"
                >
                  Đăng xuất
                </button>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => router.push(user.role === 'cashier' ? '/pos' : '/dashboard')}
                className="w-full h-8 text-xs font-semibold"
              >
                Tiếp tục vào trang quản trị ({user.role === 'cashier' ? 'POS' : 'Dashboard'})
              </Button>
            </div>
          )}

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
                placeholder="Tuanadminvippro666, admin, HKT87@123..."
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full h-11 text-sm font-bold shadow-xs active:scale-[0.99] transition-transform"
            isLoading={isLoading}
          >
            Đăng nhập hệ thống
          </Button>

          {/* Account Credential Hints */}
          <div className="p-2.5 bg-[#FAFAF8] rounded-[6px] border border-[#E8E8E5] text-[11px] text-[#737373] space-y-1">
            <p className="font-semibold text-[#202124]">Gợi ý tài khoản quản trị hệ thống:</p>
            <div className="flex flex-col gap-0.5">
              <span>
                • Admin: <code className="text-[#315C4C] font-semibold">Tuanadminvippro666</code> (hoặc <code className="text-[#315C4C]">admin</code>)
              </span>
              <span>
                • Mật khẩu: <code className="text-[#315C4C] font-semibold">Tuanadminvippro666</code> (hoặc <code className="text-[#315C4C]">Tu@n1121314151</code> / <code className="text-[#315C4C]">123456</code>)
              </span>
            </div>
          </div>

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
              className="w-full text-xs text-[#315C4C] hover:text-[#254639] border-[#315C4C]/30 hover:bg-[#EBF1EE] font-semibold gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Xem Gian Hàng Merchandise (Khách xem & Keep đồ)</span>
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
