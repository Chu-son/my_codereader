import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  PanelLeftClose,
  PanelLeftOpen,
  Rows2,
  Search,
  Settings,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { RepoSwitcher } from '@/features/repository';
import { BookmarkToggleButton } from '@/features/bookmarks';
import { STRINGS } from '@/shared/constants/strings';

const ICON_BUTTON = 'touch-target rounded-lg transition-colors hover:bg-[var(--bg-hover)]';
const ICON_COLOR = 'text-[var(--text-secondary)]';

export function Header() {
  const {
    sidebarOpen,
    isSplitView,
    splitDirection,
    navigationIndex,
    navigationHistory,
    toggleSidebar,
    toggleSplitView,
    setSettingsOpen,
    setSearchDrawerOpen,
    navigateBack,
    navigateForward,
  } = useAppStore(
    useShallow((s) => ({
      sidebarOpen: s.sidebarOpen,
      isSplitView: s.isSplitView,
      splitDirection: s.splitDirection,
      navigationIndex: s.navigationIndex,
      navigationHistory: s.navigationHistory,
      toggleSidebar: s.toggleSidebar,
      toggleSplitView: s.toggleSplitView,
      setSettingsOpen: s.setSettingsOpen,
      setSearchDrawerOpen: s.setSearchDrawerOpen,
      navigateBack: s.navigateBack,
      navigateForward: s.navigateForward,
    })),
  );

  const sidebarLabel = sidebarOpen ? STRINGS.header.sidebarClose : STRINGS.header.sidebarOpen;
  const splitLabel = isSplitView ? STRINGS.header.splitToggle : STRINGS.header.splitStart;

  return (
    <header
      id="app-header"
      className="flex items-center gap-1 px-2 border-b select-none shrink-0"
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-primary)',
      }}
    >
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className={ICON_BUTTON}
        title={sidebarLabel}
        aria-label={sidebarLabel}
      >
        {sidebarOpen ? (
          <PanelLeftClose size={18} className={ICON_COLOR} />
        ) : (
          <PanelLeftOpen size={18} className={ICON_COLOR} />
        )}
      </button>

      <button
        id="nav-back"
        onClick={navigateBack}
        disabled={navigationIndex <= 0}
        className={`${ICON_BUTTON} disabled:opacity-30`}
        aria-label={STRINGS.header.back}
      >
        <ChevronLeft size={18} className={ICON_COLOR} />
      </button>
      <button
        id="nav-forward"
        onClick={navigateForward}
        disabled={navigationIndex >= navigationHistory.length - 1}
        className={`${ICON_BUTTON} disabled:opacity-30`}
        aria-label={STRINGS.header.forward}
      >
        <ChevronRight size={18} className={ICON_COLOR} />
      </button>

      <div className="flex-1 min-w-0 mx-2">
        <RepoSwitcher />
      </div>

      <div className="flex items-center gap-0.5">
        <BookmarkToggleButton />
        <button
          id="search-toggle"
          onClick={() => setSearchDrawerOpen(true)}
          className={ICON_BUTTON}
          title={STRINGS.common.search}
          aria-label={STRINGS.common.search}
        >
          <Search size={18} className={ICON_COLOR} />
        </button>
        <button
          id="split-toggle"
          onClick={toggleSplitView}
          className={`${ICON_BUTTON} ${isSplitView ? 'text-[var(--accent-blue)]' : ICON_COLOR}`}
          title={splitLabel}
          aria-label={splitLabel}
        >
          {splitDirection === 'vertical' ? <Rows2 size={18} /> : <Columns2 size={18} />}
        </button>
        <button
          id="settings-toggle"
          onClick={() => setSettingsOpen(true)}
          className={ICON_BUTTON}
          title={STRINGS.common.settings}
          aria-label={STRINGS.common.settings}
        >
          <Settings size={18} className={ICON_COLOR} />
        </button>
      </div>
    </header>
  );
}
