import { describe, expect, it } from 'vitest';
import type { OpenedFile, TreeNode } from '@/shared/types';
import {
  MAX_SEARCH_RESULTS,
  convertGitHubSearchResults,
  searchInCachedFiles,
  searchInTree,
} from './searchUtils';

const blob = (path: string): TreeNode => ({
  path,
  name: path.split('/').pop() ?? path,
  type: 'blob',
  sha: 'sha',
  children: [],
});

const tree: TreeNode[] = [
  {
    path: 'src',
    name: 'src',
    type: 'tree',
    sha: 'sha',
    children: [blob('src/App.tsx'), blob('src/main.tsx')],
  },
  blob('README.md'),
];

describe('searchInTree', () => {
  it('ファイル名に一致するファイルを大文字小文字を無視して返す', () => {
    const results = searchInTree('app', tree);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ path: 'src/App.tsx', lineNumber: 0, matchStart: 0 });
  });

  it('ディレクトリ名にはマッチしない', () => {
    expect(searchInTree('src', tree)).toEqual([]);
  });

  it('空のクエリは空配列を返す', () => {
    expect(searchInTree('  ', tree)).toEqual([]);
  });

  it('正規表現の特殊文字をそのまま検索する', () => {
    expect(searchInTree('(', [blob('a(b).ts')])).toHaveLength(1);
  });

  it('結果を上限までに制限する', () => {
    const many = Array.from({ length: MAX_SEARCH_RESULTS + 50 }, (_, i) => blob(`f${i}.ts`));
    expect(searchInTree('f', many)).toHaveLength(MAX_SEARCH_RESULTS);
  });
});

describe('searchInCachedFiles', () => {
  const file = (over: Partial<OpenedFile>): OpenedFile => ({
    path: 'a.ts',
    content: '',
    scrollPos: 0,
    sha: 'sha',
    loading: false,
    ...over,
  });

  it('行番号と一致位置を返す', () => {
    const results = searchInCachedFiles('foo', [file({ content: 'bar\n  const foo = 1' })]);
    expect(results).toEqual([
      { path: 'a.ts', lineNumber: 2, lineContent: 'const foo = 1', matchStart: 8, matchEnd: 11 },
    ]);
  });

  it('同じ行の複数の一致を返す', () => {
    const results = searchInCachedFiles('a', [file({ content: 'aa' })]);
    expect(results).toHaveLength(2);
  });

  it('読み込み中のファイルと本文が空のファイルは対象外にする', () => {
    const files = [file({ content: 'foo', loading: true }), file({ content: '' })];
    expect(searchInCachedFiles('foo', files)).toEqual([]);
  });

  it('空のクエリは空配列を返す', () => {
    expect(searchInCachedFiles('', [file({ content: 'foo' })])).toEqual([]);
  });
});

describe('convertGitHubSearchResults', () => {
  it('text_matches が無い項目はファイル名のみの結果にする', () => {
    expect(convertGitHubSearchResults([{ path: 'a.ts' }])).toEqual([
      { path: 'a.ts', lineNumber: 0, lineContent: 'a.ts', matchStart: 0, matchEnd: 0 },
    ]);
  });

  it('fragment 内の行番号と一致位置に変換する', () => {
    const results = convertGitHubSearchResults([
      {
        path: 'a.ts',
        text_matches: [
          { fragment: 'x\n  hello world', matches: [{ text: 'world', indices: [0, 5] }] },
        ],
      },
    ]);
    expect(results).toEqual([
      { path: 'a.ts', lineNumber: 2, lineContent: 'hello world', matchStart: 8, matchEnd: 13 },
    ]);
  });
});
