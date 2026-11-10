'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { WorkspaceRole } from '@/types/database';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Copy,
  Check,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function TeamPage() {
  const t = useTranslations('team');
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const {
    members,
    invitations,
    inviteMember,
    updateMemberRole,
    removeMember,
    revokeInvitation,
  } = useDataStore();

  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<WorkspaceRole>('cashier');
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  const workspaceMembers = members.filter(
    (m) => !activeWorkspace || m.workspace_id === activeWorkspace.id
  );

  const workspaceInvitations = invitations.filter(
    (i) => !activeWorkspace || i.workspace_id === activeWorkspace.id
  );

  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWorkspace) return;

    inviteMember(
      activeWorkspace.id,
      inviteEmail.trim(),
      inviteRole,
      user?.id || 'user-artist-demo'
    );

    setInviteEmail('');
    setIsInviteModalOpen(false);
  }

  function copyInviteLink(token: string, role: string) {
    const url = `${window.location.origin}/accept-invitation?token=${token}&role=${role}&workspace=${encodeURIComponent(
      activeWorkspace?.name || 'EventMate'
    )}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  }

  const roleColors: Record<WorkspaceRole, 'default' | 'success' | 'warning' | 'neutral' | 'outline'> = {
    owner: 'default',
    admin: 'success',
    manager: 'warning',
    cashier: 'neutral',
    inventory_staff: 'neutral',
    viewer: 'outline',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">{t('title')}</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {workspaceMembers.length} {t('membersCount').toLowerCase()}
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">{t('description')}</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="gap-1.5"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t('inviteButton')}</span>
        </Button>
      </div>

      {/* Role Descriptions Banner */}
      <Card className="p-4 border-[#E8E8E5] bg-white shadow-2xs">
        <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#315C4C]" />
          Phân cấp quyền hạn trong Tour
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs text-[#737373]">
          <div>
            <span className="font-semibold text-[#202124]">Owner / Admin:</span>{' '}
            {t('roleDescriptions.owner')}
          </div>
          <div>
            <span className="font-semibold text-[#202124]">Tour Manager:</span>{' '}
            {t('roleDescriptions.manager')}
          </div>
          <div>
            <span className="font-semibold text-[#202124]">Cashier:</span>{' '}
            {t('roleDescriptions.cashier')}
          </div>
        </div>
      </Card>

      {/* Members Table */}
      <Card className="border-[#E8E8E5] bg-white shadow-xs overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-[#FAFAF8] border-b border-[#E8E8E5]">
          <CardTitle className="text-sm font-semibold text-[#202124]">
            {t('membersCount')} hiện tại
          </CardTitle>
        </CardHeader>

        <div className="divide-y divide-[#F0F0ED]">
          {workspaceMembers.map((member) => {
            const isOwner = member.role === 'owner';
            return (
              <div
                key={member.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FBFBFA] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#EBF1EE] text-[#315C4C] flex items-center justify-center font-bold text-xs shrink-0">
                    {member.profile?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#202124]">
                        {member.profile?.full_name || 'Crew Member'}
                      </p>
                      <Badge variant={roleColors[member.role]} className="text-[10px] capitalize">
                        {t(`roles.${member.role}` as any)}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#737373] flex items-center gap-1.5 mt-0.5">
                      <span>{member.profile?.phone || 'Chưa cập nhật SĐT'}</span>
                    </p>
                  </div>
                </div>

                {/* Role Switcher or Delete */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!isOwner ? (
                    <>
                      <select
                        className="h-8 rounded-[4px] border border-[#E8E8E5] bg-white px-2 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
                        value={member.role}
                        onChange={(e) =>
                          updateMemberRole(member.id, e.target.value as WorkspaceRole)
                        }
                      >
                        <option value="admin">{t('roles.admin')}</option>
                        <option value="manager">{t('roles.manager')}</option>
                        <option value="cashier">{t('roles.cashier')}</option>
                        <option value="inventory_staff">{t('roles.inventory_staff')}</option>
                        <option value="viewer">{t('roles.viewer')}</option>
                      </select>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-[#C44536] hover:bg-[#FDF1F0]"
                        onClick={() => removeMember(member.id)}
                        title="Xóa thành viên"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-[11px] text-[#737373] italic">Chủ tài khoản</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Pending Invitations */}
      {workspaceInvitations.length > 0 && (
        <Card className="border-[#E8E8E5] bg-white shadow-xs overflow-hidden">
          <CardHeader className="py-3 px-5 bg-[#FAFAF8] border-b border-[#E8E8E5]">
            <CardTitle className="text-xs font-semibold text-[#737373] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B7791F]" />
              {t('pendingInvitations')} ({workspaceInvitations.length})
            </CardTitle>
          </CardHeader>

          <div className="divide-y divide-[#F0F0ED]">
            {workspaceInvitations.map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#202124]">{inv.email}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {t(`roles.${inv.role}` as any)}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#737373] mt-0.5 font-mono">
                    Mã token: {inv.token}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => copyInviteLink(inv.token, inv.role)}
                  >
                    {copiedToken === inv.token ? (
                      <>
                        <Check className="w-3 h-3 text-[#2F7D55]" />
                        <span className="text-[#2F7D55]">{tCommon('copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t('copyInviteLink')}</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-[#C44536] hover:bg-[#FDF1F0]"
                    onClick={() => revokeInvitation(inv.id)}
                  >
                    {t('revokeInvite')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={t('inviteButton')}
        description="Gửi lời mời tham gia ekip vào Không gian làm việc hiện tại."
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inv-email" required>
              {t('emailLabel')}
            </Label>
            <Input
              id="inv-email"
              type="email"
              required
              placeholder={t('emailPlaceholder')}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-role">{t('roleLabel')}</Label>
            <select
              id="inv-role"
              className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-sm text-[#202124] focus:outline-none focus:border-[#315C4C]"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
            >
              <option value="admin">{t('roles.admin')}</option>
              <option value="manager">{t('roles.manager')}</option>
              <option value="cashier">{t('roles.cashier')}</option>
              <option value="inventory_staff">{t('roles.inventory_staff')}</option>
              <option value="viewer">{t('roles.viewer')}</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0ED]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {t('sendInvite')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
