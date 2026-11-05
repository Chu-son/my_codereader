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

describe('ui スライス', () => {
  it('左パネルは既定でエクスプローラーを開き、同じパネルを選ぶと閉じる', () => {
    expect(store().activePanel).toBe('explorer');
    store().togglePanel('explorer');
    expect(store().activePanel).toBeNull();
    store().togglePanel('bookmarks');
    expect(store().activePanel).toBe('bookmarks');
    store().togglePanel('explorer');
    expect(store().activePanel).toBe('explorer');
  });
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

describe('files / panes スライス', () => {
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

  it('ファイルを開くと本文を取得し、操作中のペインでアクティブにする', async () => {
    mockFile('a.ts', 'const a = 1;');
    await store().navigateTo('a.ts');
    expect(store().panes[1]).toEqual({ tabs: ['a.ts'], active: 'a.ts' });
    expect(store().files['a.ts']).toMatchObject({ content: 'const a = 1;', loading: false });
  });

  it('取得済みのファイルは再取得しない', async () => {
    const onRequest = vi.fn();
    mockFile('a.ts', 'a', onRequest);
    await store().navigateTo('a.ts');
    await store().navigateTo('a.ts');
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('取得に失敗したら error を持ち、本文にはエラー文を混ぜない', async () => {
    server.use(
      http.get(
        `${API}/repos/o/r/contents/missing.ts`,
        () => new HttpResponse(null, { status: 404 }),
      ),
    );
    await store().navigateTo('missing.ts');
    const file = store().files['missing.ts'];
    expect(file?.error).toBeTruthy();
    expect(file?.content).toBe('');
    expect(file?.loading).toBe(false);
  });

  it('失敗したファイルは ensureFile で再取得できる', async () => {
    server.use(
      http.get(`${API}/repos/o/r/contents/a.ts`, () => new HttpResponse(null, { status: 500 })),
    );
    await store().navigateTo('a.ts');
    expect(store().files['a.ts']?.error).toBeTruthy();
    mockFile('a.ts', 'ok');
    await store().ensureFile('a.ts');
    expect(store().files['a.ts']).toMatchObject({ content: 'ok', loading: false });
    expect(store().files['a.ts']?.error).toBeUndefined();
  });

  it('アクティブなタブを閉じると隣のタブへ切り替わり、本文のキャッシュは残る', async () => {
    mockFile('a.ts', 'a');
    mockFile('b.ts', 'b');
    await store().navigateTo('a.ts');
    await store().navigateTo('b.ts');
    store().closeFile(1, 'b.ts');
    expect(store().panes[1]).toEqual({ tabs: ['a.ts'], active: 'a.ts' });
    expect(store().files['b.ts']?.content).toBe('b');
  });

  it('分割すると pane 2 は pane 1 のファイルで始まり、タブはペインごとに独立する', async () => {
    mockFile('a.ts', 'a');
    mockFile('b.ts', 'b');
    await store().navigateTo('a.ts');
    store().toggleSplitView();
    await store().navigateTo('b.ts', { pane: 2 });
    expect(store().panes[1].tabs).toEqual(['a.ts']);
    expect(store().panes[2]).toEqual({ tabs: ['a.ts', 'b.ts'], active: 'b.ts' });
    expect(store().focusedPane).toBe(2);
  });

  it('表示状態はペインごとに独立する', () => {
    store().updateScrollTop(1, 'a.ts', 100);
    store().updateScrollTop(2, 'a.ts', 500);
    store().setCursorLine(1, 'a.ts', 7);
    expect(store().viewState['1:a.ts']).toEqual({ scrollTop: 100, cursorLine: 7 });
    expect(store().viewState['2:a.ts']).toEqual({ scrollTop: 500, cursorLine: 1 });
  });

  it('行ジャンプはペインを指定し、戻ると直前の行へ戻る', async () => {
    mockFile('a.ts', 'a');
    mockFile('b.ts', 'b');
    await store().navigateTo('a.ts');
    store().setCursorLine(1, 'a.ts', 12);
    await store().navigateTo('b.ts', { line: 30 });
    expect(store().jumpTarget).toMatchObject({ path: 'b.ts', line: 30, pane: 1 });

    store().navigateBack();
    expect(store().panes[1].active).toBe('a.ts');
    expect(store().jumpTarget).toMatchObject({ path: 'a.ts', line: 12, pane: 1 });

    store().navigateForward();
    expect(store().jumpTarget).toMatchObject({ path: 'b.ts', line: 30 });
  });

  it('タブを閉じた後でも、戻るとタブを開き直す', async () => {
    mockFile('a.ts', 'a');
    mockFile('b.ts', 'b');
    await store().navigateTo('a.ts');
    await store().navigateTo('b.ts');
    store().closeFile(1, 'a.ts');
    store().navigateBack();
    expect(store().panes[1].tabs).toContain('a.ts');
    expect(store().panes[1].active).toBe('a.ts');
  });

  it('タブの切替は履歴に積まないが、切替先から戻ると切替前の場所へ帰れる', async () => {
    mockFile('a.ts', 'a');
    mockFile('b.ts', 'b');
    await store().navigateTo('a.ts');
    await store().navigateTo('b.ts');
    const before = store().history.length;
    store().setActiveFile(1, 'a.ts');
    expect(store().history).toHaveLength(before);
    store().navigateBack();
    expect(store().panes[1].active).toBe('b.ts');
  });

  it('分割を解除した後は、pane 2 の履歴も pane 1 に表示する', async () => {
    mockFile('a.ts', 'a');
    mockFile('b.ts', 'b');
    await store().navigateTo('a.ts');
    store().toggleSplitView();
    await store().navigateTo('b.ts', { pane: 2, line: 3 });
    store().toggleSplitView();
    store().toggleSplitView();
    expect(store().isSplitView).toBe(false);
    store().navigateBack();
    store().navigateForward();
    expect(store().panes[1].active).toBe('b.ts');
    expect(store().jumpTarget?.pane).toBe(1);
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
  it('ブランチを切り替えるとツリーを取得し直し、開いていたファイルと履歴を捨てる', async () => {
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
      files: { 'a.ts': { path: 'a.ts', content: 'a', sha: 's', loading: false } },
      panes: { 1: { tabs: ['a.ts'], active: 'a.ts' }, 2: { tabs: [], active: null } },
      history: [{ path: 'a.ts', line: 1, pane: 1 }],
      historyIndex: 0,
      isSplitView: true,
    });
    await store().switchBranch('dev');
    expect(store().currentBranch).toBe('dev');
    expect(store().treeData.map((n) => n.path)).toEqual(['dev.md']);
    expect(store().files).toEqual({});
    expect(store().panes[1].tabs).toEqual([]);
    // 別ブランチの履歴で空画面に戻らないよう履歴も捨てる。分割のレイアウトは保つ
    expect(store().history).toEqual([]);
    expect(store().isSplitView).toBe(true);
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
