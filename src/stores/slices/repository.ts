import type { BranchInfo, TreeNode } from '@/shared/types';
import { fetchBranches, fetchRepoInfo, fetchRepoTree } from '@/shared/lib/github';
import { isAbortError, toErrorMessage } from '@/shared/lib/githubError';
import { parseRepoInput, splitRepoFullName } from '@/shared/lib/urlParser';
import { renewRepoSignal } from '../repoController';
import type { SliceCreator } from '../types';
import { initialFilesState } from './files';
import { initialPanesState } from './panes';
import { initialSearchState } from './search';
import { STRINGS } from '@/shared/constants/strings';

export interface RepositorySlice {
  currentRepo: string | null;
  currentBranch: string | null;
  repoDescription: string | null;
  branches: BranchInfo[];
  branchesLoading: boolean;
  treeData: TreeNode[];
  treeLoading: boolean;
  treeError: string | null;
  /** GitHub のツリーが一部しか取得できなかった場合 true */
  treeTruncated: boolean;
  expandedDirs: string[];
  recentRepos: string[];
  loadRepository: (repoInput: string) => Promise<void>;
  switchBranch: (branch: string) => Promise<void>;
  clearRepo: () => void;
  toggleDir: (path: string) => void;
  addRecentRepo: (repo: string) => void;
  removeRecentRepo: (repo: string) => void;
}

export const createRepositorySlice: SliceCreator<RepositorySlice> = (set, get) => ({
  currentRepo: null,
  currentBranch: null,
  repoDescription: null,
  branches: [],
  branchesLoading: false,
  treeData: [],
  treeLoading: false,
  treeError: null,
  treeTruncated: false,
  expandedDirs: [],
  recentRepos: [],

  loadRepository: async (repoInput: string) => {
    const parsed = parseRepoInput(repoInput);
    if (!parsed) {
      set({
        treeError: STRINGS.repository.invalidFormat,
      });
      return;
    }

    const { owner, repo, branch: inputBranch, filePath } = parsed;
    const { pat } = get();
    const signal = renewRepoSignal();

    set({
      treeLoading: true,
      treeError: null,
      treeTruncated: false,
      treeData: [],
      expandedDirs: [],
      ...initialFilesState(),
      ...initialPanesState(),
    });

    try {
      const repoInfo = await fetchRepoInfo(owner, repo, pat, signal);
      const branch = inputBranch || repoInfo.defaultBranch;
      const { tree, truncated } = await fetchRepoTree(owner, repo, branch, pat, signal);

      set({
        currentRepo: `${owner}/${repo}`,
        currentBranch: branch,
        repoDescription: repoInfo.description ?? null,
        treeData: tree,
        treeTruncated: truncated,
        treeLoading: false,
      });

      // 履歴に追加
      get().addRecentRepo(`${owner}/${repo}`);

      // ブランチ一覧を非同期で取得
      set({ branchesLoading: true });
      fetchBranches(owner, repo, pat, signal)
        .then((branches) => {
          set({ branches, branchesLoading: false });
        })
        .catch((error) => {
          // 中断は新しい読み込みが状態を管理するため触らない
          if (!isAbortError(error)) set({ branchesLoading: false });
        });

      // URLにファイルパスが含まれる場合は自動で開く
      if (filePath) {
        void get().navigateTo(filePath);
      }
    } catch (error) {
      if (isAbortError(error)) return;
      set({
        treeLoading: false,
        treeError: toErrorMessage(error, STRINGS.repository.loadFailed),
      });
    }
  },

  clearRepo: () => {
    renewRepoSignal();
    set({
      currentRepo: null,
      currentBranch: null,
      repoDescription: null,
      treeData: [],
      treeLoading: false,
      treeError: null,
      treeTruncated: false,
      expandedDirs: [],
      ...initialFilesState(),
      ...initialPanesState(),
      ...initialSearchState(),
      searchDrawerOpen: false,
    });
  },

  switchBranch: async (branchName: string) => {
    const { currentRepo, pat } = get();
    const repoParts = currentRepo && splitRepoFullName(currentRepo);
    if (!repoParts) return;
    const { owner, repo } = repoParts;
    const signal = renewRepoSignal();
    set({
      treeLoading: true,
      treeError: null,
      treeTruncated: false,
      ...initialFilesState(),
      // 別ブランチの本文・履歴は使えないので捨てる。分割のレイアウトだけは保つ
      ...initialPanesState(),
      isSplitView: get().isSplitView,
      splitDirection: get().splitDirection,
    });

    try {
      const { tree, truncated } = await fetchRepoTree(owner, repo, branchName, pat, signal);
      set({
        currentBranch: branchName,
        treeData: tree,
        treeTruncated: truncated,
        treeLoading: false,
      });
    } catch (error) {
      if (isAbortError(error)) return;
      set({
        treeLoading: false,
        treeError: toErrorMessage(error, STRINGS.repository.branchSwitchFailed),
      });
    }
  },

  toggleDir: (path: string) => {
    set((state) => {
      const expanded = state.expandedDirs.includes(path)
        ? state.expandedDirs.filter((d) => d !== path)
        : [...state.expandedDirs, path];
      return { expandedDirs: expanded };
    });
  },

  addRecentRepo: (repo) => {
    set((state) => {
      const filtered = state.recentRepos.filter((r) => r !== repo);
      return { recentRepos: [repo, ...filtered].slice(0, 20) };
    });
  },

  removeRecentRepo: (repo) => {
    set((state) => ({
      recentRepos: state.recentRepos.filter((r) => r !== repo),
    }));
  },
});
