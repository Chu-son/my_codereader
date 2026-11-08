import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  FileSearch,
  PictureInPicture2,
  Rows2,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, selectCanGoBack, selectCanGoForward } from '@/stores/useAppStore';
import { BookmarkToggleButton } from '@/features/bookmarks';
import { TrailBar } from '@/features/viewer';
import { usePreferredSplitDirection } from '@/shared/hooks/useOrientation';
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
 * 上にジャンプの軌跡バーを重ね、戻る・進むの行き先を見えるようにする。
 * Peek は単語のメニューから開き、ここでは閉じる・開き直すだけを受け持つ。
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
    hasPeek,
    peekVisible,
    setPeekVisible,
    setQuickOpenOpen,
  } = useAppStore(
    useShallow((s) => ({
      isSplitView: s.isSplitView,
      splitDirection: s.splitDirection,
      canGoBack: selectCanGoBack(s),
      canGoForward: selectCanGoForward(s),
      toggleSplitView: s.toggleSplitView,
      navigateBack: s.navigateBack,
      navigateForward: s.navigateForward,
      hasPeek: s.peek !== null,
      peekVisible: s.peek?.visible ?? false,
      setPeekVisible: s.setPeekVisible,
      setQuickOpenOpen: s.setQuickOpenOpen,
    })),
  );

  const preferredSplit = usePreferredSplitDirection();
  const peekLabel = !hasPeek
    ? STRINGS.viewer.peekUnavailable
    : peekVisible
      ? STRINGS.viewer.peekClose
      : STRINGS.viewer.peekReopen;
  const splitLabel = isSplitView ? STRINGS.header.splitToggle : STRINGS.header.splitStart;

  return (
    <div
      className={
        portrait
          ? 'flex flex-col shrink-0 border-t'
          : // 軌跡バーが長くても本文の幅を超えないよう、左右に余白を残して中央に寄せる
            'absolute bottom-3 inset-x-4 flex flex-col items-center gap-1 pointer-events-none'
      }
      style={{
        borderColor: 'var(--border-primary)',
        backgroundColor: portrait ? 'var(--header-bg)' : undefined,
        zIndex: portrait ? undefined : 'var(--z-overlay)',
      }}
    >
      <div
        className={
          portrait
            ? 'flex px-2 empty:hidden'
            : 'flex max-w-full px-1 rounded-full border pointer-events-auto empty:hidden'
        }
        style={
          portrait
            ? undefined
            : {
                backgroundColor: 'var(--header-bg)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-card)',
              }
        }
      >
        <TrailBar />
      </div>
      <div
        id="thumb-toolbar"
        role="toolbar"
        aria-label={STRINGS.shell.toolbar}
        className={
          portrait
            ? 'flex items-center justify-around px-2 py-1 select-none'
            : 'flex items-center gap-1 px-2 py-1 rounded-full border select-none pointer-events-auto'
        }
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--border-primary)',
          // 下端の safe area は App の外枠が空けている
          ...(portrait ? {} : { boxShadow: 'var(--shadow-card)' }),
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
          id="peek-toggle"
          onClick={() => setPeekVisible(!peekVisible)}
          disabled={!hasPeek}
          aria-pressed={peekVisible}
          className={`${ICON_BUTTON} ${peekVisible ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}
          title={peekLabel}
          aria-label={peekLabel}
        >
          <PictureInPicture2 size={20} />
        </button>
        <button
          id="split-toggle"
          onClick={() => toggleSplitView(preferredSplit)}
          className={`${ICON_BUTTON} ${isSplitView ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}
          title={splitLabel}
          aria-label={splitLabel}
        >
          {splitDirection === 'vertical' ? <Rows2 size={20} /> : <Columns2 size={20} />}
        </button>
        <button
          id="quick-open"
          onClick={() => setQuickOpenOpen(true)}
          className={`${ICON_BUTTON} text-[var(--text-secondary)]`}
          title={STRINGS.quickOpen.open}
          aria-label={STRINGS.quickOpen.open}
        >
          <FileSearch size={20} />
        </button>
      </div>
    </div>
  );
}
