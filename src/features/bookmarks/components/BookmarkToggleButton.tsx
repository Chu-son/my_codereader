import { Bookmark } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';

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
    activeCursorLines,
    bookmarks,
    openedFiles,
    addBookmark,
    removeBookmark,
  } = useAppStore(
    useShallow((s) => ({
      currentRepo: s.currentRepo,
      currentBranch: s.currentBranch,
      activePath: s.activePane1FilePath,
      activeCursorLines: s.activeCursorLines,
      bookmarks: s.bookmarks,
      openedFiles: s.openedFiles,
      addBookmark: s.addBookmark,
      removeBookmark: s.removeBookmark,
    })),
  );

  const activeLine = activePath ? activeCursorLines[activePath] : null;
  const currentBookmark =
    activePath && activeLine && currentRepo
      ? bookmarks.find(
          (b) => b.repo === currentRepo && b.path === activePath && b.line === activeLine,
        )
      : null;

  const handleToggle = () => {
    if (!activePath || !activeLine) {
      alert('ブックマークする行を選択してください');
      return;
    }
    if (!currentRepo || !currentBranch) return;

    if (currentBookmark) {
      removeBookmark(currentBookmark.id);
      return;
    }
    // 一覧で見分けられるよう、対象行の先頭部分をプレビューとして保存する
    const content = openedFiles.find((f) => f.path === activePath)?.content;
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

  const label = currentBookmark ? 'ブックマークを解除' : 'ブックマークを追加';
  return (
    <button
      id="bookmark-toggle"
      onClick={handleToggle}
      className="touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
      title={label}
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
