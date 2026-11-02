import { z } from 'zod';
import type { GitHubTreeItem, TreeNode, RepoInfo } from '@/types';
import { GitHubError } from './githubError';

const API_BASE = 'https://api.github.com';

/** 本文を取得する上限サイズ（バイト） */
export const MAX_FILE_BYTES = 1024 * 1024;

/** ブランチ取得の最大ページ数（1ページ100件） */
const MAX_BRANCH_PAGES = 10;
const BRANCH_PAGE_SIZE = 100;

/** レート制限の状態（/rate_limit の rate） */
export interface RateLimitInfo {
  remaining: number;
  limit: number;
  reset: number;
}

interface RequestOptions {
  pat?: string | null;
  signal?: AbortSignal;
  accept?: string;
}

function toApiError(response: Response): GitHubError {
  const { status, headers } = response;
  const resetAt = Number(headers.get('x-ratelimit-reset')) || undefined;
  if (status === 429 || (status === 403 && headers.get('x-ratelimit-remaining') === '0')) {
    return new GitHubError('rate_limit', { status, resetAt });
  }
  if (status === 401) return new GitHubError('unauthorized', { status });
  if (status === 404) return new GitHubError('not_found', { status });
  return new GitHubError('unknown', { status });
}

/** GitHub API を呼び、エラーを正規化し、レスポンスを schema で検証して返す */
async function request<S extends z.ZodType>(
  path: string,
  schema: S,
  { pat, signal, accept = 'application/vnd.github+json' }: RequestOptions = {},
): Promise<z.output<S>> {
  const headers: Record<string, string> = {
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (pat) headers.Authorization = `Bearer ${pat}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { headers, signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new GitHubError('network');
  }
  if (!response.ok) throw toApiError(response);

  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) throw new GitHubError('invalid_response', { status: response.status });
  return parsed.data;
}

const repoSchema = z.object({
  default_branch: z.string(),
  description: z.string().nullable().optional(),
  stargazers_count: z.number().optional(),
});

const treeSchema = z.object({
  tree: z.array(
    z.object({
      path: z.string(),
      mode: z.string(),
      type: z.enum(['blob', 'tree', 'commit']),
      sha: z.string(),
      size: z.number().optional(),
      url: z.string().optional(),
    }),
  ),
  truncated: z.boolean().optional(),
});

const contentSchema = z.object({
  content: z.string(),
  sha: z.string(),
  encoding: z.string(),
  size: z.number().optional(),
});

const searchSchema = z.object({
  items: z.array(
    z.object({
      path: z.string(),
      text_matches: z
        .array(
          z.object({
            fragment: z.string(),
            matches: z.array(
              z.object({ text: z.string(), indices: z.tuple([z.number(), z.number()]) }),
            ),
          }),
        )
        .optional(),
    }),
  ),
});

const rateLimitSchema = z.object({
  rate: z.object({ remaining: z.number(), limit: z.number(), reset: z.number() }),
});

const branchesSchema = z.array(
  z.object({ name: z.string(), commit: z.object({ sha: z.string() }) }),
);

/** リポジトリ情報を取得 */
export async function fetchRepoInfo(
  owner: string,
  repo: string,
  pat?: string | null,
  signal?: AbortSignal,
): Promise<RepoInfo> {
  const data = await request(`/repos/${owner}/${repo}`, repoSchema, { pat, signal });
  return {
    owner,
    repo,
    defaultBranch: data.default_branch,
    description: data.description ?? undefined,
    stargazersCount: data.stargazers_count,
  };
}

/** リポジトリのファイルツリーを再帰的に取得。truncated は一部しか取得できなかったことを示す */
export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string,
  pat?: string | null,
  signal?: AbortSignal,
): Promise<{ tree: TreeNode[]; truncated: boolean }> {
  const data = await request(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    treeSchema,
    { pat, signal },
  );
  // submodule(commit) はファイルとして開けないため除外する
  const items = data.tree.filter((item): item is GitHubTreeItem => item.type !== 'commit');
  return { tree: buildTree(items), truncated: data.truncated ?? false };
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
    const name = parts[parts.length - 1] ?? item.path;

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

/** ファイルのコンテンツを取得（Base64デコード）。MAX_FILE_BYTES 超は too_large */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string | null,
  pat?: string | null,
  signal?: AbortSignal,
): Promise<{ content: string; sha: string }> {
  const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const data = await request(`/repos/${owner}/${repo}/contents/${path}${query}`, contentSchema, {
    pat,
    signal,
  });

  if ((data.size ?? 0) > MAX_FILE_BYTES) throw new GitHubError('too_large');
  if (data.encoding !== 'base64') {
    // 1MB超のファイルは encoding が none になり本文が返らない
    if (data.content === '') throw new GitHubError('too_large');
    return { content: data.content, sha: data.sha };
  }

  try {
    // マルチバイト文字に対応したデコード
    const binary = atob(data.content.replace(/\n/g, ''));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return { content: new TextDecoder('utf-8').decode(bytes), sha: data.sha };
  } catch {
    throw new GitHubError('invalid_response');
  }
}

export type CodeSearchItem = z.output<typeof searchSchema>['items'][number];

/** GitHub Search Code APIでコード検索 */
export async function searchCode(
  owner: string,
  repo: string,
  query: string,
  pat: string,
  signal?: AbortSignal,
): Promise<CodeSearchItem[]> {
  const q = encodeURIComponent(`${query} repo:${owner}/${repo}`);
  const data = await request(`/search/code?q=${q}&per_page=30`, searchSchema, {
    pat,
    signal,
    accept: 'application/vnd.github.text-match+json',
  });
  return data.items;
}

/** レートリミット情報を取得 */
export async function fetchRateLimit(
  pat?: string | null,
  signal?: AbortSignal,
): Promise<RateLimitInfo> {
  const data = await request('/rate_limit', rateLimitSchema, { pat, signal });
  return data.rate;
}

/** ブランチ一覧を取得（100件ずつ、最大 MAX_BRANCH_PAGES ページ） */
export async function fetchBranches(
  owner: string,
  repo: string,
  pat?: string | null,
  signal?: AbortSignal,
): Promise<{ name: string; sha: string }[]> {
  const branches: { name: string; sha: string }[] = [];
  for (let page = 1; page <= MAX_BRANCH_PAGES; page++) {
    const data = await request(
      `/repos/${owner}/${repo}/branches?per_page=${BRANCH_PAGE_SIZE}&page=${page}`,
      branchesSchema,
      { pat, signal },
    );
    branches.push(...data.map((b) => ({ name: b.name, sha: b.commit.sha })));
    if (data.length < BRANCH_PAGE_SIZE) break;
  }
  return branches;
}
