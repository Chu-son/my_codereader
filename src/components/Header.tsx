// ========================================
// Header Component
// ========================================

import { useState, type FormEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftOpen,
  PanelLeftClose,
  Columns2,
  Rows2,
  Settings,
  Search,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { BranchSelector } from '@/components/BranchSelector';

export function Header() {
  const {
    currentRepo,
    treeLoading,
    sidebarOpen,
    isSplitView,
    splitDirection,
    navigationIndex,
    navigationHistory,
    toggleSidebar,
    toggleSplitView,
    setSettingsOpen,
    setSearchDrawerOpen,
    loadRepository,
    navigateBack,
    navigateForward,
    clearRepo,
  } = useAppStore();

  const [repoInput, setRepoInput] = useState('');
  const [showRepoInput, setShowRepoInput] = useState(!currentRepo);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (repoInput.trim()) {
      loadRepository(repoInput.trim());
      setShowRepoInput(false);
    }
  };

  const handleRepoClick = () => {
    setRepoInput(currentRepo ?? '');
    setShowRepoInput(true);
  };

  const handleChangeRepo = () => {
    clearRepo();
    setRepoInput('');
    setShowRepoInput(true);
  };

  return (
    <header
      id="app-header"
      className="flex items-center gap-1 px-2 border-b select-none shrink-0"
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-primary)',
      }}
    >
      {/* サイドバートグル */}
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className="touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
        title={sidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
      >
        {sidebarOpen ? (
          <PanelLeftClose size={18} className="text-[var(--text-secondary)]" />
        ) : (
          <PanelLeftOpen size={18} className="text-[var(--text-secondary)]" />
        )}
      </button>

      {/* 戻る / 進む */}
      <button
        id="nav-back"
        onClick={navigateBack}
        disabled={navigationIndex <= 0}
        className="touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30"
      >
        <ChevronLeft size={18} className="text-[var(--text-secondary)]" />
      </button>
      <button
        id="nav-forward"
        onClick={navigateForward}
        disabled={navigationIndex >= navigationHistory.length - 1}
        className="touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30"
      >
        <ChevronRight size={18} className="text-[var(--text-secondary)]" />
      </button>

      {/* リポジトリ名 or 入力フォーム */}
      <div className="flex-1 min-w-0 mx-2">
        {showRepoInput || !currentRepo ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              id="repo-input"
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repo (例: facebook/react)"
              className="flex-1 h-8 px-3 text-sm rounded-md border outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={!repoInput.trim() || treeLoading}
              className="touch-target rounded-md transition-colors disabled:opacity-40"
              style={{
                backgroundColor: 'var(--accent-blue)',
                color: 'var(--bg-tertiary)',
              }}
            >
              {treeLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowRight size={18} />
              )}
            </button>
            {currentRepo && (
              <button
                type="button"
                onClick={() => setShowRepoInput(false)}
                className="h-8 px-3 text-sm rounded-md transition-colors"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  color: 'var(--text-secondary)',
                }}
              >
                キャンセル
              </button>
            )}
          </form>
        ) : (
          <div
            id="repo-display-container"
            className="flex items-center gap-1 h-8 max-w-full"
          >
            {treeLoading && (
              <Loader2
                size={14}
                className="animate-spin text-[var(--accent-blue)]"
              />
            )}
            <button
              id="repo-name-btn"
              onClick={handleRepoClick}
              onDoubleClick={handleChangeRepo}
              className="flex items-center px-2 h-full rounded-md transition-colors hover:bg-[var(--bg-hover)] text-sm font-medium text-[var(--text-primary)] truncate-text"
            >
              {currentRepo}
            </button>
            <BranchSelector />
          </div>
        )}
      </div>

      {/* 右側ボタン群 */}
      <div className="flex items-center gap-0.5">
        {/* 検索ボタン */}
        <button
          id="search-toggle"
          onClick={() => setSearchDrawerOpen(true)}
          className="touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          title="検索"
        >
          <Search size={18} className="text-[var(--text-secondary)]" />
        </button>

        {/* 画面分割トグル */}
        <button
          id="split-toggle"
          onClick={toggleSplitView}
          className={`touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)] ${
            isSplitView ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'
          }`}
          title={isSplitView ? '分割方向を切り替え / 分割を解除' : '画面を分割'}
        >
          {splitDirection === 'vertical' ? <Rows2 size={18} /> : <Columns2 size={18} />}
        </button>

        {/* 設定ボタン */}
        <button
          id="settings-toggle"
          onClick={() => setSettingsOpen(true)}
          className="touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          title="設定"
        >
          <Settings size={18} className="text-[var(--text-secondary)]" />
        </button>
      </div>
    </header>
  );
}
