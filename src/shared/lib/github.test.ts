import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import {
  fetchBranches,
  fetchFileContent,
  fetchRateLimit,
  fetchRepoInfo,
  fetchRepoTree,
  searchCode,
} from './github';

const API = 'https://api.github.com';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchRepoInfo', () => {
  it('リポジトリ情報を変換して返す', async () => {
    server.use(
      http.get(`${API}/repos/vuejs/core`, () =>
        HttpResponse.json({ default_branch: 'main', description: null, stargazers_count: 7 }),
      ),
    );
    await expect(fetchRepoInfo('vuejs', 'core')).resolves.toEqual({
      owner: 'vuejs',
      repo: 'core',
      defaultBranch: 'main',
      description: undefined,
      stargazersCount: 7,
    });
  });

  it('PAT があれば Authorization ヘッダーを付け、無ければ付けない', async () => {
    const auths: (string | null)[] = [];
    server.use(
      http.get(`${API}/repos/vuejs/core`, ({ request }) => {
        auths.push(request.headers.get('authorization'));
        return HttpResponse.json({ default_branch: 'main', description: '', stargazers_count: 0 });
      }),
    );
    await fetchRepoInfo('vuejs', 'core', 'token123');
    await fetchRepoInfo('vuejs', 'core');
    expect(auths).toEqual(['Bearer token123', null]);
  });

  it('404 は not_found に正規化する', async () => {
    server.use(
      http.get(`${API}/repos/a/b`, () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 }),
      ),
    );
    await expect(fetchRepoInfo('a', 'b')).rejects.toMatchObject({ kind: 'not_found', status: 404 });
  });

  it('本文が JSON でない 500 は unknown にする', async () => {
    server.use(http.get(`${API}/repos/a/b`, () => new HttpResponse('oops', { status: 500 })));
    await expect(fetchRepoInfo('a', 'b')).rejects.toMatchObject({ kind: 'unknown', status: 500 });
  });
});

describe('fetchRepoTree', () => {
  it('フラットなリストをディレクトリ優先の階層に変換する', async () => {
    server.use(
      http.get(`${API}/repos/a/b/git/trees/main`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('recursive')).toBe('1');
        return HttpResponse.json({
          truncated: false,
          tree: [
            { path: 'z.md', type: 'blob', mode: '100644', sha: '1', url: '' },
            { path: 'src/a.ts', type: 'blob', mode: '100644', sha: '2', url: '' },
            { path: 'src', type: 'tree', mode: '040000', sha: '3', url: '' },
          ],
        });
      }),
    );
    const { tree, truncated } = await fetchRepoTree('a', 'b', 'main');
    expect(truncated).toBe(false);
    expect(tree.map((n) => n.path)).toEqual(['src', 'z.md']);
    expect(tree[0]?.children.map((n) => n.path)).toEqual(['src/a.ts']);
  });
});

describe('fetchFileContent', () => {
  it('base64 の UTF-8 本文をデコードする', async () => {
    const content = btoa(String.fromCharCode(...new TextEncoder().encode('こんにちは\n')));
    server.use(
      http.get(`${API}/repos/a/b/contents/src/a.txt`, () =>
        HttpResponse.json({ content, encoding: 'base64', sha: 'abc', size: 1 }),
      ),
    );
    await expect(fetchFileContent('a', 'b', 'src/a.txt')).resolves.toMatchObject({
      content: 'こんにちは\n',
      sha: 'abc',
    });
  });
});

describe('searchCode', () => {
  it('検索結果の items を返す', async () => {
    server.use(
      http.get(`${API}/search/code`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('q')).toContain('repo:a/b');
        return HttpResponse.json({ items: [{ path: 'x.ts' }] });
      }),
    );
    await expect(searchCode('a', 'b', 'foo', 'token')).resolves.toEqual([{ path: 'x.ts' }]);
  });
});

