import { Bookmark } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, selectFocusedPath, viewKey } from '@/stores/useAppStore';
import { STRINGS } from '@/shared/constants/strings';

const PREVIEW_MAX_LENGTH = 50;

function createBookmarkId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** アクティブなペインのカーソル行をブックマークに追加・解除するボタン */
export function BookmarkToggleButton() {
  const {
    currentRepo,
    currentBranch,
    activePath,
    activeLine,
    bookmarks,
    content,
    addBookmark,
    removeBookmark,
  } = useAppStore(
    useShallow((s) => {
      const path = selectFocusedPath(s);
      return {
        currentRepo: s.currentRepo,
        currentBranch: s.currentBranch,
        activePath: path,
        activeLine: path ? (s.viewState[viewKey(s.focusedPane, path)]?.cursorLine ?? null) : null,
        bookmarks: s.bookmarks,
        content: path ? s.files[path]?.content : undefined,
        addBookmark: s.addBookmark,
        removeBookmark: s.removeBookmark,
      };
    }),
  );

  const currentBookmark =
    activePath && activeLine && currentRepo
      ? bookmarks.find(
          (b) => b.repo === currentRepo && b.path === activePath && b.line === activeLine,
        )
      : null;

  const handleToggle = () => {
    if (!activePath || !activeLine || !currentRepo || !currentBranch) return;

    if (currentBookmark) {
      removeBookmark(currentBookmark.id);
      return;
    }
    // 一覧で見分けられるよう、対象行の先頭部分をプレビューとして保存する
    let text = content?.split('\n')[activeLine - 1]?.trim() ?? '';
    if (text.length > PREVIEW_MAX_LENGTH) text = text.slice(0, PREVIEW_MAX_LENGTH) + '...';

    addBookmark({
      id: createBookmarkId(),
      repo: currentRepo,
      branch: currentBranch,
      path: activePath,
      line: activeLine,
      text,
    });
  };

  const canToggle = Boolean(activePath && activeLine);
  const label = currentBookmark ? STRINGS.bookmarks.remove : STRINGS.bookmarks.add;
  return (
    <button
      id="bookmark-toggle"
      onClick={handleToggle}
      className="touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-40"
      disabled={!canToggle}
      title={canToggle ? label : STRINGS.bookmarks.selectLine}
      aria-label={label}
    >
      <Bookmark
        size={18}
        className={
          currentBookmark
            ? 'text-[var(--accent-blue)] fill-current'
            : 'text-[var(--text-secondary)]'
        }
      />
    </button>
  );
}
