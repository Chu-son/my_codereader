import { Bookmark } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, selectFocusedPath, viewKey, findBookmark } from '@/stores/useAppStore';
import { STRINGS } from '@/shared/constants/strings';

/** アクティブなペインのカーソル行をブックマークに追加・解除するボタン */
export function BookmarkToggleButton() {
  const { activePath, activeLine, isBookmarked, toggleBookmark } = useAppStore(
    useShallow((s) => {
      const path = selectFocusedPath(s);
      const line = path ? (s.viewState[viewKey(s.focusedPane, path)]?.cursorLine ?? null) : null;
      return {
        activePath: path,
        activeLine: line,
        isBookmarked: Boolean(path && line && findBookmark(s.bookmarks, s.currentRepo, path, line)),
        toggleBookmark: s.toggleBookmark,
      };
    }),
  );

  const canToggle = Boolean(activePath && activeLine);
  const label = isBookmarked ? STRINGS.bookmarks.remove : STRINGS.bookmarks.add;
  return (
    <button
      id="bookmark-toggle"
      onClick={() => {
        if (activePath && activeLine) toggleBookmark(activePath, activeLine);
      }}
      className="touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-40"
      disabled={!canToggle}
      title={canToggle ? label : STRINGS.bookmarks.selectLine}
      aria-label={label}
    >
      <Bookmark
        size={18}
        className={
          isBookmarked ? 'text-[var(--accent-blue)] fill-current' : 'text-[var(--text-secondary)]'
        }
      />
    </button>
  );
}
