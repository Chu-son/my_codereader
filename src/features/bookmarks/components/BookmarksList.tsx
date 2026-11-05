import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { Bookmark as BookmarkIcon, Trash2, FileCode2 } from 'lucide-react';
import { STRINGS } from '@/shared/constants/strings';

const getBasename = (path: string) => path.split('/').pop() || path;

export function BookmarksList() {
  const { bookmarks, currentRepo, removeBookmark, navigateTo } = useAppStore(
    useShallow((s) => ({
      bookmarks: s.bookmarks,
      currentRepo: s.currentRepo,
      removeBookmark: s.removeBookmark,
      navigateTo: s.navigateTo,
    })),
  );

  if (!currentRepo) return null;

  const repoBookmarks = bookmarks.filter((b) => b.repo === currentRepo);

  if (repoBookmarks.length === 0) {
    return (
      <div className="px-4 py-6 flex flex-col items-center gap-2 text-center">
        <BookmarkIcon size={24} className="text-[var(--text-muted)]" />
        <p className="text-xs text-[var(--text-muted)]">{STRINGS.bookmarks.empty}</p>
      </div>
    );
  }

  const handleBookmarkClick = async (path: string, line: number) => {
    await navigateTo(path, { line });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div
        className="flex items-center px-3 h-8 text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-10"
        style={{
          color: 'var(--text-muted)',
          backgroundColor: 'var(--sidebar-bg)',
        }}
      >
        {STRINGS.bookmarks.title}
      </div>
      <div className="py-1">
        {repoBookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="relative flex flex-col justify-center min-h-[44px] pl-3 py-1 hover:bg-[var(--bg-hover)] cursor-pointer"
            onClick={() => handleBookmarkClick(bookmark.path, bookmark.line)}
          >
            <div className="flex items-center gap-1.5 justify-between">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <FileCode2 size={14} className="text-[var(--accent-blue)] shrink-0" />
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {getBasename(bookmark.path)}
                </span>
                <span className="text-xs text-[var(--text-muted)] shrink-0">:{bookmark.line}</span>
              </div>
              {/* タッチ端末にはホバーが無いため、削除ボタンは常に表示する */}
              <button
                className="touch-target shrink-0 rounded hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--accent-red)]"
                onClick={(e) => {
                  e.stopPropagation();
                  removeBookmark(bookmark.id);
                }}
                title={STRINGS.bookmarks.delete}
                aria-label={STRINGS.bookmarks.delete}
              >
                <Trash2 size={14} />
              </button>
            </div>
            {bookmark.text && (
              <div className="text-xs text-[var(--text-muted)] truncate pl-[20px] mt-0.5 font-mono">
                {bookmark.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
