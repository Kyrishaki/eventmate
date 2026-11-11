'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore, UserAccount } from '@/stores/auth-store';
import { logActivity } from '@/stores/audit-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Booth, BoothStatus, BoothType, AuditActorRole } from '@/types/database';
import {
  Store,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  Boxes,
  TabletSmartphone,
  Users2,
  Percent,
  Handshake,
  Share2,
  ExternalLink,
  Copy,
  Check,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function BoothsPage() {
  const t = useTranslations('booths');
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const { booths, events, allocations, createBooth, updateBooth, deleteBooth } = useDataStore();
  const { canEditData } = useAuthStore();
  const editable = canEditData();

  const [selectedEventFilter, setSelectedEventFilter] = React.useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = React.useState<string>('all');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBooth, setEditingBooth] = React.useState<Booth | null>(null);

  // Form states
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [eventId, setEventId] = React.useState('');
  const [status, setStatus] = React.useState<BoothStatus>('active');
  const [boothType, setBoothType] = React.useState<BoothType>('solo');
  const [collabPartner, setCollabPartner] = React.useState('');
  const [revenueShareRatio, setRevenueShareRatio] = React.useState<number>(50);

  // Collab Portal Share Modal
  const [selectedCollabBooth, setSelectedCollabBooth] = React.useState<Booth | null>(null);
  const [isCollabModalOpen, setIsCollabModalOpen] = React.useState(false);
  const [copiedShareText, setCopiedShareText] = React.useState(false);

  // Collab Partner Dedicated Account Provisioning Modal
  const [isCollabAccountModalOpen, setIsCollabAccountModalOpen] = React.useState(false);
  const [collabUsername, setCollabUsername] = React.useState('');
  const [collabPassword, setCollabPassword] = React.useState('');
  const [collabFullName, setCollabFullName] = React.useState('');
  const [collabEmail, setCollabEmail] = React.useState('');
  const [collabCreatedSuccess, setCollabCreatedSuccess] = React.useState<UserAccount | null>(null);
  const [collabModalError, setCollabModalError] = React.useState<string | null>(null);
  const [copiedCollabCreds, setCopiedCollabCreds] = React.useState(false);

  function openCreateCollabAccountModal(booth: Booth) {
    setSelectedCollabBooth(booth);
    const safePartner = booth.collab_partner || 'Partner';
    const cleanSlug = safePartner.toLowerCase().replace(/[^a-z0-9]/g, '');
    setCollabUsername(`collab_${cleanSlug || 'user'}`);
    setCollabPassword('Collab@2026');
    setCollabFullName(`Đại diện ${safePartner}`);
    setCollabEmail(`${cleanSlug || 'collab'}@eventmate.local`);
    setCollabCreatedSuccess(null);
    setCollabModalError(null);
    setCopiedCollabCreds(false);
    setIsCollabAccountModalOpen(true);
  }

  function handleCreateCollabAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCollabBooth) return;
    setCollabModalError(null);

    const safePartner = selectedCollabBooth.collab_partner || 'Đối tác Collab';
    const res = useAuthStore.getState().createStaffAccount({
      username: collabUsername,
      password: collabPassword,
      fullName: collabFullName.trim() || collabUsername,
      role: 'collab_partner',
      collabPartnerName: safePartner,
      collabBoothId: selectedCollabBooth.id,
      email: collabEmail.trim() || undefined,
    });

    if (!res.success) {
      setCollabModalError(res.message || 'Lỗi khi cấp tài khoản.');
      return;
    }

    logActivity({
      actor_name: useAuthStore.getState().user?.fullName || 'Admin',
      actor_role: (useAuthStore.getState().user?.role as AuditActorRole) || 'owner',
      action_type: 'user_create',
      entity_type: 'team_member',
      entity_name: `Tài khoản Collab: ${collabUsername}`,
      description: `Admin cấp tài khoản Collab "${collabUsername}" (${collabFullName}) cho đối tác "${safePartner}" tại gian hàng "${selectedCollabBooth.name}".`,
      booth_name: selectedCollabBooth.name,
    });

    setCollabCreatedSuccess({
      id: `collab-${Date.now()}`,
      username: collabUsername,
      password: collabPassword,
      fullName: collabFullName.trim() || collabUsername,
      role: 'collab_partner',
      collabPartnerName: safePartner,
      collabBoothId: selectedCollabBooth.id,
      createdAt: new Date().toISOString(),
    });
  }

  function copyCollabAccountText() {
    if (!collabCreatedSuccess || !selectedCollabBooth) return;
    const evt = events.find((e) => e.id === selectedCollabBooth.event_id);
    const text = `🎉 TÀI KHOẢN ĐỐI TÁC GIAN HÀNG COLLAB — EVENTMATE
• Sự kiện: ${evt?.name || 'Sự kiện'}
• Gian hàng liên danh: ${selectedCollabBooth.name} (${selectedCollabBooth.code})
• Đối tác: ${collabCreatedSuccess.collabPartnerName}
• Link đăng nhập hệ thống: ${window.location.origin}/login
• Tên đăng nhập (Username): ${collabCreatedSuccess.username}
• Mật khẩu (Password): ${collabCreatedSuccess.password}
• Quyền hạn: Quản trị độc lập gian hàng & sản phẩm collab (Kho hàng Admin được bảo vệ chỉ đọc).`;

    navigator.clipboard.writeText(text);
    setCopiedCollabCreds(true);
    setTimeout(() => setCopiedCollabCreds(false), 2500);
  }

  function openShareCollabModal(booth: Booth) {
    setSelectedCollabBooth(booth);
    setIsCollabModalOpen(true);
    setCopiedShareText(false);
  }

  function getCollabShareUrl(booth: Booth) {
    if (typeof window === 'undefined') return '';
    const evt = events.find((e) => e.id === booth.event_id);
    return `${window.location.origin}/vi/collab/${booth.id}?partner=${encodeURIComponent(
      booth.collab_partner || 'Đối tác'
    )}&event=${encodeURIComponent(evt?.name || '')}&ratio=${
      booth.revenue_share_ratio || 50
    }&name=${encodeURIComponent(booth.name)}&evtId=${encodeURIComponent(booth.event_id)}`;
  }

  function handleCopyCollabShare(booth: Booth) {
    const url = getCollabShareUrl(booth);
    const evt = events.find((e) => e.id === booth.event_id);
    const text = `🎪 CỔNG HỢP TÁC GIAN HÀNG SỰ KIỆN — EVENTMATE
• Sự kiện: ${evt?.name || 'Sự kiện chung'}
• Gian hàng liên danh: ${booth.name} (${booth.code})
• Đối tác: ${booth.collab_partner || 'Đối tác'}
• Tỷ lệ chia sẻ doanh thu: ${booth.revenue_share_ratio || 50}% cho Đối tác

👉 Nhấn vào liên kết sau để mở Cổng Đối tác, đồng bộ hàng hóa và xem doanh thu thời gian thực:
${url}`;

    navigator.clipboard.writeText(text);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2500);
  }

  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );

  const workspaceBooths = booths.filter(
    (b) => !activeWorkspace || b.workspace_id === activeWorkspace.id
  );

  const filteredBooths = workspaceBooths.filter((b) => {
    const matchesEvent = selectedEventFilter === 'all' || b.event_id === selectedEventFilter;
    const matchesType =
      selectedTypeFilter === 'all' ||
      (selectedTypeFilter === 'collab' && (b.booth_type === 'collab' || !!b.collab_partner)) ||
      (selectedTypeFilter === 'solo' && b.booth_type !== 'collab' && !b.collab_partner);
    return matchesEvent && matchesType;
  });

  function openCreateModal() {
    setEditingBooth(null);
    setName('');
    setCode('');
    setEventId(workspaceEvents[0]?.id || '');
    setStatus('active');
    setBoothType('solo');
    setCollabPartner('');
    setRevenueShareRatio(50);
    setIsModalOpen(true);
  }

  function openEditModal(booth: Booth) {
    setEditingBooth(booth);
    setName(booth.name);
    setCode(booth.code);
    setEventId(booth.event_id);
    setStatus(booth.status);
    setBoothType(booth.booth_type || (booth.collab_partner ? 'collab' : 'solo'));
    setCollabPartner(booth.collab_partner || '');
    setRevenueShareRatio(booth.revenue_share_ratio || 50);
    setIsModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editable) {
      alert('Tài khoản của bạn chỉ có quyền xem, không được phép thêm hoặc sửa gian hàng.');
      return;
    }
    if (!name.trim() || !code.trim() || !eventId || !activeWorkspace) return;

    if (editingBooth) {
      updateBooth(editingBooth.id, {
        name,
        code: code.toUpperCase(),
        event_id: eventId,
        status,
        booth_type: boothType,
        collab_partner: boothType === 'collab' ? collabPartner.trim() || null : null,
        revenue_share_ratio: boothType === 'collab' ? Number(revenueShareRatio) || 50 : undefined,
      });
    } else {
      createBooth({
        workspace_id: activeWorkspace.id,
        event_id: eventId,
        name,
        code: code.toUpperCase(),
        status,
        booth_type: boothType,
        collab_partner: boothType === 'collab' ? collabPartner.trim() || null : null,
        revenue_share_ratio: boothType === 'collab' ? Number(revenueShareRatio) || 50 : undefined,
      });
    }
    setIsModalOpen(false);
  }

  const statusBadgeVariant = (st: BoothStatus) => {
    switch (st) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'closed':
        return 'neutral';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">{t('title')}</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {workspaceBooths.length} quầy bán
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Quản lý các gian hàng riêng hoặc gian hàng hợp tác liên danh (Collab) cho từng sự kiện.
          </p>
        </div>

        {editable ? (
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={openCreateModal}
            disabled={workspaceEvents.length === 0}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('createButton')}</span>
          </Button>
        ) : (
          <Badge variant="outline" className="text-xs text-[#737373]">
            Chế độ Chỉ Xem
          </Badge>
        )}
      </div>

      {/* Filters Bar: Event and Collab Type */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-[#737373]">
          <Calendar className="w-3.5 h-3.5" />
          <span>{t('selectEvent')}:</span>
        </div>
        <select
          className="h-8 rounded-[6px] border border-[#E8E8E5] bg-white px-2.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
          value={selectedEventFilter}
          onChange={(e) => setSelectedEventFilter(e.target.value)}
        >
          <option value="all">{t('allEvents')}</option>
          {workspaceEvents.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>

        {/* Filter by Solo vs Collab */}
        <div className="flex items-center gap-2 text-xs text-[#737373] border-l border-[#E8E8E5] pl-3">
          <Users2 className="w-3.5 h-3.5" />
          <span>Mô hình quầy:</span>
        </div>
        <select
          className="h-8 rounded-[6px] border border-[#E8E8E5] bg-white px-2.5 text-xs text-[#202124] focus:outline-none focus:border-[#315C4C]"
          value={selectedTypeFilter}
          onChange={(e) => setSelectedTypeFilter(e.target.value)}
        >
          <option value="all">Tất cả mô hình</option>
          <option value="solo">Gian hàng Độc lập</option>
          <option value="collab">Gian hàng Collab (Hợp tác)</option>
        </select>
      </div>

      {/* Booths Grid */}
      {filteredBooths.length === 0 ? (
        <Card className="border-[#E8E8E5] shadow-xs">
          <CardContent className="p-12 text-center">
            <Store className="w-10 h-10 text-[#9E9E9C] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#202124]">{t('noBooths')}</h3>
            <p className="text-xs text-[#737373] mt-1 max-w-sm mx-auto">{t('noBoothsDesc')}</p>
            {workspaceEvents.length > 0 && (
              <Button variant="outline" size="sm" className="mt-4 gap-1" onClick={openCreateModal}>
                <Plus className="w-3.5 h-3.5" />
                <span>{t('createButton')}</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooths.map((booth) => {
            const event = events.find((e) => e.id === booth.event_id);
            const boothAllocations = allocations.filter((a) => a.booth_id === booth.id);
            const totalAllocatedItems = boothAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
            const totalSoldItems = boothAllocations.reduce((sum, a) => sum + a.sold_quantity, 0);
            const isCollab = booth.booth_type === 'collab' || !!booth.collab_partner;

            return (
              <Card
                key={booth.id}
                className="border-[#E8E8E5] bg-white shadow-2xs hover:border-[#D6D6D2] transition-colors flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-[#202124] tracking-tight">
                          {booth.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-[10px] text-[#737373] bg-[#F0F0ED] px-1.5 py-0.5 rounded">
                          {booth.code}
                        </span>
                        {isCollab ? (
                          <Badge variant="warning" className="text-[10px] gap-1">
                            <Users2 className="w-2.5 h-2.5" />
                            <span>Collab: {booth.collab_partner || 'Đối tác'}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Độc lập
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Badge variant={statusBadgeVariant(booth.status)} className="capitalize text-[10px]">
                      {t(`statusList.${booth.status as 'active' | 'inactive' | 'closed'}`)}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#737373] mt-2 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[#9E9E9C] shrink-0" />
                    <span className="truncate">{event?.name || 'Sự kiện'}</span>
                  </p>

                  {isCollab && (
                    <div className="mt-3 p-3 bg-[#FEF7EC] rounded-[6px] border border-[#B7791F]/30 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#8C5D17] flex items-center gap-1">
                          <Handshake className="w-3.5 h-3.5 text-[#B7791F]" />
                          <span>Đối tác: {booth.collab_partner || 'Chưa đặt tên'}</span>
                        </span>
                        <span className="font-mono text-[11px] text-[#B7791F] font-bold bg-white px-1.5 py-0.5 rounded border border-[#B7791F]/20">
                          {booth.revenue_share_ratio || 50}% Doanh số
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1 border-t border-[#B7791F]/20">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 border-[#315C4C]/40 text-[#315C4C] hover:bg-[#EAF4EE] flex-1 font-bold"
                          onClick={() => openCreateCollabAccountModal(booth)}
                          title="Cấp tài khoản đăng nhập trực tiếp cho Đối tác Collab"
                        >
                          <KeyRound className="w-3 h-3 text-[#315C4C]" />
                          <span>Cấp Account Collab</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 border-[#B7791F]/40 text-[#8C5D17] hover:bg-[#FDF2E2] font-semibold"
                          onClick={() => openShareCollabModal(booth)}
                          title="Chia sẻ Cổng liên kết web"
                        >
                          <Share2 className="w-3 h-3 text-[#B7791F]" />
                          <span>Link Web</span>
                        </Button>
                        <Link
                          href={`/collab/${booth.id}?partner=${encodeURIComponent(
                            booth.collab_partner || ''
                          )}&event=${encodeURIComponent(event?.name || '')}&ratio=${
                            booth.revenue_share_ratio || 50
                          }&name=${encodeURIComponent(booth.name)}&evtId=${encodeURIComponent(booth.event_id)}`}
                          target="_blank"
                        >
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 bg-white text-[#B7791F] hover:bg-[#FDF2E2] border border-[#B7791F]/30 font-semibold"
                            title="Mở xem cổng đối tác"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373]">Hạn mức đã cấp:</span>
                      <span className="font-semibold text-[#202124]">
                        {totalAllocatedItems} món
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373]">Đã bán:</span>
                      <span className="font-semibold text-[#2F7D55]">
                        {totalSoldItems} món
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#737373]">Còn lại tại quầy:</span>
                      <span className="font-bold text-[#315C4C]">
                        {Math.max(0, totalAllocatedItems - totalSoldItems)} món
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3 border-t border-[#F0F0ED] bg-[#FAFAF8] rounded-b-[8px] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {editable ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[#737373]"
                          onClick={() => openEditModal(booth)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[#C44536] hover:bg-[#FDF1F0]"
                          onClick={() => {
                            if (confirm('Bạn có chắc muốn xóa gian hàng này?')) {
                              deleteBooth(booth.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] text-[#9E9E9C] italic">Chỉ xem</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href="/dashboard/inventory">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                        <Boxes className="w-3 h-3" />
                        <span>Kho</span>
                      </Button>
                    </Link>
                    <Link href="/pos">
                      <Button variant="primary" size="sm" className="h-7 px-2.5 text-xs gap-1">
                        <TabletSmartphone className="w-3 h-3" />
                        <span>Mở POS</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Booth Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBooth ? t('editButton') : t('createButton')}
        description="Mỗi quầy bán có mã định danh riêng và chỉ được phép bán số lượng hàng hóa được phân bổ."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="booth-event" required>
              {t('selectEvent')}
            </Label>
            <select
              id="booth-event"
              required
              className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-sm text-[#202124] focus:outline-none focus:border-[#315C4C]"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              {workspaceEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="booth-name" required>
              {t('name')}
            </Label>
            <Input
              id="booth-name"
              required
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="booth-code" required>
                {t('code')}
              </Label>
              <Input
                id="booth-code"
                required
                placeholder={t('codePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="booth-status">{t('status')}</Label>
              <select
                id="booth-status"
                className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-sm text-[#202124] focus:outline-none focus:border-[#315C4C]"
                value={status}
                onChange={(e) => setStatus(e.target.value as BoothStatus)}
              >
                <option value="active">{t('statusList.active')}</option>
                <option value="paused">{t('statusList.paused')}</option>
                <option value="closed">{t('statusList.closed')}</option>
              </select>
            </div>
          </div>

          {/* Collab Booth Options */}
          <div className="p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#202124]">Mô hình quầy bán</p>
                <p className="text-[11px] text-[#737373]">
                  Chọn nếu đây là gian hàng hợp tác / liên danh với nghệ sĩ hoặc đối tác khác
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBoothType('solo')}
                  className={`px-2 py-1 text-xs rounded font-medium ${
                    boothType === 'solo'
                      ? 'bg-[#315C4C] text-white'
                      : 'bg-white border text-[#737373]'
                  }`}
                >
                  Độc lập
                </button>
                <button
                  type="button"
                  onClick={() => setBoothType('collab')}
                  className={`px-2 py-1 text-xs rounded font-medium ${
                    boothType === 'collab'
                      ? 'bg-[#B7791F] text-white'
                      : 'bg-white border text-[#737373]'
                  }`}
                >
                  Collab
                </button>
              </div>
            </div>

            {boothType === 'collab' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E8E8E5]">
                <div className="space-y-1">
                  <Label htmlFor="collab-name">Tên Đối tác Collab</Label>
                  <Input
                    id="collab-name"
                    placeholder="VD: The Cassette, Cá Hồi Hoang..."
                    value={collabPartner}
                    onChange={(e) => setCollabPartner(e.target.value)}
                    className="bg-white text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="collab-ratio">Chia sẻ doanh thu (%)</Label>
                  <Input
                    id="collab-ratio"
                    type="number"
                    min={0}
                    max={100}
                    value={revenueShareRatio}
                    onChange={(e) => setRevenueShareRatio(Number(e.target.value))}
                    className="bg-white text-xs h-8"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0ED]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {tCommon('save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Chia sẻ Cổng Hợp Tác Đối Tác */}
      {selectedCollabBooth && (
        <Modal
          isOpen={isCollabModalOpen}
          onClose={() => setIsCollabModalOpen(false)}
          title={`Cổng Hợp Tác Đối Tác — ${selectedCollabBooth.name}`}
          description={`Gửi liên kết độc quyền này cho đối tác "${selectedCollabBooth.collab_partner || 'Đối tác'}" để họ có thể mở trang giao diện riêng, đồng bộ sản phẩm và xem báo cáo chia sẻ doanh thu.`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#FEF7EC] rounded-[6px] border border-[#B7791F]/30 space-y-1.5 text-xs text-[#8C5D17]">
              <div className="flex items-center justify-between font-bold">
                <span>Gian hàng: {selectedCollabBooth.name} ({selectedCollabBooth.code})</span>
                <span>Tỷ lệ: {selectedCollabBooth.revenue_share_ratio || 50}% Đối tác</span>
              </div>
              <p className="text-[11px]">
                Đối tác khi truy cập link này sẽ vào thẳng cổng làm việc riêng của gian hàng, không cần tài khoản admin chính của bạn.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Liên kết truy cập Cổng Đối tác:</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={getCollabShareUrl(selectedCollabBooth)}
                  className="font-mono text-xs bg-[#F7F7F5] select-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs gap-1"
                  onClick={() => handleCopyCollabShare(selectedCollabBooth)}
                >
                  {copiedShareText ? <Check className="w-3.5 h-3.5 text-[#2F7D55]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedShareText ? 'Đã copy' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mẫu tin nhắn gửi qua Zalo / Telegram:</Label>
              <div className="p-3 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[6px] text-xs font-mono text-[#202124] whitespace-pre-wrap leading-relaxed">
{`🎪 CỔNG HỢP TÁC GIAN HÀNG SỰ KIỆN — EVENTMATE
• Sự kiện: ${events.find((e) => e.id === selectedCollabBooth.event_id)?.name || 'Sự kiện chung'}
• Gian hàng liên danh: ${selectedCollabBooth.name} (${selectedCollabBooth.code})
• Đối tác: ${selectedCollabBooth.collab_partner || 'Đối tác'}
• Tỷ lệ chia sẻ doanh thu: ${selectedCollabBooth.revenue_share_ratio || 50}% cho Đối tác

👉 Nhấn vào link sau để mở Cổng Đối tác, đồng bộ hàng hóa và xem doanh thu thời gian thực:
${getCollabShareUrl(selectedCollabBooth)}`}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F0F0ED]">
              <Link
                href={`/collab/${selectedCollabBooth.id}?partner=${encodeURIComponent(
                  selectedCollabBooth.collab_partner || ''
                )}&event=${encodeURIComponent(events.find((e) => e.id === selectedCollabBooth.event_id)?.name || '')}&ratio=${
                  selectedCollabBooth.revenue_share_ratio || 50
                }&name=${encodeURIComponent(selectedCollabBooth.name)}&evtId=${encodeURIComponent(selectedCollabBooth.event_id)}`}
                target="_blank"
              >
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-[#315C4C]">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở xem thử giao diện Đối tác</span>
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCollabModalOpen(false)}
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-[#B7791F] hover:bg-[#975F16] border-none text-white font-bold gap-1.5"
                  onClick={() => handleCopyCollabShare(selectedCollabBooth)}
                >
                  {copiedShareText ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedShareText ? 'Đã sao chép tin nhắn!' : 'Sao chép tin nhắn gửi Đối tác'}</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Provision Dedicated Collab Partner Account */}
      {selectedCollabBooth && (
        <Modal
          isOpen={isCollabAccountModalOpen}
          onClose={() => setIsCollabAccountModalOpen(false)}
          title="Cấp Tài Khoản Quản Trị Cho Đối Tác Collab"
          description={`Tạo tài khoản đăng nhập trực tiếp cho đối tác "${selectedCollabBooth.collab_partner || 'Đối tác'}" để tự quản lý hàng bán.`}
          maxWidth="md"
        >
          {collabCreatedSuccess ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#EAF4EE] border border-[#2F7D55]/30 rounded-[8px] flex items-start gap-2.5 text-xs text-[#1D5438]">
                <ShieldCheck className="w-5 h-5 text-[#2F7D55] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-[#1D5438]">
                    Đã cấp tài khoản đối tác thành công!
                  </p>
                  <p className="mt-0.5 text-[#256343]">
                    Đối tác có thể đăng nhập vào hệ thống để tự quản lý sản phẩm, tồn kho và bán hàng tại quầy liên danh. Kho hàng của Admin được bảo vệ ở chế độ Chỉ đọc.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[8px] space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#E8E8E5]">
                  <span className="text-[#737373]">Thương hiệu / Đối tác:</span>
                  <span className="font-bold text-[#202124]">{collabCreatedSuccess.collabPartnerName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E8E8E5]">
                  <span className="text-[#737373]">Gian hàng được cấp:</span>
                  <span className="font-semibold text-[#315C4C]">{selectedCollabBooth.name} ({selectedCollabBooth.code})</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E8E8E5]">
                  <span className="text-[#737373]">Tên đăng nhập:</span>
                  <span className="font-mono font-bold text-sm text-[#202124] bg-white px-2 py-0.5 rounded border border-[#E8E8E5]">
                    {collabCreatedSuccess.username}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#E8E8E5]">
                  <span className="text-[#737373]">Mật khẩu:</span>
                  <span className="font-mono font-bold text-sm text-[#202124] bg-white px-2 py-0.5 rounded border border-[#E8E8E5]">
                    {collabCreatedSuccess.password}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#737373]">Link đăng nhập:</span>
                  <span className="font-mono text-[11px] text-[#315C4C]">
                    /login
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0ED]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCollabAccountModalOpen(false)}
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={copyCollabAccountText}
                  className="font-bold gap-1.5"
                >
                  {copiedCollabCreds ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCollabCreds ? 'Đã sao chép tài khoản!' : 'Sao chép thông tin tài khoản'}</span>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateCollabAccount} className="space-y-4">
              {collabModalError && (
                <div className="p-2.5 bg-[#FDF1F0] border border-[#FADBD8] text-[#C44536] rounded text-xs">
                  {collabModalError}
                </div>
              )}

              <div className="p-3 bg-[#FAF5FF] border border-[#A855F7]/30 rounded-[6px] text-xs text-[#6B21A8] space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Gian hàng: {selectedCollabBooth.name} ({selectedCollabBooth.code})</span>
                  <Badge variant="warning" className="text-[10px]">
                    Chia sẻ: {selectedCollabBooth.revenue_share_ratio || 50}%
                  </Badge>
                </div>
                <p className="text-[11px] text-[#7E22CE]">
                  🔒 Tài khoản Collab có quyền thêm/sửa sản phẩm và quản lý kho hàng của bản thân. Kho hàng của Admin sẽ ở trạng thái <strong>Chỉ đọc</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="collab-fullname" required>
                  Họ tên người đại diện đối tác
                </Label>
                <Input
                  id="collab-fullname"
                  required
                  placeholder="VD: Nguyễn Văn Đại Diện, Trưởng nhóm Brand..."
                  value={collabFullName}
                  onChange={(e) => setCollabFullName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="collab-user" required>
                    Tên đăng nhập (Username)
                  </Label>
                  <Input
                    id="collab-user"
                    required
                    placeholder="VD: collab_genz..."
                    value={collabUsername}
                    onChange={(e) => setCollabUsername(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="collab-pwd" required>
                    Mật khẩu đăng nhập
                  </Label>
                  <Input
                    id="collab-pwd"
                    type="text"
                    required
                    placeholder="Tối thiểu 6 ký tự..."
                    value={collabPassword}
                    onChange={(e) => setCollabPassword(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="collab-mail">Email liên hệ (tùy chọn)</Label>
                <Input
                  id="collab-mail"
                  type="email"
                  placeholder="partner@brand.com"
                  value={collabEmail}
                  onChange={(e) => setCollabEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0ED]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCollabAccountModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold bg-[#315C4C] hover:bg-[#254639] gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Khởi tạo & Cấp tài khoản</span>
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
