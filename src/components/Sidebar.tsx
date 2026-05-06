// ========================================
// Sidebar Component
// ========================================

import { useAppStore } from '@/stores/useAppStore';
import { OpenEditors } from '@/components/OpenEditors';
import { FileTree } from '@/components/FileTree';
import { FolderGit2 } from 'lucide-react';

export function Sidebar() {
  const { sidebarOpen, treeData, treeLoading, treeError, currentRepo } =
    useAppStore();

  if (!sidebarOpen) return null;

  return (
    <>
      {/* モバイル用オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/30 md:hidden"
        style={{ zIndex: 'var(--z-overlay)' }}
        onClick={() => useAppStore.getState().toggleSidebar()}
      />

      <aside
        id="sidebar"
        className="flex flex-col border-r shrink-0 animate-fade-in overflow-hidden
                   fixed md:relative left-0"
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--border-primary)',
          zIndex: 'var(--z-sidebar)',
          top: 'var(--header-height)',
          bottom: 0,
          overscrollBehaviorY: 'none',
        }}
      >
        {/* Open Editors セクション */}
        <div className="border-b shrink-0 max-h-[40%] overflow-y-auto" style={{ borderColor: 'var(--border-primary)' }}>
          <OpenEditors />
        </div>

        {/* Explorer セクション */}
        <div 
          className="flex-1 overflow-y-auto scroll-smooth" 
          style={{ 
            overscrollBehaviorY: 'none',
            paddingBottom: 'calc(100px + env(safe-area-inset-bottom))'
          }}
        >
          {/* セクションヘッダー */}
          <div
            className="flex items-center px-3 h-7 text-[11px] font-semibold uppercase tracking-wider sticky top-0"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--sidebar-bg)',
            }}
          >
            エクスプローラー
          </div>

          {/* ローディング */}
          {treeLoading && (
            <div className="px-4 py-8 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[var(--text-muted)]">読み込み中...</span>
            </div>
          )}

          {/* エラー */}
          {treeError && (
            <div className="px-4 py-4">
              <div
                className="text-sm p-3 rounded-lg border"
                style={{
                  backgroundColor: 'rgba(243, 139, 168, 0.1)',
                  borderColor: 'var(--accent-red)',
                  color: 'var(--accent-red)',
                }}
              >
                {treeError}
              </div>
            </div>
          )}

          {/* ツリー */}
          {!treeLoading && !treeError && treeData.length > 0 && (
            <FileTree nodes={treeData} />
          )}

          {/* 空状態 */}
          {!treeLoading && !treeError && treeData.length === 0 && !currentRepo && (
            <div className="px-4 py-12 flex flex-col items-center gap-3 text-center">
              <FolderGit2 size={40} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                リポジトリを入力して
                <br />
                読み込みを開始してください
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
