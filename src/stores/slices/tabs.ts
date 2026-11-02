import type { OpenedFile } from '@/shared/types';
import { fetchFileContent } from '@/shared/lib/github';
import { isAbortError, toErrorMessage } from '@/shared/lib/githubError';
import { isBinaryFile } from '@/shared/lib/fileUtils';
import { splitRepoFullName } from '@/shared/lib/urlParser';
import { currentRepoSignal } from '../repoController';
import type { SliceCreator } from '../types';
import { STRINGS } from '@/shared/constants/strings';

export interface TabsSlice {
  openedFiles: OpenedFile[];
  activePane1FilePath: string | null;
  activePane2FilePath: string | null;
  navigationHistory: string[];
  navigationIndex: number;
  openFile: (path: string, pane?: 1 | 2) => Promise<void>;
  retryFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  setActiveFile: (pane: 1 | 2, path: string) => void;
  updateScrollPos: (path: string, pos: number) => void;
  navigateBack: () => void;
  navigateForward: () => void;
}

export const createTabsSlice: SliceCreator<TabsSlice> = (set, get) => ({
  openedFiles: [],
  activePane1FilePath: null,
  activePane2FilePath: null,
  navigationHistory: [],
  navigationIndex: -1,

  openFile: async (path: string, pane: 1 | 2 = 1) => {
    const { openedFiles, pat, currentRepo } = get();

    if (isBinaryFile(path)) return;

    // 既にキャッシュ済みかチェック
    const existing = openedFiles.find((f) => f.path === path);
    if (existing && !existing.error && (existing.content || existing.loading)) {
      // 取得済み・取得中は再リクエストせずタブ切り替えのみ
      if (pane === 1) {
        const history = get().navigationHistory;
        const idx = get().navigationIndex;
        const newHistory = [...history.slice(0, idx + 1), path];
        set({
          activePane1FilePath: path,
          navigationHistory: newHistory,
          navigationIndex: newHistory.length - 1,
        });
      } else {
        set({ activePane2FilePath: path });
      }
      return;
    }

    const repoParts = currentRepo && splitRepoFullName(currentRepo);
    if (!repoParts) return;
    const { owner, repo } = repoParts;

    // ローディング状態のファイルを追加/更新
    const newFile: OpenedFile = {
      path,
      content: '',
      scrollPos: 0,
      sha: '',
      loading: true,
      error: undefined,
    };

    set((state) => {
      const alreadyOpened = state.openedFiles.some((f) => f.path === path);
      const files = alreadyOpened
        ? state.openedFiles.map((f) =>
            f.path === path ? { ...f, loading: true, error: undefined } : f,
          )
        : [...state.openedFiles, newFile];

      const history = state.navigationHistory;
      const idx = state.navigationIndex;
      const newHistory = [...history.slice(0, idx + 1), path];

      return {
        openedFiles: files,
        ...(pane === 1
          ? {
              activePane1FilePath: path,
              navigationHistory: newHistory,
              navigationIndex: newHistory.length - 1,
            }
          : { activePane2FilePath: path }),
      };
    });

    try {
      const { content, sha } = await fetchFileContent(
        owner,
        repo,
        path,
        get().currentBranch,
        pat,
        currentRepoSignal(),
      );
      set((state) => ({
        openedFiles: state.openedFiles.map((f) =>
          f.path === path ? { ...f, content, sha, loading: false } : f,
        ),
      }));
    } catch (error) {
      if (isAbortError(error)) return;
      const message = toErrorMessage(error, STRINGS.viewer.fileLoadFailed);
      set((state) => ({
        openedFiles: state.openedFiles.map((f) =>
          f.path === path
            ? {
                ...f,
                content: `// Error loading file: ${message}`,
                loading: false,
                error: message,
              }
            : f,
        ),
      }));
    }
  },

  retryFile: async (path: string) => {
    // 現在アクティブなペインで開き直す
    const { activePane2FilePath } = get();
    const pane: 1 | 2 = activePane2FilePath === path ? 2 : 1;
    await get().openFile(path, pane);
  },

  closeFile: (path: string) => {
    set((state) => {
      const newOpenedFiles = state.openedFiles.filter((f) => f.path !== path);

      let newPane1 = state.activePane1FilePath;
      let newPane2 = state.activePane2FilePath;

      // 閉じたファイルがアクティブだった場合、次のタブに切り替え
      if (state.activePane1FilePath === path) {
        const idx = state.openedFiles.findIndex((f) => f.path === path);
        newPane1 = newOpenedFiles[Math.min(idx, newOpenedFiles.length - 1)]?.path ?? null;
      }
      if (state.activePane2FilePath === path) {
        const idx = state.openedFiles.findIndex((f) => f.path === path);
        newPane2 = newOpenedFiles[Math.min(idx, newOpenedFiles.length - 1)]?.path ?? null;
      }

      return {
        openedFiles: newOpenedFiles,
        activePane1FilePath: newPane1,
        activePane2FilePath: newPane2,
      };
    });
  },

  setActiveFile: (pane: 1 | 2, path: string) => {
    if (pane === 1) {
      const history = get().navigationHistory;
      const idx = get().navigationIndex;
      const newHistory = [...history.slice(0, idx + 1), path];
      set({
        activePane1FilePath: path,
        navigationHistory: newHistory,
        navigationIndex: newHistory.length - 1,
      });
    } else {
      set({ activePane2FilePath: path });
    }
  },

  updateScrollPos: (path: string, pos: number) => {
    set((state) => ({
      openedFiles: state.openedFiles.map((f) => (f.path === path ? { ...f, scrollPos: pos } : f)),
    }));
  },

  navigateBack: () => {
    const { navigationHistory, navigationIndex } = get();
    if (navigationIndex > 0) {
      const newIndex = navigationIndex - 1;
      set({
        activePane1FilePath: navigationHistory[newIndex],
        navigationIndex: newIndex,
      });
    }
  },

  navigateForward: () => {
    const { navigationHistory, navigationIndex } = get();
    if (navigationIndex < navigationHistory.length - 1) {
      const newIndex = navigationIndex + 1;
      set({
        activePane1FilePath: navigationHistory[newIndex],
        navigationIndex: newIndex,
      });
    }
  },
});
