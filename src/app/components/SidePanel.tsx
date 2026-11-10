import { useAppStore } from '@/stores/useAppStore';
import { ExplorerPanel } from '@/features/explorer';
import { BookmarksList } from '@/features/bookmarks';
import { HistoryList, OutlinePanel } from '@/features/viewer';

/** アクティビティレールで選んだ左パネル。閉じているときは何も描かない */
export function SidePanel() {
  const activePanel = useAppStore((s) => s.activePanel);
  if (!activePanel) return null;

  return (
    <aside
      id="side-panel"
      className="border-r shrink-0 overflow-hidden"
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--sidebar-bg)',
        borderColor: 'var(--border-primary)',
        overscrollBehaviorY: 'none',
      }}
    >
      {activePanel === 'explorer' ? (
        <ExplorerPanel />
      ) : activePanel === 'outline' ? (
        <OutlinePanel />
      ) : activePanel === 'bookmarks' ? (
        <BookmarksList />
      ) : (
        <HistoryList />
      )}
    </aside>
  );
}
