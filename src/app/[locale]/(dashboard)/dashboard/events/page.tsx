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
  ImagePlus,
  Loader2,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useOrdersStore } from '@/stores/orders-store';
import { exportEventToExcel } from '@/lib/export-excel';
import { compressImage } from '@/lib/utils';
import { VietnamDateTimeField } from '@/components/events/vietnam-date-time-field';

const EVENT_TIME_ZONE = 'Asia/Ho_Chi_Minh';

function toVietnamDateTimeInput(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

function fromVietnamDateTimeInput(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return '';
  const date = new Date(`${value}:00+07:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}

function getVietnamToday(): string {
  return toVietnamDateTimeInput(new Date()).slice(0, 10);
}

function getScheduledEventStatus(startDate: string, endDate: string, now = Date.now()): EventStatus {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'upcoming';
  if (now < start) return 'upcoming';
  if (now < end) return 'active';
  return 'completed';
}

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
  const [timeError, setTimeError] = React.useState('');
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null);
  const [bannerError, setBannerError] = React.useState('');
  const [isBannerProcessing, setIsBannerProcessing] = React.useState(false);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);
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
    const now = new Date();
    setStartDate(toVietnamDateTimeInput(now));
    setEndDate(toVietnamDateTimeInput(new Date(now.getTime() + 4 * 3600000)));
    setTimeError('');
    setBannerUrl(null);
    setBannerError('');
    setIsModalOpen(true);
  }

  function openEditModal(event: EventItem) {
    setEditingEvent(event);
    setName(event.name);
    setLocation(event.location || '');
    setDescription(event.description || '');
    setStartDate(toVietnamDateTimeInput(event.start_date));
    setEndDate(toVietnamDateTimeInput(event.end_date));
    setTimeError('');
    setBannerUrl(event.banner_url || null);
    setBannerError('');
    setIsModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editable) {
      alert('Tài khoản của bạn chỉ có quyền xem, không được phép thêm hoặc sửa sự kiện.');
      return;
    }
    if (!name.trim() || !activeWorkspace) return;

    const startInstant = new Date(`${startDate}:00+07:00`);
    const endInstant = new Date(`${endDate}:00+07:00`);
    if (!startDate || !endDate || Number.isNaN(startInstant.getTime()) || Number.isNaN(endInstant.getTime())) {
      setTimeError('Vui lòng nhập đầy đủ ngày và giờ bắt đầu, kết thúc.');
      return;
    }
    if (endInstant <= startInstant) {
      setTimeError('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }
    const todayStart = new Date(`${getVietnamToday()}T00:00:00+07:00`);
    if (!editingEvent && startInstant < todayStart) {
      setTimeError('Không thể tạo sự kiện đã qua. Vui lòng chọn ngày hôm nay hoặc ngày sắp tới.');
      return;
    }
    setTimeError('');

    const startIso = fromVietnamDateTimeInput(startDate);
    const endIso = fromVietnamDateTimeInput(endDate);
    const savedStatus = getScheduledEventStatus(startIso, endIso);

    if (editingEvent) {
      updateEvent(editingEvent.id, {
        name,
        location: location.trim() || null,
        description: description.trim() || null,
        start_date: startIso,
        end_date: endIso,
        status: savedStatus,
        banner_url: bannerUrl,
      });
    } else {
      createEvent({
        workspace_id: activeWorkspace.id,
        name,
        location: location.trim() || null,
        description: description.trim() || null,
        start_date: startIso,
        end_date: endIso,
        status: savedStatus,
        banner_url: bannerUrl,
      });
    }
    setIsModalOpen(false);
  }

  async function handleBannerFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setBannerError('Vui lòng chọn tệp ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setBannerError('Ảnh banner phải nhỏ hơn 10 MB.');
      return;
    }

    setIsBannerProcessing(true);
    setBannerError('');
    try {
      const compressed = await compressImage(file, 1400, 0.72);
      if (!compressed) throw new Error('Không thể đọc ảnh banner này.');
      setBannerUrl(compressed);
    } catch (error) {
      setBannerError(error instanceof Error ? error.message : 'Không thể xử lý ảnh banner.');
    } finally {
      setIsBannerProcessing(false);
    }
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
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}`} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">{evt.location}</a>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span>{formatDate(evt.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-muted shrink-0" />
                      <Link href="/dashboard/booths" className="text-primary hover:underline">
                        {eventBooths.length} gian hàng đã thiết lập
                      </Link>
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

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href="/dashboard/booths" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-hover">
                      Quản lý gian hàng
                    </Link>
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
        maxWidth="2xl"
        description="Thông tin sự kiện được đồng bộ trực tiếp với các quầy POS và quản lý kho."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Banner Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                Ảnh banner sự kiện
                <span className="text-muted font-normal ml-1">(không bắt buộc)</span>
              </Label>
              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => setBannerUrl(null)}
                  className="text-xs text-error hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Gỡ banner
                </button>
              )}
            </div>

            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleBannerFileChange}
            />

            {bannerUrl ? (
              <div className="group relative rounded-xl overflow-hidden border border-border bg-surface shadow-xs">
                <img
                  src={bannerUrl}
                  alt="Banner preview"
                  className="w-full h-36 sm:h-40 object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-between p-3.5">
                  <span className="text-xs text-white/90 drop-shadow-xs hidden sm:inline">
                    Ảnh banner hiển thị trên quầy POS & Khách mua hàng
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBannerProcessing}
                      onClick={() => bannerInputRef.current?.click()}
                      className="h-7 text-xs bg-black/60 hover:bg-black text-white border-white/20 gap-1.5 shadow-xs"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      Đổi ảnh banner
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isBannerProcessing}
                onClick={() => bannerInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border hover:border-primary/50 hover:bg-surface-hover/40 rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-surface-subtle flex items-center justify-center text-muted group-hover:text-primary transition-colors">
                  {isBannerProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <ImagePlus className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {isBannerProcessing ? 'Đang nén và xử lý ảnh...' : 'Tải lên ảnh banner sự kiện'}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    Khuyến nghị tỉ lệ 16:9 hoặc 3:1 (JPG, PNG, WebP dưới 10MB)
                  </p>
                </div>
              </button>
            )}
            {bannerError && <p className="text-xs text-error" role="alert">{bannerError}</p>}
          </div>

          {/* Event Name */}
          <div className="space-y-1.5">
            <Label htmlFor="evt-name" required className="text-xs font-semibold text-foreground">
              {t('name')}
            </Label>
            <Input
              id="evt-name"
              required
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Venue Location */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="evt-location" className="text-xs font-semibold text-foreground">
                {t('location')}
              </Label>
              <span className="text-[11px] text-muted">Không bắt buộc</span>
            </div>
            <div className="relative">
              <Input
                id="evt-location"
                placeholder={t('locationPlaceholder')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="text-sm pl-9"
              />
              <MapPin className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim() || 'Việt Nam')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Tìm vị trí trên Google Maps
            </a>
            <p className="text-xs text-muted">Tìm vị trí trên Maps, sau đó sao chép địa chỉ đầy đủ hoặc tọa độ vào ô Địa điểm. Địa điểm đã lưu có thể bấm để mở bản đồ.</p>
          </div>

          {/* Date & Time Section */}
          <div className="space-y-3 rounded-xl border border-border bg-surface-subtle/50 p-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span>Thời gian diễn ra</span>
              </div>
              {(() => {
                if (!startDate || !endDate) return null;
                const s = new Date(`${startDate}:00+07:00`).getTime();
                const e = new Date(`${endDate}:00+07:00`).getTime();
                if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;
                const diffHours = Math.round((e - s) / 3600000);
                let durationText = '';
                if (diffHours < 24) {
                  durationText = `${diffHours} giờ`;
                } else {
                  const days = Math.floor(diffHours / 24);
                  const remHours = diffHours % 24;
                  durationText = remHours > 0 ? `${days} ngày ${remHours}h` : `${days} ngày`;
                }
                return (
                  <Badge variant="outline" className="text-[10px] font-mono gap-1 border-primary/40 text-primary bg-primary/5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{durationText}</span>
                  </Badge>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <VietnamDateTimeField
                id="evt-start"
                label={t('startDate')}
                value={startDate}
                minDate={!editingEvent ? getVietnamToday() : undefined}
                required
                onChange={(value) => { setStartDate(value); setTimeError(''); }}
              />
              <VietnamDateTimeField
                id="evt-end"
                label={t('endDate')}
                value={endDate}
                minDate={startDate.slice(0, 10) || (!editingEvent ? getVietnamToday() : undefined)}
                required
                onChange={(value) => { setEndDate(value); setTimeError(''); }}
              />
            </div>

            {timeError && (
              <p className="text-xs text-error font-medium pt-1" role="alert">
                ⚠️ {timeError}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="evt-desc" className="text-xs font-semibold text-foreground">
                {t('descriptionLabel')}
              </Label>
              <span className="text-[11px] text-muted">Không bắt buộc</span>
            </div>
            <textarea
              id="evt-desc"
              rows={3}
              className="flex w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted transition-colors"
              placeholder={t('descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Sticky Modal Actions Footer */}
          <div className="mt-6 pt-4 bg-surface border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-muted hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Đồng bộ tự động dữ liệu lên các quầy POS</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-9 px-4 text-xs flex-1 sm:flex-none justify-center"
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isBannerProcessing}
                className="h-9 px-5 text-xs font-semibold flex-1 sm:flex-none justify-center gap-1.5 shadow-xs"
              >
                {editingEvent ? t('editButton') : t('createButton')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}
