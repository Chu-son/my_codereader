import type { Bookmark } from '@/shared/types';
import type { SliceCreator } from '../types';

export interface BookmarksSlice {
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => void;
}

export const createBookmarksSlice: SliceCreator<BookmarksSlice> = (set) => ({
  bookmarks: [],

  addBookmark: (bookmark) => {
    set((state) => {
      // 同じリポジトリ・ファイル・行のブックマークが既にあるかチェック
      const exists = state.bookmarks.some(
        (b) => b.repo === bookmark.repo && b.path === bookmark.path && b.line === bookmark.line,
      );
      if (exists) return state;
      return { bookmarks: [...state.bookmarks, bookmark] };
    });
  },

  removeBookmark: (id) => {
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) }));
  },
});
