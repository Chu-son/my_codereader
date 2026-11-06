import { Bookmark, Files, History, Search, Settings, type LucideIcon } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, type SidePanel } from '@/stores/useAppStore';
import { STRINGS } from '@/shared/constants/strings';

const RAIL_BUTTON =
  'flex items-center justify-center w-12 h-12 rounded-xl transition-colors hover:bg-[var(--bg-hover)]';

// アウトラインはシンボル抽出（C）の段で加える
const PANELS: { panel: SidePanel; label: string; Icon: LucideIcon }[] = [
  { panel: 'explorer', label: STRINGS.shell.explorer, Icon: Files },
  { panel: 'bookmarks', label: STRINGS.shell.bookmarks, Icon: Bookmark },
  { panel: 'history', label: STRINGS.shell.history, Icon: History },
];

/** 左端のアクティビティレール。左パネルの切り替えと、検索・設定の入口 */
export function ActivityRail() {
  const { activePanel, togglePanel, setSearchDrawerOpen, setSettingsOpen } = useAppStore(
    useShallow((s) => ({
      activePanel: s.activePanel,
      togglePanel: s.togglePanel,
      setSearchDrawerOpen: s.setSearchDrawerOpen,
      setSettingsOpen: s.setSettingsOpen,
    })),
  );

  return (
    <nav
      id="activity-rail"
      aria-label={STRINGS.shell.rail}
      className="flex flex-col items-center gap-1 py-2 border-r shrink-0 select-none"
      style={{
        width: 'var(--rail-width)',
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-primary)',
      }}
    >
      {PANELS.map(({ panel, label, Icon }) => {
        const active = activePanel === panel;
        return (
          <button
            key={panel}
            id={`rail-${panel}`}
            onClick={() => togglePanel(panel)}
            className={`${RAIL_BUTTON} ${
              active
                ? 'text-[var(--accent-blue)] bg-[var(--bg-active)]'
                : 'text-[var(--text-secondary)]'
            }`}
            title={label}
            aria-label={label}
            aria-pressed={active}
          >
            <Icon size={22} />
          </button>
        );
      })}
      {/* 検索は結果一覧を広く使うため、パネルではなく既存のドロワーを開く */}
      <button
        id="search-toggle"
        onClick={() => setSearchDrawerOpen(true)}
        className={`${RAIL_BUTTON} text-[var(--text-secondary)]`}
        title={STRINGS.common.search}
        aria-label={STRINGS.common.search}
      >
        <Search size={22} />
      </button>

      <button
        id="settings-toggle"
        onClick={() => setSettingsOpen(true)}
        className={`${RAIL_BUTTON} mt-auto text-[var(--text-secondary)]`}
        title={STRINGS.common.settings}
        aria-label={STRINGS.common.settings}
      >
        <Settings size={22} />
      </button>
    </nav>
  );
}
