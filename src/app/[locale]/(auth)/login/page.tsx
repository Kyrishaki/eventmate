'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { AlertCircle, Lock, User, Eye, EyeOff, UserCheck, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const {
    login,
    loginAsGuest,
    logout,
    isAuthenticated,
    user,
    isGuestPreview,
  } = useAuthStore();
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isForcedLogout, setIsForcedLogout] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const reason = new URLSearchParams(window.location.search).get('reason');
        if (reason === 'forced_logout' || reason === 'password_changed') {
          setIsForcedLogout(true);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // If the user lands on login page with a Guest session, clear preview mode so they can log in freely
  React.useEffect(() => {
    if (isGuestPreview || user?.role === 'viewer') {
      logout();
    }
  }, [isGuestPreview, user, logout]);

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
        window.location.href = currentUser?.role === 'cashier' ? '/pos' : '/dashboard';
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
    window.location.href = '/dashboard';
  }

  const isAlreadyLoggedIn = isAuthenticated && user && user.role !== 'viewer';

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="space-y-2 pb-4 text-center">
        <div className="h-18 w-auto flex items-center justify-center mx-auto mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="HikaruStore Logo"
            className="h-18 w-auto max-w-[160px] object-contain drop-shadow-sm"
          />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
          Đăng nhập HikaruStore
        </CardTitle>
        <CardDescription className="text-xs text-muted">
          Nhập tên đăng nhập và mật khẩu được cấp để tiếp tục.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {/* Forced Logout Notice when admin randomized password */}
          {isForcedLogout && (
            <div className="p-3 bg-warning-bg border border-warning/40 rounded-lg text-xs text-warning space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                <span>Phiên làm việc đã kết thúc</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Tài khoản này vừa được Quản trị viên đổi mật khẩu ngẫu nhiên để bàn giao/tái sử dụng và đã tự động đăng xuất trên thiết bị. Vui lòng đăng nhập lại với mật khẩu mới được cấp.
              </p>
            </div>
          )}

          {/* Active Session Notice if already logged in */}
          {isAlreadyLoggedIn && (
            <div className="p-3 bg-success-bg border border-primary/30 rounded-lg text-xs text-gold-text space-y-2">
              <div className="flex items-center justify-between">
                <span>
                  Đang đăng nhập: <b>{user.fullName}</b> ({user.role})
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-[11px] underline text-error hover:text-error font-medium"
                >
                  Đăng xuất
                </button>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  window.location.href = user.role === 'cashier' ? '/pos' : '/dashboard';
                }}
                className="w-full h-8 text-xs font-semibold cursor-pointer"
              >
                Tiếp tục vào trang quản trị ({user.role === 'cashier' ? 'POS' : 'Dashboard'})
              </Button>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-error bg-error-bg border border-error-bg rounded-lg animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Identifier Input */}
          <div className="space-y-1.5">
            <Label htmlFor="identifier" className="text-xs font-semibold text-foreground">
              Tên đăng nhập hoặc Email
            </Label>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <Input
                id="identifier"
                type="text"
                placeholder="Nhập tên đăng nhập hoặc email..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-9 h-10 text-xs bg-surface"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Mật khẩu
              </Label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9 h-10 text-xs bg-surface"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted hover:text-foreground"
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

          {/* Guest Access Alternative */}
          <div className="pt-2 text-center">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-[11px] text-muted uppercase tracking-wider">Hoặc</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleGuestLogin}
              className="w-full text-xs text-primary hover:text-gold-text border-primary/30 hover:bg-warning-bg font-semibold gap-1.5"
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
