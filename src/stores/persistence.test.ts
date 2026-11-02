import { describe, expect, it } from 'vitest';
import { DEFAULT_PERSISTED, migratePersistedState, partializeState } from './persistence';

const bookmark = { id: 'b1', repo: 'o/r', branch: 'main', path: 'a.ts', line: 3, text: 'x' };

describe('migratePersistedState', () => {
  it('旧形式（状態全体）から許可リストの項目だけを取り出す', () => {
    const old = {
      pat: 'ghp_x',
      bookmarks: [bookmark],
      recentRepos: ['o/r'],
      wordWrap: false,
      fontSize: 18,
      treeData: [{ path: 'a' }],
      openedFiles: [{ path: 'a.ts', content: 'secret body' }],
      searchResults: [{}],
      currentRepo: 'o/r',
    };
    const result = migratePersistedState(old);
    expect(Object.keys(result).sort()).toEqual(Object.keys(DEFAULT_PERSISTED).sort());
    expect(result.pat).toBe('ghp_x');
    expect(result.patRemembered).toBe(true);
    expect(result.bookmarks).toEqual([bookmark]);
    expect(result.wordWrap).toBe(false);
    expect(result.fontSize).toBe(18);
    expect(result.showIndentGuides).toBe(true);
  });

  it('不正な型・範囲外の値は既定値に戻す', () => {
    const result = migratePersistedState({
      pat: 123,
      bookmarks: [bookmark, { id: 1 }, null],
      recentRepos: ['a/b', 5],
      wordWrap: 'yes',
      fontSize: 99,
      lineHeight: 'x',
    });
    expect(result.pat).toBeNull();
    expect(result.bookmarks).toEqual([bookmark]);
    expect(result.recentRepos).toEqual(['a/b']);
    expect(result.wordWrap).toBe(true);
    expect(result.fontSize).toBe(14);
    expect(result.lineHeight).toBe(1.5);
  });

  it('オブジェクト以外は既定値を返す', () => {
    expect(migratePersistedState(null)).toEqual(DEFAULT_PERSISTED);
    expect(migratePersistedState('x')).toEqual(DEFAULT_PERSISTED);
  });
});

describe('partializeState', () => {
  it('許可リスト以外を含めない', () => {
    const result = partializeState({ ...DEFAULT_PERSISTED, ...{ treeData: [1] } });
    expect(Object.keys(result).sort()).toEqual(Object.keys(DEFAULT_PERSISTED).sort());
  });
});
