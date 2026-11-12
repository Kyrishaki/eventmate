'use client';

import * as React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useAuditStore } from '@/stores/audit-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { AuditLogEntry, AuditActionType, AuditActorRole } from '@/types/database';
import { Link } from '@/i18n/routing';
import {
  History,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  User,
  Store,
  Calendar,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  Handshake,
  Users2,
  ShoppingCart,
  Package,
  Layers,
  ArrowRight,
  AlertTriangle,
  FileText,
  KeyRound,
  CheckCircle2,
  Info,
  ChevronRight,
  Bookmark,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

export default function AuditLogsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();
  const { logs, clearLogs, resetToDefaultLogs, deleteLog } = useAuditStore();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = React.useState('');
  const [actorRoleFilter, setActorRoleFilter] = React.useState<string>('all');
  const [actionTypeFilter, setActionTypeFilter] = React.useState<string>('all');
  const [timeFilter, setTimeFilter] = React.useState<string>('all');

  // Modal Detail State
  const [selectedLog, setSelectedLog] = React.useState<AuditLogEntry | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = React.useState(false);
  const [copyFeedback, setCopyFeedback] = React.useState(false);

  // Check Admin permission: only master admin or users with owner/admin role
  const isAdmin = user && (user.role === 'owner' || user.role === 'admin');

  // Relative Time Helper with stable timestamp
  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const dateYear = date.getFullYear();
    if (isNaN(dateYear)) return dateStr;
    return formatDate(dateStr);
  }

  // Filtered Logs calculation
  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      // 1. Keyword search (case-insensitive)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchActor = log.actor_name?.toLowerCase().includes(q);
        const matchEntity = log.entity_name?.toLowerCase().includes(q);
        const matchDesc = log.description?.toLowerCase().includes(q);
        const matchBooth = log.booth_name?.toLowerCase().includes(q);
        if (!matchActor && !matchEntity && !matchDesc && !matchBooth) {
          return false;
        }
      }

      // 2. Actor Role Filter
      if (actorRoleFilter !== 'all') {
        if (actorRoleFilter === 'collab_partner' && log.actor_role !== 'collab_partner') return false;
        if (actorRoleFilter === 'staff' && log.actor_role !== 'staff' && log.actor_role !== 'inventory_staff') return false;
        if (actorRoleFilter === 'cashier' && log.actor_role !== 'cashier') return false;
        if (actorRoleFilter === 'admin' && log.actor_role !== 'owner' && log.actor_role !== 'admin') return false;
      }

      // 3. Action Type Filter
      if (actionTypeFilter !== 'all') {
        if (log.action_type !== actionTypeFilter) return false;
      }

      // 4. Time Filter
      if (timeFilter !== 'all') {
        const logTime = new Date(log.timestamp).getTime();
        const cutoff = timeFilter === '24h' ? 86400000 : 86400000 * 7;
        const baseline = logs[0] ? new Date(logs[0].timestamp).getTime() : 0;
        if (baseline > 0 && baseline - logTime > cutoff) return false;
      }

      return true;
    });
  }, [logs, searchTerm, actorRoleFilter, actionTypeFilter, timeFilter]);

  // Executive Metric Counts
  const totalLogsCount = logs.length;
  const collabLogsCount = logs.filter((l) => l.actor_role === 'collab_partner').length;
  const staffLogsCount = logs.filter(
    (l) => l.actor_role === 'staff' || l.actor_role === 'cashier' || l.actor_role === 'inventory_staff'
  ).length;
  const criticalActionsCount = logs.filter(
    (l) =>
      l.action_type === 'delete' ||
      l.action_type === 'update' ||
      l.action_type === 'preorder_adjust' ||
      l.action_type === 'user_delete' ||
      l.action_type === 'order_cancel' ||
      l.action_type === 'order_refund'
  ).length;

  // Export JSON Handler
  function handleExportJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `eventmate-audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Helper for Actor Badge
  function renderActorBadge(role: AuditActorRole, name: string) {
    switch (role) {
      case 'collab_partner':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[#FEF7EC] text-[#8C5D17] border border-[#B7791F]/30">
            <Handshake className="w-3 h-3 text-[#B7791F]" />
            <span>{name}</span>
          </span>
        );
      case 'staff':
      case 'inventory_staff':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#3B82F6]/30">
            <Users2 className="w-3 h-3 text-[#3B82F6]" />
            <span>{name}</span>
          </span>
        );
      case 'cashier':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#EBF1EE] text-[#315C4C] border border-[#315C4C]/30">
            <ShoppingCart className="w-3 h-3 text-[#315C4C]" />
            <span>{name}</span>
          </span>
        );
      case 'owner':
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[#202124] text-white">
            <ShieldCheck className="w-3 h-3 text-[#B7791F]" />
            <span>{name}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-[#F7F7F5] text-[#737373] border border-[#E8E8E5]">
            <User className="w-3 h-3" />
            <span>{name}</span>
          </span>
        );
    }
  }

  // Helper for Action Badge
  function renderActionBadge(type: AuditActionType) {
    switch (type) {
      case 'collab_contribute':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F3E8FF] text-[#6B21A8] border border-[#D8B4FE]">
            + Hàng Collab mới
          </span>
        );
      case 'collab_sync':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]">
            🔄 Đồng bộ Collab
          </span>
        );
      case 'preorder_adjust':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FEF7EC] text-[#B7791F] border border-[#B7791F]/30">
            ⚡ Chỉnh đặt trước
          </span>
        );
      case 'stock_adjust':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74]">
            📦 Điều chỉnh kho
          </span>
        );
      case 'create':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EBF1EE] text-[#2F7D55] border border-[#A6C4B8]">
            + Thêm mới
          </span>
        );
      case 'update':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            ✎ Chỉnh sửa
          </span>
        );
      case 'delete':
      case 'user_delete':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FDF1F0] text-[#C44536] border border-[#F8B4AF]">
            🗑 Đã xóa
          </span>
        );
      case 'order_create':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            🛒 Đơn POS
          </span>
        );
      case 'order_cancel':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FDF1F0] text-[#C44536] border border-[#F8B4AF]">
            🚫 Hủy đơn (Void)
          </span>
        );
      case 'order_refund':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FEF7EC] text-[#B7791F] border border-[#FDE68A]">
            ↩ Hoàn tiền / Trả hàng
          </span>
        );
      case 'user_create':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
            🔑 Cấp tài khoản
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F7F7F5] text-[#737373]">
            {type}
          </span>
        );
    }
  }

  // =========================================================================
  // ACCESS DENIED VIEW: NON-ADMIN USERS
  // =========================================================================
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#FEF7EC] border border-[#B7791F]/30 flex items-center justify-center mx-auto text-[#B7791F]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202124]">
            Khu vực Giám Sát & Nhật Ký Hoạt Động (Admin Only)
          </h1>
          <p className="text-xs sm:text-sm text-[#737373] max-w-lg mx-auto">
            Nhật ký lưu vết thao tác (Audit Log) chứa thông tin bảo mật về toàn bộ lịch sử chỉnh sửa, xóa hàng, điều chỉnh kho của Đối tác Collab và Nhân viên.
          </p>
        </div>

        <Card className="p-4 bg-[#F7F7F5] border-[#E8E8E5] text-left text-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E5]">
            <span className="text-[#737373]">Tài khoản hiện tại:</span>
            <span className="font-semibold text-[#202124]">{user?.fullName || 'Khách xem'}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E5]">
            <span className="text-[#737373]">Vai trò hiện tại:</span>
            <Badge variant="warning" className="text-[10px] uppercase font-bold">
              {user?.role || 'viewer'} (Không đủ quyền)
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#737373]">Tài khoản Quản trị viên chính:</span>
            <span className="font-mono text-[#315C4C] font-bold">
              Tuanadminvippro666 & HKT87@123
            </span>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/login">
            <Button variant="primary" size="md" className="gap-2 w-full sm:w-auto shadow-xs">
              <KeyRound className="w-4 h-4" />
              <span>Đăng nhập bằng tài khoản Quản trị viên (Admin)</span>
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="md" className="w-full sm:w-auto">
              <span>Quay lại Bảng tổng quan</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ADMIN AUDIT LOG INTERFACE
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#E8E8E5]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#202124] flex items-center gap-2">
              <History className="w-5 h-5 text-[#315C4C]" />
              <span>Nhật Ký Hoạt Động (Audit Log)</span>
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#2F7D55]/10 text-[#2F7D55] border border-[#2F7D55]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D55] animate-pulse" />
              Thời gian thực
            </span>
          </div>
          <p className="text-xs text-[#737373] mt-0.5">
            Dành riêng cho Quản trị viên: Tra cứu toàn bộ lịch sử Đối tác Collab và Staff nhân sự làm gì, thêm gì, chỉnh gì, xóa gì.
          </p>
        </div>

        {/* Global Log Actions */}
        <div className="grid grid-cols-3 sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-8 bg-white flex-1 sm:flex-none justify-center px-2"
            onClick={handleExportJson}
            title="Tải file JSON toàn bộ nhật ký"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="truncate">Xuất JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-8 bg-white flex-1 sm:flex-none justify-center px-2"
            onClick={resetToDefaultLogs}
            title="Khôi phục lại dữ liệu log mẫu để đối soát"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="truncate">Log mẫu</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-8 text-[#C44536] hover:bg-[#FDF1F0] hover:border-[#F8B4AF] flex-1 sm:flex-none justify-center px-2"
            onClick={() => setIsConfirmClearOpen(true)}
            title="Xóa sạch toàn bộ lịch sử log"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="truncate">Xóa log</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Logs */}
        <Card className="border-[#E8E8E5] bg-white shadow-2xs p-3.5 sm:p-4">
          <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
            Tổng Lượt Thao Tác
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg min-[360px]:text-xl sm:text-2xl font-black text-[#202124]">
              {totalLogsCount}
            </span>
            <FileText className="w-4 h-4 text-[#737373]" />
          </div>
          <p className="text-[10px] text-[#737373] mt-1">Đã lưu trong phiên làm việc</p>
        </Card>

        {/* Collab Partner Actions */}
        <Card
          className="border-[#B7791F]/30 bg-[#FEF7EC] shadow-2xs p-3.5 sm:p-4 cursor-pointer hover:border-[#B7791F] transition-colors"
          onClick={() => setActorRoleFilter(actorRoleFilter === 'collab_partner' ? 'all' : 'collab_partner')}
        >
          <span className="text-[11px] font-bold text-[#B7791F] uppercase tracking-wider block">
            Đối Tác Collab Thao Tác
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg min-[360px]:text-xl sm:text-2xl font-black text-[#B7791F]">
              {collabLogsCount}
            </span>
            <Handshake className="w-4 h-4 text-[#B7791F]" />
          </div>
          <p className="text-[10px] text-[#8C5D17] mt-1">Thêm hàng, nạp kho, đồng bộ</p>
        </Card>

        {/* Staff & Cashier Actions */}
        <Card
          className="border-[#3B82F6]/30 bg-[#EFF6FF] shadow-2xs p-3.5 sm:p-4 cursor-pointer hover:border-[#3B82F6] transition-colors"
          onClick={() => setActorRoleFilter(actorRoleFilter === 'staff' ? 'all' : 'staff')}
        >
          <span className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-wider block">
            Staff & Thu Ngân Làm Việc
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg min-[360px]:text-xl sm:text-2xl font-black text-[#1D4ED8]">
              {staffLogsCount}
            </span>
            <Users2 className="w-4 h-4 text-[#1D4ED8]" />
          </div>
          <p className="text-[10px] text-[#1E40AF] mt-1">Bán POS, kiểm kê, chỉnh kho</p>
        </Card>

        {/* Sensitive / Critical Changes */}
        <Card
          className="border-[#E8E8E5] bg-white shadow-2xs p-3.5 sm:p-4 cursor-pointer hover:border-[#C44536]/50 transition-colors"
          onClick={() => setActionTypeFilter(actionTypeFilter === 'delete' ? 'all' : 'delete')}
        >
          <span className="text-[11px] font-bold text-[#C44536] uppercase tracking-wider block">
            Chỉnh Sửa & Xóa Nhạy Cảm
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg min-[360px]:text-xl sm:text-2xl font-black text-[#C44536]">
              {criticalActionsCount}
            </span>
            <AlertTriangle className="w-4 h-4 text-[#C44536]" />
          </div>
          <p className="text-[10px] text-[#737373] mt-1">Sửa giá, xóa món, chỉnh VIP hold</p>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-3.5 sm:p-4 border-[#E8E8E5] bg-white shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9E9E9C] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên nhân viên, đối tác, sản phẩm, mã đơn hoặc nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          {/* Quick Filter Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
            {/* Filter by Actor */}
            <select
              value={actorRoleFilter}
              onChange={(e) => setActorRoleFilter(e.target.value)}
              className="h-9 px-2.5 rounded-[6px] border border-[#E8E8E5] bg-white text-xs font-medium text-[#202124] focus:outline-none focus:border-[#315C4C]"
            >
              <option value="all">👤 Tất cả đối tượng</option>
              <option value="collab_partner">🤝 Chỉ Đối tác Collab</option>
              <option value="staff">👔 Chỉ Staff / Trợ lý / Kho</option>
              <option value="cashier">🛒 Chỉ Thu ngân POS</option>
              <option value="admin">🛡️ Chỉ Quản trị viên (Admin)</option>
            </select>

            {/* Filter by Action */}
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="h-9 px-2.5 rounded-[6px] border border-[#E8E8E5] bg-white text-xs font-medium text-[#202124] focus:outline-none focus:border-[#315C4C]"
            >
              <option value="all">⚡ Tất cả hành động</option>
              <option value="collab_contribute">+ Đóng góp hàng Collab</option>
              <option value="preorder_adjust">⚡ Chỉnh Đặt trước / VIP hold</option>
              <option value="stock_adjust">📦 Bổ sung / Điều chỉnh kho</option>
              <option value="order_create">🛒 Tạo đơn hàng POS</option>
              <option value="order_cancel">🚫 Hủy đơn (Void)</option>
              <option value="order_refund">↩ Hoàn tiền / Trả hàng</option>
              <option value="create">+ Thêm mới</option>
              <option value="update">✎ Chỉnh sửa</option>
              <option value="delete">🗑 Xóa dữ liệu</option>
              <option value="user_create">🔑 Cấp tài khoản nhân sự</option>
              <option value="collab_sync">🔄 Đồng bộ gói hàng</option>
            </select>

            {/* Filter by Time */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="h-9 px-2.5 rounded-[6px] border border-[#E8E8E5] bg-white text-xs font-medium text-[#202124] focus:outline-none focus:border-[#315C4C]"
            >
              <option value="all">🕒 Tất cả thời gian</option>
              <option value="24h">Hôm nay / 24 giờ qua</option>
              <option value="7d">7 ngày gần nhất</option>
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(searchTerm || actorRoleFilter !== 'all' || actionTypeFilter !== 'all' || timeFilter !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0F0ED] text-xs">
            <span className="text-[#737373]">Đang lọc:</span>
            {searchTerm && (
              <Badge variant="outline" className="gap-1 text-[11px]">
                Từ khóa: &ldquo;{searchTerm}&rdquo;
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-[#C44536] ml-1"
                >
                  ×
                </button>
              </Badge>
            )}
            {actorRoleFilter !== 'all' && (
              <Badge variant="warning" className="gap-1 text-[11px]">
                Vai trò: {actorRoleFilter}
                <button
                  type="button"
                  onClick={() => setActorRoleFilter('all')}
                  className="hover:text-[#C44536] ml-1"
                >
                  ×
                </button>
              </Badge>
            )}
            {actionTypeFilter !== 'all' && (
              <Badge variant="outline" className="gap-1 text-[11px]">
                Hành động: {actionTypeFilter}
                <button
                  type="button"
                  onClick={() => setActionTypeFilter('all')}
                  className="hover:text-[#C44536] ml-1"
                >
                  ×
                </button>
              </Badge>
            )}
            {timeFilter !== 'all' && (
              <Badge variant="outline" className="gap-1 text-[11px]">
                Thời gian: {timeFilter}
                <button
                  type="button"
                  onClick={() => setTimeFilter('all')}
                  className="hover:text-[#C44536] ml-1"
                >
                  ×
                </button>
              </Badge>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setActorRoleFilter('all');
                setActionTypeFilter('all');
                setTimeFilter('all');
              }}
              className="text-xs text-[#315C4C] hover:underline font-semibold ml-auto"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </Card>

      {/* Main Audit Log Feed / Table */}
      <Card className="border-[#E8E8E5] bg-white shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 sm:px-5 bg-[#FAFAF8] border-b border-[#E8E8E5] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-[#202124] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#315C4C]" />
              <span>Dòng Nhật Ký Hoạt Động Chi Tiết</span>
            </CardTitle>
            <p className="text-xs text-[#737373] mt-0.5">
              Hiển thị {filteredLogs.length} / {logs.length} bản ghi thao tác
            </p>
          </div>
        </CardHeader>

        {filteredLogs.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-2">
            <FileText className="w-10 h-10 text-[#9E9E9C] mx-auto" />
            <p className="text-sm font-semibold text-[#202124]">
              Không tìm thấy thao tác nào phù hợp
            </p>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Thử thay đổi từ khóa tìm kiếm hoặc chọn lại bộ lọc hành động / đối tượng bên trên.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0ED]">
            {filteredLogs.map((log) => {
              const hasChanges = Boolean(log.changes && log.changes.length > 0);

              return (
                <div
                  key={log.id}
                  className="p-3.5 sm:p-4 hover:bg-[#FBFBFA] transition-colors flex flex-col md:flex-row md:items-start justify-between gap-3"
                >
                  {/* Left Column: Actor & Timeline */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Actor Badge */}
                      {renderActorBadge(log.actor_role, log.actor_name)}

                      {/* Action Type Badge */}
                      {renderActionBadge(log.action_type)}

                      {/* Relative Time */}
                      <span className="text-[11px] text-[#737373] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#9E9E9C]" />
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </div>

                    {/* Detailed Human-Readable Description */}
                    <p className="text-xs sm:text-sm text-[#202124] font-medium leading-relaxed">
                      {log.description}
                    </p>

                    {/* Changes Diff Tags (if available) */}
                    {hasChanges && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-semibold text-[#737373] uppercase tracking-wider">
                          Thay đổi:
                        </span>
                        {log.changes!.map((ch, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] bg-[#F7F7F5] px-2 py-0.5 rounded border border-[#E8E8E5] font-mono text-[#202124]"
                          >
                            <span className="text-[#737373]">{ch.field_label || ch.field}:</span>
                            {ch.old_value !== undefined && (
                              <span className="text-[#C44536] line-through text-[10px]">
                                {String(ch.old_value)}
                              </span>
                            )}
                            {ch.old_value !== undefined && ch.new_value !== undefined && (
                              <ArrowRight className="w-2.5 h-2.5 text-[#9E9E9C]" />
                            )}
                            {ch.new_value !== undefined && (
                              <span className="text-[#2F7D55] font-bold">
                                {String(ch.new_value)}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Context Meta (Booth, Event) */}
                    {(log.booth_name || log.event_name) && (
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#737373] pt-0.5">
                        {log.booth_name && (
                          <span className="flex items-center gap-1">
                            <Store className="w-3 h-3 text-[#9E9E9C]" />
                            {log.booth_name}
                          </span>
                        )}
                        {log.event_name && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#9E9E9C]" />
                            {log.event_name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 md:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2.5 gap-1 text-[#737373] hover:text-[#202124]"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Chi tiết</span>
                    </Button>
                    <button
                      type="button"
                      title="Xóa dòng log này"
                      onClick={() => deleteLog(log.id)}
                      className="p-1.5 text-[#9E9E9C] hover:text-[#C44536] hover:bg-[#FDF1F0] rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal: View Single Audit Log Detail */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Chi Tiết Bản Ghi Nhật Ký Thao Tác"
        description="Toàn bộ thông tin đối soát kỹ thuật được hệ thống ghi nhận."
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#F7F7F5] rounded-[6px] border border-[#E8E8E5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#737373]">Mã bản ghi (Log ID):</span>
                <span className="font-mono font-bold text-[#202124]">{selectedLog.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#737373]">Thời gian chính xác:</span>
                <span className="font-mono text-[#202124]">{formatDate(selectedLog.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#737373]">Đối tượng thực hiện:</span>
                <span className="font-bold text-[#202124]">
                  {selectedLog.actor_name} ({selectedLog.actor_role})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#737373]">Hành động:</span>
                <span>{renderActionBadge(selectedLog.action_type)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#737373]">Thực thể tác động:</span>
                <span className="font-semibold text-[#202124]">
                  {selectedLog.entity_name} ({selectedLog.entity_type})
                </span>
              </div>
            </div>

            <div>
              <span className="font-bold text-[#202124] block mb-1">Mô tả đầy đủ:</span>
              <p className="p-3 bg-white rounded-[6px] border border-[#E8E8E5] text-[#202124] leading-relaxed">
                {selectedLog.description}
              </p>
            </div>

            {selectedLog.changes && selectedLog.changes.length > 0 && (
              <div>
                <span className="font-bold text-[#202124] block mb-1">Dữ liệu thay đổi (Diff):</span>
                <div className="border border-[#E8E8E5] rounded-[6px] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAF8] border-b border-[#E8E8E5]">
                      <tr>
                        <th className="p-2 font-semibold text-[#737373]">Trường dữ liệu</th>
                        <th className="p-2 font-semibold text-[#737373]">Giá trị cũ</th>
                        <th className="p-2 font-semibold text-[#737373]">Giá trị mới</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0ED]">
                      {selectedLog.changes.map((c, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono text-[#202124]">{c.field_label || c.field}</td>
                          <td className="p-2 text-[#C44536] font-mono">
                            {c.old_value !== undefined ? String(c.old_value) : '—'}
                          </td>
                          <td className="p-2 text-[#2F7D55] font-bold font-mono">
                            {c.new_value !== undefined ? String(c.new_value) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0ED]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Confirm Clear Logs */}
      <Modal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        title="Xác nhận Xóa Nhật Ký Hoạt Động"
        description="Bạn có chắc chắn muốn xóa toàn bộ lịch sử thao tác không? Hành động này không thể hoàn tác."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[#FDF1F0] rounded-[6px] border border-[#F8B4AF] text-[#8C2318] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Toàn bộ lịch sử đối soát và hoạt động của đối tác collab và nhân viên sẽ bị xóa khỏi bộ nhớ. Hãy cân nhắc <strong>Xuất file JSON</strong> trước khi xóa!
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F0ED]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmClearOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-[#C44536] hover:bg-[#A8372A] border-none text-white font-bold"
              onClick={() => {
                clearLogs();
                setIsConfirmClearOpen(false);
              }}
            >
              Xóa sạch nhật ký ngay
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
