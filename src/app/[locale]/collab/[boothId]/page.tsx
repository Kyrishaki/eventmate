'use client';

import * as React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useDataStore } from '@/stores/data-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { Handshake, Loader2, ArrowRight } from 'lucide-react';

export default function CollabPartnerRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const boothId = params?.boothId as string;

  const { activeWorkspace } = useWorkspaceStore();
  const { booths, events, createBooth, createEvent } = useDataStore();
  const { user, enterCollabPreview } = useAuthStore();

  const [statusMessage, setStatusMessage] = React.useState('Đang khởi tạo không gian Đối tác Collab...');

  React.useEffect(() => {
    if (!boothId) {
      router.replace('/dashboard');
      return;
    }

    // 1. Locate booth or bootstrap from URL parameters
    let currentBooth = booths.find((b) => b.id === boothId);

    const partnerParam = searchParams.get('partner') || 'Đối tác Liên danh';
    const eventNameParam = searchParams.get('event') || 'Sự kiện Collab 2026';
    const ratioParam = Number(searchParams.get('ratio')) || 50;
    const boothNameParam = searchParams.get('name') || `Gian hàng Collab — ${partnerParam}`;
    const evtIdParam = searchParams.get('evtId') || `evt-collab-${boothId}`;
    const wsId = activeWorkspace?.id || 'ws-hac-cam-studio';

    if (!currentBooth) {
      let evt =
        events.find((e) => e.id === evtIdParam) ||
        events.find((e) => e.name.trim().toLowerCase() === eventNameParam.trim().toLowerCase());

      if (!evt) {
        evt = createEvent({
          id: evtIdParam,
          workspace_id: wsId,
          name: eventNameParam,
          location: 'Địa điểm sự kiện',
          description: `Sự kiện hợp tác cùng đối tác ${partnerParam}`,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
          event_type: 'collab_event',
        });
      }

      currentBooth = createBooth({
        id: boothId,
        workspace_id: wsId,
        event_id: evt.id,
        name: boothNameParam,
        code: `COL-${partnerParam.slice(0, 3).toUpperCase()}`,
        status: 'active',
        booth_type: 'collab',
        collab_partner: partnerParam,
        revenue_share_ratio: ratioParam,
      });
    }

    const effectivePartner = currentBooth?.collab_partner || partnerParam;

    // 2. Activate Collab session (saving previous user if switching from Admin)
    setStatusMessage(`Đang kết nối không gian Quản trị cho "${effectivePartner}"...`);
    enterCollabPreview(effectivePartner, boothId);

    // 3. Smooth redirect to the unified Dashboard
    const timer = setTimeout(() => {
      router.replace('/dashboard');
    }, 450);

    return () => clearTimeout(timer);
  }, [boothId, searchParams, booths, events, activeWorkspace, createBooth, createEvent, enterCollabPreview, router]);

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-800 rounded-2xl p-8 shadow-sm space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF5FF] dark:bg-purple-950/50 border border-[#A855F7]/30 text-[#9333EA] dark:text-purple-300 flex items-center justify-center mx-auto shadow-2xs">
          <Handshake className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[#202124] dark:text-neutral-100 tracking-tight">
            Cổng Quản Trị Đối Tác Collab
          </h2>
          <p className="text-xs text-[#737373] dark:text-neutral-400">
            Hệ thống dùng chung giao diện Quản trị chuẩn HikaruStore. Hàng kho Admin được bảo vệ an toàn ở chế độ Chỉ đọc.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F7F7F5] dark:bg-neutral-800/60 border border-[#E8E8E5] dark:border-neutral-700/60 flex items-center justify-center gap-2.5 text-xs text-[#315C4C] dark:text-emerald-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{statusMessage}</span>
        </div>

        <button
          type="button"
          onClick={() => router.replace('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#202124] dark:hover:text-white font-medium cursor-pointer"
        >
          <span>Nhấn vào đây nếu không tự chuyển trang</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
