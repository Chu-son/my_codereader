// ========================================
// Zustand App Store
// ========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TreeNode, OpenedFile, SearchResult, BranchInfo } from '@/types';
import {
  fetchRepoInfo,
  fetchRepoTree,
  fetchFileContent,
  searchCode,
  fetchBranches,
} from '@/lib/github';
import {
  searchInCachedFiles,
  searchInTree,
  convertGitHubSearchResults,
} from '@/lib/searchUtils';
import { isBinaryFile } from '@/lib/fileUtils';
import { parseRepoInput } from '@/lib/urlParser';

// ========================================
// State Interface
// ========================================

interface AppState {
  // 認証・リポジトリ情報
  pat: string | null;
  currentRepo: string | null;
  currentBranch: string | null;
  repoDescription: string | null;
  branches: BranchInfo[];
  branchesLoading: boolean;

  // ツリー情報
  treeData: TreeNode[];
  treeLoading: boolean;
  treeError: string | null;
  expandedDirs: string[];

  // タブ（関心ファイル）管理
  openedFiles: OpenedFile[];

  // 表示状態（画面分割対応）
  isSplitView: boolean;
  activePane1FilePath: string | null;
  activePane2FilePath: string | null;
  splitDirection: 'horizontal' | 'vertical';

  // サイドバー状態
  sidebarOpen: boolean;

  // 検索
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  searchDrawerOpen: boolean;

  // 設定ダイアログ
  settingsOpen: boolean;

  // ナビゲーション履歴
  navigationHistory: string[];
  navigationIndex: number;

  // 設定
  wordWrap: boolean;
  showIndentGuides: boolean;
  fontSize: number;
  lineHeight: number;

  // アクション
  setPat: (pat: string | null) => void;
  loadRepository: (repoInput: string) => Promise<void>;
  openFile: (path: string, pane?: 1 | 2) => Promise<void>;
  closeFile: (path: string) => void;
  setActiveFile: (pane: 1 | 2, path: string) => void;
  updateScrollPos: (path: string, pos: number) => void;
  toggleSplitView: () => void;
  toggleSplitDirection: () => void;
  toggleSidebar: () => void;
  toggleDir: (path: string) => void;
  searchInRepo: (query: string) => Promise<void>;
  setSearchDrawerOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  clearRepo: () => void;
  switchBranch: (branch: string) => Promise<void>;
  retryFile: (path: string) => Promise<void>;
  setWordWrap: (wrap: boolean) => void;
  setShowIndentGuides: (show: boolean) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
}

