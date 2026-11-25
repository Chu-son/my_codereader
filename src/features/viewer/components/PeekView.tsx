import { Fragment, useEffect } from 'react';
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  PanelRight,
  SquareArrowOutUpRight,
  X,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { PaneId } from '@/shared/types';
import { useAppStore } from '@/stores/useAppStore';
import { usePreferredSplitDirection } from '@/shared/hooks/useOrientation';
import { getFileName } from '@/shared/lib/fileUtils';
import { STRINGS } from '@/shared/constants/strings';
import { PeekEditor } from './PeekEditor';

const ICON_BUTTON =
  'touch-target shrink-0 rounded-lg transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]';

/**
 * 定義を浮かぶ枠で見る（Peek）。枠はペインの下側に 1 枚だけ出し、本文の読んでいる位置は動かさない。
 * 枠の中で識別子をタップすると、その定義へ枠の中身を進め、パンくずで戻れる。
 */
export function PeekView({ pane }: { pane: PaneId }) {
  const direction = usePreferredSplitDirection();
  const { stack, popPeekTo, setPeekVisible, navigateTo, openInOtherPane } = useAppStore(
    useShallow((s) => ({
      stack: s.peek && s.peek.pane === pane && s.peek.visible ? s.peek.stack : null,
      popPeekTo: s.popPeekTo,
      setPeekVisible: s.setPeekVisible,
      navigateTo: s.navigateTo,
      openInOtherPane: s.openInOtherPane,
    })),
  );
  const top = stack?.at(-1);
  const isOpen = !!top;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // メニューが開いていれば、先にメニューだけを閉じる（FloatingMenu が defaultPrevented にする）
      if (e.key === 'Escape' && !e.defaultPrevented) setPeekVisible(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setPeekVisible]);

  if (!stack || !top) return null;

  // 開いたら Peek は役目を終えるので閉じる（道筋は残り、ツールバーから開き直せる）
  const openAndClose = (open: () => Promise<void>) => () => {
    setPeekVisible(false);
    void open();
  };

  return (
    <section
      id="peek-view"
      aria-label={STRINGS.viewer.peekTitle(top.name)}
      className="absolute inset-x-3 flex flex-col rounded-xl border overflow-hidden"
      style={{
        bottom: 'var(--toolbar-clearance)',
        height: '55%',
        minHeight: 160,
        maxHeight: 'calc(100% - var(--toolbar-clearance) - 8px)',
        zIndex: 'var(--z-peek)',
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--accent-blue)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <header
        className="flex items-center gap-1 pl-2 pr-1 shrink-0 border-b"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <nav
          aria-label={STRINGS.viewer.peekTrail}
          className="flex-1 min-w-0 flex items-center overflow-x-auto"
        >
          {stack.map((entry, i) => {
            const isCurrent = i === stack.length - 1;
            return (
              <Fragment key={`${i}:${entry.path}:${entry.line}`}>
                {i > 0 && <ChevronRight size={14} className="shrink-0 text-[var(--text-muted)]" />}
                <button
                  onClick={() => popPeekTo(i)}
                  disabled={isCurrent}
                  aria-current={isCurrent ? 'location' : undefined}
                  aria-label={isCurrent ? undefined : STRINGS.viewer.peekTrailEntry(entry.name)}
                  className={`shrink-0 min-h-[44px] px-2 rounded-md font-mono text-[13px] transition-colors ${
                    isCurrent
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {entry.name}
                </button>
              </Fragment>
            );
          })}
          <span className="shrink-0 pl-2 text-[11px] text-[var(--text-muted)]">
            {STRINGS.viewer.peekLocation(getFileName(top.path), top.line)}
          </span>
        </nav>
        <button
          onClick={openAndClose(() => navigateTo(top.path, { line: top.line, pane }))}
          className={ICON_BUTTON}
          title={STRINGS.viewer.peekOpenHere}
          aria-label={STRINGS.viewer.peekOpenHere}
        >
          <SquareArrowOutUpRight size={18} />
        </button>
        <button
          onClick={openAndClose(() => openInOtherPane(top.path, { line: top.line, direction }))}
          className={ICON_BUTTON}
          title={STRINGS.viewer.openLineInOtherPane}
          aria-label={STRINGS.viewer.openLineInOtherPane}
        >
          <PanelRight size={18} />
        </button>
        <button
          onClick={() => setPeekVisible(false)}
          className={ICON_BUTTON}
          aria-label={STRINGS.viewer.peekClose}
        >
          <X size={18} />
        </button>
      </header>
      <div className="flex-1 min-h-0 relative">
        {/* 定義ごとに作り直す（スクロール位置と目印を、その定義の行から始めるため） */}
        <PeekBody key={`${stack.length}:${top.path}:${top.line}`} {...top} />
      </div>
      <p
        className="px-3 py-1 shrink-0 text-[11px] text-[var(--text-muted)] border-t"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        {STRINGS.viewer.peekHint}
      </p>
    </section>
  );
}

function PeekBody({ path, line }: { path: string; line: number }) {
  const file = useAppStore((s) => s.files[path]);
  if (!file || file.loading) {
    return (
      <div className="h-full flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
        <Loader2 size={18} className="animate-spin text-[var(--accent-blue)]" />
        {STRINGS.viewer.fileLoading}
      </div>
    );
  }
  if (file.error) {
    return (
      <div className="h-full flex items-center justify-center gap-2 px-4 text-xs text-[var(--text-muted)]">
        <AlertCircle size={16} className="shrink-0 text-[var(--accent-red)]" />
        {file.error}
      </div>
    );
  }
  return <PeekEditor path={path} line={line} content={file.content} />;
}
