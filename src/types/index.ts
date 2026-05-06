// ========================================
// Type Definitions
// ========================================

/** GitHub API のツリーノード */
export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

/** アプリ内で使用するツリーノード */
export interface TreeNode {
  path: string;
  name: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  children: TreeNode[];
}

/** 開いているファイル */
export interface OpenedFile {
  path: string;
  content: string;
  scrollPos: number;
  sha: string;
  loading: boolean;
  error?: string;
}

/** 検索結果の1件 */
export interface SearchResult {
  path: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

/** GitHub APIエラー */
export interface GitHubApiError {
  message: string;
  status: number;
  documentation_url?: string;
}

/** リポジトリ情報 */
export interface RepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
  description?: string;
  stargazersCount?: number;
}

/** ブランチ情報 */
export interface BranchInfo {
  name: string;
  sha: string;
}