// ========================================
// Store
// ========================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初期値
      pat: null,
      currentRepo: null,
      currentBranch: null,
      repoDescription: null,
      treeData: [],
      treeLoading: false,
      treeError: null,
      expandedDirs: [],
      branches: [],
      branchesLoading: false,
      openedFiles: [],
      isSplitView: false,
      activePane1FilePath: null,
      activePane2FilePath: null,
      splitDirection: 'horizontal',
      sidebarOpen: true,
      searchQuery: '',
      searchResults: [],
      searchLoading: false,
      searchDrawerOpen: false,
      settingsOpen: false,
      navigationHistory: [],
      navigationIndex: -1,

      // 設定初期値
      wordWrap: true,
      showIndentGuides: true,
      fontSize: 14,
      lineHeight: 1.5,

      // === アクション ===

      setPat: (pat) => set({ pat }),

      loadRepository: async (repoInput: string) => {
        const parsed = parseRepoInput(repoInput);
        if (!parsed) {
          set({ treeError: '無効なリポジトリ形式です。owner/repo または GitHubのURLを入力してください。' });
          return;
        }

        const { owner, repo, branch: inputBranch, filePath } = parsed;
        const { pat } = get();

        set({
          treeLoading: true,
          treeError: null,
          treeData: [],
          openedFiles: [],
          activePane1FilePath: null,
          activePane2FilePath: null,
          expandedDirs: [],
          navigationHistory: [],
          navigationIndex: -1,
        });

        try {
          const repoInfo = await fetchRepoInfo(owner, repo, pat);
          const branch = inputBranch || repoInfo.defaultBranch;
          const tree = await fetchRepoTree(owner, repo, branch, pat);

          set({
            currentRepo: `${owner}/${repo}`,
            currentBranch: branch,
            repoDescription: repoInfo.description ?? null,
            treeData: tree,
            treeLoading: false,
          });

          // ブランチ一覧を非同期で取得
          set({ branchesLoading: true });
          fetchBranches(owner, repo, pat).then((branches) => {
            set({ branches, branchesLoading: false });
          }).catch(() => {
            set({ branchesLoading: false });
          });

          // URLにファイルパスが含まれる場合は自動で開く
          if (filePath) {
            get().openFile(filePath);
          }
        } catch (error) {
          set({
            treeLoading: false,
            treeError:
              error instanceof Error
                ? error.message
                : 'リポジトリの読み込みに失敗しました',
          });
        }
      },

      openFile: async (path: string, pane: 1 | 2 = 1) => {
        const { openedFiles, pat, currentRepo } = get();

        if (isBinaryFile(path)) return;

        // 既にキャッシュ済みかチェック
        const existing = openedFiles.find((f) => f.path === path);
        if (existing && existing.content && !existing.error) {
          // タブ切り替えのみ
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

        if (!currentRepo) return;

        const [owner, repo] = currentRepo.split('/');

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
                f.path === path ? { ...f, loading: true, error: undefined } : f
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
            pat
          );
          set((state) => ({
            openedFiles: state.openedFiles.map((f) =>
              f.path === path ? { ...f, content, sha, loading: false } : f
            ),
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          set((state) => ({
            openedFiles: state.openedFiles.map((f) =>
              f.path === path
                ? {
                    ...f,
                    content: `// Error loading file: ${message}`,
                    loading: false,
                    error: message,
                  }
                : f
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
          const newOpenedFiles = state.openedFiles.filter(
            (f) => f.path !== path
          );

          let newPane1 = state.activePane1FilePath;
          let newPane2 = state.activePane2FilePath;

          // 閉じたファイルがアクティブだった場合、次のタブに切り替え
          if (state.activePane1FilePath === path) {
            const idx = state.openedFiles.findIndex((f) => f.path === path);
            newPane1 =
              newOpenedFiles[Math.min(idx, newOpenedFiles.length - 1)]?.path ??
              null;
          }
          if (state.activePane2FilePath === path) {
            const idx = state.openedFiles.findIndex((f) => f.path === path);
            newPane2 =
              newOpenedFiles[Math.min(idx, newOpenedFiles.length - 1)]?.path ??
              null;
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
          openedFiles: state.openedFiles.map((f) =>
            f.path === path ? { ...f, scrollPos: pos } : f
          ),
        }));
      },

      toggleSplitView: () => {
        set((state) => {
          if (!state.isSplitView) {
            // 分割なし -> 横分割
            return {
              isSplitView: true,
              splitDirection: 'horizontal',
              activePane2FilePath: state.activePane1FilePath,
            };
          } else if (state.splitDirection === 'horizontal') {
            // 横分割 -> 縦分割
            return { splitDirection: 'vertical' };
          } else {
            // 縦分割 -> 分割なし
            return {
              isSplitView: false,
              activePane2FilePath: null,
            };
          }
        });
      },

      toggleSplitDirection: () => {
        set((state) => ({
          splitDirection: state.splitDirection === 'horizontal' ? 'vertical' : 'horizontal',
        }));
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      toggleDir: (path: string) => {
        set((state) => {
          const expanded = state.expandedDirs.includes(path)
            ? state.expandedDirs.filter((d) => d !== path)
            : [...state.expandedDirs, path];
          return { expandedDirs: expanded };
        });
      },

      searchInRepo: async (query: string) => {
        const { pat, currentRepo, openedFiles, treeData } = get();
        set({ searchQuery: query, searchLoading: true, searchDrawerOpen: true });

        try {
          let results: SearchResult[] = [];

          // 1. ファイル名検索 (常に実行)
          const nameResults = searchInTree(query, treeData);
          results = [...nameResults];

          if (pat && currentRepo) {
            // 2. GitHub Search Code API使用
            try {
              const [owner, repo] = currentRepo.split('/');
              const items = await searchCode(owner, repo, query, pat);
              const apiResults = convertGitHubSearchResults(items);
              results = [...results, ...apiResults];
            } catch (apiError) {
              console.warn('GitHub Search API error, falling back:', apiError);
              // APIエラー時はキャッシュファイル検索へ
              const cachedResults = searchInCachedFiles(query, openedFiles);
              results = [...results, ...cachedResults];
            }
          } else {
            // 3. キャッシュ済みファイルから検索
            const cachedResults = searchInCachedFiles(query, openedFiles);
            results = [...results, ...cachedResults];
          }

          set({ searchResults: results, searchLoading: false });
        } catch (error) {
          console.error('Search error:', error);
          set({ searchLoading: false });
        }
      },

      setSearchDrawerOpen: (open) => set({ searchDrawerOpen: open }),

      setSettingsOpen: (open) => set({ settingsOpen: open }),

      setWordWrap: (wordWrap) => set({ wordWrap }),
      setShowIndentGuides: (showIndentGuides) => set({ showIndentGuides }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),

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

      clearRepo: () => {
        set({
          currentRepo: null,
          currentBranch: null,
          repoDescription: null,
          treeData: [],
          treeLoading: false,
          treeError: null,
          expandedDirs: [],
          openedFiles: [],
          activePane1FilePath: null,
          activePane2FilePath: null,
          isSplitView: false,
          searchQuery: '',
          searchResults: [],
          searchDrawerOpen: false,
          navigationHistory: [],
          navigationIndex: -1,
        });
      },

      switchBranch: async (branchName: string) => {
        const { currentRepo, pat } = get();
        if (!currentRepo) return;

        const [owner, repo] = currentRepo.split('/');
        set({ treeLoading: true, treeError: null, openedFiles: [], activePane1FilePath: null, activePane2FilePath: null });

        try {
          const tree = await fetchRepoTree(owner, repo, branchName, pat);
          set({
            currentBranch: branchName,
            treeData: tree,
            treeLoading: false,
          });
        } catch (error) {
          set({
            treeLoading: false,
            treeError: error instanceof Error ? error.message : 'ブランチの切り替えに失敗しました',
          });
        }
      },
    }),
    {
      name: 'codereader-storage',
      partialState: (state: AppState) => ({
        pat: state.pat,
        currentRepo: state.currentRepo,
        wordWrap: state.wordWrap,
        showIndentGuides: state.showIndentGuides,
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
      }),
    } as any
  )
);
