'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useFeedbackStore, FeedbackItem, FeedbackStatus, FeedbackType, FeedbackSeverity } from '@/stores/feedback-store';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { FeedbackModal } from '@/components/feedback/feedback-modal';
import { formatDate } from '@/lib/utils';
import {
  Bug,
  Lightbulb,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  Copy,
  Check,
  Download,
  Trash2,
  ExternalLink,
  Laptop,
  User,
  Eye,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  ListTodo,
} from 'lucide-react';

export default function DashboardFeedbackPage() {
  const { user } = useAuthStore();
  const { items, updateStatus, updateAdminNotes, deleteFeedback } = useFeedbackStore();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [filterSeverity, setFilterSeverity] = React.useState<string>('all');

  // Detail Modal
  const [selectedItem, setSelectedItem] = React.useState<FeedbackItem | null>(null);
  const [editingNotes, setEditingNotes] = React.useState('');
  const [copiedRoadmap, setCopiedRoadmap] = React.useState(false);
  const [viewScreenshotUrl, setViewScreenshotUrl] = React.useState<string | null>(null);

  function handleSelectItem(item: FeedbackItem) {
    setSelectedItem(item);
    setEditingNotes(item.admin_notes || '');
  }

  // Metrics
  const totalCount = items.length;
  const bugsPending = items.filter((i) => i.type === 'bug' && i.status !== 'resolved' && i.status !== 'closed').length;
  const featuresCount = items.filter((i) => i.type === 'feature').length;
  const resolvedCount = items.filter((i) => i.status === 'resolved').length;

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reporter_name && item.reporter_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || item.severity === filterSeverity;

    return matchesSearch && matchesType && matchesStatus && matchesSeverity;
  });

  // Export Roadmap to Markdown clipboard
  const handleCopyRoadmap = () => {
    const pendingBugs = items.filter((i) => i.type === 'bug' && i.status !== 'resolved');
    const pendingFeatures = items.filter((i) => i.type === 'feature' && i.status !== 'resolved');
    const resolvedItems = items.filter((i) => i.status === 'resolved');

    let md = `# 📋 KẾ HOẠCH UPDATE PHẦN MỀM EVENTMATE\n`;
    md += `*Thời gian tổng hợp: ${new Date().toLocaleString('vi-VN')}*\n\n`;

    md += `## 🐞 Lỗi cần sửa (Bugs to fix):\n`;
    if (pendingBugs.length === 0) {
      md += `- [x] Chưa có lỗi nào tồn đọng!\n`;
    } else {
      pendingBugs.forEach((b) => {
        md += `- [ ] **[${b.severity.toUpperCase()}]** ${b.title} (${b.module}) — Người báo: ${b.reporter_name || 'N/A'}\n`;
      });
    }

    md += `\n## 💡 Góp ý & Tính năng cần bổ sung (Features & Ideas):\n`;
    if (pendingFeatures.length === 0) {
      md += `- Không có tính năng mới nào đang chờ.\n`;
    } else {
      pendingFeatures.forEach((f) => {
        md += `- [ ] **${f.title}** (${f.module}): ${f.description.slice(0, 80)}...\n`;
      });
    }

    md += `\n## ✅ Đã xử lý & Hoàn thành (Resolved):\n`;
    resolvedItems.forEach((r) => {
      md += `- [x] ${r.title} (${r.admin_notes || 'Đã update thành công'})\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedRoadmap(true);
    setTimeout(() => setCopiedRoadmap(false), 2500);
  };

  // Export to JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `eventmate_feedback_export_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const getTypeBadge = (type: FeedbackType) => {
    switch (type) {
      case 'bug':
        return (
          <Badge variant="outline" className="text-[10px] border-[#C44536] text-[#C44536] bg-[#C44536]/10 gap-1">
            <Bug className="w-3 h-3" />
            <span>Báo lỗi</span>
          </Badge>
        );
      case 'feature':
        return (
          <Badge variant="outline" className="text-[10px] border-[#315C4C] text-[#315C4C] bg-[#315C4C]/10 gap-1">
            <Lightbulb className="w-3 h-3" />
            <span>Góp ý tính năng</span>
          </Badge>
        );
      case 'ux':
        return (
          <Badge variant="outline" className="text-[10px] border-[#2563EB] text-[#2563EB] bg-[#2563EB]/10 gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Trải nghiệm (UX)</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] border-[#737373] text-[#737373] bg-[#737373]/10 gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>Ý kiến</span>
          </Badge>
        );
    }
  };

  const getSeverityBadge = (sev: FeedbackSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#FDF1F0] text-[#C44536] border border-[#C44536]/30 animate-pulse">
            🚨 Khẩn cấp
          </span>
        );
      case 'high':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#FEF7EC] text-[#B7791F] border border-[#B7791F]/30">
            Cao
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#F0F5FF] text-[#2563EB] border border-[#2563EB]/20">
            Bình thường
          </span>
        );
      case 'low':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#F7F7F5] text-[#737373] border border-[#E8E8E5]">
            Thấp
          </span>
        );
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-[#FEF7EC] text-[#B7791F] border border-[#B7791F]/30">
            ⏳ Chờ xử lý
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-[#F0F5FF] text-[#2563EB] border border-[#2563EB]/30">
            ⚙️ Đang xử lý
          </span>
        );
      case 'resolved':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-[#EBF1EE] text-[#2F7D55] border border-[#2F7D55]/30">
            ✅ Đã hoàn thành
          </span>
        );
      case 'closed':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-[#F7F7F5] text-[#737373] border border-[#E8E8E5]">
            Đã đóng
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8E8E5] dark:border-[#333333]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#202124] dark:text-[#F0F0F0]">
              Hộp thư Báo cáo Lỗi & Góp ý Cải thiện
            </h1>
            <Badge variant="outline" className="text-[11px] font-mono">
              {totalCount} phản hồi
            </Badge>
          </div>
          <p className="text-xs text-[#737373] dark:text-[#9E9E9C] mt-0.5">
            Tổng hợp toàn bộ phản hồi từ người dùng, thu ngân và đối tác để đối chiếu và lên kế hoạch update web.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyRoadmap}
            className="text-xs gap-1.5 bg-white dark:bg-[#1E1E1E]"
            title="Sao chép toàn bộ danh sách lỗi và tính năng ra định dạng Markdown để lưu trữ"
          >
            {copiedRoadmap ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#2F7D55]" />
                <span>Đã chép danh sách!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#315C4C]" />
                <span>Chép Kế hoạch Update</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="text-xs gap-1.5 bg-white dark:bg-[#1E1E1E]"
            title="Tải file dữ liệu JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất JSON</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gửi phản hồi mới</span>
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-white dark:bg-[#1E1E1E] border-[#E8E8E5] dark:border-[#333333] shadow-xs">
          <div className="flex items-center justify-between text-[#737373] mb-1">
            <span className="text-[11px] sm:text-xs font-medium">Tổng số phản hồi</span>
            <div className="w-6 h-6 rounded-[4px] bg-[#F7F7F5] dark:bg-[#2A2A2A] border border-[#E8E8E5] dark:border-[#333333] flex items-center justify-center text-[#315C4C]">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#202124] dark:text-[#F0F0F0]">
            {totalCount}
          </div>
          <p className="text-[10px] text-[#737373] mt-0.5">Từ mọi nguồn và thiết bị</p>
        </Card>

        <Card className="p-3 sm:p-4 bg-white dark:bg-[#1E1E1E] border-[#E8E8E5] dark:border-[#333333] shadow-xs">
          <div className="flex items-center justify-between text-[#737373] mb-1">
            <span className="text-[11px] sm:text-xs font-medium text-[#C44536]">Lỗi cần fix</span>
            <div className="w-6 h-6 rounded-[4px] bg-[#FDF1F0] dark:bg-[#3E1F1D] border border-[#C44536]/20 flex items-center justify-center text-[#C44536]">
              <Bug className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#C44536]">
            {bugsPending}
          </div>
          <p className="text-[10px] text-[#C44536] mt-0.5">Đang chờ xử lý / kiểm tra</p>
        </Card>

        <Card className="p-3 sm:p-4 bg-white dark:bg-[#1E1E1E] border-[#E8E8E5] dark:border-[#333333] shadow-xs">
          <div className="flex items-center justify-between text-[#737373] mb-1">
            <span className="text-[11px] sm:text-xs font-medium text-[#315C4C]">Ý tưởng tính năng</span>
            <div className="w-6 h-6 rounded-[4px] bg-[#EBF1EE] dark:bg-[#2F3E37] border border-[#315C4C]/20 flex items-center justify-center text-[#315C4C]">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#315C4C]">
            {featuresCount}
          </div>
          <p className="text-[10px] text-[#737373] mt-0.5">Đề xuất cải thiện từ người dùng</p>
        </Card>

        <Card className="p-3 sm:p-4 bg-white dark:bg-[#1E1E1E] border-[#E8E8E5] dark:border-[#333333] shadow-xs">
          <div className="flex items-center justify-between text-[#737373] mb-1">
            <span className="text-[11px] sm:text-xs font-medium text-[#2F7D55]">Đã giải quyết</span>
            <div className="w-6 h-6 rounded-[4px] bg-[#EBF1EE] dark:bg-[#25352C] border border-[#2F7D55]/20 flex items-center justify-center text-[#2F7D55]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#2F7D55]">
            {resolvedCount}
          </div>
          <p className="text-[10px] text-[#737373] mt-0.5">Đã fix & đưa vào bản update</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-[#1E1E1E] rounded-[8px] border border-[#E8E8E5] dark:border-[#333333] shadow-xs">
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-[#9E9E9C] absolute left-3 top-2.5" />
          <Input
            placeholder="Tìm theo tiêu đề, người gửi, module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8 bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-[#737373]">
            <Filter className="w-3.5 h-3.5 text-[#315C4C]" />
            <span>Loại:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 text-xs rounded-[6px] border border-[#E8E8E5] dark:border-[#333333] bg-[#F7F7F5] dark:bg-[#2A2A2A] px-2.5 text-[#202124] dark:text-[#F0F0F0] focus:outline-none"
          >
            <option value="all">Tất cả loại</option>
            <option value="bug">🐞 Báo lỗi (Bug)</option>
            <option value="feature">💡 Góp ý tính năng</option>
            <option value="ux">⚡ Trải nghiệm (UX)</option>
            <option value="other">💬 Ý kiến khác</option>
          </select>

          <span className="text-[#E8E8E5] dark:text-[#444444]">|</span>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 text-xs rounded-[6px] border border-[#E8E8E5] dark:border-[#333333] bg-[#F7F7F5] dark:bg-[#2A2A2A] px-2.5 text-[#202124] dark:text-[#F0F0F0] focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="resolved">Đã hoàn thành</option>
            <option value="closed">Đã đóng</option>
          </select>

          <span className="text-[#E8E8E5] dark:text-[#444444]">|</span>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="h-8 text-xs rounded-[6px] border border-[#E8E8E5] dark:border-[#333333] bg-[#F7F7F5] dark:bg-[#2A2A2A] px-2.5 text-[#202124] dark:text-[#F0F0F0] focus:outline-none"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="critical">🚨 Khẩn cấp</option>
            <option value="high">Cao</option>
            <option value="medium">Bình thường</option>
            <option value="low">Thấp</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      <Card className="border-[#E8E8E5] dark:border-[#333333] shadow-xs bg-white dark:bg-[#1E1E1E]">
        <CardHeader className="py-3 px-4 border-b border-[#F0F0ED] dark:border-[#2D2D2D] flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-[#202124] dark:text-[#F0F0F0]">
              Danh sách tiếp nhận ({filteredItems.length} mục)
            </CardTitle>
            <CardDescription className="text-xs text-[#737373] dark:text-[#9E9E9C]">
              Bấm vào từng mục để cập nhật tiến độ xử lý và ghi chú cho bản cập nhật mới
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CheckCircle2 className="w-10 h-10 text-[#2F7D55] mx-auto mb-2 opacity-60" />
              <p className="text-xs font-semibold text-[#202124] dark:text-[#F0F0F0]">
                Không tìm thấy phản hồi nào phù hợp bộ lọc
              </p>
              <p className="text-[11px] text-[#737373] dark:text-[#9E9E9C] mt-0.5">
                Mọi ý kiến đóng góp từ máy POS hoặc Dashboard sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0ED] dark:divide-[#2D2D2D]">
              {filteredItems.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-[#FBFBFA] dark:hover:bg-[#252525] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getTypeBadge(item.type)}
                        {getSeverityBadge(item.severity)}
                        {getStatusBadge(item.status)}
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {item.module}
                        </Badge>
                      </div>

                      <h3
                        onClick={() => handleSelectItem(item)}
                        className="text-xs sm:text-sm font-bold text-[#202124] dark:text-[#F0F0F0] hover:text-[#315C4C] dark:hover:text-[#A6C4B8] cursor-pointer transition-colors"
                      >
                        {item.title}
                      </h3>

                      <p className="text-xs text-[#555555] dark:text-[#BBBBBB] line-clamp-2">
                        {item.description}
                      </p>

                      {item.admin_notes && (
                        <div className="text-[11px] bg-[#EBF1EE]/60 dark:bg-[#25352C]/60 text-[#2F7D55] dark:text-[#A6C4B8] p-2 rounded-[6px] border border-[#2F7D55]/20 flex items-start gap-1.5 mt-1.5">
                          <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            <strong>Ghi chú cập nhật:</strong> {item.admin_notes}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-[#737373] dark:text-[#9E9E9C] pt-1">
                        <span>
                          Người báo: <strong>{item.reporter_name || 'Khách'}</strong> ({item.reporter_role || 'staff'})
                        </span>
                        <span>•</span>
                        <span>{formatDate(item.created_at)}</span>
                        {item.screenshot_url && (
                          <>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => setViewScreenshotUrl(item.screenshot_url!)}
                              className="text-[#315C4C] hover:underline font-semibold flex items-center gap-0.5"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Xem ảnh lỗi</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Status Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value as FeedbackStatus)}
                        className="h-8 text-xs font-semibold rounded-[6px] border border-[#E8E8E5] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] px-2 text-[#202124] dark:text-[#F0F0F0] focus:outline-none cursor-pointer"
                      >
                        <option value="pending">Chờ xử lý</option>
                        <option value="in_progress">Đang xử lý</option>
                        <option value="resolved">Đã hoàn thành</option>
                        <option value="closed">Đã đóng</option>
                      </select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectItem(item)}
                        className="h-8 text-xs"
                      >
                        <span>Chi tiết</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa báo cáo "${item.title}"?`)) {
                            deleteFeedback(item.id);
                          }
                        }}
                        className="h-8 px-2 text-[#C44536] hover:bg-[#FDF1F0] dark:hover:bg-[#3E1F1D]"
                        title="Xóa mục này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail / Update Resolution Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Chi Tiết Phản Hồi — #${selectedItem.id}`}
          description="Cập nhật trạng thái và ghi chú xử lý để chuẩn bị tài liệu cập nhật phiên bản mới."
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {getTypeBadge(selectedItem.type)}
              {getSeverityBadge(selectedItem.severity)}
              {getStatusBadge(selectedItem.status)}
              <Badge variant="outline" className="text-[10px]">
                {selectedItem.module}
              </Badge>
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#202124] dark:text-[#F0F0F0]">
                {selectedItem.title}
              </h2>
              <p className="text-xs text-[#555555] dark:text-[#CCCCCC] mt-1 whitespace-pre-wrap bg-[#FBFBFA] dark:bg-[#252525] p-3 rounded-[6px] border border-[#E8E8E5] dark:border-[#333333]">
                {selectedItem.description}
              </p>
            </div>

            {/* Attached Screenshot */}
            {selectedItem.screenshot_url && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#202124] dark:text-[#F0F0F0]">Ảnh minh chứng đính kèm:</span>
                <div className="max-h-60 overflow-hidden rounded-[6px] border border-[#E8E8E5] dark:border-[#333333] bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedItem.screenshot_url}
                    alt="Screenshot"
                    className="max-h-60 w-auto object-contain cursor-pointer hover:opacity-95"
                    onClick={() => setViewScreenshotUrl(selectedItem.screenshot_url!)}
                    title="Bấm để xem phóng to"
                  />
                </div>
              </div>
            )}

            {/* Diagnostics Metadata */}
            <div className="p-3 bg-[#F7F7F5] dark:bg-[#252525] rounded-[6px] border border-[#E8E8E5] dark:border-[#333333] text-xs space-y-1 text-[#737373] dark:text-[#9E9E9C]">
              <div className="flex justify-between">
                <span>Người báo cáo:</span>
                <span className="font-semibold text-[#202124] dark:text-[#F0F0F0]">
                  {selectedItem.reporter_name} ({selectedItem.reporter_role})
                </span>
              </div>
              {selectedItem.reporter_email && (
                <div className="flex justify-between">
                  <span>Liên hệ:</span>
                  <span className="text-[#202124] dark:text-[#F0F0F0]">{selectedItem.reporter_email}</span>
                </div>
              )}
              {selectedItem.page_url && (
                <div className="flex justify-between truncate">
                  <span>Trang gặp lỗi:</span>
                  <span className="text-[#315C4C] truncate max-w-xs">{selectedItem.page_url}</span>
                </div>
              )}
              {selectedItem.device_info && (
                <div className="flex justify-between">
                  <span>Thiết bị & Màn hình:</span>
                  <span>
                    {selectedItem.device_info.os} • {selectedItem.device_info.browser} • {selectedItem.device_info.screen}
                  </span>
                </div>
              )}
            </div>

            {/* Admin Resolution Notes Editor */}
            <div className="space-y-1.5 pt-2 border-t border-[#E8E8E5] dark:border-[#333333]">
              <label className="text-xs font-bold text-[#202124] dark:text-[#F0F0F0] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2F7D55]" />
                <span>Ghi chú xử lý / Kế hoạch update của Admin:</span>
              </label>
              <textarea
                rows={2}
                placeholder="VD: Đã fix trong bản build mới; hoặc Sẽ triển khai vào tuần tới..."
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                className="flex w-full rounded-[6px] border border-[#E8E8E5] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] px-3 py-2 text-xs text-[#202124] dark:text-[#F0F0F0] focus:outline-none focus:border-[#315C4C]"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#F0F0ED] dark:border-[#2D2D2D]">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updateStatus(selectedItem.id, 'resolved', editingNotes);
                    setSelectedItem(null);
                  }}
                  className="text-xs text-[#2F7D55] border-[#2F7D55]/30 hover:bg-[#EBF1EE]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Đánh dấu Đã hoàn thành</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)}>
                  Đóng
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    updateAdminNotes(selectedItem.id, editingNotes);
                    setSelectedItem(null);
                  }}
                >
                  Lưu ghi chú
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Zoom Screenshot Modal */}
      {viewScreenshotUrl && (
        <Modal
          isOpen={!!viewScreenshotUrl}
          onClose={() => setViewScreenshotUrl(null)}
          title="Ảnh Minh Chứng Báo Cáo Lỗi"
          maxWidth="xl"
        >
          <div className="p-2 text-center bg-black/5 dark:bg-white/5 rounded-[6px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewScreenshotUrl}
              alt="Ảnh phóng to"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded"
            />
          </div>
          <div className="pt-3 text-right">
            <Button variant="outline" size="sm" onClick={() => setViewScreenshotUrl(null)}>
              Đóng ảnh
            </Button>
          </div>
        </Modal>
      )}

      {/* Floating / Manual Submit Modal */}
      <FeedbackModal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} />
    </div>
  );
}
