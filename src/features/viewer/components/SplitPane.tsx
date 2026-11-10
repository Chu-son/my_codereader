import { lazy, Suspense } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { useShallow } from 'zustand/react/shallow';
import type { PaneId } from '@/shared/types';
import { useAppStore } from '@/stores/useAppStore';
import { FileTabs } from './FileTabs';
import { CodeViewer } from './CodeViewer';
import { PeekView } from './PeekView';
const MarkdownPreview = lazy(() =>
  import('./MarkdownPreview').then((m) => ({ default: m.MarkdownPreview })),
);
import { isMarkdownFile } from '@/shared/lib/fileUtils';
import { FileCode, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { STRINGS } from '@/shared/constants/strings';

interface PaneContentProps {
  pane: PaneId;
}

function PaneContent({ pane }: PaneContentProps) {
  const { activeFile, isFocused, isSplitView, focusMode, ensureFile, focusPane } = useAppStore(
    useShallow((s) => {
      const path = s.panes[pane].active;
      return {
        activeFile: path ? s.files[path] : undefined,
        isFocused: s.focusedPane === pane,
        isSplitView: s.isSplitView,
        focusMode: s.focusMode,
        ensureFile: s.ensureFile,
        focusPane: s.focusPane,
      };
    }),
  );

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: 'var(--bg-primary)',
        // 分割時は、ツリーや検索から開く先（操作中のペイン）が分かるよう上端に線を引く
        boxShadow: isSplitView && isFocused ? 'inset 0 2px 0 var(--accent-blue)' : undefined,
      }}
      onPointerDownCapture={() => {
        if (!isFocused) focusPane(pane);
      }}
    >
      {/* タブバー */}
      {!focusMode && <FileTabs pane={pane} />}

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-hidden relative">
        {activeFile ? (
          activeFile.loading ? (
            <LoadingState />
          ) : activeFile.error ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center px-8 max-w-md">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent-red-soft)' }}
                >
                  <AlertCircle size={32} className="text-[var(--accent-red)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                    {STRINGS.viewer.fileLoadFailedTitle}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mb-4">{activeFile.error}</p>
                  <button
                    onClick={() => void ensureFile(activeFile.path)}
                    className="h-9 px-4 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 mx-auto"
                    style={{
                      backgroundColor: 'var(--accent-blue)',
                      color: 'var(--bg-tertiary)',
                    }}
                  >
                    <RefreshCw size={14} />
                    {STRINGS.viewer.reload}
                  </button>
                </div>
              </div>
            </div>
          ) : isMarkdownFile(activeFile.path) ? (
            <Suspense fallback={<LoadingState />}>
              <MarkdownPreview content={activeFile.content} />
            </Suspense>
          ) : (
            <CodeViewer
              key={activeFile.path}
              pane={pane}
              filePath={activeFile.path}
              content={activeFile.content}
            />
          )
        ) : (
          <EmptyState />
        )}
        {/* タブを切り替えても残るよう、エディタではなくペインに置く */}
        <PeekView pane={pane} />
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
          <p className="text-sm text-[var(--text-muted)] mb-1">{STRINGS.viewer.noFileTitle}</p>
          <p className="text-xs text-[var(--text-muted)] opacity-60">{STRINGS.viewer.noFileHint}</p>
        </div>
      </div>
    </div>
  );
}

export function SplitPane() {
  const { isSplitView, splitDirection } = useAppStore(
    useShallow((s) => ({ isSplitView: s.isSplitView, splitDirection: s.splitDirection })),
  );

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

function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin text-[var(--accent-blue)]" />
        <span className="text-sm text-[var(--text-muted)]">{STRINGS.viewer.fileLoading}</span>
      </div>
    </div>
  );
}
