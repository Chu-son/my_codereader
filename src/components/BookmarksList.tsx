import { useAppStore } from '@/stores/useAppStore';
import { Bookmark as BookmarkIcon, Trash2, FileCode2 } from 'lucide-react';

const getBasename = (path: string) => path.split('/').pop() || path;

export function BookmarksList() {
  const { bookmarks, currentRepo, removeBookmark, openFile, setJumpTarget } = useAppStore();

  if (!currentRepo) return null;

  const repoBookmarks = bookmarks.filter((b) => b.repo === currentRepo);

  if (repoBookmarks.length === 0) {
    return (
      <div className="px-4 py-6 flex flex-col items-center gap-2 text-center border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <BookmarkIcon size={24} className="text-[var(--text-muted)]" />
        <p className="text-xs text-[var(--text-muted)]">ブックマークはありません</p>
      </div>
    );
  }

  const handleBookmarkClick = async (path: string, line: number) => {
    await openFile(path, 1);
    setJumpTarget({ path, line, timestamp: Date.now() });
  };

  return (
    <div className="border-b shrink-0 max-h-[30%] overflow-y-auto" style={{ borderColor: 'var(--border-primary)' }}>
      <div
        className="flex items-center px-3 h-7 text-[11px] font-semibold uppercase tracking-wider sticky top-0 z-10"
        style={{
          color: 'var(--text-muted)',
          backgroundColor: 'var(--sidebar-bg)',
        }}
      >
        ブックマーク
      </div>
      <div className="py-1">
        {repoBookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="group relative flex flex-col px-3 py-1.5 hover:bg-[var(--bg-hover)] cursor-pointer"
            onClick={() => handleBookmarkClick(bookmark.path, bookmark.line)}
          >
            <div className="flex items-center gap-1.5 justify-between">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <FileCode2 size={14} className="text-[var(--accent-blue)] shrink-0" />
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {getBasename(bookmark.path)}
                </span>
                <span className="text-xs text-[var(--text-muted)] shrink-0">
                  :{bookmark.line}
                </span>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--accent-red)]"
                onClick={(e) => {
                  e.stopPropagation();
                  removeBookmark(bookmark.id);
                }}
                title="ブックマークを削除"
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
