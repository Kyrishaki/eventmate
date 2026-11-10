'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { useOrdersStore } from '@/stores/orders-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Database, Save, Sparkles, Building2, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { activeWorkspace, setActiveWorkspace, workspaces, setWorkspaces, resetWorkspaces } = useWorkspaceStore();
  const { seedDemoTourData, clearAllData } = useDataStore();
  const { clearOrders } = useOrdersStore();

  const [name, setName] = React.useState(activeWorkspace?.name || '');
  const [slug, setSlug] = React.useState(activeWorkspace?.slug || '');
  const [currency, setCurrency] = React.useState(activeWorkspace?.currency || 'VND');
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [seedSuccess, setSeedSuccess] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState(false);

  React.useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
      setSlug(activeWorkspace.slug);
      setCurrency(activeWorkspace.currency);
    }
  }, [activeWorkspace]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;

    const updated = {
      ...activeWorkspace,
      name,
      slug,
      currency,
      updated_at: new Date().toISOString(),
    };

    setActiveWorkspace(updated);
    setWorkspaces(workspaces.map((w) => (w.id === updated.id ? updated : w)));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  function handleSeedDemo() {
    if (!activeWorkspace) return;
    seedDemoTourData(activeWorkspace.id);
    setSeedSuccess(true);
    setTimeout(() => setSeedSuccess(false), 3000);
  }

  function handleResetAll() {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu (sự kiện, gian hàng, sản phẩm, đơn hàng) để hệ thống hoàn toàn trắng không?')) return;
    clearAllData();
    clearOrders();
    resetWorkspaces();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">{t('title')}</h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {activeWorkspace?.currency || 'VND'}
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">{t('description')}</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 text-xs text-[#2F7D55] bg-[#EAF4EE] border border-[#CEE6D7] rounded-[6px]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Đã lưu thành công các thay đổi của Không gian làm việc.</span>
        </div>
      )}

      {/* Workspace Profile Form */}
      <Card className="border-[#E8E8E5] bg-white shadow-xs">
        <CardHeader className="border-b border-[#F0F0ED] pb-4">
          <CardTitle className="text-sm font-semibold text-[#202124] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#315C4C]" />
            {t('workspaceInfo')}
          </CardTitle>
          <CardDescription className="text-xs">{t('description')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name" required>
                {t('name')}
              </Label>
              <Input
                id="ws-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ws-slug">{t('slug')}</Label>
                <Input
                  id="ws-slug"
                  className="font-mono text-xs"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ws-curr">{t('currency')}</Label>
                <select
                  id="ws-curr"
                  className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-sm text-[#202124] focus:outline-none focus:border-[#315C4C]"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="VND">VND (Việt Nam Đồng - ₫)</option>
                  <option value="USD">USD (US Dollar - $)</option>
                </select>
                <p className="text-[11px] text-[#737373]">{t('currencyHelp')}</p>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                <Save className="w-3.5 h-3.5" />
                <span>{t('saveChanges')}</span>
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Demo Tour Data Seeder */}
      <Card className="border-[#E8E8E5] bg-white shadow-xs">
        <CardHeader className="border-b border-[#F0F0ED] pb-4">
          <CardTitle className="text-sm font-semibold text-[#202124] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B7791F]" />
            {t('demoSection')}
          </CardTitle>
          <CardDescription className="text-xs">{t('demoHelp')}</CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          <p className="text-xs text-[#737373] leading-relaxed">
            Dữ liệu bao gồm: 2 Sự kiện diễn tại Hà Nội & TP.HCM, 2 Gian hàng quầy vé, 4 Sản phẩm merchandise (Áo thun, nón, lightstick, đĩa vinyl) và bảng phân bổ tồn kho hoàn chỉnh đúng theo mô hình kinh doanh.
          </p>

          {seedSuccess && (
            <div className="flex items-center gap-2 p-3 text-xs text-[#2F7D55] bg-[#EAF4EE] border border-[#CEE6D7] rounded-[6px]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t('demoLoaded')}</span>
            </div>
          )}

          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSeedDemo}
              className="gap-1.5 border-[#315C4C] text-[#315C4C] hover:bg-[#EBF1EE]"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{t('loadDemoData')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset to Clean Data */}
      <Card className="border-[#E8E8E5] bg-white shadow-xs">
        <CardHeader className="border-b border-[#F0F0ED] pb-4">
          <CardTitle className="text-sm font-semibold text-[#202124] flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#C44536]" />
            Khởi tạo Hệ thống Trắng (Xóa sạch dữ liệu mẫu)
          </CardTitle>
          <CardDescription className="text-xs">
            Xóa toàn bộ các dữ liệu mẫu (sự kiện, gian hàng, đơn hàng, sản phẩm) để bắt đầu nhập dữ liệu kinh doanh thực tế của bạn.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          {resetSuccess && (
            <div className="flex items-center gap-2 p-3 text-xs text-[#2F7D55] bg-[#EAF4EE] border border-[#CEE6D7] rounded-[6px]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đã xóa toàn bộ dữ liệu mẫu thành công. Hệ thống đang ở trạng thái trắng hoàn toàn.</span>
            </div>
          )}

          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              className="gap-1.5 border-[#C44536] text-[#C44536] hover:bg-[#FDF1F0]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa sạch dữ liệu mẫu & Đặt lại về trắng</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
