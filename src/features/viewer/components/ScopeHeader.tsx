import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { EditorView } from '@codemirror/view';
import { ChevronRight } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { getFileName } from '@/shared/lib/fileUtils';
import { STRINGS } from '@/shared/constants/strings';
import { findScopeChain } from '../lib/symbols';

interface ScopeHeaderProps {
  view: EditorView | null;
  filePath: string;
}

/** 集中モードの固定ヘッダー。タブが隠れている間のファイル名と、宣言がスクロールで見えなくなった囲みを示す */
export function ScopeHeader({ view, filePath }: ScopeHeaderProps) {
  const symbols = useAppStore((s) => s.symbols[filePath]);

  // store を通さず、スクロールのたびに行だけを読む（行が変わったときだけ再描画される）
  const subscribe = useCallback(
    (notify: () => void) => {
      const scroller = view?.scrollDOM;
      scroller?.addEventListener('scroll', notify, { passive: true });
      return () => scroller?.removeEventListener('scroll', notify);
    },
    [view],
  );
  const topLine = useSyncExternalStore(subscribe, () =>
    view ? view.state.doc.lineAt(view.lineBlockAtHeight(view.scrollDOM.scrollTop).from).number : 1,
  );
  const chain = useMemo(() => findScopeChain(symbols ?? [], topLine), [symbols, topLine]);

  return (
    <div
      role="status"
      aria-label={STRINGS.viewer.scope}
      className="flex items-center gap-1 h-7 px-3 shrink-0 border-b text-xs font-mono overflow-hidden whitespace-nowrap text-[var(--text-secondary)]"
      style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--header-bg)' }}
    >
      <span className="truncate shrink-0 max-w-[50%]">{getFileName(filePath)}</span>
      {chain.map((symbol) => (
        <span key={symbol.from} className="flex items-center gap-1 min-w-0">
          <ChevronRight size={12} className="shrink-0 text-[var(--text-muted)]" />
          <span className="truncate text-[var(--text-primary)]">{symbol.name}</span>
        </span>
      ))}
    </div>
  );
}
