import { ChevronLeft, ChevronRight, Columns2, Rows2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, selectCanGoBack, selectCanGoForward } from '@/stores/useAppStore';
import { BookmarkToggleButton } from '@/features/bookmarks';
import { STRINGS } from '@/shared/constants/strings';

const ICON_BUTTON =
  'touch-target rounded-full transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30';

/**
 * 画面下中央の親指ツールバー。iPad を両手で持ったまま届く位置に、頻繁に使う移動操作を集める。
 * Peek とクイックオープンは、それぞれの機能の段で加える。
 */
export function ThumbToolbar() {
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
      className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full border select-none"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-primary)',
        boxShadow: 'var(--shadow-card)',
        zIndex: 'var(--z-overlay)',
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
        onClick={toggleSplitView}
        className={`${ICON_BUTTON} ${isSplitView ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}
        title={splitLabel}
        aria-label={splitLabel}
      >
        {splitDirection === 'vertical' ? <Rows2 size={20} /> : <Columns2 size={20} />}
      </button>
    </div>
  );
}
