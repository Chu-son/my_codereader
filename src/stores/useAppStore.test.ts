import { http, HttpResponse, delay } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import { useAppStore } from './useAppStore';

describe('useAppStore の永続化', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    localStorage.clear();
  });

  it('保存されるのは許可リストの項目だけで、本文・ツリーは含まれない', () => {
    useAppStore.setState({
      pat: 'ghp_x',
      fontSize: 16,
      treeData: [{ path: 'a', name: 'a', type: 'blob', sha: 's', children: [] }],
      openedFiles: [{ path: 'a.ts', content: 'body', scrollPos: 0, sha: 's', loading: false }],
      searchResults: [{ path: 'a', lineNumber: 1, lineContent: 'x', matchStart: 0, matchEnd: 1 }],
    });
    const raw = localStorage.getItem('codereader-storage');
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw ?? '{}');
    expect(saved.version).toBe(1);
    expect(saved.state.fontSize).toBe(16);
    expect(saved.state).not.toHaveProperty('treeData');
    expect(saved.state).not.toHaveProperty('openedFiles');
    expect(saved.state).not.toHaveProperty('searchResults');
  });

  it('version 0 の旧データを読み込むと余分な項目が捨てられる', async () => {
    localStorage.setItem(
      'codereader-storage',
      JSON.stringify({
        state: { fontSize: 20, openedFiles: [{ path: 'x', content: 'old' }], treeData: [1] },
        version: 0,
      }),
    );
    await useAppStore.persist.rehydrate();
    const s = useAppStore.getState();
    expect(s.fontSize).toBe(20);
    expect(s.openedFiles).toEqual([]);
    expect(s.treeData).toEqual([]);
  });
});

describe('useAppStore のリポジトリ読み込み', () => {
  const API = 'https://api.github.com';
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
  });

  const mockRepo = (name: string, branch: string, delayMs = 0) => {
    server.use(
      http.get(`${API}/repos/o/${name}`, async () => {
        await delay(delayMs);
        return HttpResponse.json({ default_branch: branch });
      }),
      http.get(`${API}/repos/o/${name}/git/trees/${branch}`, () =>
        HttpResponse.json({
          truncated: name === 'big',
          tree: [{ path: `${name}.md`, type: 'blob', mode: '100644', sha: 's' }],
        }),
      ),
      http.get(`${API}/repos/o/${name}/branches`, () => HttpResponse.json([])),
    );
  };

  it('切り替え前の遅い読み込みが後から状態を上書きしない', async () => {
    mockRepo('slow', 'main', 50);
    mockRepo('fast', 'main');
    const first = useAppStore.getState().loadRepository('o/slow');
    await useAppStore.getState().loadRepository('o/fast');
    await first;
    expect(useAppStore.getState().currentRepo).toBe('o/fast');
    expect(useAppStore.getState().treeData.map((n) => n.path)).toEqual(['fast.md']);
  });

  it('truncated のツリーはフラグが立つ', async () => {
    mockRepo('big', 'main');
    await useAppStore.getState().loadRepository('o/big');
    expect(useAppStore.getState().treeTruncated).toBe(true);
  });

  it('API エラーは正規化したメッセージを treeError に入れる', async () => {
    server.use(http.get(`${API}/repos/o/none`, () => new HttpResponse(null, { status: 404 })));
    await useAppStore.getState().loadRepository('o/none');
    expect(useAppStore.getState().treeError).toContain('見つかりません');
  });
});
