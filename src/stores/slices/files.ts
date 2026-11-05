import type { OpenedFile } from '@/shared/types';
import { fetchFileContent } from '@/shared/lib/github';
import { isAbortError, toErrorMessage } from '@/shared/lib/githubError';
import { splitRepoFullName } from '@/shared/lib/urlParser';
import { currentRepoSignal } from '../repoController';
import type { SliceCreator } from '../types';
import { STRINGS } from '@/shared/constants/strings';

/**
 * ファイル本文のキャッシュ。タブ（panes スライス）とはライフサイクルが違うため分ける。
 * タブを閉じても破棄しない（履歴や Peek で戻ったときに再取得で API を消費しないため）。
 */
export interface FilesSlice {
  files: Record<string, OpenedFile>;
  /** 未取得・失敗済みなら取得する。取得済み・取得中なら何もしない */
  ensureFile: (path: string) => Promise<void>;
}

export const initialFilesState = (): Pick<FilesSlice, 'files'> => ({ files: {} });

export const createFilesSlice: SliceCreator<FilesSlice> = (set, get) => ({
  ...initialFilesState(),

  ensureFile: async (path) => {
    const existing = get().files[path];
    // 取得済み・取得中は重複リクエストを発行しない
    if (existing && !existing.error && (existing.content || existing.loading)) return;

    const repoParts = get().currentRepo && splitRepoFullName(get().currentRepo ?? '');
    if (!repoParts) return;

    const update = (patch: Partial<OpenedFile>) =>
      set((state) => {
        const current = state.files[path];
        if (!current) return state;
        return { files: { ...state.files, [path]: { ...current, ...patch } } };
      });

    set((state) => ({
      files: {
        ...state.files,
        [path]: { path, content: '', sha: '', loading: true, error: undefined },
      },
    }));

    try {
      const { content, sha } = await fetchFileContent(
        repoParts.owner,
        repoParts.repo,
        path,
        get().currentBranch,
        get().pat,
        currentRepoSignal(),
      );
      update({ content, sha, loading: false });
    } catch (error) {
      if (isAbortError(error)) return;
      update({ loading: false, error: toErrorMessage(error, STRINGS.viewer.fileLoadFailed) });
    }
  },
});
