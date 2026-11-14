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
          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-border dark:border-border bg-surface dark:bg-surface hover:bg-background dark:hover:bg-surface-hover transition-colors text-left"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                'w-6 h-6 rounded-lg text-white flex items-center justify-center shrink-0 text-xs font-semibold',
                activeWorkspace?.is_collab ? 'bg-warning' : 'bg-primary'
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
                <p className="text-xs font-semibold text-foreground dark:text-foreground truncate leading-tight">
                  {activeWorkspace?.name || 'Chọn Không Gian Làm Việc'}
                </p>
                {activeWorkspace?.is_collab && (
                  <Badge variant="warning" className="text-[9px] px-1 py-0 shrink-0">
                    Collab
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted dark:text-muted truncate leading-tight">
                {activeWorkspace?.currency || 'VND'}
              </p>
            </div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted shrink-0" />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface dark:bg-surface border border-border dark:border-border rounded-lg shadow-md z-50 py-1 max-h-72 overflow-y-auto">
            <div className="px-2.5 py-1 text-[10px] font-semibold text-muted dark:text-muted uppercase tracking-wider">
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
                    'w-full flex items-center justify-between px-2.5 py-2 text-xs text-left hover:bg-background dark:hover:bg-surface-hover transition-colors border-b border-border dark:border-border last:border-b-0',
                    isSelected ? 'font-semibold text-primary dark:text-success' : 'text-foreground dark:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-[3px] text-white flex items-center justify-center shrink-0 text-[10px] font-bold',
                        ws.is_collab ? 'bg-warning' : 'bg-primary'
                      )}
                    >
                      {ws.is_collab ? <Users2 className="w-3 h-3" /> : ws.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{ws.name}</span>
                        {ws.is_collab && (
                          <span className="text-[9px] font-mono text-warning bg-warning-bg dark:bg-amber-950/60 px-1 rounded">
                            Collab
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary dark:text-success shrink-0" />}
                </button>
              );
            })}

            <div className="p-1.5 border-t border-border dark:border-border mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs gap-1 justify-center text-primary dark:text-success border-dashed border-primary/40 dark:border-emerald-600/40 hover:bg-warning-bg dark:hover:bg-success-bg/40"
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

          <div className="p-3 bg-background border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Dự án Hợp tác / Liên danh (Collab)
                </p>
                <p className="text-[11px] text-muted">
                  Bật nếu đây là gian hàng hợp tác chung với nghệ sĩ, ban nhạc hoặc đối tác khác.
                </p>
              </div>
              <input
                type="checkbox"
                id="is-collab"
                checked={isCollab}
                onChange={(e) => setIsCollab(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            {isCollab && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <Label htmlFor="collab-partner">Tên Đối tác / Gian hàng Collab</Label>
                <Input
                  id="collab-partner"
                  placeholder="VD: Cá Hồi Hoang, Cổ Động, The Cassette, Hãng Đĩa Thời Đại..."
                  value={collabPartner}
                  onChange={(e) => setCollabPartner(e.target.value)}
                  className="bg-surface"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-ws-curr">Tiền tệ thanh toán</Label>
            <select
              id="create-ws-curr"
              className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
              value="VND"
              disabled
            >
              <option value="VND">VND (Việt Nam Đồng - ₫)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
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
