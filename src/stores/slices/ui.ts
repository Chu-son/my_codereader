import type { SliceCreator } from '../types';

/** アクティビティレールで切り替える左パネル。検索は既存のドロワーを開くため含めない */
export type SidePanel = 'explorer' | 'bookmarks' | 'history' | 'outline';

export interface UiSlice {
  /** 開いている左パネル。null なら閉じている */
  activePanel: SidePanel | null;
  /** 縦向きで、レールとパネルを入れた左ドロワーが開いているか（横向きでは使わない） */
  navDrawerOpen: boolean;
  searchDrawerOpen: boolean;
  quickOpenOpen: boolean;
  settingsOpen: boolean;
  /** 集中モード。レール・パネル・ツールバー・タブを隠して本文だけにする */
  focusMode: boolean;
  /** 開いているパネルを再度選ぶと閉じる */
  togglePanel: (panel: SidePanel) => void;
  setNavDrawerOpen: (open: boolean) => void;
  setSearchDrawerOpen: (open: boolean) => void;
  setQuickOpenOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setFocusMode: (on: boolean) => void;
}

export const createUiSlice: SliceCreator<UiSlice> = (set) => ({
  activePanel: 'explorer',
  navDrawerOpen: false,
  searchDrawerOpen: false,
  quickOpenOpen: false,
  settingsOpen: false,
  focusMode: false,

  togglePanel: (panel) =>
    set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  setNavDrawerOpen: (open) => set({ navDrawerOpen: open }),
  // ドロワーを重ねないよう、検索・設定を開くときは左ドロワーを閉じる
  setSearchDrawerOpen: (open) =>
    set(open ? { searchDrawerOpen: true, navDrawerOpen: false } : { searchDrawerOpen: false }),
  setQuickOpenOpen: (open) => set({ quickOpenOpen: open }),
  setSettingsOpen: (open) =>
    set(open ? { settingsOpen: true, navDrawerOpen: false } : { settingsOpen: false }),
  setFocusMode: (on) => set({ focusMode: on }),
});
