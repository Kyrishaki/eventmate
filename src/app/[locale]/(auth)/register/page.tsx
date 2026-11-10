'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { AlertCircle, Building2, Lock, Mail, User } from 'lucide-react';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const { setActiveWorkspace, workspaces, setWorkspaces } = useWorkspaceStore();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const registerSchema = React.useMemo(
    () =>
      z.object({
        fullName: z.string().min(2, t('errors.requiredField')),
        workspaceName: z.string().min(2, t('errors.requiredField')),
        email: z.string().min(1, t('errors.requiredField')).email(t('errors.invalidEmail')),
        password: z.string().min(6, t('errors.passwordTooShort')),
      }),
    [t]
  );

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      workspaceName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = React.useCallback(
    async (data: RegisterFormValues) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              workspace_name: data.workspaceName,
            },
          },
        });

        const newWorkspace = {
          id: `ws-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : 'demo'}`,
          name: data.workspaceName,
          slug: data.workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          owner_id: authData?.user?.id ?? 'user-artist-owner',
          currency: 'VND',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setWorkspaces([newWorkspace, ...workspaces]);
        setActiveWorkspace(newWorkspace);

        setUser({
          id: authData?.user?.id ?? 'user-artist-owner',
          email: data.email,
          fullName: data.fullName,
          role: 'owner',
        });

        router.push('/dashboard');
      } catch {
        // Dev fallback
        const newWorkspace = {
          id: `ws-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : 'demo'}`,
          name: data.workspaceName,
          slug: data.workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          owner_id: 'user-artist-owner',
          currency: 'VND',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setWorkspaces([newWorkspace, ...workspaces]);
        setActiveWorkspace(newWorkspace);

        setUser({
          id: 'user-artist-owner',
          email: data.email,
          fullName: data.fullName,
          role: 'owner',
        });
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    },
    [router, setActiveWorkspace, setUser, setWorkspaces, workspaces]
  );

  return (
    <Card className="border-[#E8E8E5] shadow-xs">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight text-[#202124]">
          {t('registerTitle')}
        </CardTitle>
        <CardDescription className="text-xs text-[#737373]">
          {t('registerSubtitle')}
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

          <div className="space-y-1.5">
            <Label htmlFor="fullName" required>
              {t('fullNameLabel')}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-[#9E9E9C]" />
              <Input
                id="fullName"
                type="text"
                placeholder={t('fullNamePlaceholder')}
                className="pl-9"
                error={!!errors.fullName}
                {...register('fullName')}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-[#C44536]">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workspaceName" required>
              {t('workspaceNameLabel')}
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-[#9E9E9C]" />
              <Input
                id="workspaceName"
                type="text"
                placeholder={t('workspaceNamePlaceholder')}
                className="pl-9"
                error={!!errors.workspaceName}
                {...register('workspaceName')}
              />
            </div>
            {errors.workspaceName && (
              <p className="text-xs text-[#C44536]">{errors.workspaceName.message}</p>
            )}
          </div>

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

          <div className="space-y-1.5">
            <Label htmlFor="password" required>
              {t('passwordLabel')}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#9E9E9C]" />
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                className="pl-9"
                error={!!errors.password}
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-[#C44536]">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            {t('signUpButton')}
          </Button>
        </CardContent>

        <CardFooter className="justify-center border-t border-[#F0F0ED] pt-4 text-xs text-[#737373]">
          <span>{t('signInPrompt')}</span>
          <Link
            href="/login"
            className="ml-1 text-[#315C4C] font-semibold hover:underline"
          >
            {t('signInLink')}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
