// ========================================
// BranchSelector Component
// ========================================

import { useState, useRef, useEffect } from 'react';
import { GitBranch, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

export function BranchSelector() {
  const { currentBranch, branches, branchesLoading, switchBranch } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBranchClick = (branchName: string) => {
    if (branchName !== currentBranch) {
      switchBranch(branchName);
    }
    setIsOpen(false);
  };

  if (!currentBranch) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 h-8 rounded-md transition-colors hover:bg-[var(--bg-hover)] text-xs text-[var(--text-secondary)]"
        title="ブランチを切り替え"
      >
        <GitBranch size={14} className={branchesLoading ? 'animate-pulse' : ''} />
        <span className="font-medium truncate max-w-[120px]">{currentBranch}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-64 max-h-[320px] overflow-y-auto rounded-lg border shadow-xl animate-fade-in"
          style={{
            zIndex: 'var(--z-overlay)',
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-2">
              ブランチを切り替え
            </span>
          </div>

          <div className="py-1">
            {branchesLoading && branches.length === 0 ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={18} className="animate-spin text-[var(--accent-blue)]" />
              </div>
            ) : (
              branches.map((branch) => (
                <button
                  key={branch.name}
                  onClick={() => handleBranchClick(branch.name)}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                >
                  <span className={branch.name === currentBranch ? 'text-[var(--accent-blue)] font-medium' : 'text-[var(--text-primary)]'}>
                    {branch.name}
                  </span>
                  {branch.name === currentBranch && (
                    <Check size={14} className="text-[var(--accent-blue)]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
