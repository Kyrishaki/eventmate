'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import {
  useAuthStore,
  canManageTeam,
  isViewerOnly,
  UserAccount,
  getDisplayPassword,
  generateStaffPassword,
} from '@/stores/auth-store';
import { logActivity } from '@/stores/audit-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { WorkspaceRole, AuditActorRole } from '@/types/database';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  ShieldAlert,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  Lock,
  Share2,
  Users2,
  Pencil,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
  Shuffle,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Send,
} from 'lucide-react';

export default function TeamManagement() {
  const t = useTranslations('team');
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const {
    user,
    accounts,
    createStaffAccount,
    updateAccountCredentials,
    randomizeAccountCredentials,
    deleteStaffAccount,
  } = useAuthStore();

  const isAdmin = canManageTeam(user?.role);
  const isReadOnly = isViewerOnly(user?.role);

  // Create Staff Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = React.useState(false);
  const [fullName, setFullName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<WorkspaceRole>('cashier');
  const [collabPartnerName, setCollabPartnerName] = React.useState('');
  const [modalError, setModalError] = React.useState<string | null>(null);

  // Edit Account Modal State
  const [editingAccount, setEditingAccount] = React.useState<UserAccount | null>(null);
  const [editFullName, setEditFullName] = React.useState('');
  const [editUsername, setEditUsername] = React.useState('');
  const [editPassword, setEditPassword] = React.useState('');
  const [editRole, setEditRole] = React.useState<WorkspaceRole>('cashier');
  const [editCollabPartnerName, setEditCollabPartnerName] = React.useState('');
  const [editModalError, setEditModalError] = React.useState<string | null>(null);
  const [showEditPassword, setShowEditPassword] = React.useState(false);

  // Recycle / Randomize Account Modal State
  const [isRecycleModalOpen, setIsRecycleModalOpen] = React.useState(false);
  const [recycleTargetId, setRecycleTargetId] = React.useState('');
  const [recycleNewName, setRecycleNewName] = React.useState('');
  const [recycleNewPassword, setRecycleNewPassword] = React.useState('');
  const [recycleNewRole, setRecycleNewRole] = React.useState<WorkspaceRole>('cashier');
  const [recycleModalError, setRecycleModalError] = React.useState<string | null>(null);
  const [isRecycling, setIsRecycling] = React.useState(false);
  const [recycleSuccessData, setRecycleSuccessData] = React.useState<{
    username: string;
    password: string;
    fullName: string;
    role: WorkspaceRole;
  } | null>(null);

  // Notification Banner
  const [actionFeedback, setActionFeedback] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // UI state for showing/hiding passwords & copied indicators
  const [visiblePasswords, setVisiblePasswords] = React.useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  function toggleShowPassword(id: string) {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    if (role === 'collab_partner' && !collabPartnerName.trim()) {
      setModalError('Vui lòng nhập tên đối tác / thương hiệu Collab.');
      return;
    }

    const res = createStaffAccount({
      username,
      password,
      fullName: fullName.trim() || username,
      role,
      collabPartnerName: role === 'collab_partner' ? collabPartnerName.trim() : undefined,
    });

    if (!res.success) {
      setModalError(res.message || 'Lỗi tạo tài khoản');
      return;
    }

    logActivity({
      actor_name: user?.fullName || 'Admin',
      actor_role: (user?.role as AuditActorRole) || 'owner',
      action_type: 'user_create',
      entity_type: 'team_member',
      entity_name: `Tài khoản: ${username}`,
      description: `Admin cấp tài khoản mới "${username}" (${fullName.trim() || username}) với vai trò "${getRoleLabel(role)}"${role === 'collab_partner' ? ` [Đối tác: ${collabPartnerName}]` : ''}.`,
      changes: [
        { field: 'username', field_label: 'Tên đăng nhập', new_value: username },
        { field: 'role', field_label: 'Vai trò', new_value: role },
        { field: 'collab_partner', field_label: 'Đối tác', new_value: collabPartnerName || '—' },
      ],
    });

    setActionFeedback({
      type: 'success',
      message: `Đã cấp tài khoản "${username}" thành công! Mật khẩu: ${password}`,
    });

    setFullName('');
    setUsername('');
    setPassword('');
    setRole('cashier');
    setCollabPartnerName('');
    setIsAccountModalOpen(false);
  }

  function openEditModal(account: UserAccount) {
    setEditingAccount(account);
    setEditFullName(account.fullName);
    setEditUsername(account.username);
    setEditPassword(getDisplayPassword(account));
    setEditRole(account.role);
    setEditCollabPartnerName(account.collabPartnerName || '');
    setEditModalError(null);
    setShowEditPassword(true);
  }

  function handleUpdateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAccount) return;
    setEditModalError(null);

    if (editRole === 'collab_partner' && !editCollabPartnerName.trim()) {
      setEditModalError('Vui lòng nhập tên đối tác / thương hiệu Collab.');
      return;
    }

    const res = updateAccountCredentials({
      accountId: editingAccount.id,
      username: editUsername,
      password: editPassword,
      fullName: editFullName.trim() || editUsername,
      role: editRole,
      collabPartnerName: editRole === 'collab_partner' ? editCollabPartnerName.trim() : undefined,
    });

    if (!res.success) {
      setEditModalError(res.message || 'Lỗi khi cập nhật tài khoản');
      return;
    }

    logActivity({
      actor_name: user?.fullName || 'Admin',
      actor_role: (user?.role as AuditActorRole) || 'owner',
      action_type: 'update',
      entity_type: 'team_member',
      entity_name: `Tài khoản: ${editUsername}`,
      description: `Admin đã cập nhật tên đăng nhập và mật khẩu cho tài khoản "${editUsername}" (${editFullName.trim() || editUsername}).`,
      changes: [
        { field: 'username', field_label: 'Tên đăng nhập', old_value: editingAccount.username, new_value: editUsername },
        { field: 'role', field_label: 'Vai trò', old_value: editingAccount.role, new_value: editRole },
      ],
    });

    setActionFeedback({
      type: 'success',
      message: `Đã cập nhật tên tài khoản và mật khẩu cho "${editUsername}" thành công!`,
    });

    setEditingAccount(null);
  }

  function openRecycleModal(account?: UserAccount | null) {
    const target =
      account ||
      accounts.find((a) => a.id !== 'admin-tuan' && a.id !== 'admin-hkt') ||
      accounts[0] ||
      null;
    if (!target) return;
    if (target.id === 'admin-tuan' || target.id === 'admin-hkt' || target.role === 'owner') {
      setActionFeedback({
        type: 'error',
        message: 'Tài khoản Quản trị viên (Admin) được cố định thông tin, không được phép đảo ngẫu nhiên mật khẩu.',
      });
      return;
    }
    setRecycleTargetId(target.id);
    setRecycleNewName(target.fullName);
    setRecycleNewPassword(generateStaffPassword());
    setRecycleNewRole(target.role);
    setRecycleModalError(null);
    setRecycleSuccessData(null);
    setIsRecycleModalOpen(true);
  }

  function rerollRecyclePassword() {
    setRecycleNewPassword(generateStaffPassword());
  }

  function handleConfirmRecycle(e: React.FormEvent) {
    e.preventDefault();
    setRecycleModalError(null);

    const target = accounts.find((a) => a.id === recycleTargetId);
    if (!target) {
      setRecycleModalError('Không tìm thấy tài khoản cần tái sử dụng.');
      return;
    }

    setIsRecycling(true);

    const res = randomizeAccountCredentials({
      accountId: target.id,
      newPassword: recycleNewPassword,
      newFullName: recycleNewName.trim() || target.fullName,
      newRole: recycleNewRole,
    });

    setIsRecycling(false);

    if (!res.success) {
      setRecycleModalError(res.message || 'Lỗi khi đảo mật khẩu');
      return;
    }

    logActivity({
      actor_name: user?.fullName || 'Admin',
      actor_role: (user?.role as AuditActorRole) || 'owner',
      action_type: 'update',
      entity_type: 'team_member',
      entity_name: `Tài khoản: ${target.username}`,
      description: `Admin đã đảo ngẫu nhiên mật khẩu tài khoản "${target.username}" để bàn giao cho "${recycleNewName.trim() || target.fullName}" và cưỡng chế đăng xuất toàn bộ thiết bị đang đăng nhập.`,
      changes: [
        { field: 'password', field_label: 'Mật khẩu', old_value: '******', new_value: recycleNewPassword },
        { field: 'session_revoked', field_label: 'Thu hồi phiên', new_value: 'Đã ngắt toàn bộ phiên thiết bị' },
      ],
    });

    setRecycleSuccessData({
      username: target.username,
      password: recycleNewPassword,
      fullName: recycleNewName.trim() || target.fullName,
      role: recycleNewRole,
    });

    setActionFeedback({
      type: 'success',
      message: `Đã đảo ngẫu nhiên mật khẩu cho "${target.username}" và thu hồi phiên trên toàn bộ thiết bị thành công!`,
    });
  }

  function copyAccountCredentials(account: UserAccount) {
    const displayPassword = getDisplayPassword(account);
    const text = `EventMate - Thông tin đăng nhập:\n- Đường dẫn: ${window.location.origin}/login\n- Tên đăng nhập: ${account.username}\n- Mật khẩu: ${displayPassword}\n- Vai trò: ${getRoleLabel(account.role)}${account.collabPartnerName ? `\n- Đối tác: ${account.collabPartnerName} (Chỉ quản trị hàng bán của bản thân)` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(account.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  function getRoleLabel(r: WorkspaceRole): string {
    switch (r) {
      case 'owner':
        return 'Chủ sở hữu hệ thống';
      case 'admin':
        return 'Quản trị viên';
      case 'manager':
        return 'Quản lý quầy';
      case 'cashier':
        return 'Thu ngân';
      case 'inventory_staff':
        return 'Nhân viên kho';
      case 'collab_partner':
        return 'Đối tác gian hàng';
      case 'viewer':
        return 'Khách xem';
      default:
        return r;
    }
  }

  const roleColors: Record<WorkspaceRole, 'default' | 'success' | 'warning' | 'neutral' | 'outline'> = {
    owner: 'default',
    admin: 'success',
    manager: 'warning',
    collab_partner: 'warning',
    cashier: 'neutral',
    inventory_staff: 'neutral',
    viewer: 'outline',
  };

  const selectedRecycleTarget = accounts.find((a) => a.id === recycleTargetId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Đội ngũ & Cấp tài khoản Nhân sự
            </h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {accounts.length} tài khoản
            </Badge>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Quản trị viên trực tiếp quản lý, đổi mật khẩu và đảo ngẫu nhiên mật khẩu để tái sử dụng tài khoản cho nhân sự mới.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openRecycleModal()}
              className="gap-1.5 font-bold border-warning/40 text-warning bg-warning-bg hover:bg-warning-bg shadow-2xs"
              title="Đảo ngẫu nhiên mật khẩu một tài khoản bất kỳ và đá phiên khỏi thiết bị cũ"
            >
              <Shuffle className="w-3.5 h-3.5 text-warning" />
              <span>Đảo ngẫu nhiên MK</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAccountModalOpen(true)}
              className="gap-1.5 font-bold shadow-2xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cấp tài khoản mới</span>
            </Button>
          </div>
        )}
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
            actionFeedback.type === 'success'
              ? 'bg-success-bg border-primary/30 text-primary'
              : 'bg-error-bg border-error/30 text-error'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-error" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-muted hover:text-foreground p-1 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Role explanation alert */}
      <Card className="border-border bg-background p-3.5">
        <div className="flex items-center gap-2 font-semibold text-xs text-foreground mb-1.5">
          <Shield className="w-4 h-4 text-primary" />
          <span>Quy tắc phân quyền & Tái sử dụng tài khoản:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-muted">
          <div>
            <span className="font-semibold text-foreground">Admin (Chủ sở hữu / Quản trị):</span>{' '}
            Toàn quyền thêm, sửa, xóa, đổi mật khẩu và đảo ngẫu nhiên mật khẩu của tất cả tài khoản.
          </div>
          <div>
            <span className="font-semibold text-foreground">Đảo MK Tái sử dụng:</span> Cho phép reset mật khẩu sang mã ngẫu nhiên mới và NGAY LẬP TỨC thoát phiên (đá ra) ở thiết bị cũ.
          </div>
          <div>
            <span className="font-semibold text-foreground">Thu ngân (Cashier):</span> Chỉ được mở màn hình Bán hàng
            (`/pos`) để bán hàng và quét mã VietQR. Không được sửa giá hay kho.
          </div>
          <div>
            <span className="font-semibold text-foreground">Đối tác Collab:</span> Chỉ được quản trị và kiểm đếm danh mục sản phẩm của thương hiệu đối tác mình. Kho hàng Admin ở chế độ chỉ đọc.
          </div>
        </div>
      </Card>

      {/* Accounts List */}
      <Card className="border-border bg-surface shadow-xs overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-background border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              Danh sách Tài khoản & Mật khẩu Đã Cấp
            </CardTitle>
            <CardDescription className="text-xs">
              Quản trị viên có thể đổi mật khẩu, đổi username hoặc bấm &ldquo;Đảo MK & Thoát phiên&rdquo; để bàn giao tài khoản cho người khác
            </CardDescription>
          </div>
        </CardHeader>

        <div className="divide-y divide-border">
          {accounts.map((acc) => {
            const isMaster = acc.id === 'admin-tuan' || acc.id === 'admin-hkt';
            const isPasswordVisible = !!visiblePasswords[acc.id];
            const isCopied = copiedId === acc.id;

            return (
              <div
                key={acc.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-background transition-colors"
              >
                {/* Account info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-warning-bg text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {acc.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{acc.fullName}</p>
                      <Badge variant={roleColors[acc.role]} className="text-[10px]">
                        {getRoleLabel(acc.role)}
                      </Badge>
                      {acc.collabPartnerName && (
                        <Badge variant="warning" className="text-[10px] gap-1 bg-[#FAF5FF] text-[#6B21A8] border-[#A855F7]/40 font-semibold">
                          <Users2 className="w-2.5 h-2.5" />
                          <span>Đối tác: {acc.collabPartnerName}</span>
                        </Badge>
                      )}
                      {isMaster && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded font-semibold">
                          Admin Chính
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted">
                      <span>
                        Tài khoản: <strong className="text-foreground font-mono">{acc.username}</strong>
                      </span>

                      {/* Password field with show/hide */}
                      <span className="flex items-center gap-1">
                        Mật khẩu:{' '}
                        <span className="font-mono font-bold text-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                          {isPasswordVisible ? getDisplayPassword(acc) : '••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(acc.id)}
                          className="p-1 text-muted hover:text-foreground rounded"
                          title={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-border flex-wrap">
                  {/* Button: Đảo MK & Đăng xuất thiết bị (Tái sử dụng) - Chỉ áp dụng cho Nhân viên, không đảo Admin */}
                  {isAdmin && !isMaster && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1 border-warning/40 text-warning hover:bg-warning-bg font-semibold"
                      onClick={() => openRecycleModal(acc)}
                      title="Đảo ngẫu nhiên mật khẩu và cưỡng chế thoát phiên ở tất cả các thiết bị đang đăng nhập"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-warning" />
                      <span>Đảo MK & Thoát phiên</span>
                    </Button>
                  )}

                  {/* Button: Đổi tên tài khoản & mật khẩu */}
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1 border-primary/40 text-primary hover:bg-success-bg font-semibold"
                      onClick={() => openEditModal(acc)}
                      title="Đổi tên đăng nhập, mật khẩu tùy ý và vai trò của tài khoản này"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Đổi mật khẩu / Thông tin</span>
                    </Button>
                  )}

                  {/* Button: Gửi thông tin (Sao chép credentials) */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs gap-1"
                    onClick={() => copyAccountCredentials(acc)}
                    title="Sao chép tên đăng nhập và mật khẩu để gửi nhân sự"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-primary" />
                        <span className="text-primary font-semibold">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Gửi thông tin</span>
                      </>
                    )}
                  </Button>

                  {/* Button: Xóa tài khoản (chỉ với nhân sự, bảo vệ tài khoản master) */}
                  {isAdmin && !isMaster && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-error hover:bg-error-bg"
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa tài khoản "${acc.username}"?`)) {
                          deleteStaffAccount(acc.id);
                          logActivity({
                            actor_name: user?.fullName || 'Admin',
                            actor_role: (user?.role as AuditActorRole) || 'owner',
                            action_type: 'user_delete',
                            entity_type: 'team_member',
                            entity_name: `Tài khoản: ${acc.username}`,
                            description: `Admin đã xóa tài khoản nhân viên "${acc.username}" (${acc.fullName}).`,
                          });
                        }
                      }}
                      title="Xóa tài khoản nhân viên"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal: Đảo Ngẫu Nhiên Mật Khẩu & Thu Hồi Phiên (Tái Sử Dụng Tài Khoản) */}
      <Modal
        isOpen={isRecycleModalOpen}
        onClose={() => {
          if (!isRecycling) {
            setIsRecycleModalOpen(false);
            setRecycleSuccessData(null);
          }
        }}
        title="Đảo Ngẫu Nhiên Mật Khẩu & Thu Hồi Phiên Thiết Bị"
        description="Đổi mật khẩu sang mã ngẫu nhiên mới để bàn giao cho nhân sự khác và NGAY LẬP TỨC đá phiên làm việc trên các thiết bị cũ."
      >
        {recycleSuccessData ? (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-success-bg border border-primary/30 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-primary text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Đã đảo mật khẩu & Thu hồi phiên thành công!</span>
              </div>
              <p className="text-foreground leading-relaxed">
                Tất cả thiết bị đang đăng nhập tài khoản <strong>{recycleSuccessData.username}</strong> đã bị đăng xuất ngay lập tức. Hãy sao chép thông tin mới dưới đây để gửi cho nhân sự mới nhận tài khoản:
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-background border border-border font-mono text-xs space-y-2">
              <div className="flex justify-between items-center py-0.5 border-b border-border">
                <span className="text-muted">Đường dẫn:</span>
                <span className="font-bold text-foreground">{typeof window !== 'undefined' ? window.location.origin : ''}/login</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-border">
                <span className="text-muted">Tên tài khoản:</span>
                <span className="font-bold text-foreground">{recycleSuccessData.username}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-border">
                <span className="text-muted">Mật khẩu mới:</span>
                <span className="font-bold text-error text-sm bg-surface px-2 py-0.5 rounded border border-border">
                  {recycleSuccessData.password}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-border">
                <span className="text-muted">Người nhận mới:</span>
                <span className="font-bold text-foreground">{recycleSuccessData.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-muted">Vai trò:</span>
                <span className="font-bold text-foreground">{getRoleLabel(recycleSuccessData.role)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="gap-1.5 font-bold"
                onClick={() => {
                  const text = `EventMate - Thông tin tài khoản bàn giao mới:\n- Đường dẫn: ${window.location.origin}/login\n- Tên đăng nhập: ${recycleSuccessData.username}\n- Mật khẩu mới: ${recycleSuccessData.password}\n- Người nhận: ${recycleSuccessData.fullName}\n- Vai trò: ${getRoleLabel(recycleSuccessData.role)}`;
                  navigator.clipboard.writeText(text);
                  setActionFeedback({
                    type: 'success',
                    message: 'Đã sao chép thông tin tài khoản mới vào bộ nhớ tạm để gửi cho nhân sự!',
                  });
                  setIsRecycleModalOpen(false);
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép thông tin & Đóng</span>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmRecycle} className="space-y-4 text-xs">
            {recycleModalError && (
              <div className="p-2.5 bg-error-bg border border-error-bg text-error rounded text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{recycleModalError}</span>
              </div>
            )}

            {/* Chọn tài khoản cần tái sử dụng */}
            <div className="space-y-1.5">
              <Label htmlFor="recycle-account" required>
                Tài khoản cần đảo mật khẩu & tái sử dụng
              </Label>
              <select
                id="recycle-account"
                value={recycleTargetId}
                onChange={(e) => {
                  const found = accounts.find((a) => a.id === e.target.value);
                  if (found) {
                    setRecycleTargetId(found.id);
                    setRecycleNewName(found.fullName);
                    setRecycleNewRole(found.role);
                  }
                }}
                className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground font-medium focus:outline-none focus:border-primary"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} (@{a.username}) — {getRoleLabel(a.role)}
                  </option>
                ))}
              </select>
            </div>

            {/* Tên người nhận mới */}
            <div className="space-y-1.5">
              <Label htmlFor="recycle-name" required>
                Tên nhân sự mới nhận tài khoản
              </Label>
              <Input
                id="recycle-name"
                required
                placeholder="VD: Thu ngân Ca chiều - Lan, Trợ lý sự kiện..."
                value={recycleNewName}
                onChange={(e) => setRecycleNewName(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted">
                Tên hiển thị để nhận diện ai đang chịu trách nhiệm ca/quầy hiện tại
              </p>
            </div>

            {/* Mật khẩu ngẫu nhiên mới */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="recycle-password" required className="font-bold text-foreground">
                  Mật khẩu ngẫu nhiên mới sinh ra
                </Label>
                <button
                  type="button"
                  onClick={rerollRecyclePassword}
                  className="text-[11px] text-warning hover:text-warning flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đổi mã khác</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  id="recycle-password"
                  required
                  readOnly
                  value={recycleNewPassword}
                  className="h-10 text-sm font-mono font-bold bg-background text-error border-border"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(recycleNewPassword);
                    alert(`Đã sao chép mật khẩu: ${recycleNewPassword}`);
                  }}
                  className="h-10 px-3 text-xs shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </Button>
              </div>
              <p className="text-[11px] text-muted">Mật khẩu ngẫu nhiên rõ ràng, dễ nhớ, dễ gõ trên điện thoại</p>
            </div>

            {/* Phân quyền */}
            <div className="space-y-1.5">
              <Label htmlFor="recycle-role" required>
                Phân quyền nhiệm vụ cho nhân sự mới
              </Label>
              <select
                id="recycle-role"
                className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                value={recycleNewRole}
                onChange={(e) => setRecycleNewRole(e.target.value as WorkspaceRole)}
              >
                <option value="cashier">Thu ngân (Cashier)</option>
                <option value="manager">Quản lý (Manager)</option>
                <option value="inventory_staff">Nhân viên kho (Inventory)</option>
                <option value="collab_partner">Đối tác Collab (Collab Partner)</option>
                <option value="viewer">Khách xem (Viewer)</option>
                <option value="admin">Quản trị viên (Admin)</option>
                <option value="owner">Chủ sở hữu (Owner)</option>
              </select>
            </div>

            {/* Hộp cảnh báo cưỡng chế đăng xuất */}
            <div className="p-3 bg-warning-bg border border-warning/40 rounded-lg text-xs text-warning space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                <span>Cưỡng chế thoát phiên ở tất cả các thiết bị:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Ngay khi bạn bấm <strong>&ldquo;Xác nhận Đảo MK & Thoát Phiên&rdquo;</strong>, hệ thống sẽ gửi tín hiệu hủy phiên tức thời đến mọi thiết bị (điện thoại, máy tính bảng) đang mở tài khoản này. Thiết bị cũ sẽ bị đẩy về trang Đăng nhập ngay lập tức.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isRecycling}
                onClick={() => setIsRecycleModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isRecycling}
                className="font-bold gap-1.5 bg-warning hover:bg-warning text-white"
              >
                {isRecycling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang thu hồi phiên...</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Xác nhận Đảo MK & Thoát Phiên</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Đổi Tên Đăng Nhập & Mật Khẩu (Toàn bộ tài khoản) */}
      <Modal
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        title={`Đổi Tên Đăng Nhập & Mật Khẩu: ${editingAccount?.fullName || ''}`}
        description="Quản trị viên có thể thay đổi tên tài khoản (username), mật khẩu và quyền hạn cho tài khoản này."
      >
        {editingAccount && (
          <form onSubmit={handleUpdateAccount} className="space-y-4">
            {editModalError && (
              <div className="p-2.5 bg-error-bg border border-error-bg text-error rounded text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editModalError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="edit-name" required>
                Tên hiển thị / Họ và tên
              </Label>
              <Input
                id="edit-name"
                required
                placeholder="VD: Tuấn Admin, Nguyễn Văn Thu Ngân..."
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-username" required>
                  Tên đăng nhập (Username)
                </Label>
                <Input
                  id="edit-username"
                  required
                  placeholder="VD: admin_vip, thungan01..."
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="h-9 text-xs font-mono font-bold"
                />
                <p className="text-[11px] text-muted">Dùng để đăng nhập vào trang `/login`</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-pass" required>
                    Mật khẩu đăng nhập
                  </Label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generateStaffPassword())}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tạo ngẫu nhiên</span>
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="edit-pass"
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu mới..."
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="h-9 text-xs font-mono font-bold pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2 top-2.5 text-muted hover:text-foreground"
                    title={showEditPassword ? 'Ẩn' : 'Hiện'}
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted">Mật khẩu dạng chữ rõ ràng, tối thiểu 4 ký tự</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-role" required>
                Phân quyền nhiệm vụ
              </Label>
              <select
                id="edit-role"
                className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as WorkspaceRole)}
              >
                <option value="owner">Chủ sở hữu (Owner)</option>
                <option value="admin">Quản trị viên (Admin)</option>
                <option value="manager">Quản lý (Manager)</option>
                <option value="cashier">Thu ngân (Cashier)</option>
                <option value="inventory_staff">Nhân viên kho (Inventory)</option>
                <option value="collab_partner">Đối tác Collab (Collab Partner)</option>
                <option value="viewer">Khách xem (Viewer)</option>
              </select>
            </div>

            {editRole === 'collab_partner' && (
              <div className="space-y-1.5 p-3 rounded-lg bg-[#FAF5FF] border border-[#A855F7]/30">
                <Label htmlFor="edit-collab-partner" required className="text-[#6B21A8] font-bold">
                  Tên đối tác / Thương hiệu Collab
                </Label>
                <Input
                  id="edit-collab-partner"
                  required
                  placeholder="VD: GenZ Studio, The Cassette, Brand X..."
                  value={editCollabPartnerName}
                  onChange={(e) => setEditCollabPartnerName(e.target.value)}
                  className="h-9 text-xs bg-surface"
                />
              </div>
            )}

            <div className="p-3 bg-background rounded text-xs text-muted space-y-1">
              <p className="font-semibold text-foreground">💡 Hiệu lực ngay lập tức:</p>
              <p>
                Sau khi bấm <strong>&ldquo;Lưu thay đổi&rdquo;</strong>, tên đăng nhập và mật khẩu mới sẽ có hiệu lực ngay lập tức. Người dùng có thể dùng thông tin mới để đăng nhập ngay mà không cần đợi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingAccount(null)}
              >
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm" className="font-bold">
                Lưu thay đổi
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Create Staff Account & Password */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="Tạo Tài Khoản & Mật Khẩu Cho Nhân Sự"
        description="Admin trực tiếp đặt tên đăng nhập và mật khẩu để phát cho trợ lý hoặc thu ngân."
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          {modalError && (
            <div className="p-2.5 bg-error-bg border border-error-bg text-error rounded text-xs">
              {modalError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="staff-name" required>
              Tên nhân viên / Trợ lý
            </Label>
            <Input
              id="staff-name"
              required
              placeholder="VD: Nguyễn Văn Thu Ngân, Trợ Lý Minh..."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="staff-username" required>
                Tên đăng nhập (Username)
              </Label>
              <Input
                id="staff-username"
                required
                placeholder="VD: thungan01, trolytour..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="staff-pass" required>
                  Mật khẩu đăng nhập
                </Label>
                <button
                  type="button"
                  onClick={() => setPassword(generateStaffPassword())}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Tạo ngẫu nhiên</span>
                </button>
              </div>
              <Input
                id="staff-pass"
                type="text"
                required
                placeholder="Tối thiểu 4 ký tự..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-role" required>
              Phân quyền nhiệm vụ
            </Label>
            <select
              id="staff-role"
              className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
            >
              <option value="cashier">Thu ngân (Cashier)</option>
              <option value="manager">Quản lý (Manager)</option>
              <option value="inventory_staff">Nhân viên kho (Inventory)</option>
              <option value="collab_partner">Đối tác Collab (Collab Partner)</option>
              <option value="viewer">Khách xem (Viewer)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
          </div>

          {role === 'collab_partner' && (
            <div className="space-y-1.5 p-3 rounded-lg bg-[#FAF5FF] border border-[#A855F7]/30">
              <Label htmlFor="staff-collab-partner" required className="text-[#6B21A8] font-bold">
                Tên đối tác / Thương hiệu Collab
              </Label>
              <Input
                id="staff-collab-partner"
                required
                placeholder="VD: GenZ Studio, The Cassette, Brand X..."
                value={collabPartnerName}
                onChange={(e) => setCollabPartnerName(e.target.value)}
                className="h-9 text-xs bg-surface"
              />
              <p className="text-[11px] text-[#7E22CE]">
                🔒 Đối tác Collab sẽ chỉ được phép quản trị sản phẩm và điều phối kho hàng thuộc thương hiệu này. Kho hàng của Admin được bảo vệ an toàn (Chỉ đọc).
              </p>
            </div>
          )}

          <div className="p-3 bg-background rounded text-xs text-muted space-y-1">
            <p className="font-semibold text-foreground">💡 Lưu ý bảo mật:</p>
            <p>
              Sau khi tạo, bạn có thể bấm nút <strong>&ldquo;Gửi thông tin&rdquo;</strong> để sao chép tin nhắn định dạng sẵn và gửi qua Zalo/Messenger cho nhân viên.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAccountModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Tạo & Lưu tài khoản
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
