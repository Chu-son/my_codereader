import type { Bookmark, JumpTarget } from '@/types';
import type { SliceCreator } from '../types';

export interface BookmarksSlice {
  bookmarks: Bookmark[];
  activeCursorLines: Record<string, number>;
  jumpTarget: JumpTarget | null;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => void;
  setActiveCursorLine: (path: string, line: number) => void;
  setJumpTarget: (target: JumpTarget | null) => void;
  requestJump: (path: string, line: number) => void;
}

export const createBookmarksSlice: SliceCreator<BookmarksSlice> = (set) => ({
  bookmarks: [],
  activeCursorLines: {},
  jumpTarget: null,

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

  setActiveCursorLine: (path, line) => {
    set((state) => ({ activeCursorLines: { ...state.activeCursorLines, [path]: line } }));
  },

  // timestamp を変えることで、同じ行への連続ジャンプも検知できる
  requestJump: (path, line) => {
    set({ jumpTarget: { path, line, timestamp: Date.now() } });
  },

  setJumpTarget: (target) => set({ jumpTarget: target }),
});
