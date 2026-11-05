import type { SliceCreator } from '../types';

/** アクティビティレールで切り替える左パネル。検索は既存のドロワーを開くため含めない */
export type SidePanel = 'explorer' | 'bookmarks' | 'outline';

export interface UiSlice {
  /** 開いている左パネル。null なら閉じている */
  activePanel: SidePanel | null;
  /** 縦向きで、レールとパネルを入れた左ドロワーが開いているか（横向きでは使わない） */
  navDrawerOpen: boolean;
  searchDrawerOpen: boolean;
  settingsOpen: boolean;
  /** 開いているパネルを再度選ぶと閉じる */
  togglePanel: (panel: SidePanel) => void;
  setNavDrawerOpen: (open: boolean) => void;
  setSearchDrawerOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
}

export const createUiSlice: SliceCreator<UiSlice> = (set) => ({
  activePanel: 'explorer',
  navDrawerOpen: false,
  searchDrawerOpen: false,
  settingsOpen: false,

  togglePanel: (panel) =>
    set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  setNavDrawerOpen: (open) => set({ navDrawerOpen: open }),
  // ドロワーを重ねないよう、検索・設定を開くときは左ドロワーを閉じる
  setSearchDrawerOpen: (open) =>
    set(open ? { searchDrawerOpen: true, navDrawerOpen: false } : { searchDrawerOpen: false }),
  setSettingsOpen: (open) =>
    set(open ? { settingsOpen: true, navDrawerOpen: false } : { settingsOpen: false }),
});
