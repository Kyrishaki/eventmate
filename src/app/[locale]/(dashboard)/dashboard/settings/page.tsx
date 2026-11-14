'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { useOrdersStore, normalizeVietQrBankId, getBankDisplayName } from '@/stores/orders-store';
import { usePreorderStore } from '@/stores/preorder-store';
import { useAuditStore } from '@/stores/audit-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  Save,
  Sparkles,
  Building2,
  Download,
  Upload,
  ShieldCheck,
  Palette,
  User,
  Phone,
  Mail,
  MapPin,
  Share2,
  QrCode,
  CreditCard,
  Info,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { EventItem, Workspace } from '@/types/database';
import TeamManagement from '@/components/dashboard/team-management';
import { ThemeSelector } from '@/components/ui/theme-toggle';

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

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { activeWorkspace, setActiveWorkspace, workspaces, setWorkspaces } = useWorkspaceStore();
  const { activeBankConfig, setBankConfig } = useOrdersStore();

  // Store & Brand Identity
  const [name, setName] = React.useState(activeWorkspace?.name || 'HikaruStore');
  const [slug, setSlug] = React.useState(activeWorkspace?.slug || 'hikarustore');
  const [currency, setCurrency] = React.useState(activeWorkspace?.currency || 'VND');
  const [description, setDescription] = React.useState(activeWorkspace?.description || 'Không gian bán hàng và phân phối merchandise chính hãng');
  const [slogan, setSlogan] = React.useState(
    activeWorkspace?.slogan || 'Chuyên cung cấp merchandise & phụ kiện concert anime chính hãng'
  );

  // Personal / Representative Profile & Contacts
  const [ownerName, setOwnerName] = React.useState(activeWorkspace?.owner_name || 'Nguyễn Văn Tuấn');
  const [phone, setPhone] = React.useState(activeWorkspace?.phone || '0988.776.655');
  const [email, setEmail] = React.useState(activeWorkspace?.email || 'contact@hikarustore.vn');
  const [address, setAddress] = React.useState(
    activeWorkspace?.address || 'Gian Hàng HikaruStore, Khu phức hợp Sự kiện, Q.1, TP. Hồ Chí Minh'
  );
  const [socialLink, setSocialLink] = React.useState(activeWorkspace?.social_link || 'https://zalo.me/0988776655');

  // Bank & VietQR Payment Settings
  const [bankId, setBankId] = React.useState(
    normalizeVietQrBankId(activeBankConfig?.bankId || activeWorkspace?.bank_name)
  );
  const [accountNo, setAccountNo] = React.useState(
    activeBankConfig?.accountNo || activeWorkspace?.bank_account_no || '109876880260'
  );
  const [accountName, setAccountName] = React.useState(
    activeBankConfig?.accountName || activeWorkspace?.bank_account_name || 'NGUYEN BAO THUONG'
  );

  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [backupSuccess, setBackupSuccess] = React.useState(false);
  const [restoreMessage, setRestoreMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Google Gemini AI Connection test state
  const [aiStatus, setAiStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [aiMessage, setAiMessage] = React.useState<string | null>(null);

  const handleTestAiConnection = async () => {
    setAiStatus('testing');
    setAiMessage(null);
    try {
      const res = await fetch('/api/ai/test');
      const json = await res.json();
      if (res.ok && json.success) {
        setAiStatus('success');
        setAiMessage(json.message || 'Kết nối Google Gemini AI thành công!');
      } else {
        setAiStatus('error');
        setAiMessage(json.error || 'Không thể kết nối tới Google Gemini API.');
      }
    } catch (err: unknown) {
      setAiStatus('error');
      setAiMessage(err instanceof Error ? err.message : 'Lỗi kết nối kiểm tra AI.');
    }
  };

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
  }

  function handleSaveAll(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;

    const cleanBankId = bankId.toUpperCase();
    const cleanAccountNo = accountNo.trim();
    const cleanAccountName = accountName.trim().toUpperCase();

    const updated: Workspace = {
      ...activeWorkspace,
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
      updated_at: new Date().toISOString(),
    };

    setActiveWorkspace(updated);
    setWorkspaces(workspaces.map((w) => (w.id === updated.id ? updated : w)));

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
      } catch (err) {
        alert('Có lỗi xảy ra khi đọc file sao lưu JSON. Vui lòng kiểm tra định dạng file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Cài Đặt Hệ Thống & Thông Tin Gian Hàng</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {activeWorkspace?.currency || 'VND'}
            </Badge>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Cấu hình đồng bộ thông tin cá nhân, gian hàng, hotline, địa chỉ và mã VietQR cho toàn bộ hệ thống.
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => document.getElementById('team-management')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      >
        Đội ngũ &amp; tài khoản
      </Button>

      {/* Auto-Sync Explanation Banner */}
      <div className="flex items-start gap-3 p-3.5 bg-warning-bg dark:bg-success-bg/30 border border-primary/30 rounded-lg text-xs text-foreground dark:text-foreground">
        <Info className="w-5 h-5 text-primary dark:text-success shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-primary dark:text-success">
            Trung tâm Đồng bộ Tự động — Điền 1 lần, hiển thị toàn diện:
          </p>
          <p className="text-[#404040] dark:text-muted leading-relaxed text-[11px]">
            Mọi thông tin cá nhân và tài khoản bạn chỉnh sửa bên dưới sẽ được tự động đồng bộ ngay lập tức sang:
            <strong> (1) Gian hàng cho Khách xem</strong> (Hotline, Zalo, địa chỉ, số tài khoản thanh toán online),
            <strong> (2) Màn hình Bán hàng & Mã VietQR</strong>, và
            <strong> (3) Hóa đơn in nhiệt / Phiếu xuất hàng</strong>. Bạn không cần phải chỉnh thủ công ở bất kỳ chỗ nào khác!
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-3.5 text-xs text-primary bg-success-bg border border-[#CEE6D7] rounded-lg shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" />
          <div>
            <p className="font-bold">Đã lưu và đồng bộ toàn bộ thông tin thành công!</p>
            <p className="text-[11px] text-primary/90">
              Gian hàng khách xem, hóa đơn in nhiệt và mã VietQR tại quầy POS đã nhận dữ liệu mới nhất.
            </p>
          </div>
        </div>
      )}

      {/* Main Consolidated Profile Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: Store & Brand Profile */}
        <Card className="border-border bg-surface shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              1. Thông Tin Gian Hàng & Thương Hiệu
            </CardTitle>
            <CardDescription className="text-xs">
              Tên cửa hàng, định danh đường dẫn, tiền tệ và slogan hiển thị trên tiêu đề và hóa đơn.
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

        {/* Section 2: Owner & Public Contact Info */}
        <Card className="border-border bg-surface shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              2. Thông Tin Chủ Quầy & Kênh Liên Hệ Khách Hàng
            </CardTitle>
            <CardDescription className="text-xs">
              Thông tin liên hệ của bạn để khách gọi chốt đơn, chat Zalo, đặt cọc giữ đồ và hiển thị trên biên nhận.
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

              <div className="space-y-1.5">
                <Label htmlFor="owner-social" className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-muted" />
                  <span>Link Chat Zalo / Facebook Tư Vấn Nhanh</span>
                </Label>
                <Input
                  id="owner-social"
                  placeholder="https://zalo.me/0988776655"
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                />
                <p className="text-[11px] text-muted">Gắn vào nút &quot;Nhắn Zalo đặt hàng ngay&quot; ở gian hàng khách xem.</p>
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

        {/* Section 3: Bank & VietQR Payment Configuration */}
        <Card className="border-border bg-surface shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              3. Cấu Hình Tài Khoản Ngân Hàng & Mã VietQR Nhận Tiền
            </CardTitle>
            <CardDescription className="text-xs">
              Mã VietQR động tự chèn số tiền và mã đơn trên máy POS và hỗ trợ khách chuyển khoản đặt cọc online.
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
            <div className="p-3 bg-background dark:bg-surface-hover rounded-lg border border-border dark:border-border flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 bg-surface p-1 rounded border border-border shrink-0 flex items-center justify-center">
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
                <p className="font-bold text-foreground dark:text-foreground flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  <span>Mã QR Xem Trước Của Bạn</span>
                </p>
                <p className="text-[11px] text-muted dark:text-muted">
                  Ngân hàng: <strong>{getBankDisplayName(bankId)}</strong> • Số TK:{' '}
                  <strong className="font-mono text-foreground dark:text-foreground">{accountNo || '(Chưa nhập)'}</strong>
                </p>
                <p className="text-[11px] text-muted dark:text-muted">
                  Chủ TK: <strong className="uppercase">{accountName || '(Chưa nhập)'}</strong>
                </p>
                <p className="text-[10px] text-primary font-semibold mt-1">
                  ✓ Sẵn sàng quét nhận tiền qua tất cả ứng dụng ngân hàng và ví điện tử tại Việt Nam.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button Bar */}
        <div className="sticky bottom-2 sm:bottom-4 bg-surface/95 dark:bg-surface/95 backdrop-blur p-3.5 sm:p-4 rounded-lg border border-border dark:border-border shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 z-20">
          <p className="text-xs text-muted dark:text-muted">
            Lưu một lần — Tự động áp dụng cho Gian hàng khách xem, Hóa đơn và Màn hình POS.
          </p>
          <Button type="submit" variant="primary" size="md" className="gap-2 bg-primary hover:bg-gold-text text-primary-foreground w-full sm:w-auto shrink-0 shadow-sm">
            <Save className="w-4 h-4" />
            <span className="font-bold">Lưu Toàn Bộ Cài Đặt</span>
          </Button>
        </div>
      </form>

      {/* Theme & Appearance Settings */}
      <Card className="border-border bg-surface shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            Chế độ Giao diện (Sáng / Tối)
          </CardTitle>
          <CardDescription className="text-xs">
            Tùy chỉnh giao diện hiển thị cho toàn bộ hệ thống quản trị và màn hình bán hàng POS.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-background border border-border rounded-lg">
            <div>
              <p className="text-xs font-semibold text-foreground">Lựa chọn chủ đề:</p>
              <p className="text-[11px] text-muted mt-0.5">
                Chế độ Tối (Dark mode) giúp bảo vệ mắt khi bán hàng ban đêm tại các sự kiện hoặc sân khấu âm nhạc.
              </p>
            </div>
            <ThemeSelector />
          </div>
        </CardContent>
      </Card>

      {/* Google Gemini AI Configuration */}
      <Card className="border-border dark:border-border bg-surface dark:bg-surface shadow-xs">
        <CardHeader className="border-b border-border dark:border-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground dark:text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary dark:text-success" />
              Trí Tuệ Nhân Tạo (Google Gemini AI)
            </CardTitle>
            <Badge variant="success" className="text-[10px] font-mono">
              gemini-2.5-flash
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted dark:text-muted">
            Hệ thống AI thông minh hỗ trợ trích xuất tự động thông tin sự kiện từ ảnh poster, đọc dữ liệu và tối ưu hóa quản trị.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3.5">
          <div className="p-3.5 bg-background dark:bg-surface-hover/60 rounded-lg border border-border dark:border-border/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground dark:text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Trạng thái: <strong>Đã tự động cấu hình & Sẵn sàng hoạt động</strong></span>
                </p>
                <p className="text-[11px] text-muted dark:text-muted mt-0.5">
                  Khóa API: <code className="font-mono bg-surface dark:bg-surface px-1.5 py-0.5 rounded border border-border dark:border-border text-xs">AQ.Ab8RN6••••••••5w9Q</code> (Đã kích hoạt trong .env.local)
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestAiConnection}
                disabled={aiStatus === 'testing'}
                className="gap-1.5 text-xs text-primary dark:text-success border-primary/40 dark:border-emerald-600/40 hover:bg-warning-bg dark:hover:bg-success-bg/40 shrink-0"
              >
                {aiStatus === 'testing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{aiStatus === 'testing' ? 'Đang kiểm tra...' : 'Kiểm tra kết nối AI'}</span>
              </Button>
            </div>

            {aiStatus === 'success' && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-emerald-50 dark:bg-success-bg/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-success dark:text-success" />
                <span>{aiMessage || 'Kết nối máy chủ Google Gemini API thành công 100%!'}</span>
              </div>
            )}

            {aiStatus === 'error' && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs">
                <Info className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{aiMessage || 'Lỗi kết nối tới Google Gemini API.'}</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-muted dark:text-muted space-y-1">
            <p className="font-semibold text-foreground dark:text-muted">
              💡 Hướng dẫn nếu bạn muốn tạo và lấy khóa API riêng từ tài khoản Google cá nhân:
            </p>
            <ol className="list-decimal list-inside pl-1 space-y-0.5">
              <li>Truy cập <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-primary dark:text-success underline font-semibold inline-flex items-center gap-0.5">Google AI Studio (aistudio.google.com/apikey) <ExternalLink className="w-2.5 h-2.5" /></a> và đăng nhập bằng tài khoản Google của bạn.</li>
              <li>Bấm nút <strong>&ldquo;Create API key&rdquo;</strong> để tạo khóa mới hoàn toàn miễn phí.</li>
              <li>Sao chép mã khóa và cập nhật vào biến <code className="font-mono text-[10.5px] bg-surface-hover dark:bg-surface-hover px-1 rounded">GEMINI_API_KEY</code> trong tệp <code className="font-mono text-[10.5px]">.env.local</code>.</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Full System Backup & Restore Section */}
      <Card className="border-border bg-surface shadow-xs">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Sao Lưu & Khôi Phục Dữ Liệu Ngoại Tuyến (Backup / Restore)
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

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportBackup}
              className="gap-1.5 border-primary/40 text-primary hover:bg-success-bg font-semibold h-8.5"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Tải File Sao Lưu (.json)</span>
            </Button>

            <div>
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
                className="gap-1.5 border-muted/40 text-foreground hover:bg-surface-hover font-semibold h-8.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Khôi Phục từ File Backup</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <section id="team-management" aria-label="Đội ngũ và tài khoản" className="scroll-mt-20">
        <TeamManagement />
      </section>
    </div>
  );
}
