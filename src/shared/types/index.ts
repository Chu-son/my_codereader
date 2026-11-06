/** GitHub API のツリーノード */
export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
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

/** 取得したファイル本文のキャッシュ（タブの有無とは独立して保持する） */
export interface OpenedFile {
  path: string;
  content: string;
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

/** ブックマーク */
export interface Bookmark {
  id: string;
  repo: string;
  branch: string;
  path: string;
  line: number;
  text: string;
}

/** 分割表示のペイン。2 ペイン固定（デザイン G が 2 ペインのみのため一般化しない） */
export type PaneId = 1 | 2;

/** 行ジャンプの依頼。pane を持つことで、同じファイルを開く別ペインを巻き込まない */
export interface JumpTarget {
  path: string;
  line: number;
  pane: PaneId;
  timestamp: number;
}

/** ジャンプ履歴の 1 件。戻ったときに行まで復元する */
export interface HistoryEntry {
  path: string;
  line: number;
  pane: PaneId;
}

/** ペインごと・ファイルごとの表示状態（スクロール位置とカーソル行） */
export interface ViewState {
  scrollTop: number;
  cursorLine: number;
}

/** シンボル（宣言）の種類。アウトラインのアイコンと、メソッド判定に使う */
export type SymbolKind =
  | 'function'
  | 'method'
  | 'class'
  | 'interface'
  | 'type'
  | 'enum'
  | 'variable'
  | 'property'
  | 'module';

/** 構文木から取り出した宣言 1 件。アウトライン・定義へ・スコープ表示で共用する */
export interface DocSymbol {
  name: string;
  kind: SymbolKind;
  /** 名前の開始位置（文書先頭からの文字オフセット） */
  from: number;
  /** 名前のある行（1 始まり） */
  line: number;
  /** 宣言の最終行（1 始まり）。カーソルがどの宣言の中にあるかの判定に使う */
  endLine: number;
  /** 囲んでいる宣言の数（トップレベルは 0） */
  depth: number;
}
