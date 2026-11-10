import { History } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { getFileIcon, getFileName } from '@/shared/lib/fileUtils';
import { STRINGS } from '@/shared/constants/strings';

/** 行位置つきのジャンプ履歴（左パネル）。新しいものを上に並べ、タップでその場所へ移る */
export function HistoryList() {
  const { history, historyIndex, isSplitView, goToHistory } = useAppStore(
    useShallow((s) => ({
      history: s.history,
      historyIndex: s.historyIndex,
      isSplitView: s.isSplitView,
      goToHistory: s.goToHistory,
    })),
  );

  return (
    <div id="history-list" className="h-full overflow-y-auto select-none">
      <div
        className="flex items-center px-3 h-8 text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-10"
        style={{ color: 'var(--text-muted)', backgroundColor: 'var(--sidebar-bg)' }}
      >
        {STRINGS.shell.history}
      </div>
      {history.length === 0 ? (
        <div className="px-4 py-8 flex flex-col items-center gap-3 text-center">
          <History size={24} className="text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-muted)]">{STRINGS.viewer.historyEmpty}</p>
        </div>
      ) : (
        <ol className="py-1">
          {history
            .map((entry, i) => ({ entry, i }))
            .reverse()
            .map(({ entry, i }) => {
              const current = i === historyIndex;
              const FileIcon = getFileIcon(entry.path);
              const dir = entry.path.slice(0, -getFileName(entry.path).length).replace(/\/$/, '');
              return (
                <li key={i}>
                  <button
                    onClick={() => goToHistory(i)}
                    aria-current={current ? 'location' : undefined}
                    aria-label={STRINGS.viewer.historyEntry(entry.path, entry.line)}
                    className={`w-full flex items-center gap-1.5 min-h-[44px] px-3 text-left transition-colors ${
                      current ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'
                    } ${i > historyIndex ? 'opacity-60' : ''}`}
                  >
                    <FileIcon size={14} className="shrink-0 text-[var(--text-secondary)]" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-1">
                        <span className="text-[13px] truncate text-[var(--text-primary)]">
                          {getFileName(entry.path)}
                        </span>
                        <span className="text-xs shrink-0 text-[var(--text-muted)]">
                          :{entry.line}
                        </span>
                      </span>
                      {dir && (
                        <span className="block text-[11px] truncate text-[var(--text-muted)]">
                          {dir}
                        </span>
                      )}
                    </span>
                    {isSplitView && (
                      <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                        {entry.pane}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
        </ol>
      )}
    </div>
  );
}
