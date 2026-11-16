'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { useOrdersStore, normalizeVietQrBankId, getBankDisplayName } from '@/stores/orders-store';
import { usePreorderStore } from '@/stores/preorder-store';
import { useAuditStore } from '@/stores/audit-store';
import { useAuthStore } from '@/stores/auth-store';
import { isTestOrder } from '@/lib/test-data-filter';
import { Link } from '@/i18n/routing';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Save,
  Building2,
  Download,
  Upload,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Share2,
  QrCode,
  CreditCard,
  Info,
  UserCheck,
  ChevronRight,
  Printer,
  Clock,
  Sliders,
  Trash2,
  AlertTriangle,
  Receipt,
  Volume2,
  VolumeX,
  FileText,
  Store,
} from 'lucide-react';
import { EventItem, Workspace } from '@/types/database';

const POPULAR_BANKS = [
  { id: 'ICB', name: 'VietinBank (Công Thương VN)' },
  { id: 'MB', name: 'MBBank (Ngân hàng Quân Đội)' },
  { id: 'VCB', name: 'Vietcombank (Ngoại thương Việt Nam)' },
  { id: 'ACB', name: 'ACB (Á Châu)' },
  { id: 'TCB', name: 'Techcombank (Kỹ Thương)' },
  { id: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { id: 'BIDV', name: 'BIDV (Đầu tư và Phát triển VN)' },
  { id: 'VIB', name: 'VIB (Quốc tế)' },
  { id: 'TPB', name: 'TPBank (Tiên Phong)' },
];

type SettingsTab = 'store' | 'payment' | 'receipt' | 'keep' | 'pos' | 'system';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { activeWorkspace, setActiveWorkspace, workspaces, setWorkspaces, updateWorkspaceProfile } = useWorkspaceStore();
  const { activeBankConfig, setBankConfig, orders, clearTestOrders } = useOrdersStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = React.useState<SettingsTab>('store');

  // 1. Store & Brand Identity
  const [name, setName] = React.useState(activeWorkspace?.name || 'HikaruStore');
  const [slug, setSlug] = React.useState(activeWorkspace?.slug || 'hikarustore');
  const [currency, setCurrency] = React.useState(activeWorkspace?.currency || 'VND');
  const [description, setDescription] = React.useState(
    activeWorkspace?.description || 'Không gian bán hàng và phân phối merchandise chính hãng'
  );
  const [slogan, setSlogan] = React.useState(
    activeWorkspace?.slogan || 'Chuyên cung cấp merchandise & phụ kiện concert anime chính hãng'
  );

  // 2. Personal / Representative Profile & Contacts
  const [ownerName, setOwnerName] = React.useState(activeWorkspace?.owner_name || 'Nguyễn Văn Tuấn');
  const [phone, setPhone] = React.useState(activeWorkspace?.phone || '0988.776.655');
  const [email, setEmail] = React.useState(activeWorkspace?.email || 'contact@hikarustore.vn');
  const [address, setAddress] = React.useState(
    activeWorkspace?.address || 'Gian Hàng HikaruStore, Khu phức hợp Sự kiện, Q.1, TP. Hồ Chí Minh'
  );
  const [socialLink, setSocialLink] = React.useState(activeWorkspace?.social_link || 'https://zalo.me/0988776655');

  // 3. Bank & VietQR Payment Settings
  const [bankId, setBankId] = React.useState(
    normalizeVietQrBankId(activeBankConfig?.bankId || activeWorkspace?.bank_name)
  );
  const [accountNo, setAccountNo] = React.useState(
    activeBankConfig?.accountNo || activeWorkspace?.bank_account_no || '109876880260'
  );
  const [accountName, setAccountName] = React.useState(
    activeBankConfig?.accountName || activeWorkspace?.bank_account_name || 'NGUYEN BAO THUONG'
  );

  // 4. Thermal Printer & Invoicing Settings
  const [receiptPaperSize, setReceiptPaperSize] = React.useState<'58mm' | '80mm'>(
    activeWorkspace?.receipt_paper_size || '58mm'
  );
  const [receiptAutoPrint, setReceiptAutoPrint] = React.useState<boolean>(
    activeWorkspace?.receipt_auto_print || false
  );
  const [receiptFooterNote, setReceiptFooterNote] = React.useState<string>(
    activeWorkspace?.receipt_footer_note || 'Cảm ơn bạn đã ghé thăm HikaruStore! Quý khách vui lòng kiểm tra kỹ phụ kiện trước khi rời quầy.'
  );
  const [receiptShowQr, setReceiptShowQr] = React.useState<boolean>(
    activeWorkspace?.receipt_show_qr !== false
  );

  // 5. Keep Order / Preorder Policy Settings
  const [keepTimeoutMinutes, setKeepTimeoutMinutes] = React.useState<number>(
    activeWorkspace?.keep_timeout_minutes || 30
  );
  const [keepRequireProof, setKeepRequireProof] = React.useState<boolean>(
    activeWorkspace?.keep_require_proof !== false
  );
  const [keepPolicyNote, setKeepPolicyNote] = React.useState<string>(
    activeWorkspace?.keep_policy_note ||
      'Hàng keep cần được thanh toán chuyển khoản trước 100% để quầy đóng gói và giữ riêng cho bạn không lo hết hàng. Vui lòng quét mã VietQR và tải ảnh chụp biên lai/chuyển khoản bên dưới.'
  );

  // 6. POS UX Settings
  const [posBeepSound, setPosBeepSound] = React.useState<boolean>(
    activeWorkspace?.pos_beep_sound !== false
  );
  const [posDefaultPayment, setPosDefaultPayment] = React.useState<'cash' | 'qr_manual'>(
    activeWorkspace?.pos_default_payment || 'cash'
  );

  // Alerts & Messages
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [backupSuccess, setBackupSuccess] = React.useState(false);
  const [restoreMessage, setRestoreMessage] = React.useState<string | null>(null);
  const [cleanTestSuccess, setCleanTestSuccess] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync state if active workspace changes
  const [prevWorkspaceId, setPrevWorkspaceId] = React.useState(activeWorkspace?.id);
  if (activeWorkspace && activeWorkspace.id !== prevWorkspaceId) {
    setPrevWorkspaceId(activeWorkspace.id);
    setName(activeWorkspace.name || 'HikaruStore');
    setSlug(activeWorkspace.slug || 'hikarustore');
    setCurrency(activeWorkspace.currency || 'VND');
    setDescription(activeWorkspace.description || '');
    setSlogan(activeWorkspace.slogan || 'Chuyên cung cấp merchandise & phụ kiện concert anime chính hãng');
    setOwnerName(activeWorkspace.owner_name || 'Nguyễn Văn Tuấn');
    setPhone(activeWorkspace.phone || '0988.776.655');
    setEmail(activeWorkspace.email || 'contact@hikarustore.vn');
    setAddress(activeWorkspace.address || 'Gian Hàng HikaruStore, Khu phức hợp Sự kiện, Q.1, TP. Hồ Chí Minh');
    setSocialLink(activeWorkspace.social_link || 'https://zalo.me/0988776655');
    setBankId(normalizeVietQrBankId(activeWorkspace.bank_name || activeBankConfig.bankId));
    setAccountNo(activeWorkspace.bank_account_no || activeBankConfig.accountNo || '0988776655');
    setAccountName(activeWorkspace.bank_account_name || activeBankConfig.accountName || 'NGUYEN VAN TUAN');
    setReceiptPaperSize(activeWorkspace.receipt_paper_size || '58mm');
    setReceiptAutoPrint(activeWorkspace.receipt_auto_print || false);
    setReceiptFooterNote(
      activeWorkspace.receipt_footer_note ||
        'Cảm ơn bạn đã ghé thăm HikaruStore! Quý khách vui lòng kiểm tra kỹ phụ kiện trước khi rời quầy.'
    );
    setReceiptShowQr(activeWorkspace.receipt_show_qr !== false);
    setKeepTimeoutMinutes(activeWorkspace.keep_timeout_minutes || 30);
    setKeepRequireProof(activeWorkspace.keep_require_proof !== false);
    setKeepPolicyNote(
      activeWorkspace.keep_policy_note ||
        'Hàng keep cần được thanh toán chuyển khoản trước 100% để quầy đóng gói và giữ riêng cho bạn không lo hết hàng. Vui lòng quét mã VietQR và tải ảnh chụp biên lai/chuyển khoản bên dưới.'
    );
    setPosBeepSound(activeWorkspace.pos_beep_sound !== false);
    setPosDefaultPayment(activeWorkspace.pos_default_payment || 'cash');
  }

  const testOrdersCount = React.useMemo(() => {
    return orders.filter(isTestOrder).length;
  }, [orders]);

  function handleSaveAll(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!activeWorkspace) return;

    const cleanBankId = bankId.toUpperCase();
    const cleanAccountNo = accountNo.trim();
    const cleanAccountName = accountName.trim().toUpperCase();

    const updates: Partial<Workspace> = {
      name: name.trim() || 'HikaruStore',
      slug: slug.trim() || 'hikarustore',
      currency,
      description: description.trim(),
      slogan: slogan.trim(),
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      social_link: socialLink.trim(),
      bank_name: cleanBankId,
      bank_account_no: cleanAccountNo,
      bank_account_name: cleanAccountName,
      receipt_paper_size: receiptPaperSize,
      receipt_auto_print: receiptAutoPrint,
      receipt_footer_note: receiptFooterNote.trim(),
      receipt_show_qr: receiptShowQr,
      keep_timeout_minutes: Number(keepTimeoutMinutes) || 30,
      keep_require_proof: keepRequireProof,
      keep_policy_note: keepPolicyNote.trim(),
      pos_beep_sound: posBeepSound,
      pos_default_payment: posDefaultPayment,
    };

    updateWorkspaceProfile(updates);

    // Sync bank config to orders store (for POS & VietQR)
    setBankConfig({
      bankId: cleanBankId,
      accountNo: cleanAccountNo,
      accountName: cleanAccountName,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  }

  const handleExportBackup = () => {
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      appName: 'EventMate',
      workspace: activeWorkspace,
      workspaces,
      events: useDataStore.getState().events,
      booths: useDataStore.getState().booths,
      products: useDataStore.getState().products,
      variants: useDataStore.getState().variants,
      categories: useDataStore.getState().categories,
      allocations: useDataStore.getState().allocations,
      orders: useOrdersStore.getState().orders,
      preorders: usePreorderStore.getState().preorders,
      auditLogs: useAuditStore.getState().logs,
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HikaruStore_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (!data || data.appName !== 'EventMate') {
          alert('File sao lưu không hợp lệ hoặc không phải từ hệ thống EventMate.');
          return;
        }

        if (data.workspaces && Array.isArray(data.workspaces)) {
          setWorkspaces(data.workspaces);
        }
        if (data.workspace) {
          setActiveWorkspace(data.workspace);
        }
        if (data.events && Array.isArray(data.events)) {
          data.events.forEach((evt: EventItem) => useDataStore.getState().createEvent(evt));
        }

        setRestoreMessage(`Khôi phục thành công dữ liệu từ file sao lưu (${file.name})!`);
        setTimeout(() => setRestoreMessage(null), 4000);
      } catch {
        alert('Có lỗi xảy ra khi đọc file sao lưu JSON. Vui lòng kiểm tra định dạng file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearTestOrders = () => {
    if (testOrdersCount === 0) {
      alert('Hiện không có đơn thử nghiệm nào cần dọn dẹp.');
      return;
    }
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn dọn dẹp ${testOrdersCount} đơn thử nghiệm/sandbox? Thao tác này sẽ giải phóng tồn kho ảo và giữ sạch báo cáo doanh thu.`
    );
    if (!confirmDelete) return;

    clearTestOrders({
      actorName: user?.fullName || 'Quản trị viên',
      actorRole: user?.role || 'admin',
    });
    setCleanTestSuccess(`Đã dọn dẹp thành công ${testOrdersCount} đơn thử nghiệm khỏi hệ thống!`);
    setTimeout(() => setCleanTestSuccess(null), 4000);
  };

  const tabsConfig = [
    { id: 'store', label: 'Gian Hàng & Liên Hệ', icon: Building2 },
    { id: 'payment', label: 'Thanh Toán & VietQR', icon: QrCode },
    { id: 'receipt', label: 'Máy In & Hóa Đơn', icon: Printer },
    { id: 'keep', label: 'Quy Tắc Giữ Đồ', icon: Clock },
    { id: 'pos', label: 'Bán Hàng POS', icon: Sliders },
    { id: 'system', label: 'Dữ Liệu & Sao Lưu', icon: ShieldCheck },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5 pb-36 sm:pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-foreground">
              Cài Đặt Gian Hàng & Vận Hành
            </h1>
            <Badge variant="outline" className="text-[10px] sm:text-[11px] font-mono border-primary/30 text-primary">
              {activeWorkspace?.currency || 'VND'}
            </Badge>
            <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border text-muted">
              Theme: Tối mặc định
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted mt-0.5">
            Trung tâm cấu hình toàn diện: Tự động đồng bộ sang POS, Biên nhận in nhiệt và Gian hàng khách xem.
          </p>
        </div>

        {/* Quick link to Team / Account management */}
        <Link
          href="/dashboard/team"
          className="h-8.5 px-3 rounded-lg border border-border hover:border-primary text-xs font-semibold flex items-center justify-between sm:justify-start gap-1.5 transition-colors text-foreground shrink-0 bg-surface shadow-2xs w-full sm:w-auto"
          title="Quản lý tài khoản đăng nhập và phân quyền thu ngân"
        >
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-primary" />
            <span>Tài khoản &amp; Nhân sự</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted" />
        </Link>
      </div>

      {/* Auto-Sync Explanation Banner */}
      <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 bg-warning-bg dark:bg-success-bg/25 border border-primary/30 rounded-xl text-xs text-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-primary text-[11.5px] sm:text-xs">
            Đồng Bộ Tự Động Toàn Hệ Thống — Chỉnh 1 nơi, áp dụng toàn bộ:
          </p>
          <p className="text-muted leading-relaxed text-[10.5px] sm:text-[11px]">
            Mọi thông số (Hotline, Zalo, VietQR, khổ giấy in bill, quy định giữ đồ) sẽ ngay lập tức được cập nhật trên
            <strong> Gian hàng Khách</strong>, <strong>Màn hình POS Quầy</strong> và <strong>Biên lai in nhiệt</strong>.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-3 text-xs text-primary bg-success-bg border border-[#CEE6D7] rounded-xl shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
          <div>
            <p className="font-bold text-[11.5px] sm:text-xs">Đã lưu và đồng bộ toàn bộ cài đặt thành công!</p>
            <p className="text-[10.5px] sm:text-[11px] text-primary/90">
              Gian hàng khách xem, hóa đơn in nhiệt và quầy bán hàng POS đã nhận dữ liệu mới nhất.
            </p>
          </div>
        </div>
      )}

      {cleanTestSuccess && (
        <div className="flex items-center gap-2.5 p-3 text-xs text-primary bg-success-bg border border-[#CEE6D7] rounded-xl shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
          <p className="font-bold text-[11.5px] sm:text-xs">{cleanTestSuccess}</p>
        </div>
      )}

      {/* Tab Navigation Buttons - Mobile Horizontal Swipeable */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-border -mx-3 sm:mx-0 px-3 sm:px-0">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted hover:text-foreground hover:bg-surface border border-transparent'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.id === 'system' && testOrdersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* TAB 1: GIAN HÀNG & LIÊN HỆ */}
        {activeTab === 'store' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Store Profile Card */}
            <Card className="border-border bg-surface shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary" />
                  1. Thông Tin Nhận Diện Gian Hàng & Slogan
                </CardTitle>
                <CardDescription className="text-xs">
                  Tên cửa hàng, định danh đường dẫn, tiền tệ và slogan xuất hiện trên trang khách xem và đầu hóa đơn.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ws-name" required>
                      Tên Gian Hàng / Cửa Hàng
                    </Label>
                    <Input
                      id="ws-name"
                      required
                      placeholder="VD: HikaruStore"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <p className="text-[11px] text-muted">Tên xuất hiện trên tiêu đề web, bill in nhiệt và banner khách xem.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ws-slug">Định danh URL (Slug)</Label>
                    <Input
                      id="ws-slug"
                      className="font-mono text-xs"
                      placeholder="hikarustore"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                    <p className="text-[11px] text-muted">Đường dẫn trang gian hàng khách: /gian-hang/{slug || 'shop'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ws-slogan">Slogan / Thông Điệp Gian Hàng</Label>
                    <Input
                      id="ws-slogan"
                      placeholder="VD: Chuyên cung cấp merchandise & phụ kiện concert anime chính hãng"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                    />
                    <p className="text-[11px] text-muted">Hiển thị tại đầu trang gian hàng khách và chân hóa đơn.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ws-curr">{t('currency')}</Label>
                    <select
                      id="ws-curr"
                      className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="VND">VND (Việt Nam Đồng - ₫)</option>
                      <option value="USD">USD (US Dollar - $)</option>
                    </select>
                    <p className="text-[11px] text-muted">Tiền tệ niêm yết tại quầy và giỏ hàng.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ws-desc">Mô tả Giới thiệu ngắn về Gian hàng</Label>
                  <textarea
                    id="ws-desc"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="Giới thiệu về gian hàng, tour diễn và các sản phẩm độc quyền..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Representative & Contacts Card */}
            <Card className="border-border bg-surface shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  2. Thông Tin Chủ Quầy & Kênh Liên Hệ Khách Hàng
                </CardTitle>
                <CardDescription className="text-xs">
                  Kênh liên hệ để khách gọi chốt đơn, chat Zalo, đặt cọc giữ đồ và in trên chân biên nhận.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="owner-name" required className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted" />
                      <span>Họ và Tên Chủ quầy / Người đại diện</span>
                    </Label>
                    <Input
                      id="owner-name"
                      required
                      placeholder="VD: Nguyễn Văn Tuấn"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="owner-phone" required className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted" />
                      <span>Số Điện Thoại / Hotline Tư Vấn & Đặt Hàng</span>
                    </Label>
                    <Input
                      id="owner-phone"
                      required
                      placeholder="VD: 0988.776.655"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <p className="text-[11px] text-muted">Khách bấm vào nút Hotline ở gian hàng sẽ gọi thẳng tới số này.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="owner-social" className="flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-muted" />
                      <span>Link Chat Zalo / Fanpage Tư Vấn Nhanh</span>
                    </Label>
                    <Input
                      id="owner-social"
                      placeholder="https://zalo.me/0988776655"
                      value={socialLink}
                      onChange={(e) => setSocialLink(e.target.value)}
                    />
                    <p className="text-[11px] text-muted">Gắn vào nút &quot;Nhắn Zalo đặt hàng ngay&quot; ở gian hàng khách xem.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="owner-email" className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted" />
                      <span>Địa chỉ Email Hỗ trợ / Hợp tác</span>
                    </Label>
                    <Input
                      id="owner-email"
                      type="email"
                      placeholder="contact@hikarustore.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="owner-address" className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted" />
                    <span>Địa Chỉ Quầy Bán / Trụ Sở Gian Hàng</span>
                  </Label>
                  <Input
                    id="owner-address"
                    placeholder="VD: Gian Hàng HikaruStore, Khu phức hợp Sự kiện, Q.1, TP. Hồ Chí Minh"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <p className="text-[11px] text-muted">In trên chân hóa đơn bán hàng và thông tin liên hệ của trang web.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: THANH TOÁN & VIETQR */}
        {activeTab === 'payment' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="border-border bg-surface shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  Cấu Hình Tài Khoản Ngân Hàng & Mã VietQR Nhận Tiền
                </CardTitle>
                <CardDescription className="text-xs">
                  Mã VietQR động tự động điền số tiền và mã đơn trên máy POS, đồng thời hiển thị trong cổng đặt cọc giữ đồ online.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bank-select" required>
                      Ngân Hàng Thụ Hưởng
                    </Label>
                    <select
                      id="bank-select"
                      className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      value={bankId}
                      onChange={(e) => setBankId(e.target.value)}
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="acc-no" required>
                      Số Tài Khoản Nhận Tiền
                    </Label>
                    <Input
                      id="acc-no"
                      required
                      className="font-mono text-xs"
                      placeholder="VD: 0988776655"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="acc-name" required>
                      Tên Chủ Tài Khoản (Không Dấu)
                    </Label>
                    <Input
                      id="acc-name"
                      required
                      className="uppercase font-mono text-xs"
                      placeholder="VD: NGUYEN VAN TUAN"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                {/* Live VietQR Preview Box */}
                <div className="p-3.5 bg-background rounded-xl border border-border flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-28 h-28 bg-surface p-1 rounded-lg border border-border shrink-0 flex items-center justify-center">
                    {accountNo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://img.vietqr.io/image/${normalizeVietQrBankId(bankId)}-${accountNo}-compact2.png?amount=0&addInfo=HKTS-TEST&accountName=${encodeURIComponent(
                          accountName
                        )}`}
                        alt="VietQR Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="w-10 h-10 text-muted" />
                    )}
                  </div>
                  <div className="text-xs space-y-1 flex-1">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-primary" />
                      <span>Mã QR Xem Trước Thực Tế Của Gian Hàng</span>
                    </p>
                    <p className="text-[11px] text-muted">
                      Ngân hàng: <strong>{getBankDisplayName(bankId)}</strong> • Số TK:{' '}
                      <strong className="font-mono text-foreground">{accountNo || '(Chưa nhập)'}</strong>
                    </p>
                    <p className="text-[11px] text-muted">
                      Chủ TK: <strong className="uppercase">{accountName || '(Chưa nhập)'}</strong>
                    </p>
                    <p className="text-[10px] text-primary font-semibold mt-1">
                      ✓ Sẵn sàng quét nhận tiền qua tất cả ứng dụng ngân hàng và ví điện tử tại Việt Nam.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: MÁY IN & HÓA ĐƠN */}
        {activeTab === 'receipt' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="border-border bg-surface shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Printer className="w-4 h-4 text-primary" />
                  Cấu Hình Máy In Nhiệt &amp; Hóa Đơn Bán Hàng
                </CardTitle>
                <CardDescription className="text-xs">
                  Tùy chỉnh định dạng bill in nhiệt, khổ giấy in (58mm/80mm), tự động bật lệnh in và lời cảm ơn chân biên nhận.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Paper Size */}
                  <div className="space-y-1.5">
                    <Label htmlFor="paper-size">Khổ Giấy In Nhiệt ESC/POS</Label>
                    <select
                      id="paper-size"
                      className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      value={receiptPaperSize}
                      onChange={(e) => setReceiptPaperSize(e.target.value as '58mm' | '80mm')}
                    >
                      <option value="58mm">Khổ 58mm (Máy in mini cầm tay, Bluetooth PT-210/Goojprt/Xprinter)</option>
                      <option value="80mm">Khổ 80mm (Máy in hóa đơn để bàn quầy thu ngân lớn)</option>
                    </select>
                    <p className="text-[11px] text-muted">
                      Khổ 58mm rất phù hợp với quầy bán lưu động tại các fes, concert và sự kiện anime.
                    </p>
                  </div>

                  {/* Auto Print Toggle */}
                  <div className="space-y-1.5">
                    <Label htmlFor="auto-print">Tự Động In Bill Khi Hoàn Tất Đơn</Label>
                    <div className="flex items-center gap-3 h-9">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          id="auto-print"
                          checked={receiptAutoPrint}
                          onChange={(e) => setReceiptAutoPrint(e.target.checked)}
                          className="w-4 h-4 accent-primary rounded cursor-pointer"
                        />
                        <span>Mở hộp thoại in ngay khi bấm &quot;Hoàn tất thanh toán&quot;</span>
                      </label>
                    </div>
                    <p className="text-[11px] text-muted">
                      Giúp thu ngân thao tác nhanh hơn một bước mà không cần bấm thủ công nút &quot;In hóa đơn&quot;.
                    </p>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="space-y-1.5">
                  <Label htmlFor="footer-note">Lời Nhắn / Quy Định Ở Chân Hóa Đơn</Label>
                  <textarea
                    id="footer-note"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="VD: Cảm ơn bạn đã ghé thăm HikaruStore! Quý khách vui lòng kiểm tra kỹ phụ kiện trước khi rời quầy."
                    value={receiptFooterNote}
                    onChange={(e) => setReceiptFooterNote(e.target.value)}
                  />
                  <p className="text-[11px] text-muted">
                    In ở cuối mỗi biên nhận (lưu ý đổi trả, lời cảm ơn, mật khẩu Wi-Fi gian hàng...).
                  </p>
                </div>

                {/* Show QR on Receipt */}
                <div className="pt-2 border-t border-border">
                  <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={receiptShowQr}
                      onChange={(e) => setReceiptShowQr(e.target.checked)}
                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                    <span>In kèm mã QR tra cứu đơn hàng / Fanpage ở cuối hóa đơn</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: QUY TẮC GIỮ ĐỒ (KEEP ORDER) */}
        {activeTab === 'keep' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="border-border bg-surface shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Quy Định Giữ Đồ Cho Khách Xem &amp; Đặt Hàng Trước
                </CardTitle>
                <CardDescription className="text-xs">
                  Thiết lập thời gian đếm ngược giữ chỗ giỏ hàng, quy định chuyển khoản và yêu cầu ảnh biên lai khi khách giữ đồ.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Keep Timeout */}
                  <div className="space-y-1.5">
                    <Label htmlFor="keep-timeout">Thời Gian Giữ Chỗ Chờ Chuyển Khoản</Label>
                    <select
                      id="keep-timeout"
                      className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      value={keepTimeoutMinutes}
                      onChange={(e) => setKeepTimeoutMinutes(Number(e.target.value))}
                    >
                      <option value={15}>15 phút (Giữ nhanh giờ cao điểm)</option>
                      <option value={30}>30 phút (Tiêu chuẩn khuyên dùng)</option>
                      <option value={60}>60 phút (1 tiếng)</option>
                      <option value={120}>120 phút (2 tiếng)</option>
                      <option value={1440}>Trong ngày diễn ra sự kiện (24 tiếng)</option>
                    </select>
                    <p className="text-[11px] text-muted">
                      Hết thời gian đếm ngược này nếu khách không xác nhận chuyển khoản, món đồ sẽ tự động nhả về kho.
                    </p>
                  </div>

                  {/* Require Proof Image */}
                  <div className="space-y-1.5">
                    <Label htmlFor="require-proof">Yêu Cầu Tải Lên Ảnh Biên Lai Chuyển Khoản</Label>
                    <div className="flex items-center gap-3 h-9">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          id="require-proof"
                          checked={keepRequireProof}
                          onChange={(e) => setKeepRequireProof(e.target.checked)}
                          className="w-4 h-4 accent-primary rounded cursor-pointer"
                        />
                        <span>Bắt buộc khách tải ảnh chụp màn hình chuyển khoản</span>
                      </label>
                    </div>
                    <p className="text-[11px] text-muted">
                      Giúp thu ngân quầy đối soát nhanh chóng qua số điện thoại và hình ảnh đã tải lên.
                    </p>
                  </div>
                </div>

                {/* Policy text */}
                <div className="space-y-1.5">
                  <Label htmlFor="keep-policy">Quy Định &amp; Hướng Dẫn Hiển Thị Trong Popup Giữ Đồ</Label>
                  <textarea
                    id="keep-policy"
                    rows={3}
                    className="w-full rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="Nhập nội dung quy định giữ đồ..."
                    value={keepPolicyNote}
                    onChange={(e) => setKeepPolicyNote(e.target.value)}
                  />
                  <p className="text-[11px] text-muted">
                    Đoạn văn bản giải thích quy trình giữ đồ và nhận hàng trực tiếp tại quầy sự kiện.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 5: TRẢI NGHIỆM BÁN HÀNG POS */}
        {activeTab === 'pos' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Card className="border-border bg-surface shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  Cấu Hình Màn Hình Bán Hàng Tại Quầy (POS)
                </CardTitle>
                <CardDescription className="text-xs">
                  Cài đặt âm thanh phản hồi khi quét barcode, phương thức thanh toán ưu tiên và giao diện bán hàng nhanh.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Beep Sound */}
                  <div className="space-y-1.5 p-3 rounded-xl border border-border bg-background">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pos-sound" className="flex items-center gap-2 font-bold cursor-pointer">
                        {posBeepSound ? (
                          <Volume2 className="w-4 h-4 text-primary" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-muted" />
                        )}
                        <span>Âm Thanh Phản Hồi Khi Quét Barcode</span>
                      </Label>
                      <input
                        type="checkbox"
                        id="pos-sound"
                        checked={posBeepSound}
                        onChange={(e) => setPosBeepSound(e.target.checked)}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-muted mt-1">
                      Phát tiếng &quot;bíp&quot; vui tai khi nhận diện mã vạch hoặc bấm thêm món vào giỏ hàng giữa tiếng ồn hội chợ.
                    </p>
                  </div>

                  {/* Default Payment Method */}
                  <div className="space-y-1.5 p-3 rounded-xl border border-border bg-background">
                    <Label htmlFor="default-pay" className="font-bold">
                      Phương Thức Thanh Toán Mặc Định Khi Mở Popup
                    </Label>
                    <select
                      id="default-pay"
                      className="mt-1 flex h-8 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      value={posDefaultPayment}
                      onChange={(e) => setPosDefaultPayment(e.target.value as 'cash' | 'qr_manual')}
                    >
                      <option value="cash">Tiền mặt (Mặc định phổ biến tại quầy)</option>
                      <option value="qr_manual">Chuyển khoản VietQR</option>
                    </select>
                    <p className="text-[11px] text-muted mt-1">
                      Tab thanh toán được tự động chọn trước khi thu ngân bấm nút &quot;Thanh toán&quot;.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 6: DỮ LIỆU & HỆ THỐNG */}
        {activeTab === 'system' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Clean Test / Sandbox Orders Card */}
            <Card className="border-border bg-surface shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-warning" />
                  Dọn Dẹp Dữ Liệu Đơn Thử Nghiệm (Test Sandbox Orders)
                </CardTitle>
                <CardDescription className="text-xs">
                  Xóa bỏ các đơn hàng dùng thử và hoàn trả lại số lượng tồn kho ảo trước khi chính thức mở quầy đón khách fes.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-background border border-border rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>Trạng thái đơn thử nghiệm:</span>
                      <Badge variant="outline" className={testOrdersCount > 0 ? 'text-warning border-warning/40' : 'text-primary'}>
                        {testOrdersCount} đơn test trong hệ thống
                      </Badge>
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Bấm dọn dẹp sẽ xóa các đơn tạo trong sự kiện thử nghiệm hoặc có gắn cờ &quot;Đơn test&quot;, giữ sổ sách kế toán chuẩn xác.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearTestOrders}
                    disabled={testOrdersCount === 0}
                    className="gap-1.5 border-warning/40 text-warning hover:bg-warning-bg font-semibold h-9 w-full sm:w-auto shrink-0 justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-warning" />
                    <span>Dọn Dẹp {testOrdersCount} Đơn Test</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Backup & Restore Card */}
            <Card className="border-border bg-surface shadow-xs">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Sao Lưu &amp; Khôi Phục Dữ Liệu Ngoại Tuyến (Backup / Restore)
                </CardTitle>
                <CardDescription className="text-xs">
                  Xuất file sao lưu toàn bộ kho hàng, sự kiện, đơn hàng và nhật ký ra file JSON để lưu trữ hoặc chuyển sang máy khác.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                {backupSuccess && (
                  <div className="flex items-center gap-2 p-3 text-xs text-primary bg-success-bg border border-[#CEE6D7] rounded-lg">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Đã xuất thành công file sao lưu hệ thống toàn vẹn (.json)!</span>
                  </div>
                )}

                {restoreMessage && (
                  <div className="flex items-center gap-2 p-3 text-xs text-primary bg-success-bg border border-[#CEE6D7] rounded-lg">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{restoreMessage}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportBackup}
                    className="gap-1.5 border-primary/40 text-primary hover:bg-success-bg font-semibold h-9 w-full sm:w-auto justify-center"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Tải File Sao Lưu (.json)</span>
                  </Button>

                  <div className="w-full sm:w-auto">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                      id="restore-file-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5 border-muted/40 text-foreground hover:bg-surface font-semibold h-9 w-full sm:w-auto justify-center"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Khôi Phục từ File Backup</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sticky Bottom Save Bar - Positioned above Mobile Bottom Nav on small screens */}
        <div className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 md:left-64 bg-surface/95 backdrop-blur-md p-2.5 sm:p-4 border-t border-border shadow-lg flex items-center justify-between gap-3 z-30">
          <p className="text-xs text-muted truncate hidden sm:block">
            Nhấn lưu để áp dụng ngay sang POS, VietQR, Hóa đơn in nhiệt và Gian hàng khách xem.
          </p>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="gap-2 bg-primary hover:bg-gold-text text-primary-foreground w-full sm:w-auto h-10 sm:h-9 shrink-0 shadow-sm font-bold justify-center"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Toàn Bộ Cài Đặt</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
