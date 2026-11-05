import { ChevronLeft, ChevronRight, Columns2, Rows2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, selectCanGoBack, selectCanGoForward } from '@/stores/useAppStore';
import { BookmarkToggleButton } from '@/features/bookmarks';
import { STRINGS } from '@/shared/constants/strings';

const ICON_BUTTON =
  'touch-target rounded-full transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30';

interface ThumbToolbarProps {
  /**
   * 縦向き。本文の上に浮かせず画面下端に固定する。
   * 分割も上下で始める（縦長の画面を左右に割ると 1 行が短くなりすぎるため）
   */
  portrait: boolean;
}

/**
 * 親指ツールバー。iPad を持ったまま届く下端に、頻繁に使う移動操作を集める。
 * Peek とクイックオープンは、それぞれの機能の段で加える。
 */
export function ThumbToolbar({ portrait }: ThumbToolbarProps) {
  const {
    isSplitView,
    splitDirection,
    canGoBack,
    canGoForward,
    toggleSplitView,
    navigateBack,
    navigateForward,
  } = useAppStore(
    useShallow((s) => ({
      isSplitView: s.isSplitView,
      splitDirection: s.splitDirection,
      canGoBack: selectCanGoBack(s),
      canGoForward: selectCanGoForward(s),
      toggleSplitView: s.toggleSplitView,
      navigateBack: s.navigateBack,
      navigateForward: s.navigateForward,
    })),
  );

  const splitLabel = isSplitView ? STRINGS.header.splitToggle : STRINGS.header.splitStart;

  return (
    <div
      id="thumb-toolbar"
      role="toolbar"
      aria-label={STRINGS.shell.toolbar}
      className={
        portrait
          ? 'flex items-center justify-around shrink-0 px-2 py-1 border-t select-none'
          : 'absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full border select-none'
      }
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-primary)',
        // 下端の safe area は App の外枠が空けている
        ...(portrait ? {} : { boxShadow: 'var(--shadow-card)', zIndex: 'var(--z-overlay)' }),
      }}
    >
      <button
        id="nav-back"
        onClick={navigateBack}
        disabled={!canGoBack}
        className={`${ICON_BUTTON} text-[var(--text-secondary)]`}
        aria-label={STRINGS.header.back}
      >
        <ChevronLeft size={22} />
      </button>
      <button
        id="nav-forward"
        onClick={navigateForward}
        disabled={!canGoForward}
        className={`${ICON_BUTTON} text-[var(--text-secondary)]`}
        aria-label={STRINGS.header.forward}
      >
        <ChevronRight size={22} />
      </button>
      <BookmarkToggleButton />
      <button
        id="split-toggle"
        onClick={() => toggleSplitView(portrait ? 'vertical' : 'horizontal')}
        className={`${ICON_BUTTON} ${isSplitView ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}
        title={splitLabel}
        aria-label={splitLabel}
      >
        {splitDirection === 'vertical' ? <Rows2 size={20} /> : <Columns2 size={20} />}
      </button>
    </div>
  );
}
