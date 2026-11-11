'use client';

import * as React from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Building2, Check, ChevronsUpDown, Plus, Users2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace } = useWorkspaceStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // New Workspace Form
  const [name, setName] = React.useState('');
  const [currency, setCurrency] = React.useState('VND');
  const [isCollab, setIsCollab] = React.useState(false);
  const [collabPartner, setCollabPartner] = React.useState('');

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    createWorkspace(
      name.trim(),
      currency,
      isCollab,
      isCollab && collabPartner.trim() ? `Hợp tác cùng: ${collabPartner.trim()}` : undefined
    );

    setName('');
    setCollabPartner('');
    setIsCollab(false);
    setIsModalOpen(false);
    setIsOpen(false);
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[6px] border border-[#E8E8E5] dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-[#F7F7F5] dark:hover:bg-neutral-800 transition-colors text-left"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                'w-6 h-6 rounded-[4px] text-white flex items-center justify-center shrink-0 text-xs font-semibold',
                activeWorkspace?.is_collab ? 'bg-[#B7791F]' : 'bg-[#315C4C]'
              )}
            >
              {activeWorkspace?.is_collab ? (
                <Users2 className="w-3.5 h-3.5" />
              ) : (
                activeWorkspace?.name.charAt(0) || 'W'
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-[#202124] dark:text-neutral-200 truncate leading-tight">
                  {activeWorkspace?.name || 'Select Workspace'}
                </p>
                {activeWorkspace?.is_collab && (
                  <Badge variant="warning" className="text-[9px] px-1 py-0 shrink-0">
                    Collab
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-[#737373] dark:text-neutral-400 truncate leading-tight">
                {activeWorkspace?.currency || 'VND'}
              </p>
            </div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-[#9E9E9C] shrink-0" />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-neutral-900 border border-[#E8E8E5] dark:border-neutral-800 rounded-[6px] shadow-md z-50 py-1 max-h-72 overflow-y-auto">
            <div className="px-2.5 py-1 text-[10px] font-semibold text-[#737373] dark:text-neutral-400 uppercase tracking-wider">
              Không gian & Dự án Collab
            </div>

            {workspaces.map((ws) => {
              const isSelected = ws.id === activeWorkspace?.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    setActiveWorkspace(ws);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 text-xs text-left hover:bg-[#F7F7F5] dark:hover:bg-neutral-800 transition-colors border-b border-[#F5F5F3] dark:border-neutral-800 last:border-b-0',
                    isSelected ? 'font-semibold text-[#315C4C] dark:text-emerald-400' : 'text-[#202124] dark:text-neutral-200'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-[3px] text-white flex items-center justify-center shrink-0 text-[10px] font-bold',
                        ws.is_collab ? 'bg-[#B7791F]' : 'bg-[#315C4C]'
                      )}
                    >
                      {ws.is_collab ? <Users2 className="w-3 h-3" /> : ws.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{ws.name}</span>
                        {ws.is_collab && (
                          <span className="text-[9px] font-mono text-[#B7791F] bg-[#FEF7EC] dark:bg-amber-950/60 px-1 rounded">
                            Collab
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#315C4C] dark:text-emerald-400 shrink-0" />}
                </button>
              );
            })}

            <div className="p-1.5 border-t border-[#E8E8E5] dark:border-neutral-800 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs gap-1 justify-center text-[#315C4C] dark:text-emerald-400 border-dashed border-[#315C4C]/40 dark:border-emerald-600/40 hover:bg-[#EBF1EE] dark:hover:bg-emerald-950/40"
                onClick={() => {
                  setIsModalOpen(true);
                  setIsOpen(false);
                }}
              >
                <Plus className="w-3 h-3" />
                <span>Thêm Dự án / Gian hàng Collab mới</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Workspace / Collab Project */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo Không gian hoặc Dự án Collab mới"
        description="Quản lý độc lập từng tour diễn, dự án hợp tác liên danh (collab), hoặc gian hàng tại các lễ hội/comic con khác nhau."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-ws-name" required>
              Tên Không gian / Dự án Collab
            </Label>
            <Input
              id="create-ws-name"
              required
              placeholder="VD: Collab Hạc Cầm x M-TP Merch, Pop-up Comic Con..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="p-3 bg-[#F7F7F5] border border-[#E8E8E5] rounded-[6px] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#202124]">
                  Dự án Hợp tác / Liên danh (Collab)
                </p>
                <p className="text-[11px] text-[#737373]">
                  Bật nếu đây là gian hàng hợp tác chung với nghệ sĩ, ban nhạc hoặc đối tác khác.
                </p>
              </div>
              <input
                type="checkbox"
                id="is-collab"
                checked={isCollab}
                onChange={(e) => setIsCollab(e.target.checked)}
                className="w-4 h-4 rounded border-[#E8E8E5] text-[#315C4C] focus:ring-[#315C4C]"
              />
            </div>

            {isCollab && (
              <div className="space-y-1.5 pt-2 border-t border-[#E8E8E5]">
                <Label htmlFor="collab-partner">Tên Đối tác / Gian hàng Collab</Label>
                <Input
                  id="collab-partner"
                  placeholder="VD: Cá Hồi Hoang, Cổ Động, The Cassette, Hãng Đĩa Thời Đại..."
                  value={collabPartner}
                  onChange={(e) => setCollabPartner(e.target.value)}
                  className="bg-white"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-ws-curr">Tiền tệ thanh toán</Label>
            <select
              id="create-ws-curr"
              className="flex h-9 w-full rounded-[6px] border border-[#E8E8E5] bg-white px-3 py-1.5 text-sm text-[#202124] focus:outline-none focus:border-[#315C4C]"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="VND">VND (Việt Nam Đồng - ₫)</option>
              <option value="USD">USD (US Dollar - $)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0ED]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Khởi tạo ngay
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
