import type { Bookmark } from '@/shared/types';
import type { SliceCreator } from '../types';

const PREVIEW_MAX_LENGTH = 50;

function createBookmarkId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export interface BookmarksSlice {
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => void;
  /**
   * 表示中のリポジトリ・ブランチで、指定行のブックマークを付け外しする。
   * ツールバーのボタンと行番号の長押しメニューが同じ規則（ID・プレビュー文）で作るため、ここに置く
   */
  toggleBookmark: (path: string, line: number) => void;
}

/** 指定行のブックマーク（表示中のリポジトリのもの）。無ければ undefined */
export const findBookmark = (
  bookmarks: readonly Bookmark[],
  repo: string | null,
  path: string,
  line: number,
) => bookmarks.find((b) => b.repo === repo && b.path === path && b.line === line);

export const createBookmarksSlice: SliceCreator<BookmarksSlice> = (set, get) => ({
  bookmarks: [],

  addBookmark: (bookmark) => {
    set((state) => {
      // 同じリポジトリ・ファイル・行のブックマークが既にあるかチェック
      if (findBookmark(state.bookmarks, bookmark.repo, bookmark.path, bookmark.line)) return state;
      return { bookmarks: [...state.bookmarks, bookmark] };
    });
  },

  removeBookmark: (id) => {
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) }));
  },

  toggleBookmark: (path, line) => {
    const { currentRepo, currentBranch, bookmarks, files } = get();
    if (!currentRepo || !currentBranch || line < 1) return;

    const existing = findBookmark(bookmarks, currentRepo, path, line);
    if (existing) {
      get().removeBookmark(existing.id);
      return;
    }
    // 一覧で見分けられるよう、対象行の先頭部分をプレビューとして保存する
    let text = files[path]?.content.split('\n')[line - 1]?.trim() ?? '';
    if (text.length > PREVIEW_MAX_LENGTH) text = text.slice(0, PREVIEW_MAX_LENGTH) + '...';

    get().addBookmark({
      id: createBookmarkId(),
      repo: currentRepo,
      branch: currentBranch,
      path,
      line,
      text,
    });
  },
});
