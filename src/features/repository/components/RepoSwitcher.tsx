import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { BranchSelector } from './BranchSelector';

/** リポジトリ名の表示と、owner/repo の入力フォームを切り替えるヘッダー部品 */
export function RepoSwitcher() {
  const { currentRepo, treeLoading, loadRepository, clearRepo } = useAppStore(
    useShallow((s) => ({
      currentRepo: s.currentRepo,
      treeLoading: s.treeLoading,
      loadRepository: s.loadRepository,
      clearRepo: s.clearRepo,
    })),
  );

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

  if (showRepoInput || !currentRepo) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <div className="relative flex-1">
          <input
            id="repo-input"
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="owner/repo (例: facebook/react)"
            aria-label="リポジトリ (owner/repo)"
            className="w-full h-8 pl-3 pr-8 text-sm rounded-md border outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
            autoFocus
          />
          {repoInput && (
            <button
              type="button"
              onClick={() => {
                setRepoInput('');
                document.getElementById('repo-input')?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
              title="クリア"
              aria-label="クリア"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!repoInput.trim() || treeLoading}
          className="touch-target rounded-md transition-colors disabled:opacity-40"
          style={{ backgroundColor: 'var(--accent-blue)', color: 'var(--bg-tertiary)' }}
          aria-label="読み込む"
        >
          {treeLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
        </button>
        {currentRepo && (
          <button
            type="button"
            onClick={() => setShowRepoInput(false)}
            className="h-8 px-3 text-sm rounded-md transition-colors"
            style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
          >
            キャンセル
          </button>
        )}
      </form>
    );
  }

  return (
    <div id="repo-display-container" className="flex items-center gap-1 h-8 max-w-full">
      {treeLoading && <Loader2 size={14} className="animate-spin text-[var(--accent-blue)]" />}
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
  );
}
