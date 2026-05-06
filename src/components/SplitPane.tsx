// ========================================
// SplitPane Component
// ========================================

import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { useAppStore } from '@/stores/useAppStore';
import { FileTabs } from '@/components/FileTabs';
import { CodeViewer } from '@/components/CodeViewer';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import { isMarkdownFile } from '@/lib/fileUtils';
import { FileCode, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface PaneContentProps {
  pane: 1 | 2;
}

function PaneContent({ pane }: PaneContentProps) {
  const {
    openedFiles,
    activePane1FilePath,
    activePane2FilePath,
    retryFile,
  } = useAppStore();

  const activeFilePath =
    pane === 1 ? activePane1FilePath : activePane2FilePath;

  const activeFile = openedFiles.find((f) => f.path === activeFilePath);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* タブバー */}
      <FileTabs pane={pane} />

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          activeFile.loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2
                  size={24}
                  className="animate-spin text-[var(--accent-blue)]"
                />
                <span className="text-sm text-[var(--text-muted)]">
                  ファイルを読み込み中...
                </span>
              </div>
            </div>
          ) : activeFile.error ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center px-8 max-w-md">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(243, 139, 168, 0.1)' }}
                >
                  <AlertCircle size={32} className="text-[var(--accent-red)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                    ファイルを読み込めませんでした
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mb-4">
                    {activeFile.error}
                  </p>
                  <button
                    onClick={() => retryFile(activeFile.path)}
                    className="h-9 px-4 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    style={{
                      backgroundColor: 'var(--accent-blue)',
                      color: 'var(--bg-tertiary)',
                    }}
                  >
                    <RefreshCw size={14} />
                    再読み込み
                  </button>
                </div>
              </div>
            </div>
          ) : isMarkdownFile(activeFile.path) ? (
            <MarkdownPreview content={activeFile.content} />
          ) : (
            <CodeViewer
              filePath={activeFile.path}
              content={activeFile.content}
              scrollPos={activeFile.scrollPos}
            />
          )
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <FileCode size={28} className="text-[var(--text-muted)]" />
        </div>
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">
            ファイルが選択されていません
          </p>
          <p className="text-xs text-[var(--text-muted)] opacity-60">
            サイドバーのエクスプローラーからファイルを選択してください
          </p>
        </div>
      </div>
    </div>
  );
}

export function SplitPane() {
  const { isSplitView, splitDirection } = useAppStore();

  if (!isSplitView) {
    return <PaneContent pane={1} />;
  }

  return (
    <Allotment key={splitDirection} vertical={splitDirection === 'vertical'}>
      <Allotment.Pane minSize={200}>
        <PaneContent pane={1} />
      </Allotment.Pane>
      <Allotment.Pane minSize={200}>
        <PaneContent pane={2} />
      </Allotment.Pane>
    </Allotment>
  );
}
