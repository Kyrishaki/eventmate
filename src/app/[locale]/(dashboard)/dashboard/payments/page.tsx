'use client';

import * as React from 'react';
import { useOrdersStore, normalizeVietQrBankId } from '@/stores/orders-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDataStore } from '@/stores/data-store';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { playSuccessChime, speakPaymentReceived } from '@/lib/sound';
import {
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Save,
  ShieldCheck,
  FlaskConical,
  Radio,
  Volume2,
  Copy,
  RefreshCw,
  Zap,
  AlertCircle,
  Camera,
  Eye,
  Store,
  Calendar,
} from 'lucide-react';
import { filterRealOrders, isTestOrder, isNetRevenueOrder } from '@/lib/test-data-filter';

interface WebhookLogItem {
  id: string;
  gateway: string;
  accountNumber: string;
  amount: number;
  content: string;
  referenceCode: string;
  transactionDate: string;
  source: string;
  receivedAt: string;
}

export default function PaymentsPage() {
  const { activeWorkspace } = useWorkspaceStore();
  const { activeBankConfig, setBankConfig, orders, setOrderProofVerified } = useOrdersStore();
  const { events, booths } = useDataStore();
  const { user } = useAuthStore();
  const isCollab = user?.role === 'collab_partner';

  const [activeTab, setActiveTab] = React.useState<'proofs' | 'config'>('proofs');
  const [proofFilter, setProofFilter] = React.useState<'all' | 'unverified' | 'verified'>('all');
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);

  const [bankId, setBankId] = React.useState(normalizeVietQrBankId(activeBankConfig.bankId));
  const [accountNo, setAccountNo] = React.useState(activeBankConfig.accountNo || '109876880260');
  const [accountName, setAccountName] = React.useState(activeBankConfig.accountName || 'NGUYEN BAO THUONG');
  const [autoCheckEnabled, setAutoCheckEnabled] = React.useState(
    activeBankConfig.autoCheckEnabled === true
  );
  const [provider, setProvider] = React.useState<'sepay' | 'casso' | 'webhook_only'>(
    activeBankConfig.provider || 'webhook_only'
  );
  const [apiToken, setApiToken] = React.useState(activeBankConfig.apiToken || '');
  const [voiceAnnouncement, setVoiceAnnouncement] = React.useState(
    activeBankConfig.voiceAnnouncement === true
  );
  const [isSaved, setIsSaved] = React.useState(false);

  // Connection test & live feed states
  const [isTestingApi, setIsTestingApi] = React.useState(false);
  const [apiTestResult, setApiTestResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [recentWebhooks, setRecentWebhooks] = React.useState<WebhookLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = React.useState(false);
  const [simCode, setSimCode] = React.useState('EM8899');
  const [simAmount, setSimAmount] = React.useState('150000');
  const [webhookCopied, setWebhookCopied] = React.useState(false);

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/payments/webhook`
      : 'https://your-domain.com/api/payments/webhook';

  // Sync state if activeBankConfig is updated via cross-tab broadcast
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (activeBankConfig) {
        setBankId(normalizeVietQrBankId(activeBankConfig.bankId));
        setAccountNo(activeBankConfig.accountNo || '109876880260');
        setAccountName(activeBankConfig.accountName || 'NGUYEN BAO THUONG');
        setAutoCheckEnabled(activeBankConfig.autoCheckEnabled === true);
        setProvider(activeBankConfig.provider || 'webhook_only');
        setApiToken(activeBankConfig.apiToken || '');
        setVoiceAnnouncement(activeBankConfig.voiceAnnouncement === true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeBankConfig]);

  const fetchWebhookLogs = React.useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/payments/webhook');
      if (res.ok) {
        const data = await res.json();
        setRecentWebhooks(Array.isArray(data?.transactions) ? data.transactions : []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetchWebhookLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWebhookLogs]);

  // Revenue breakdown by method (REAL PRODUCTION + NON-CANCELLED/NON-REFUNDED ONLY)
  const realOrders = filterRealOrders(orders).filter(isNetRevenueOrder);
  const testOrders = orders.filter((o) => isTestOrder(o) && isNetRevenueOrder(o));
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
    if (isCollab) {
      alert('Chỉ Quản trị viên chính (Owner/Admin) có quyền thay đổi cấu hình tài khoản ngân hàng nhận tiền.');
      return;
    }
    const updated = {
      bankId: bankId.toUpperCase(),
      accountNo: accountNo.trim(),
      accountName: accountName.trim().toUpperCase(),
      autoCheckEnabled,
      provider,
      apiToken: apiToken.trim(),
      voiceAnnouncement,
    };
    setBankConfig(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  }

  async function handleTestApiConnection() {
    setIsTestingApi(true);
    setApiTestResult(null);
    try {
      const res = await fetch('/api/payments/check-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testConnection: true,
          provider,
          apiToken: apiToken.trim(),
          accountNo: accountNo.trim(),
        }),
      });
      const data = await res.json();
      setApiTestResult({
        success: !!data.success,
        message: data.message || data.error || 'Không thể kết nối API',
      });
    } catch (err: unknown) {
      setApiTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Lỗi kết nối máy chủ',
      });
    } finally {
      setIsTestingApi(false);
    }
  }

  async function handleSendSimulatedWebhook() {
    const numAmount = parseInt(simAmount.replace(/\D/g, ''), 10) || 150000;
    try {
      await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: bankId,
          accountNumber: accountNo,
          transferType: 'in',
          transferAmount: numAmount,
          content: `Chuyen khoan don hang ${simCode.trim().toUpperCase()}`,
          referenceCode: `FT${Date.now().toString().slice(-8)}`,
          source: 'simulated',
        }),
      });
      playSuccessChime();
      if (voiceAnnouncement) {
        speakPaymentReceived(numAmount);
      }
      await fetchWebhookLogs();
    } catch {
      alert('Không thể gửi tín hiệu thử nghiệm');
    }
  }

  // Filter transfer orders with proof images
  const transferOrdersWithProof = orders.filter((o) => !!o.proof_image_url);
  const unverifiedProofsCount = transferOrdersWithProof.filter((o) => !o.proof_verified).length;
  const verifiedProofsCount = transferOrdersWithProof.filter((o) => !!o.proof_verified).length;

  const filteredProofOrders = transferOrdersWithProof.filter((o) => {
    if (proofFilter === 'unverified') return !o.proof_verified;
    if (proofFilter === 'verified') return !!o.proof_verified;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124]">
              Thanh toán & Đối soát Chuyển khoản
            </h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              VietinBank / VietQR
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Admin kiểm tra ảnh chụp minh chứng chuyển khoản từ quầy thu ngân và cấu hình tài khoản VietQR nhận tiền.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#F0F0ED] rounded-[8px] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('proofs')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'proofs'
                ? 'bg-white text-[#202124] shadow-xs'
                : 'text-[#737373] hover:text-[#202124]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Đối soát minh chứng</span>
            {unverifiedProofsCount > 0 ? (
              <span className="px-1.5 py-0.2 bg-[#C5221F] text-white rounded-full text-[10px] font-bold">
                {unverifiedProofsCount}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 bg-[#E8E8E5] text-[#737373] rounded-full text-[10px]">
                {transferOrdersWithProof.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-white text-[#202124] shadow-xs'
                : 'text-[#737373] hover:text-[#202124]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Cấu hình VietQR & Ngân hàng</span>
          </button>
        </div>
      </div>

      {activeTab === 'proofs' ? (
        /* TAB 1: PROOF VERIFICATION DASHBOARD */
        <div className="space-y-4">
          {/* Proof Summary Stats & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-white border border-[#E8E8E5] rounded-[8px] shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#202124]">Lọc theo trạng thái:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setProofFilter('all')}
                  className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors ${
                    proofFilter === 'all'
                      ? 'bg-[#315C4C] text-white'
                      : 'bg-[#F7F7F5] text-[#555] hover:bg-[#E8E8E5]'
                  }`}
                >
                  Tất cả ({transferOrdersWithProof.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProofFilter('unverified')}
                  className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                    proofFilter === 'unverified'
                      ? 'bg-[#B7791F] text-white'
                      : 'bg-[#FEF7EC] text-[#B7791F] hover:bg-[#FEEBC8]'
                  }`}
                >
                  <span>Chờ đối soát</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20">
                    {unverifiedProofsCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setProofFilter('verified')}
                  className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                    proofFilter === 'verified'
                      ? 'bg-[#2F7D55] text-white'
                      : 'bg-[#EAF4EE] text-[#2F7D55] hover:bg-[#CEE6D7]'
                  }`}
                >
                  <span>Đã khớp tiền</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20">
                    {verifiedProofsCount}
                  </span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#737373]">
              Bấm vào ảnh để phóng to kiểm tra bill. Bấm nút xanh để xác nhận khớp tiền tài khoản.
            </p>
          </div>

          {/* Proof Orders Grid / List */}
          {filteredProofOrders.length === 0 ? (
            <Card className="p-8 text-center bg-white border-[#E8E8E5]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#F7F7F5] flex items-center justify-center text-[#737373] mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#202124]">
                {proofFilter === 'unverified'
                  ? 'Tuyệt vời! Không còn đơn hàng nào chờ đối soát minh chứng'
                  : 'Chưa có đơn hàng nào có ảnh minh chứng chuyển khoản'}
              </p>
              <p className="text-xs text-[#737373] mt-1 max-w-md mx-auto">
                Khi thu ngân tại máy POS chọn thanh toán Chuyển khoản VietQR và chụp lại ảnh giao dịch / bill ngân hàng của khách, ảnh sẽ xuất hiện tại đây để Admin kiểm tra chéo với app ngân hàng.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProofOrders.map((order) => {
                const booth = booths.find((b) => b.id === order.booth_id);
                const event = events.find((e) => e.id === order.event_id);
                const isVerified = !!order.proof_verified;

                return (
                  <Card
                    key={order.id}
                    className={`bg-white border transition-shadow overflow-hidden shadow-xs hover:shadow-sm ${
                      isVerified ? 'border-[#CEE6D7]' : 'border-[#F6AD55]'
                    }`}
                  >
                    {/* Image Header with Lightbox Zoom Click */}
                    <div className="relative h-48 bg-[#1B1F23] flex items-center justify-center group overflow-hidden">
                      {order.proof_image_url ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={order.proof_image_url}
                            alt={`Minh chứng ${order.order_number}`}
                            className="w-full h-full object-contain cursor-pointer transition-transform duration-200 group-hover:scale-105"
                            onClick={() => setLightboxImage(order.proof_image_url || null)}
                          />
                          <button
                            type="button"
                            onClick={() => setLightboxImage(order.proof_image_url || null)}
                            className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 hover:bg-black text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-opacity backdrop-blur-xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Phóng to xem bill</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-[#737373]">Không có ảnh minh chứng</span>
                      )}

                      {/* Verified overlay badge */}
                      <div className="absolute top-2 left-2">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2F7D55] text-white shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã khớp tiền
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B7791F] text-white shadow-xs">
                            <AlertCircle className="w-3 h-3" />
                            Chờ đối soát
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#202124]">
                              {order.order_number}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              VietQR
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[#737373] mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(order.created_at)}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-base text-[#315C4C]">
                            {formatCurrency(order.final_amount, 'VND')}
                          </div>
                          <span className="text-[10px] text-[#737373]">
                            {order.items?.length || 0} món
                          </span>
                        </div>
                      </div>

                      {/* Event & Booth location */}
                      {(event || booth) && (
                        <div className="text-[11px] text-[#555] bg-[#F7F7F5] p-2 rounded-[6px] space-y-0.5">
                          {booth && (
                            <div className="flex items-center gap-1.5 font-medium text-[#202124]">
                              <Store className="w-3 h-3 text-[#315C4C]" />
                              <span>{booth.name}</span>
                            </div>
                          )}
                          {event && (
                            <p className="text-[10px] text-[#737373] truncate">
                              Sự kiện: {event.name}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Verification status details */}
                      {isVerified && order.proof_verified_at && (
                        <div className="text-[10px] text-[#2F7D55] bg-[#EAF4EE] p-2 rounded-[6px]">
                          ✓ Khớp bởi: <strong>{order.proof_verified_by || 'Admin'}</strong> lúc{' '}
                          {formatDate(order.proof_verified_at)}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-1">
                        {isVerified ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOrderProofVerified(order.id, false)}
                            className="w-full text-xs text-[#737373] hover:text-[#C5221F] hover:bg-[#FDF2E9]"
                          >
                            Hủy trạng thái đã khớp
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              setOrderProofVerified(
                                order.id,
                                true,
                                user?.fullName || user?.username || user?.email || 'Admin'
                              )
                            }
                            className="w-full text-xs gap-1.5 bg-[#2F7D55] hover:bg-[#256343]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Xác nhận đã khớp tiền vào TK ✓</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: BANK SETTINGS & AUTO-BANKING */
        <div className="space-y-6">

      {/* Revenue by Method KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="flex items-center gap-2 p-3 text-xs text-[#2F7D55] bg-[#EAF4EE] border border-[#CEE6D7] rounded-[6px] shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2F7D55]" />
          <span>
            <strong>Đã lưu cấu hình VietQR & Tự động nhận tiền thành công!</strong> Toàn bộ các màn hình POS của thu ngân đã được đồng bộ tức thì.
          </span>
        </div>
      )}

      {isCollab && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-[8px] bg-[#FEF7EC] dark:bg-amber-950/40 border border-[#B7791F]/30 text-xs text-[#8C5D17] dark:text-amber-300 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#B7791F]" />
          <span>
            <strong>Chế độ Chỉ đọc:</strong> Cấu hình tài khoản ngân hàng nhận tiền VietQR và cổng tự động được bảo vệ an toàn và do Quản trị viên chính (Admin) thiết lập chung cho toàn gian hàng.
          </span>
        </div>
      )}

      {/* VietQR Bank Settings + Auto-Banking Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-[#E8E8E5] bg-white shadow-xs">
          <CardHeader className="border-b border-[#F0F0ED] pb-4">
            <CardTitle className="text-sm font-semibold text-[#202124] flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#315C4C]" />
              1. Tài khoản Ngân hàng Nhận tiền (VietQR)
            </CardTitle>
            <CardDescription className="text-xs">
              Hệ thống tự động nhúng số tiền và mã phiên <code className="font-mono font-bold text-[#315C4C]">EMxxxx</code> vào mã QR. Khách quét là hiện sẵn đúng số tiền và nội dung chuyển khoản.
            </CardDescription>
          </CardHeader>

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
                  <option value="ICB">VietinBank</option>
                  <option value="MB">MB Bank (Quân Đội)</option>
                  <option value="VCB">Vietcombank</option>
                  <option value="TCB">Techcombank</option>
                  <option value="ACB">ACB</option>
                  <option value="VPB">VPBank</option>
                  <option value="TPB">TPBank</option>
                  <option value="BIDV">BIDV</option>
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
                {accountNo.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://img.vietqr.io/image/${normalizeVietQrBankId(bankId)}-${accountNo.trim()}-compact2.png?amount=50000&addInfo=EM8899&accountName=${encodeURIComponent(
                      accountName.trim()
                    )}`}
                    alt="VietQR Demo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode className="w-10 h-10 text-[#9E9E9C]" />
                )}
              </div>

              <div className="text-xs text-[#737373] space-y-1">
                <p className="font-semibold text-[#202124]">Xem trước mã VietQR tại quầy</p>
                <p>
                  Khi thu ngân bấm thanh toán trên POS, mã QR sẽ gắn sẵn nội dung riêng (ví dụ: <strong>EM8899</strong>) để máy tự động đối soát xem đơn nào đã được thanh toán.
                </p>
                <div className="flex items-center gap-1.5 text-[#2F7D55] text-[11px] pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Chuẩn VietQR liên ngân hàng Napas247</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Auto-Banking Verification without Phone */}
        <Card className="border-[#315C4C]/30 bg-white shadow-xs">
          <CardHeader className="border-b border-[#F0F0ED] pb-4 bg-[#F7FAF8]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-[#202124] flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#2F7D55] animate-pulse" />
                  2. Tự động nhận diện Tiền về & Báo thành công trên Web (Không cần cầm ĐT)
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Dành cho trường hợp thu ngân tại quầy không cầm điện thoại nhận thông báo ngân hàng. Khi khách chuyển khoản xong, web POS sẽ tự động phát loa đọc số tiền và chuyển sang màn hình <strong>Thanh toán thành công!</strong>
                </CardDescription>
              </div>
              <Badge className="bg-[#EAF4EE] text-[#2F7D55] border border-[#CEE6D7] shrink-0">
                Quét 2 giây / lần
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3 rounded-[8px] border border-[#E8E8E5] bg-[#FAFAF8] cursor-pointer hover:border-[#315C4C]/40">
                <input
                  type="checkbox"
                  checked={autoCheckEnabled}
                  onChange={(e) => setAutoCheckEnabled(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#D5D5D0] text-[#315C4C] focus:ring-[#315C4C]"
                />
                <div className="text-xs">
                  <p className="font-bold text-[#202124]">Tự động nhảy &quot;Thanh toán thành công&quot;</p>
                  <p className="text-[11px] text-[#737373] mt-0.5">
                    Màn hình POS tự động kiểm tra giao dịch khớp mã <code className="font-mono">EMxxxx</code> và tự động hoàn tất đơn hàng ngay khi nhận được tiền.
                  </p>
                </div>
              </label>

              <div className="flex items-start justify-between gap-2 p-3 rounded-[8px] border border-[#E8E8E5] bg-[#FAFAF8]">
                <label className="flex items-start gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={voiceAnnouncement}
                    onChange={(e) => setVoiceAnnouncement(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#D5D5D0] text-[#315C4C] focus:ring-[#315C4C]"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-[#202124]">Loa đọc thông báo tiền về tại quầy</p>
                    <p className="text-[11px] text-[#737373] mt-0.5">
                      Phát tiếng &quot;Ting-ting&quot; và giọng đọc tiếng Việt: <em>&quot;Đã nhận chuyển khoản 150.000 đồng&quot;</em>.
                    </p>
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    playSuccessChime();
                    speakPaymentReceived(150000);
                  }}
                  className="shrink-0 px-2.5 py-1.5 rounded-[6px] bg-white border border-[#D5D5D0] hover:bg-[#F0F0ED] text-[11px] font-semibold text-[#315C4C] flex items-center gap-1 cursor-pointer"
                  title="Nghe thử âm thanh báo nhận tiền"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Nghe thử</span>
                </button>
              </div>
            </div>

            {/* Provider & API Token */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="auto-provider">Nguồn đọc biến động số dư</Label>
                <select
                  id="auto-provider"
                  className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-xs font-semibold text-[#202124] focus:outline-none focus:border-[#315C4C]"
                  value={provider}
                  onChange={(e) =>
                    setProvider(e.target.value as 'sepay' | 'casso' | 'webhook_only')
                  }
                >
                  <option value="sepay">SePay.vn (Khuyên dùng - Miễn phí)</option>
                  <option value="casso">Casso.vn (API & Webhook)</option>
                  <option value="webhook_only">Webhook trực tiếp / App đọc thông báo ĐT</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="api-token">
                  {provider === 'casso'
                    ? 'Casso API Key (Hoặc để trống nếu chỉ dùng Webhook)'
                    : 'SePay API Token (Lấy tại my.sepay.vn -> Cấu hình Công ty -> API Access)'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="api-token"
                    type="password"
                    placeholder={
                      provider === 'webhook_only'
                        ? 'Chế độ Webhook không bắt buộc nhập Token'
                        : 'Nhập API Token để web tự động đọc giao dịch (hoạt động cả trên localhost)...'
                    }
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    className="font-mono text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestApiConnection}
                    disabled={isTestingApi}
                    isLoading={isTestingApi}
                    className="shrink-0 text-xs font-semibold"
                  >
                    Kiểm tra kết nối
                  </Button>
                </div>
              </div>
            </div>

            {apiTestResult && (
              <div
                className={`p-3 rounded-[6px] border text-xs flex items-center gap-2 ${
                  apiTestResult.success
                    ? 'bg-[#EAF4EE] border-[#CEE6D7] text-[#2F7D55]'
                    : 'bg-[#FDF2E9] border-[#C5221F]/30 text-[#C5221F]'
                }`}
              >
                {apiTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{apiTestResult.message}</span>
              </div>
            )}

            {/* Webhook Endpoint Box */}
            <div className="p-3.5 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[8px] space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#202124]">
                    Địa chỉ Webhook nhận thông báo tiền vào (Tức thì):
                  </p>
                  <p className="text-[11px] text-[#737373]">
                    Dán link này vào mục <strong>Tích hợp Webhooks</strong> trên SePay.vn, Casso.vn hoặc ứng dụng đọc thông báo ngân hàng trên điện thoại của bạn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined') {
                      navigator.clipboard.writeText(webhookUrl);
                      setWebhookCopied(true);
                      setTimeout(() => setWebhookCopied(false), 2500);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-[6px] bg-white border border-[#D5D5D0] hover:bg-[#F0F0ED] text-xs font-mono font-bold text-[#315C4C] flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{webhookCopied ? 'Đã sao chép!' : 'Sao chép Webhook URL'}</span>
                </button>
              </div>
              <div className="px-3 py-1.5 rounded bg-white border border-[#E8E8E5] font-mono text-xs text-[#202124] select-all overflow-x-auto">
                {webhookUrl}
              </div>
            </div>

            {/* 3-Step Quick Guide */}
            <div className="p-3.5 bg-[#EAF4EE]/60 border border-[#CEE6D7] rounded-[8px] text-xs space-y-1.5">
              <p className="font-bold text-[#202124]">
                💡 Hướng dẫn 3 bước để không cầm điện thoại vẫn tự nhảy đơn trên Web:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[#333] text-[11.5px]">
                <li>
                  Tạo tài khoản miễn phí tại <strong>my.sepay.vn</strong> (hoặc <strong>casso.vn</strong>) và liên kết với số tài khoản ngân hàng nhận tiền của bạn (chỉ cần làm 1 lần trên điện thoại chủ TK).
                </li>
                <li>
                  Vào mục <strong>API Access</strong> trên SePay copy <strong>API Token</strong> dán vào ô bên trên (hoặc dán <strong>Webhook URL</strong> bên trên vào mục Webhooks của SePay).
                </li>
                <li>
                  Bấm <strong>Lưu cấu hình</strong> bên dưới. Từ lúc này, tại quầy POS, khi khách quét mã QR và chuyển khoản xong, <strong>màn hình POS sẽ tự động phát loa báo tiền về và nhảy sang &quot;Thanh toán thành công&quot;</strong> sau 1–2 giây!
                </li>
              </ol>
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="gap-1.5"
                disabled={isCollab}
                title={isCollab ? 'Đối tác Collab không có quyền thay đổi tài khoản ngân hàng' : undefined}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isCollab ? 'Khóa quyền thay đổi (Chỉ Admin)' : 'Lưu toàn bộ cấu hình Thanh toán & Tự động'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Section 3: Live Webhook / Bank Feed & Simulator */}
      <Card className="border-[#E8E8E5] bg-white shadow-xs">
        <CardHeader className="border-b border-[#F0F0ED] pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-[#202124] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#B7791F]" />
              3. Bảng theo dõi Tín hiệu Tiền về & Giả lập Chuyển khoản
            </CardTitle>
            <CardDescription className="text-xs">
              Bạn có thể bắn thử một tín hiệu chuyển khoản tại đây trong khi đang mở màn hình POS ở tab bên cạnh để kiểm chứng tính năng tự động nhảy đơn.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchWebhookLogs}
            disabled={isLoadingLogs}
            className="text-xs gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Simulator Row */}
          <div className="p-3 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[6px] flex flex-col sm:flex-row items-end gap-3">
            <div className="w-full sm:w-44 space-y-1">
              <Label htmlFor="sim-code" className="text-xs">
                Mã nội dung trên QR POS
              </Label>
              <Input
                id="sim-code"
                value={simCode}
                onChange={(e) => setSimCode(e.target.value.toUpperCase())}
                placeholder="VD: EM8899"
                className="h-8 font-mono text-xs bg-white uppercase"
              />
            </div>
            <div className="w-full sm:w-44 space-y-1">
              <Label htmlFor="sim-amount" className="text-xs">
                Số tiền chuyển (VND)
              </Label>
              <Input
                id="sim-amount"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                placeholder="VD: 150000"
                className="h-8 font-mono text-xs bg-white"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSendSimulatedWebhook}
              className="w-full sm:w-auto gap-1.5 bg-[#2F7D55] hover:bg-[#256343] text-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Bắn tín hiệu tiền về (Test)</span>
            </Button>
          </div>

          {/* Recent Incoming Transactions List */}
          {recentWebhooks.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#737373] border border-dashed border-[#E8E8E5] rounded-[6px]">
              Chưa có giao dịch chuyển khoản nào được ghi nhận trong phiên này.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recentWebhooks.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-[6px] border border-[#E8E8E5] bg-white flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#2F7D55]">
                        +{formatCurrency(tx.amount, 'VND')}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {tx.gateway}
                      </Badge>
                      <span className="text-[10px] text-[#737373]">
                        {new Date(tx.receivedAt).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-[#202124]">{tx.content}</p>
                  </div>
                  <span className="text-[10px] font-mono text-[#737373]">{tx.referenceCode}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      )}

      {/* Lightbox Modal for Fullscreen Proof Inspection */}
      <Modal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        title="Chi tiết ảnh minh chứng chuyển khoản (Bill)"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="bg-[#121212] rounded-[8px] p-2 flex items-center justify-center max-h-[75vh] overflow-hidden">
            {lightboxImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightboxImage}
                alt="Minh chứng chi tiết"
                className="max-h-[72vh] w-auto max-w-full object-contain rounded"
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLightboxImage(null)}
            >
              Đóng cửa sổ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
