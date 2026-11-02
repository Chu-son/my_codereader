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

  it('エラー時は API のメッセージで例外を投げる', async () => {
    server.use(
      http.get(`${API}/repos/a/b`, () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 }),
      ),
    );
    await expect(fetchRepoInfo('a', 'b')).rejects.toThrow('Not Found');
  });

  it('エラー本文が JSON でない場合はステータスを含むメッセージにする', async () => {
    server.use(http.get(`${API}/repos/a/b`, () => new HttpResponse('oops', { status: 500 })));
    await expect(fetchRepoInfo('a', 'b')).rejects.toThrow('500');
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
    const tree = await fetchRepoTree('a', 'b', 'main');
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
