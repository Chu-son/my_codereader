import type { SliceCreator } from '../types';

/** アクティビティレールで切り替える左パネル。検索は既存のドロワーを開くため含めない */
export type SidePanel = 'explorer' | 'bookmarks' | 'outline';

export interface UiSlice {
  /** 開いている左パネル。null なら閉じている */
  activePanel: SidePanel | null;
  searchDrawerOpen: boolean;
  settingsOpen: boolean;
  /** 開いているパネルを再度選ぶと閉じる */
  togglePanel: (panel: SidePanel) => void;
  setSearchDrawerOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
}

export const createUiSlice: SliceCreator<UiSlice> = (set) => ({
  activePanel: 'explorer',
  searchDrawerOpen: false,
  settingsOpen: false,

  togglePanel: (panel) =>
    set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  setSearchDrawerOpen: (open) => set({ searchDrawerOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
});
