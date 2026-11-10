import { useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Braces,
  Hash,
  ListTree,
  Package,
  SquareFunction,
  Type,
  Variable,
  type LucideIcon,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { SymbolKind } from '@/shared/types';
import { useAppStore, selectFocusedPath, viewKey } from '@/stores/useAppStore';
import { getFileName } from '@/shared/lib/fileUtils';
import { STRINGS } from '@/shared/constants/strings';
import { findEnclosingSymbol } from '../lib/symbols';

const KIND_STYLE: Record<SymbolKind, { Icon: LucideIcon; color: string }> = {
  function: { Icon: SquareFunction, color: 'var(--accent-purple)' },
  method: { Icon: SquareFunction, color: 'var(--accent-purple)' },
  class: { Icon: Box, color: 'var(--accent-yellow)' },
  interface: { Icon: Braces, color: 'var(--accent-teal)' },
  type: { Icon: Type, color: 'var(--accent-teal)' },
  enum: { Icon: Hash, color: 'var(--accent-yellow)' },
  variable: { Icon: Variable, color: 'var(--accent-blue)' },
  property: { Icon: Variable, color: 'var(--accent-blue)' },
  module: { Icon: Package, color: 'var(--accent-green)' },
};

const INDENT_PX = 14;

/**
 * 操作中のペインで開いているファイルの宣言一覧。カーソルのある宣言に目印を付ける。
 * 選ぶと navigateTo で移動するので、ジャンプ履歴に乗る。
 */
export function OutlinePanel() {
  const { path, pane, symbols, cursorLine, navigateTo } = useAppStore(
    useShallow((s) => {
      const focused = selectFocusedPath(s);
      return {
        path: focused,
        pane: s.focusedPane,
        symbols: focused ? s.symbols[focused] : undefined,
        cursorLine: focused ? (s.viewState[viewKey(s.focusedPane, focused)]?.cursorLine ?? 0) : 0,
        navigateTo: s.navigateTo,
      };
    }),
  );
  const current = useMemo(
    () => (symbols ? findEnclosingSymbol(symbols, cursorLine) : null),
    [symbols, cursorLine],
  );
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest' });
  }, [current]);

  return (
    <div id="outline-panel" className="flex flex-col h-full select-none">
      <div
        className="flex items-center gap-2 px-3 h-11 shrink-0 border-b text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)', borderColor: 'var(--border-primary)' }}
      >
        <ListTree size={14} />
        <span className="truncate-text normal-case tracking-normal font-normal">
          {path ? getFileName(path) : STRINGS.shell.outline}
        </span>
      </div>

      {!path || !symbols || symbols.length === 0 ? (
        <p className="px-4 py-6 text-xs leading-relaxed text-[var(--text-muted)]">
          {path ? STRINGS.viewer.outlineEmpty : STRINGS.viewer.outlineNoFile}
        </p>
      ) : (
        <ul className="flex-1 overflow-y-auto py-1">
          {symbols.map((symbol) => {
            const { Icon, color } = KIND_STYLE[symbol.kind];
            const isCurrent = symbol === current;
            return (
              <li key={`${symbol.from}:${symbol.name}`}>
                <button
                  ref={isCurrent ? currentRef : undefined}
                  onClick={() => void navigateTo(path, { line: symbol.line, pane })}
                  aria-current={isCurrent ? 'location' : undefined}
                  aria-label={STRINGS.viewer.outlineEntry(symbol.name, symbol.line)}
                  className={`w-full flex items-center gap-2 pr-3 min-h-[44px] text-left transition-colors ${
                    isCurrent ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'
                  }`}
                  style={{ paddingLeft: 12 + symbol.depth * INDENT_PX }}
                >
                  <Icon size={14} className="shrink-0" style={{ color }} />
                  <span
                    className={`flex-1 min-w-0 font-mono text-[13px] truncate-text ${
                      isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {symbol.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                    {symbol.line}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
