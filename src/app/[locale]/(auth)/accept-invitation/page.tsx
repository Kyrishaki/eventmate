'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { CheckCircle2, ShieldCheck, Users } from 'lucide-react';

export default function AcceptInvitationPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || 'demo-token';
  const role = searchParams.get('role') || 'cashier';
  const workspaceName = searchParams.get('workspace') || 'Hạc Cầm Studio Tour';

  const [isAccepting, setIsAccepting] = React.useState(false);
  const [isAccepted, setIsAccepted] = React.useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const { setActiveWorkspace, workspaces, setWorkspaces } = useWorkspaceStore();

  async function handleAccept() {
    setIsAccepting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const invitedWorkspace = {
      id: `ws-${Date.now()}`,
      name: workspaceName,
      slug: workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      owner_id: 'owner-id',
      currency: 'VND',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setWorkspaces([invitedWorkspace, ...workspaces]);
    setActiveWorkspace(invitedWorkspace);

    setUser({
      id: 'user-invited-member',
      email: 'crew@eventmate.com',
      fullName: 'Crew Member',
      role: role as any,
    });

    setIsAccepted(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  }

  return (
    <Card className="border-[#E8E8E5] shadow-xs">
      <CardHeader className="space-y-1 pb-4">
        <div className="w-10 h-10 rounded-[6px] bg-[#EBF1EE] text-[#315C4C] flex items-center justify-center mb-2">
          <Users className="w-5 h-5" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-[#202124]">
          {t('acceptInvitationTitle')}
        </CardTitle>
        <CardDescription className="text-xs text-[#737373]">
          {t('acceptInvitationSubtitle')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-4 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#737373]">Không gian làm việc:</span>
            <span className="font-semibold text-[#202124]">{workspaceName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#737373]">Vai trò được phân công:</span>
            <Badge variant="default" className="capitalize">
              {role}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#737373]">Mã thư mời:</span>
            <span className="font-mono text-[#737373] text-[11px] truncate max-w-[160px]">{token}</span>
          </div>
        </div>

        {isAccepted ? (
          <div className="flex items-center justify-center gap-2 p-3 text-xs text-[#2F7D55] bg-[#EAF4EE] border border-[#CEE6D7] rounded-[6px]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã tham gia thành công! Đang chuyển hướng...</span>
          </div>
        ) : (
          <Button
            type="button"
            variant="primary"
            className="w-full gap-2"
            isLoading={isAccepting}
            onClick={handleAccept}
          >
            <ShieldCheck className="w-4 h-4" />
            {t('acceptButton')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
