import { Fragment, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { getFileName } from '@/shared/lib/fileUtils';
import { STRINGS } from '@/shared/constants/strings';

/**
 * ジャンプの軌跡バー。履歴を 1 本の流れとして横に並べ、どこから来てどこまで潜ったかを見せる。
 * 項目をタップすると、その位置へ戻る（進む）。2 件未満のときは何も描かない。
 */
export function TrailBar() {
  const { history, historyIndex, isSplitView, goToHistory } = useAppStore(
    useShallow((s) => ({
      history: s.history,
      historyIndex: s.historyIndex,
      isSplitView: s.isSplitView,
      goToHistory: s.goToHistory,
    })),
  );
  const ref = useRef<HTMLElement>(null);

  // 現在地が見えるよう横にスクロールする
  useEffect(() => {
    ref.current
      ?.querySelector('[aria-current="location"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [historyIndex, history.length]);

  if (history.length < 2) return null;

  return (
    <nav
      id="trail-bar"
      ref={ref}
      aria-label={STRINGS.shell.trail}
      className="flex items-center min-w-0 max-w-full overflow-x-auto select-none"
      style={{ scrollbarWidth: 'none' }}
    >
      {history.map((entry, i) => {
        const current = i === historyIndex;
        return (
          <Fragment key={i}>
            {i > 0 && <ChevronRight size={12} className="shrink-0 text-[var(--text-muted)]" />}
            {/* 見た目は小さなチップだが、タップ領域は 44px を確保する */}
            <button
              onClick={() => goToHistory(i)}
              aria-current={current ? 'location' : undefined}
              aria-label={STRINGS.viewer.historyEntry(entry.path, entry.line)}
              title={entry.path}
              className="shrink-0 h-11 px-0.5 flex items-center"
            >
              <span
                className={`flex items-center gap-1 h-7 px-2.5 rounded-full border text-xs whitespace-nowrap ${
                  current
                    ? 'border-[var(--accent-blue)] text-[var(--text-primary)] bg-[var(--accent-blue-soft)]'
                    : i > historyIndex
                      ? 'border-[var(--border-primary)] text-[var(--text-muted)]'
                      : 'border-[var(--border-primary)] text-[var(--text-secondary)]'
                }`}
              >
                {isSplitView && <span className="text-[10px] opacity-70">{entry.pane}</span>}
                {getFileName(entry.path)}
                <span className="text-[var(--text-muted)]">:{entry.line}</span>
              </span>
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}
