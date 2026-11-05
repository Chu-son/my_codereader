import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createBookmarksSlice } from './slices/bookmarks';
import { createRepositorySlice } from './slices/repository';
import { createSearchSlice } from './slices/search';
import { createSettingsSlice } from './slices/settings';
import { createFilesSlice } from './slices/files';
import { createPanesSlice } from './slices/panes';
import { createUiSlice } from './slices/ui';
import {
  PERSIST_VERSION,
  STORAGE_KEY,
  storage,
  migratePersistedState,
  partializeState,
  sessionPat,
  type PersistedState,
} from './persistence';
import type { AppState } from './types';

export type { AppState } from './types';

export const useAppStore = create<AppState>()(
  persist<AppState, [], [], PersistedState>(
    (...args) => ({
      ...createSettingsSlice(...args),
      ...createBookmarksSlice(...args),
      ...createUiSlice(...args),
      ...createRepositorySlice(...args),
      ...createFilesSlice(...args),
      ...createPanesSlice(...args),
      ...createSearchSlice(...args),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => storage),
      version: PERSIST_VERSION,
      partialize: partializeState,
      migrate: migratePersistedState,
      // localStorage に PAT が無ければ、同一タブの sessionStorage から復元する
      merge: (persisted, current) => {
        const saved = persisted as Partial<PersistedState> | undefined;
        return { ...current, ...saved, pat: saved?.pat ?? sessionPat.read() };
      },
    },
  ),
);

// ペインのセレクタは複数の feature が使うため、ストアの入口から公開する
export {
  viewKey,
  selectCanGoBack,
  selectCanGoForward,
  selectCurrentLocation,
  selectFocusedPath,
  selectOpenPaths,
} from './slices/panes';
