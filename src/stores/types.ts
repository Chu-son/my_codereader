import type { StateCreator } from 'zustand';
import type { BookmarksSlice } from './slices/bookmarks';
import type { RepositorySlice } from './slices/repository';
import type { SearchSlice } from './slices/search';
import type { SettingsSlice } from './slices/settings';
import type { TabsSlice } from './slices/tabs';
import type { UiSlice } from './slices/ui';

export type AppState = SettingsSlice &
  BookmarksSlice &
  UiSlice &
  RepositorySlice &
  TabsSlice &
  SearchSlice;

/** persist ミドルウェア込みのスライス作成関数の型 */
export type SliceCreator<T> = StateCreator<AppState, [['zustand/persist', unknown]], [], T>;
