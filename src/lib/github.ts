// ========================================
// GitHub REST API Client
// ========================================

import type { GitHubTreeItem, TreeNode, RepoInfo } from '@/types';

const API_BASE = 'https://api.github.com';

/** 共通ヘッダーの生成 */
function getHeaders(pat?: string | null): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (pat) {
    headers.Authorization = `Bearer ${pat}`;
  }
  return headers;
}

/** APIレスポンスのエラーハンドリング */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody.message || `GitHub API error: ${response.status}`;
    throw new Error(message);
  }
  return response.json();
}

/** リポジトリ情報を取得 */
export async function fetchRepoInfo(
  owner: string,
  repo: string,
  pat?: string | null
): Promise<RepoInfo> {
  const response = await fetch(`${API_BASE}/repos/${owner}/${repo}`, {
    headers: getHeaders(pat),
  });
  const data = await handleResponse<{
    default_branch: string;
    description: string | null;
    stargazers_count: number;
  }>(response);

  return {
    owner,
    repo,
    defaultBranch: data.default_branch,
    description: data.description ?? undefined,
    stargazersCount: data.stargazers_count,
  };
}

/** リポジトリのファイルツリーを再帰的に取得 */
export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string,
  pat?: string | null
): Promise<TreeNode[]> {
  const response = await fetch(
    `${API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: getHeaders(pat) }
  );
  const data = await handleResponse<{
    tree: GitHubTreeItem[];
    truncated: boolean;
  }>(response);

  return buildTree(data.tree);
}

/** フラットなツリーリストを階層構造に変換 */
function buildTree(items: GitHubTreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // ディレクトリとファイルをソート（ディレクトリ優先）
  const sortedItems = [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const item of sortedItems) {
    const parts = item.path.split('/');
    const name = parts[parts.length - 1];

    const node: TreeNode = {
      path: item.path,
      name,
      type: item.type,
      sha: item.sha,
      size: item.size,
      children: [],
    };

    nodeMap.set(item.path, node);

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = nodeMap.get(parentPath);
      if (parent) {
        parent.children.push(node);
      } else {
        // 親ディレクトリが存在しない場合はルートに追加
        root.push(node);
      }
    }
  }

  return root;
}

/** ファイルのコンテンツを取得（Base64デコード） */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string | null,
  pat?: string | null
): Promise<{ content: string; sha: string }> {
  const url = new URL(`${API_BASE}/repos/${owner}/${repo}/contents/${path}`);
  if (ref) url.searchParams.set('ref', ref);

  const response = await fetch(url.toString(), { headers: getHeaders(pat) });
  const data = await handleResponse<{
    content: string;
    sha: string;
    encoding: string;
  }>(response);

  if (data.encoding === 'base64') {
    try {
      // マルチバイト文字に対応したデコード
      const binary = atob(data.content.replace(/\n/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decoded = new TextDecoder('utf-8').decode(bytes);
      return { content: decoded, sha: data.sha };
    } catch (e) {
      console.error('Base64 decode error:', e);
      // フォールバック
      return { content: atob(data.content.replace(/\n/g, '')), sha: data.sha };
    }
  }

  return { content: data.content, sha: data.sha };
}

/** GitHub Search Code APIでコード検索 */
export async function searchCode(
  owner: string,
  repo: string,
  query: string,
  pat: string
): Promise<
  {
    path: string;
    text_matches?: {
      fragment: string;
      matches: { text: string; indices: [number, number] }[];
    }[];
  }[]
> {
  const q = encodeURIComponent(`${query} repo:${owner}/${repo}`);
  const response = await fetch(
    `${API_BASE}/search/code?q=${q}&per_page=30`,
    {
      headers: {
        ...getHeaders(pat),
        Accept: 'application/vnd.github.text-match+json',
      },
    }
  );
  const data = await handleResponse<{
    items: {
      path: string;
      text_matches?: {
        fragment: string;
        matches: { text: string; indices: [number, number] }[];
      }[];
    }[];
  }>(response);

  return data.items;
}

/** レートリミット情報を取得 */
export async function fetchRateLimit(
  pat?: string | null
): Promise<{
  remaining: number;
  limit: number;
  reset: number;
}> {
  const response = await fetch(`${API_BASE}/rate_limit`, {
    headers: getHeaders(pat),
  });
  const data = await handleResponse<{
    rate: { remaining: number; limit: number; reset: number };
  }>(response);
  return data.rate;
}

/** ブランチ一覧を取得 */
export async function fetchBranches(
  owner: string,
  repo: string,
  pat?: string | null
): Promise<{ name: string; sha: string }[]> {
  const response = await fetch(`${API_BASE}/repos/${owner}/${repo}/branches?per_page=100`, {
    headers: getHeaders(pat),
  });
  const data = await handleResponse<{ name: string; commit: { sha: string } }[]>(response);
  return data.map((b) => ({ name: b.name, sha: b.commit.sha }));
}
