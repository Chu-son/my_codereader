import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { OpenEditors } from '@/features/viewer';
import { FileTree } from './FileTree';
import { FolderGit2 } from 'lucide-react';
import { STRINGS } from '@/shared/constants/strings';

/** エクスプローラーのパネル（開いているファイル + ツリー）。外枠はアプリのシェルが持つ */
export function ExplorerPanel() {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const { treeData, treeLoading, treeError, treeTruncated, currentRepo } = useAppStore(
    useShallow((s) => ({
      treeData: s.treeData,
      treeLoading: s.treeLoading,
      treeError: s.treeError,
      treeTruncated: s.treeTruncated,
      currentRepo: s.currentRepo,
    })),
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Open Editors セクション */}
      <div
        className="border-b shrink-0 max-h-[40%] overflow-y-auto"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <OpenEditors />
      </div>

      {/* Explorer セクション */}
      <div
        ref={setScrollElement}
        className="flex-1 overflow-y-auto relative"
        style={{
          overscrollBehaviorY: 'none',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
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
          {STRINGS.explorer.title}
        </div>

        {/* ローディング */}
        {treeLoading && (
          <div className="px-4 py-8 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[var(--text-muted)]">{STRINGS.common.loading}</span>
          </div>
        )}

        {/* エラー */}
        {treeError && (
          <div className="px-4 py-4">
            <div
              className="text-sm p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--accent-red-soft)',
                borderColor: 'var(--accent-red)',
                color: 'var(--accent-red)',
              }}
            >
              {treeError}
            </div>
          </div>
        )}

        {/* 一部のみ取得した旨の通知 */}
        {treeTruncated && !treeLoading && !treeError && (
          <div role="status" className="mx-4 my-2 text-xs text-[var(--accent-yellow)]">
            {STRINGS.explorer.truncated}
          </div>
        )}

        {/* ツリー */}
        {!treeLoading && !treeError && treeData.length > 0 && (
          <FileTree nodes={treeData} scrollElement={scrollElement} />
        )}

        {/* 空状態 */}
        {!treeLoading && !treeError && treeData.length === 0 && !currentRepo && (
          <div className="px-4 py-12 flex flex-col items-center gap-3 text-center">
            <FolderGit2 size={40} className="text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">
              {STRINGS.explorer.emptyLine1}
              <br />
              {STRINGS.explorer.emptyLine2}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
