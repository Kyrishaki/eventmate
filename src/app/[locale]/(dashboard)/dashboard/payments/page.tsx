'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useOrdersStore } from '@/stores/orders-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import {
  CreditCard,
  QrCode,
  Banknote,
  Building,
  CheckCircle2,
  Save,
  ShieldCheck,
  Smartphone,
  FlaskConical,
} from 'lucide-react';
import { filterRealOrders, isTestOrder } from '@/lib/test-data-filter';

export default function PaymentsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { activeBankConfig, setBankConfig, orders } = useOrdersStore();

  const [bankId, setBankId] = React.useState(activeBankConfig.bankId);
  const [accountNo, setAccountNo] = React.useState(activeBankConfig.accountNo);
  const [accountName, setAccountName] = React.useState(activeBankConfig.accountName);
  const [isSaved, setIsSaved] = React.useState(false);

  // Revenue breakdown by method (REAL PRODUCTION ONLY - test transactions quarantined)
  const realOrders = filterRealOrders(orders);
  const testOrders = orders.filter((o) => isTestOrder(o));
  const testCashAmount = testOrders
    .filter((o) => o.payment_method === 'cash')
    .reduce((sum, o) => sum + o.final_amount, 0);

  const cashRevenue = realOrders
    .filter((o) => o.payment_method === 'cash')
    .reduce((sum, o) => sum + o.final_amount, 0);

  const qrRevenue = realOrders
    .filter((o) => o.payment_method === 'qr_manual')
    .reduce((sum, o) => sum + o.final_amount, 0);

  const gatewayRevenue = realOrders
    .filter((o) => o.payment_method === 'gateway')
    .reduce((sum, o) => sum + o.final_amount, 0);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBankConfig({
      bankId: bankId.toUpperCase(),
      accountNo: accountNo.trim(),
      accountName: accountName.trim().toUpperCase(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">
              Phương thức & Cấu hình Thanh toán
            </h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              VietQR / Tiền mặt
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Cấu hình thông tin ngân hàng thụ hưởng để sinh mã VietQR tự động trên toàn bộ máy POS.
          </p>
        </div>
      </div>

      {/* Revenue by Method KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <div className="flex items-center justify-between text-[#737373] mb-1">
            <span className="text-xs font-medium">Chuyển khoản VietQR</span>
            <QrCode className="w-4 h-4 text-[#315C4C]" />
          </div>
          <div className="text-xl font-bold text-[#315C4C]">
            {formatCurrency(qrRevenue, activeWorkspace?.currency || 'VND')}
          </div>
          <p className="text-[10px] text-[#737373] mt-0.5">Doanh thu thực tế vào tài khoản</p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <div className="flex items-center justify-between text-[#737373] mb-1">
            <span className="text-xs font-medium">Tiền mặt tại két (Cash)</span>
            <Banknote className="w-4 h-4 text-[#B7791F]" />
          </div>
          <div className="text-xl font-bold text-[#B7791F]">
            {formatCurrency(cashRevenue, activeWorkspace?.currency || 'VND')}
          </div>
          <p className="text-[10px] text-[#737373] mt-0.5">Thu ngân giữ tại quầy thực tế</p>
        </Card>

        <Card className="p-4 bg-white border-[#E8E8E5] shadow-2xs">
          <div className="flex items-center justify-between text-[#737373] mb-1">
            <span className="text-xs font-medium">Cổng / Thẻ POS</span>
            <CreditCard className="w-4 h-4 text-[#737373]" />
          </div>
          <div className="text-xl font-bold text-[#202124]">
            {formatCurrency(gatewayRevenue, activeWorkspace?.currency || 'VND')}
          </div>
          <p className="text-[10px] text-[#737373] mt-0.5">Qua thiết bị thanh toán ngoài</p>
        </Card>
      </div>

      {/* Sandbox Isolation Notice */}
      {testOrders.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-[6px] bg-[#FEF7EC] border border-[#B7791F]/30 text-xs text-[#B7791F] shadow-xs">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 shrink-0 text-[#B7791F]" />
            <span>
              Hệ thống đã tự động cách ly <strong>{testOrders.length} đơn hàng thử nghiệm ({formatCurrency(testCashAmount, 'VND')})</strong> khỏi dòng tiền thực tế tại quầy để đảm bảo số liệu kế toán chính xác.
            </span>
          </div>
        </div>
      )}

      {isSaved && (
        <div className="flex items-center gap-2 p-3 text-xs text-[#2F7D55] bg-[#EAF4EE] border border-[#CEE6D7] rounded-[6px]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Đã lưu thành công cấu hình ngân hàng VietQR! Các máy POS sẽ áp dụng tức thì.</span>
        </div>
      )}

      {/* VietQR Bank Settings Form */}
      <Card className="border-[#E8E8E5] bg-white shadow-xs">
        <CardHeader className="border-b border-[#F0F0ED] pb-4">
          <CardTitle className="text-sm font-semibold text-[#202124] flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#315C4C]" />
            Cấu hình Mã VietQR Nhận tiền tại quầy
          </CardTitle>
          <CardDescription className="text-xs">
            Hệ thống tự động nhúng số tiền và mã hóa đơn vào mã QR, khách hàng quét là hiện đúng số tiền và thông tin tour.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bank-id" required>
                  Mã Ngân hàng (BIN / Code)
                </Label>
                <select
                  id="bank-id"
                  className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-sm text-[#202124] focus:outline-none focus:border-[#315C4C]"
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                >
                  <option value="MB">MB Bank (Quân Đội)</option>
                  <option value="VCB">Vietcombank</option>
                  <option value="TCB">Techcombank</option>
                  <option value="ACB">ACB</option>
                  <option value="VPB">VPBank</option>
                  <option value="TPB">TPBank</option>
                  <option value="BIDV">BIDV</option>
                  <option value="CTG">VietinBank</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-no" required>
                  Số tài khoản nhận tiền
                </Label>
                <Input
                  id="acc-no"
                  required
                  placeholder="VD: 0987654321"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-name" required>
                  Tên Chủ tài khoản (Không dấu)
                </Label>
                <Input
                  id="acc-name"
                  required
                  placeholder="VD: NGUYEN VAN A"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  className="text-sm uppercase"
                />
              </div>
            </div>

            {/* Live QR Preview */}
            <div className="p-4 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[6px] flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 bg-white p-1 rounded border border-[#E8E8E5] shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=50000&addInfo=DEMO&accountName=${encodeURIComponent(
                    accountName
                  )}`}
                  alt="VietQR Demo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-xs text-[#737373] space-y-1">
                <p className="font-semibold text-[#202124]">Xem trước mã VietQR tại quầy</p>
                <p>
                  Khi thu ngân bấm thanh toán trên POS, mã QR này sẽ hiển thị kèm chính xác số tiền của giỏ hàng và mã đơn để khách chỉ cần quét và xác nhận chuyển khoản.
                </p>
                <div className="flex items-center gap-1.5 text-[#2F7D55] text-[11px] pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Chuẩn VietQR liên ngân hàng Napas247</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thông tin ngân hàng</span>
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
