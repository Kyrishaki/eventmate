'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Booth, BoothStatus } from '@/types/database';
import {
  Store,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  Boxes,
  TabletSmartphone,
  CheckCircle2,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function BoothsPage() {
  const t = useTranslations('booths');
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const { booths, events, allocations, createBooth, updateBooth, deleteBooth } = useDataStore();

  const [selectedEventFilter, setSelectedEventFilter] = React.useState<string>('all');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBooth, setEditingBooth] = React.useState<Booth | null>(null);

  // Form states
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [eventId, setEventId] = React.useState('');
  const [status, setStatus] = React.useState<BoothStatus>('active');

  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );

  const workspaceBooths = booths.filter(
    (b) => !activeWorkspace || b.workspace_id === activeWorkspace.id
  );

  const filteredBooths = workspaceBooths.filter(
    (b) => selectedEventFilter === 'all' || b.event_id === selectedEventFilter
  );

  function openCreateModal() {
    setEditingBooth(null);
    setName('');
    setCode('');
    setEventId(workspaceEvents[0]?.id || '');
    setStatus('active');
    setIsModalOpen(true);
  }

  function openEditModal(booth: Booth) {
    setEditingBooth(booth);
    setName(booth.name);
    setCode(booth.code);
    setEventId(booth.event_id);
    setStatus(booth.status);
    setIsModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !eventId || !activeWorkspace) return;

    if (editingBooth) {
      updateBooth(editingBooth.id, {
        name,
        code: code.toUpperCase(),
        event_id: eventId,
        status,
      });
    } else {
      createBooth({
        workspace_id: activeWorkspace.id,
        event_id: eventId,
        name,
        code: code.toUpperCase(),
        status,
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
              {workspaceBooths.length} {t('title').toLowerCase()}
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">{t('description')}</p>
        </div>

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
      </div>

      {/* Filter by Event */}
      <div className="flex items-center gap-3">
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

            return (
              <Card
                key={booth.id}
                className="border-[#E8E8E5] bg-white shadow-2xs hover:border-[#D6D6D2] transition-colors flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#202124] tracking-tight">
                        {booth.name}
                      </h3>
                      <span className="font-mono text-[10px] text-[#737373] bg-[#F0F0ED] px-1.5 py-0.5 rounded">
                        {booth.code}
                      </span>
                    </div>
                    <Badge variant={statusBadgeVariant(booth.status)} className="capitalize text-[10px]">
                      {t(`statusList.${booth.status}` as any)}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#737373] mt-2 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[#9E9E9C] shrink-0" />
                    <span className="truncate">{event?.name || 'Sự kiện'}</span>
                  </p>

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
                      onClick={() => deleteBooth(booth.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
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
