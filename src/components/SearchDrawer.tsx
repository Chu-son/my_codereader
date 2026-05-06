// ========================================
// SearchDrawer Component
// ========================================

import { useState, type FormEvent, useEffect, useRef } from 'react';
import { Drawer } from 'vaul';
import { Search, FileCode, Loader2, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { getFileName } from '@/lib/fileUtils';

export function SearchDrawer() {
  const {
    searchDrawerOpen,
    searchQuery,
    searchResults,
    searchLoading,
    pat,
    setSearchDrawerOpen,
    searchInRepo,
    openFile,
  } = useAppStore();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // ドロワーが開かれた時にクエリを同期 & フォーカス
  useEffect(() => {
    if (searchDrawerOpen) {
      setLocalQuery(searchQuery);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchDrawerOpen, searchQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      searchInRepo(localQuery.trim());
    }
  };

  const handleResultClick = (path: string) => {
    openFile(path);
    setSearchDrawerOpen(false);
  };

  return (
    <Drawer.Root
      open={searchDrawerOpen}
      onOpenChange={setSearchDrawerOpen}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0"
          style={{ zIndex: 'var(--z-drawer)' }}
        />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-2xl outline-none"
          style={{
            zIndex: 'var(--z-drawer)',
            maxHeight: '90dvh',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          {/* ドラッグハンドル */}
          <div className="flex justify-center pt-3 pb-2">
            <div
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: 'var(--border-secondary)' }}
            />
          </div>
          <Drawer.Title className="sr-only">検索</Drawer.Title>

          {/* 検索入力 */}
          <div className="px-4 pb-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="検索文字列を入力..."
                  className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border outline-none transition-colors focus:border-[var(--accent-blue)]"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!localQuery.trim() || searchLoading}
                className="h-10 px-4 text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--accent-blue)',
                  color: 'var(--bg-tertiary)',
                }}
              >
                {searchLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  '検索'
                )}
              </button>
            </form>

            {/* 検索モード表示 */}
            {!pat && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--accent-yellow)]">
                <AlertCircle size={12} />
                <span>
                  PAT未設定: ファイル名と開いているファイルのみ検索可能です
                </span>
              </div>
            )}
          </div>

          {/* 検索結果 */}
          <div
            className="flex-1 overflow-y-auto border-t"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  size={24}
                  className="animate-spin text-[var(--accent-blue)]"
                />
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {/* 結果件数 */}
                <div className="px-4 py-2 text-xs text-[var(--text-muted)] sticky top-0"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  {searchResults.length}件の結果
                </div>

                {searchResults.map((result, i) => (
                  <button
                    key={`${result.path}-${result.lineNumber}-${i}`}
                    className="flex items-start gap-3 w-full px-4 py-2.5 text-left transition-colors hover:bg-[var(--bg-hover)]"
                    onClick={() => handleResultClick(result.path)}
                  >
                    <FileCode
                      size={16}
                      className="shrink-0 mt-0.5 text-[var(--text-muted)]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-medium text-[var(--accent-blue)] truncate-text">
                          {getFileName(result.path)}
                        </span>
                        {result.lineNumber > 0 && (
                          <span className="text-xs text-[var(--text-muted)] shrink-0">
                            :{result.lineNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate-text">
                        {result.path}
                      </div>
                      {result.lineContent && (
                        <div
                          className="text-xs mt-1 font-mono truncate-text"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {result.lineContent}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery && !searchLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search size={32} className="text-[var(--text-muted)] mb-3" />
                <p className="text-sm text-[var(--text-muted)]">
                  結果が見つかりませんでした
                </p>
              </div>
            ) : null}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
