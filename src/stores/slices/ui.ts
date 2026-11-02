import type { SliceCreator } from '../types';

export interface UiSlice {
  sidebarOpen: boolean;
  searchDrawerOpen: boolean;
  settingsOpen: boolean;
  isSplitView: boolean;
  splitDirection: 'horizontal' | 'vertical';
  toggleSidebar: () => void;
  setSearchDrawerOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  toggleSplitView: () => void;
  toggleSplitDirection: () => void;
}

export const createUiSlice: SliceCreator<UiSlice> = (set) => ({
  sidebarOpen: true,
  searchDrawerOpen: false,
  settingsOpen: false,
  isSplitView: false,
  splitDirection: 'horizontal',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSearchDrawerOpen: (open) => set({ searchDrawerOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  // 分割なし -> 横分割 -> 縦分割 -> 分割なし の順に切り替える
  toggleSplitView: () => {
    set((state) => {
      if (!state.isSplitView) {
        return {
          isSplitView: true,
          splitDirection: 'horizontal',
          activePane2FilePath: state.activePane1FilePath,
        };
      }
      if (state.splitDirection === 'horizontal') return { splitDirection: 'vertical' };
      return { isSplitView: false, activePane2FilePath: null };
    });
  },

  toggleSplitDirection: () => {
    set((state) => ({
      splitDirection: state.splitDirection === 'horizontal' ? 'vertical' : 'horizontal',
    }));
  },
});
