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
import { formatDate } from '@/lib/utils';
import { EventItem, EventStatus } from '@/types/database';
import {
  CalendarDays,
  Plus,
  MapPin,
  Clock,
  Store,
  Edit2,
  Trash2,
  ArrowRight,
  Boxes,
  Users2,
  Download,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useOrdersStore } from '@/stores/orders-store';
import { exportEventToExcel } from '@/lib/export-excel';
import { AiEventPosterModal } from '@/components/events/ai-event-poster-modal';

export default function EventsPage() {
  const t = useTranslations('events');
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const { events, booths, createEvent, updateEvent, deleteEvent } = useDataStore();
  const { canEditData } = useAuthStore();
  const editable = canEditData();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<EventItem | null>(null);

  // Form states
  const [name, setName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [status, setStatus] = React.useState<EventStatus>('upcoming');
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const workspaceEvents = events.filter(
    (e) => !activeWorkspace || e.workspace_id === activeWorkspace.id
  );

  const filteredEvents = workspaceEvents.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  function openCreateModal() {
    setEditingEvent(null);
    setName('');
    setLocation('');
    setDescription('');
    setStartDate(new Date().toISOString().substring(0, 16));
    setEndDate(new Date(Date.now() + 4 * 3600000).toISOString().substring(0, 16));
    setStatus('upcoming');
    setBannerUrl(null);
    setIsModalOpen(true);
  }

  function openEditModal(event: EventItem) {
    setEditingEvent(event);
    setName(event.name);
    setLocation(event.location || '');
    setDescription(event.description || '');
    setStartDate(new Date(event.start_date).toISOString().substring(0, 16));
    setEndDate(new Date(event.end_date).toISOString().substring(0, 16));
    setStatus(event.status);
    setBannerUrl(event.banner_url || null);
    setIsModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editable) {
      alert('Tài khoản của bạn chỉ có quyền xem, không được phép thêm hoặc sửa sự kiện.');
      return;
    }
    if (!name.trim() || !activeWorkspace) return;

    if (editingEvent) {
      updateEvent(editingEvent.id, {
        name,
        location: location.trim() || null,
        description: description.trim() || null,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        status,
        banner_url: bannerUrl,
      });
    } else {
      createEvent({
        workspace_id: activeWorkspace.id,
        name,
        location: location.trim() || null,
        description: description.trim() || null,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        status,
        banner_url: bannerUrl,
      });
    }
    setIsModalOpen(false);
  }

  const statusBadgeVariant = (st: EventStatus) => {
    switch (st) {
      case 'active':
        return 'success';
      case 'upcoming':
        return 'default';
      case 'completed':
        return 'neutral';
      case 'draft':
        return 'outline';
      case 'cancelled':
        return 'error';
      default:
        return 'outline';
    }
  };

  const handleExportEventExcel = (evt: EventItem) => {
    const orders = useOrdersStore.getState().orders;
    const { products, variants, allocations } = useDataStore.getState();
    exportEventToExcel({
      event: evt,
      orders,
      booths,
      products,
      variants,
      allocations,
      workspaceName: activeWorkspace?.name || 'Gian hàng',
      currency: activeWorkspace?.currency || 'VND',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">{t('title')}</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {workspaceEvents.length} {t('title').toLowerCase()}
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">{t('description')}</p>
        </div>

        {editable ? (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none justify-center gap-1.5 border-[#315C4C]/40 text-[#315C4C] hover:bg-[#EAF4EE] font-semibold shadow-2xs h-8 text-xs"
              onClick={() => setIsAiModalOpen(true)}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#315C4C]" />
              <span>Quét ảnh Poster (AI)</span>
            </Button>
            <Button variant="primary" size="sm" className="flex-1 sm:flex-none justify-center gap-1.5 h-8 text-xs font-semibold" onClick={openCreateModal}>
              <Plus className="w-3.5 h-3.5" />
              <span>{t('createButton')}</span>
            </Button>
          </div>
        ) : (
          <Badge variant="outline" className="text-xs text-[#737373]">
            Chế độ Chỉ Xem (Khách)
          </Badge>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder={tCommon('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs w-full bg-white dark:bg-neutral-900"
          />
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card className="border-[#E8E8E5] shadow-xs">
          <CardContent className="p-12 text-center">
            <CalendarDays className="w-10 h-10 text-[#9E9E9C] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#202124]">{t('noEvents')}</h3>
            <p className="text-xs text-[#737373] mt-1 max-w-sm mx-auto">{t('noEventsDesc')}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {editable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-[#315C4C]/40 text-[#315C4C] hover:bg-[#EAF4EE] font-semibold"
                  onClick={() => setIsAiModalOpen(true)}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#315C4C]" />
                  <span>Quét ảnh Poster (AI)</span>
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-1" onClick={openCreateModal}>
                <Plus className="w-3.5 h-3.5" />
                <span>{t('createButton')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((evt) => {
            const eventBooths = booths.filter((b) => b.event_id === evt.id);
            return (
              <Card
                key={evt.id}
                className="border-[#E8E8E5] bg-white shadow-2xs hover:border-[#D6D6D2] transition-colors flex flex-col justify-between overflow-hidden"
              >
                {evt.banner_url && (
                  <div className="relative w-full h-36 bg-[#121212] overflow-hidden border-b border-[#F0F0ED]">
                    <img
                      src={evt.banner_url}
                      alt={evt.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-[#202124] tracking-tight truncate">
                      {evt.name}
                    </h3>
                    <Badge variant={statusBadgeVariant(evt.status)} className="capitalize text-[10px]">
                      {t(`statusList.${evt.status as 'upcoming' | 'active' | 'completed' | 'draft'}`)}
                    </Badge>
                  </div>

                  {evt.description && (
                    <p className="text-xs text-[#737373] line-clamp-2 mb-3">
                      {evt.description}
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs text-[#737373] border-t border-[#F0F0ED] pt-3">
                    {evt.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#9E9E9C] shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#9E9E9C] shrink-0" />
                      <span>{formatDate(evt.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-[#9E9E9C] shrink-0" />
                      <span>
                        {eventBooths.length} gian hàng đã thiết lập
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3 border-t border-[#F0F0ED] bg-[#FAFAF8] rounded-b-[8px] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {editable ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[#737373]"
                          onClick={() => openEditModal(evt)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          {tCommon('edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[#C44536] hover:bg-[#FDF1F0]"
                          onClick={() => {
                            if (confirm('Bạn có chắc muốn xóa sự kiện này?')) {
                              deleteEvent(evt.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] text-[#9E9E9C] italic">Chế độ xem</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportEventExcel(evt)}
                      className="h-7 px-2 text-xs gap-1 text-[#2F7D55] border-[#2F7D55]/30 hover:bg-[#EAF4EE] font-medium"
                      title="Xuất toàn bộ dữ liệu sự kiện này ra file Excel (.xlsx)"
                    >
                      <Download className="w-3 h-3 text-[#2F7D55]" />
                      <span>Xuất Excel</span>
                    </Button>
                    {eventBooths.some((b) => b.booth_type === 'collab' || !!b.collab_partner) && (
                      <Link href="/dashboard/booths">
                        <Badge variant="warning" className="text-[10px] gap-1 cursor-pointer hover:opacity-80">
                          <Users2 className="w-2.5 h-2.5" />
                          <span>Quầy Collab</span>
                        </Badge>
                      </Link>
                    )}
                    <Link href="/dashboard/inventory">
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1">
                        <Boxes className="w-3 h-3" />
                        <span>Phân bổ kho</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? t('editButton') : t('createButton')}
        description="Thông tin sự kiện được đồng bộ trực tiếp với các quầy POS và quản lý kho."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Quick AI Fill banner in Create Mode */}
          {!editingEvent && (
            <div className="p-2.5 bg-[#FAFAF8] rounded-[6px] border border-dashed border-[#315C4C]/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-[#202124]">
                <Sparkles className="w-4 h-4 text-[#315C4C] shrink-0" />
                <span className="text-[11px] text-[#737373]">
                  Có ảnh poster sự kiện? AI sẽ tự động tách tên, ngày tháng năm & địa điểm.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsAiModalOpen(true);
                }}
                className="h-7 text-xs gap-1 text-[#315C4C] border-[#315C4C]/40 hover:bg-[#EAF4EE] shrink-0 font-semibold"
              >
                <Sparkles className="w-3 h-3 text-[#315C4C]" />
                <span>Nhập ảnh AI</span>
              </Button>
            </div>
          )}

          {/* Banner Preview if available */}
          {bannerUrl && (
            <div className="relative rounded-[6px] overflow-hidden border border-[#E8E8E5] max-h-36 bg-[#121212]">
              <img
                src={bannerUrl}
                alt="Banner preview"
                className="w-full h-28 object-cover"
              />
              <button
                type="button"
                onClick={() => setBannerUrl(null)}
                className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 hover:bg-black text-white text-[10px]"
              >
                Gỡ ảnh banner
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="evt-name" required>
              {t('name')}
            </Label>
            <Input
              id="evt-name"
              required
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evt-location">{t('location')}</Label>
            <Input
              id="evt-location"
              placeholder={t('locationPlaceholder')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="evt-start">{t('startDate')}</Label>
              <Input
                id="evt-start"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evt-end">{t('endDate')}</Label>
              <Input
                id="evt-end"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evt-status">{t('status')}</Label>
            <select
              id="evt-status"
              className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-sm text-[#202124] focus:outline-none focus:border-[#315C4C]"
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
            >
              <option value="draft">{t('statusList.draft')}</option>
              <option value="upcoming">{t('statusList.upcoming')}</option>
              <option value="active">{t('statusList.active')}</option>
              <option value="completed">{t('statusList.completed')}</option>
              <option value="cancelled">{t('statusList.cancelled')}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evt-desc">{t('descriptionLabel')}</Label>
            <textarea
              id="evt-desc"
              rows={3}
              className="flex w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-2 text-sm text-[#202124] focus:outline-none focus:border-[#315C4C]"
              placeholder={t('descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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

      {/* AI Event Poster Import Modal */}
      <AiEventPosterModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}
