'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Booth, BoothStatus, BoothType } from '@/types/database';
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
                      {t(`statusList.${booth.status}` as any)}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#737373] mt-2 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[#9E9E9C] shrink-0" />
                    <span className="truncate">{event?.name || 'Sự kiện'}</span>
                  </p>

                  {isCollab && booth.revenue_share_ratio && (
                    <div className="mt-2 text-[11px] text-[#B7791F] flex items-center gap-1 bg-[#FEF7EC] px-2 py-1 rounded">
                      <Percent className="w-3 h-3" />
                      <span>Chia sẻ doanh thu đối tác: {booth.revenue_share_ratio}%</span>
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
    </div>
  );
}
