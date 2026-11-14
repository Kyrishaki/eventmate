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
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useOrdersStore } from '@/stores/orders-store';
import { exportEventToExcel } from '@/lib/export-excel';

export default function EventsPage() {
  const t = useTranslations('events');
  const tCommon = useTranslations('common');
  const { activeWorkspace } = useWorkspaceStore();
  const { events, booths, createEvent, updateEvent, deleteEvent } = useDataStore();
  const { canEditData, user } = useAuthStore();
  const editable = canEditData() && user?.role !== 'collab_partner';

  const [isModalOpen, setIsModalOpen] = React.useState(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {workspaceEvents.length} {t('title').toLowerCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted mt-0.5">{t('description')}</p>
        </div>

        {editable ? (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Button variant="primary" size="sm" className="flex-1 sm:flex-none justify-center gap-1.5 h-8 text-xs font-semibold" onClick={openCreateModal}>
              <Plus className="w-3.5 h-3.5" />
              <span>{t('createButton')}</span>
            </Button>
          </div>
        ) : (
          <Badge variant="outline" className="text-xs text-muted">
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
            className="h-8 text-xs w-full bg-surface dark:bg-surface"
          />
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card className="border-border shadow-xs">
          <CardContent className="p-12 text-center">
            <CalendarDays className="w-10 h-10 text-muted mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground">{t('noEvents')}</h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">{t('noEventsDesc')}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
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
                className="border-border bg-surface shadow-2xs hover:border-border-strong transition-colors flex flex-col justify-between overflow-hidden"
              >
                {evt.banner_url && (
                  <div className="relative w-full h-36 bg-[#121212] overflow-hidden border-b border-border">
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
                    <h3 className="text-sm font-bold text-foreground tracking-tight truncate">
                      {evt.name}
                    </h3>
                    <Badge variant={statusBadgeVariant(evt.status)} className="capitalize text-[10px]">
                      {t(`statusList.${evt.status as 'upcoming' | 'active' | 'completed' | 'draft'}`)}
                    </Badge>
                  </div>

                  {evt.description && (
                    <p className="text-xs text-muted line-clamp-2 mb-3">
                      {evt.description}
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs text-muted border-t border-border pt-3">
                    {evt.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span>{formatDate(evt.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span>
                        {eventBooths.length} gian hàng đã thiết lập
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3 border-t border-border bg-background rounded-b-[8px] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {editable ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted"
                          onClick={() => openEditModal(evt)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          {tCommon('edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-error hover:bg-error-bg"
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
                      <span className="text-[11px] text-muted italic">Chế độ xem</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportEventExcel(evt)}
                      className="h-7 px-2 text-xs gap-1 text-primary border-primary/30 hover:bg-success-bg font-medium"
                      title="Xuất toàn bộ dữ liệu sự kiện này ra file Excel (.xlsx)"
                    >
                      <Download className="w-3 h-3 text-primary" />
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
          {/* Banner Preview if available */}
          {bannerUrl && (
            <div className="relative rounded-lg overflow-hidden border border-border max-h-36 bg-[#121212]">
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
              className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
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
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder={t('descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
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
