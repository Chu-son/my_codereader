import type { SliceCreator } from '../types';

export interface UiSlice {
  sidebarOpen: boolean;
  searchDrawerOpen: boolean;
  settingsOpen: boolean;
  toggleSidebar: () => void;
  setSearchDrawerOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
}

export const createUiSlice: SliceCreator<UiSlice> = (set) => ({
  sidebarOpen: true,
  searchDrawerOpen: false,
  settingsOpen: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSearchDrawerOpen: (open) => set({ searchDrawerOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
});