describe('fetchRateLimit', () => {
  it('rate の値を返す', async () => {
    server.use(
      http.get(`${API}/rate_limit`, () =>
        HttpResponse.json({ rate: { remaining: 59, limit: 60, reset: 1700000000 } }),
      ),
    );
    await expect(fetchRateLimit()).resolves.toEqual({
      remaining: 59,
      limit: 60,
      reset: 1700000000,
    });
  });
});

describe('fetchBranches', () => {
  it('ブランチ名と sha に変換する', async () => {
    server.use(
      http.get(`${API}/repos/a/b/branches`, () =>
        HttpResponse.json([{ name: 'main', commit: { sha: 's1' } }]),
      ),
    );
    await expect(fetchBranches('a', 'b')).resolves.toEqual([{ name: 'main', sha: 's1' }]);
  });
});

describe('エラーの正規化', () => {
  const failWith = (status: number, headers: Record<string, string> = {}) =>
    server.use(
      http.get(`${API}/repos/a/b`, () => HttpResponse.json({ message: 'x' }, { status, headers })),
    );

  it('残量 0 の 403 は resetAt 付きの rate_limit', async () => {
    failWith(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1700000000' });
    await expect(fetchRepoInfo('a', 'b')).rejects.toMatchObject({
      kind: 'rate_limit',
      resetAt: 1700000000,
    });
  });

  it('残量のある 403 は rate_limit にしない', async () => {
    failWith(403, { 'x-ratelimit-remaining': '10' });
    await expect(fetchRepoInfo('a', 'b')).rejects.toMatchObject({ kind: 'unknown' });
  });

  it('429 は rate_limit、401 は unauthorized', async () => {
    failWith(429);
    await expect(fetchRepoInfo('a', 'b')).rejects.toMatchObject({ kind: 'rate_limit' });
    failWith(401);
    await expect(fetchRepoInfo('a', 'b')).rejects.toMatchObject({ kind: 'unauthorized' });
  });

  it('通信失敗は network', async () => {
    server.use(http.get(`${API}/repos/a/b`, () => HttpResponse.error()));
    await expect(fetchRepoInfo('a', 'b')).rejects.toMatchObject({ kind: 'network' });
  });

  it('PAT をエラーメッセージに含めない', async () => {
    failWith(401);
    const error = await fetchRepoInfo('a', 'b', 'ghp_secret').catch((e: Error) => e);
    expect(String((error as Error).message)).not.toContain('ghp_secret');
  });

  it('想定外の形のレスポンスは invalid_response', async () => {
    server.use(http.get(`${API}/repos/a/b`, () => HttpResponse.json({ foo: 1 })));
    await expect(fetchRepoInfo('a', 'b')).rejects.toMatchObject({ kind: 'invalid_response' });
  });

  it('中断された場合は AbortError をそのまま投げる', async () => {
    server.use(http.get(`${API}/repos/a/b`, () => HttpResponse.json({ default_branch: 'main' })));
    const controller = new AbortController();
    controller.abort();
    await expect(fetchRepoInfo('a', 'b', null, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});

describe('大きなデータ', () => {
  it('truncated を返す', async () => {
    server.use(
      http.get(`${API}/repos/a/b/git/trees/main`, () =>
        HttpResponse.json({ truncated: true, tree: [] }),
      ),
    );
    await expect(fetchRepoTree('a', 'b', 'main')).resolves.toMatchObject({ truncated: true });
  });

  it('上限を超えるファイルは too_large', async () => {
    server.use(
      http.get(`${API}/repos/a/b/contents/big.txt`, () =>
        HttpResponse.json({ content: '', encoding: 'none', sha: 's', size: 5_000_000 }),
      ),
    );
    await expect(fetchFileContent('a', 'b', 'big.txt')).rejects.toMatchObject({
      kind: 'too_large',
    });
  });

  it('ブランチは 100 件を超えたら次ページも取得する', async () => {
    const page = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ name: `b${i}`, commit: { sha: 's' } }));
    server.use(
      http.get(`${API}/repos/a/b/branches`, ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('page') === '1' ? page(100) : page(5),
        ),
      ),
    );
    await expect(fetchBranches('a', 'b')).resolves.toHaveLength(105);
  });
});
