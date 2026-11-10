'use client';

import * as React from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const [isOpen, setIsOpen] = React.useState(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[6px] border border-[#E8E8E5] bg-white hover:bg-[#F7F7F5] transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-[#315C4C] text-white flex items-center justify-center shrink-0 text-xs font-semibold">
            {activeWorkspace?.name.charAt(0) || 'W'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#202124] truncate leading-tight">
              {activeWorkspace?.name || 'Select Workspace'}
            </p>
            <p className="text-[10px] text-[#737373] truncate leading-tight">
              {activeWorkspace?.currency || 'VND'}
            </p>
          </div>
        </div>
        <ChevronsUpDown className="w-3.5 h-3.5 text-[#9E9E9C] shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E8E8E5] rounded-[6px] shadow-sm z-50 py-1">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-[#737373] uppercase tracking-wider">
            Không gian làm việc
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
                  'w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left hover:bg-[#F7F7F5] transition-colors',
                  isSelected ? 'font-semibold text-[#315C4C]' : 'text-[#202124]'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                  <span className="truncate">{ws.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#315C4C] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
