import { http, HttpResponse, delay } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/test/server';
import type { Bookmark, TreeNode } from '@/shared/types';
import { MAX_SEARCH_RESULTS } from '@/shared/lib/searchUtils';
import { useAppStore } from './useAppStore';

const API = 'https://api.github.com';
const store = () => useAppStore.getState();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => {
  useAppStore.setState(useAppStore.getInitialState(), true);
});

const bookmark = (id: string, line: number): Bookmark => ({
  id,
  repo: 'o/r',
  branch: 'main',
  path: 'a.ts',
  line,
  text: 'x',
});

describe('bookmarks スライス', () => {
  it('同じ行のブックマークは重複して追加されない', () => {
    store().addBookmark(bookmark('1', 3));
    store().addBookmark(bookmark('2', 3));
    store().addBookmark(bookmark('3', 4));
    expect(store().bookmarks.map((b) => b.id)).toEqual(['1', '3']);
  });

  it('id を指定して削除できる', () => {
    store().addBookmark(bookmark('1', 3));
    store().removeBookmark('1');
    expect(store().bookmarks).toEqual([]);
  });
});

describe('tabs スライス', () => {
  const mockFile = (path: string, text: string, onRequest?: () => void) =>
    server.use(
      http.get(`${API}/repos/o/r/contents/${path}`, () => {
        onRequest?.();
        return HttpResponse.json({ content: btoa(text), encoding: 'base64', sha: 's', size: 1 });
      }),
    );

  beforeEach(() => {
    useAppStore.setState({ currentRepo: 'o/r', currentBranch: 'main' });
  });

  it('ファイルを開くと本文を取得し、アクティブにする', async () => {
    mockFile('a.ts', 'const a = 1;');
    await store().openFile('a.ts');
    expect(store().activePane1FilePath).toBe('a.ts');
    expect(store().openedFiles[0]).toMatchObject({ content: 'const a = 1;', loading: false });
  });

  it('取得済みのファイルは再取得せずタブを切り替えるだけ', async () => {
    const onRequest = vi.fn();
    mockFile('a.ts', 'a', onRequest);
    await store().openFile('a.ts');
    await store().openFile('a.ts');
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('取得に失敗したら error を持ち、本文にはエラー文を混ぜない', async () => {
    server.use(
      http.get(
        `${API}/repos/o/r/contents/missing.ts`,
        () => new HttpResponse(null, { status: 404 }),
      ),
    );
    await store().openFile('missing.ts');
    const file = store().openedFiles[0];
    expect(file?.error).toBeTruthy();
    expect(file?.content).toBe('');
    expect(file?.loading).toBe(false);
  });

  it('失敗したファイルは retryFile で再取得できる', async () => {
    server.use(
      http.get(`${API}/repos/o/r/contents/a.ts`, () => new HttpResponse(null, { status: 500 })),
    );
    await store().openFile('a.ts');
    expect(store().openedFiles[0]?.error).toBeTruthy();
    mockFile('a.ts', 'ok');
    await store().retryFile('a.ts');
    expect(store().openedFiles[0]).toMatchObject({ content: 'ok', loading: false });
    expect(store().openedFiles[0]?.error).toBeUndefined();
  });

  it('アクティブなファイルを閉じると別のタブへ切り替わる', async () => {
    mockFile('a.ts', 'a');
    mockFile('b.ts', 'b');
    await store().openFile('a.ts');
    await store().openFile('b.ts');
    store().closeFile('b.ts');
    expect(store().openedFiles.map((f) => f.path)).toEqual(['a.ts']);
    expect(store().activePane1FilePath).toBe('a.ts');
  });
});

describe('search スライス', () => {
  const blob = (path: string): TreeNode => ({
    path,
    name: path,
    type: 'blob',
    sha: 's',
    children: [],
  });

  it('PAT が無ければファイル名を検索する', async () => {
    useAppStore.setState({ treeData: [blob('src/App.tsx'), blob('README.md')] });
    await store().searchInRepo('app');
    expect(store().searchResults.map((r) => r.path)).toEqual(['src/App.tsx']);
    expect(store().searchLoading).toBe(false);
    expect(store().searchDrawerOpen).toBe(true);
  });

  it('結果は上限で切る', async () => {
    useAppStore.setState({
      treeData: Array.from({ length: MAX_SEARCH_RESULTS + 50 }, (_, i) => blob(`f${i}.ts`)),
    });
    await store().searchInRepo('f');
    expect(store().searchResults).toHaveLength(MAX_SEARCH_RESULTS);
  });

  it('新しい検索を始めると、遅れて返った前の検索で結果を上書きしない', async () => {
    server.use(
      http.get(`${API}/search/code`, async ({ request }) => {
        const q = new URL(request.url).searchParams.get('q') ?? '';
        if (q.startsWith('slow')) await delay(50);
        return HttpResponse.json({ items: [] });
      }),
    );
    useAppStore.setState({
      pat: 'token',
      currentRepo: 'o/r',
      treeData: [blob('slow.ts'), blob('fast.ts')],
    });
    const first = store().searchInRepo('slow');
    await store().searchInRepo('fast');
    await first;
    expect(store().searchQuery).toBe('fast');
    expect(store().searchResults.map((r) => r.path)).toEqual(['fast.ts']);
    expect(store().searchLoading).toBe(false);
  });
});

describe('repository スライス: switchBranch', () => {
  it('ブランチを切り替えるとツリーを取得し直し、開いていたファイルを閉じる', async () => {
    server.use(
      http.get(`${API}/repos/o/r/git/trees/dev`, () =>
        HttpResponse.json({
          truncated: false,
          tree: [{ path: 'dev.md', type: 'blob', mode: '100644', sha: 's' }],
        }),
      ),
    );
    useAppStore.setState({
      currentRepo: 'o/r',
      currentBranch: 'main',
      openedFiles: [{ path: 'a.ts', content: 'a', scrollPos: 0, sha: 's', loading: false }],
    });
    await store().switchBranch('dev');
    expect(store().currentBranch).toBe('dev');
    expect(store().treeData.map((n) => n.path)).toEqual(['dev.md']);
    expect(store().openedFiles).toEqual([]);
  });

  it('取得に失敗したら treeError を設定する', async () => {
    server.use(
      http.get(`${API}/repos/o/r/git/trees/dev`, () => new HttpResponse(null, { status: 404 })),
    );
    useAppStore.setState({ currentRepo: 'o/r', currentBranch: 'main' });
    await store().switchBranch('dev');
    expect(store().treeError).toBeTruthy();
    expect(store().treeLoading).toBe(false);
  });
});
