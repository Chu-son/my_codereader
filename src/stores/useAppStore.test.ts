import { beforeEach, describe, expect, it } from 'vitest';
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
