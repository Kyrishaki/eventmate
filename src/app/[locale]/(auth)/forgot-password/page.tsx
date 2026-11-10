'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const forgotSchema = z.object({
    email: z.string().min(1, t('errors.requiredField')).email(t('errors.invalidEmail')),
  });

  type ForgotFormValues = z.infer<typeof forgotSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  async function onSubmit(data: ForgotFormValues) {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Đã gửi email liên kết khôi phục mật khẩu. Vui lòng kiểm tra hòm thư.');
      }
    } catch {
      setSuccessMessage('Đã gửi hướng dẫn khôi phục mật khẩu nếu email tồn tại trong hệ thống.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-[#E8E8E5] shadow-xs">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight text-[#202124]">
          {t('forgotTitle')}
        </CardTitle>
        <CardDescription className="text-xs text-[#737373]">
          {t('forgotSubtitle')}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 text-xs text-[#C44536] bg-[#FDF1F0] border border-[#FADBD8] rounded-[6px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 p-3 text-xs text-[#2F7D55] bg-[#EAF4EE] border border-[#CEE6D7] rounded-[6px]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" required>
              {t('emailLabel')}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#9E9E9C]" />
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                className="pl-9"
                error={!!errors.email}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-[#C44536]">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            {t('sendResetLink')}
          </Button>
        </CardContent>

        <CardFooter className="justify-center border-t border-[#F0F0ED] pt-4 text-xs">
          <Link
            href="/login"
            className="text-[#315C4C] font-medium hover:underline"
          >
            ← {t('backToLogin')}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
