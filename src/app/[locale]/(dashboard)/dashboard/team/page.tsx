'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore, canManageTeam, isViewerOnly, UserAccount } from '@/stores/auth-store';
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
} from 'lucide-react';

export default function TeamPage() {
  const t = useTranslations('team');
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const { user, accounts, createStaffAccount, deleteStaffAccount } = useAuthStore();

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

    setFullName('');
    setUsername('');
    setPassword('');
    setRole('cashier');
    setCollabPartnerName('');
    setIsAccountModalOpen(false);
  }

  function copyAccountCredentials(account: UserAccount) {
    const text = `EventMate - Thông tin đăng nhập:\n- Đường dẫn: ${window.location.origin}/login\n- Tên đăng nhập: ${account.username}\n- Mật khẩu: ${account.password}\n- Vai trò: ${getRoleLabel(account.role)}${account.collabPartnerName ? `\n- Đối tác: ${account.collabPartnerName} (Chỉ quản trị hàng bán của bản thân)` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(account.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  function getRoleLabel(r: WorkspaceRole): string {
    switch (r) {
      case 'owner':
        return 'Chủ sở hữu (Owner)';
      case 'admin':
        return 'Quản trị viên (Admin)';
      case 'manager':
        return 'Quản lý quầy (Manager)';
      case 'cashier':
        return 'Thu ngân POS (Cashier)';
      case 'inventory_staff':
        return 'Nhân viên kho (Inventory)';
      case 'collab_partner':
        return 'Đối tác Collab (Quản trị độc lập)';
      case 'viewer':
        return 'Khách xem (Viewer)';
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">
              Đội ngũ & Cấp tài khoản Nhân sự
            </h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {accounts.length} tài khoản
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Quản trị viên trực tiếp tạo tài khoản & mật khẩu để phát cho nhân viên, trợ lý và thu ngân.
          </p>
        </div>

        {isAdmin ? (
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 shadow-xs w-full sm:w-auto justify-center"
            onClick={() => {
              setModalError(null);
              setIsAccountModalOpen(true);
            }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tạo tài khoản & Mật khẩu</span>
          </Button>
        ) : (
          <Badge variant="warning" className="text-xs gap-1 py-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Chế độ Chỉ xem (Không có quyền tạo tài khoản)</span>
          </Badge>
        )}
      </div>

      {/* Role Descriptions Banner */}
      <Card className="p-4 border-[#E8E8E5] bg-white shadow-2xs">
        <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#315C4C]" />
          Phân cấp quyền hạn trong hệ thống
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-[#737373]">
          <div>
            <span className="font-semibold text-[#202124]">Admin / Owner:</span>{' '}
            Toàn quyền quản lý, tạo account + mật khẩu phát cho nhân viên, xem & xuất doanh thu.
          </div>
          <div>
            <span className="font-semibold text-[#202124]">Thu ngân (Cashier):</span>{' '}
            Chỉ được mở màn hình POS (`/pos`) để bán hàng và quét mã VietQR. Không được sửa giá hay kho.
          </div>
          <div>
            <span className="font-semibold text-[#202124]">Khách xem (Viewer / Guest):</span>{' '}
            Chỉ được phép xem báo cáo đối soát. Bị chặn mọi quyền thêm, sửa, xóa dữ liệu.
          </div>
        </div>
      </Card>

      {/* Accounts List */}
      <Card className="border-[#E8E8E5] bg-white shadow-xs overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-[#FAFAF8] border-b border-[#E8E8E5] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-[#202124] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#315C4C]" />
              Danh sách Tài khoản & Mật khẩu Đã Cấp
            </CardTitle>
            <CardDescription className="text-xs">
              Các tài khoản có thể đăng nhập trực tiếp tại trang `/login`
            </CardDescription>
          </div>
        </CardHeader>

        <div className="divide-y divide-[#F0F0ED]">
          {accounts.map((acc) => {
            const isMaster = acc.id === 'admin-tuan' || acc.id === 'admin-hkt';
            const isPasswordVisible = !!visiblePasswords[acc.id];
            const isCopied = copiedId === acc.id;

            return (
              <div
                key={acc.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#FBFBFA] transition-colors"
              >
                {/* Account info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#EBF1EE] text-[#315C4C] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {acc.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#202124]">{acc.fullName}</p>
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
                        <span className="text-[10px] bg-[#315C4C] text-white px-1.5 py-0.2 rounded font-semibold">
                          Admin Chính
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#737373]">
                      <span>
                        Tài khoản: <strong className="text-[#202124] font-mono">{acc.username}</strong>
                      </span>

                      {/* Password field with show/hide */}
                      <span className="flex items-center gap-1">
                        Mật khẩu:{' '}
                        <span className="font-mono font-bold text-[#202124] bg-[#F7F7F5] px-1.5 py-0.5 rounded border border-[#E8E8E5]">
                          {isPasswordVisible ? acc.password : '••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(acc.id)}
                          className="p-1 text-[#9E9E9C] hover:text-[#202124] rounded"
                          title={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#F0F0ED] dark:border-neutral-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs gap-1"
                    onClick={() => copyAccountCredentials(acc)}
                    title="Sao chép tên đăng nhập và mật khẩu để gửi nhân sự"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2F7D55]" />
                        <span className="text-[#2F7D55] font-semibold">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Gửi thông tin</span>
                      </>
                    )}
                  </Button>

                  {isAdmin && !isMaster && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-[#C44536] hover:bg-[#FDF1F0]"
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

      {/* Modal: Create Staff Account & Password */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="Tạo Tài Khoản & Mật Khẩu Cho Nhân Sự"
        description="Admin trực tiếp đặt tên đăng nhập và mật khẩu để phát cho trợ lý hoặc thu ngân."
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          {modalError && (
            <div className="p-2.5 bg-[#FDF1F0] border border-[#FADBD8] text-[#C44536] rounded text-xs">
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
              <Label htmlFor="staff-pass" required>
                Mật khẩu đăng nhập
              </Label>
              <Input
                id="staff-pass"
                type="text"
                required
                placeholder="Tối thiểu 6 ký tự..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-role" required>
              Phân quyền nhiệm vụ
            </Label>
            <select
              id="staff-role"
              className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
            >
              <option value="cashier">Thu ngân (Cashier) — Chỉ bán hàng tại màn hình POS</option>
              <option value="manager">Quản lý (Manager) — Quản lý sự kiện, quầy và theo dõi kho</option>
              <option value="inventory_staff">Nhân viên kho (Inventory) — Chỉ quản lý và điều chuyển tồn kho</option>
              <option value="collab_partner">Đối tác Collab (Collab Partner) — Quản trị sản phẩm & kho hàng riêng, không can thiệp kho Admin</option>
              <option value="viewer">Khách xem (Viewer) — Chỉ xem báo cáo, không được chỉnh sửa</option>
              <option value="admin">Quản trị viên (Admin) — Toàn quyền như Owner</option>
            </select>
          </div>

          {role === 'collab_partner' && (
            <div className="space-y-1.5 p-3 rounded-[6px] bg-[#FAF5FF] border border-[#A855F7]/30">
              <Label htmlFor="staff-collab-partner" required className="text-[#6B21A8] font-bold">
                Tên đối tác / Thương hiệu Collab
              </Label>
              <Input
                id="staff-collab-partner"
                required
                placeholder="VD: GenZ Studio, The Cassette, Brand X..."
                value={collabPartnerName}
                onChange={(e) => setCollabPartnerName(e.target.value)}
                className="h-9 text-xs bg-white"
              />
              <p className="text-[11px] text-[#7E22CE]">
                🔒 Đối tác Collab sẽ chỉ được phép quản trị sản phẩm và điều phối kho hàng thuộc thương hiệu này. Kho hàng của Admin được bảo vệ an toàn (Chỉ đọc).
              </p>
            </div>
          )}

          <div className="p-3 bg-[#F7F7F5] rounded text-xs text-[#737373] space-y-1">
            <p className="font-semibold text-[#202124]">💡 Lưu ý bảo mật:</p>
            <p>
              Sau khi tạo, bạn có thể bấm nút <strong>&ldquo;Gửi thông tin&rdquo;</strong> để sao chép tin nhắn định dạng sẵn và gửi qua Zalo/Messenger cho nhân viên.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0ED]">
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
