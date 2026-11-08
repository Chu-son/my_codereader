import { describe, expect, it } from 'vitest';
import type { DocSymbol } from '@/shared/types';
import {
  buildItems,
  emptyMessage,
  fuzzyScore,
  parseQuery,
  rankPaths,
  rankSymbols,
  type QuickOpenSource,
} from './quickOpen';

const symbol = (name: string, line: number): DocSymbol => ({
  name,
  kind: 'function',
  from: line * 10,
  endLine: line,
  line,
  depth: 0,
});

const source: QuickOpenSource = {
  paths: ['src/core/Ky.ts', 'src/errors/HTTPError.ts', 'docs/ky-guide.md'],
  openTabs: ['src/core/Ky.ts'],
  activePath: 'src/core/Ky.ts',
  symbols: [symbol('createInstance', 3), symbol('retry', 8)],
  lineCount: 100,
};

describe('parseQuery', () => {
  it.each([
    ['foo', 'file', 'foo'],
    ['@ bar ', 'symbol', 'bar'],
    [':42', 'line', '42'],
    ['#text here', 'text', 'text here'],
    ['', 'file', ''],
  ])('%s', (query, mode, term) => {
    expect(parseQuery(query)).toEqual({ mode, term });
  });
});

describe('fuzzyScore', () => {
  it('文字が順に現れなければ一致しない', () => {
    expect(fuzzyScore('zk', 'Ky.ts')).toBeNull();
  });

  it('大文字小文字を区別しない', () => {
    expect(fuzzyScore('httperror', 'HTTPError.ts')).not.toBeNull();
  });

  it('連続した一致を、飛び飛びの一致より高くする', () => {
    expect(fuzzyScore('err', 'errors.ts') ?? 0).toBeGreaterThan(
      fuzzyScore('err', 'e-x-r-r.ts') ?? 0,
    );
  });

  it('単語の先頭の一致を高くする', () => {
    expect(fuzzyScore('fb', 'fooBar') ?? 0).toBeGreaterThan(fuzzyScore('fb', 'fxxb') ?? 0);
  });
});

describe('rankPaths', () => {
  it('ファイル名の一致を、ディレクトリだけの一致より上にする', () => {
    expect(rankPaths('core', ['core/a.ts', 'lib/core.ts'])).toEqual(['lib/core.ts', 'core/a.ts']);
  });

  it('スラッシュを含む入力はパス全体で比べる', () => {
    expect(rankPaths('core/a', ['core/a.ts', 'other/a.ts'])).toEqual(['core/a.ts']);
  });

  it('候補は 50 件まで', () => {
    const many = Array.from({ length: 80 }, (_, i) => `f${i}.ts`);
    expect(rankPaths('f', many)).toHaveLength(50);
  });
});

describe('rankSymbols', () => {
  it('入力が無ければファイルの順', () => {
    expect(rankSymbols('', source.symbols).map((s) => s.name)).toEqual(['createInstance', 'retry']);
  });

  it('よく一致するものを上にする', () => {
    expect(rankSymbols('ret', source.symbols)[0]?.name).toBe('retry');
  });

  it('入力で絞り込む', () => {
    expect(rankSymbols('retr', source.symbols).map((s) => s.name)).toEqual(['retry']);
  });
});

describe('buildItems', () => {
  it('入力が無ければ開いているタブ', () => {
    expect(buildItems('', source).map((i) => i.action)).toEqual([
      { kind: 'open', path: 'src/core/Ky.ts' },
    ]);
  });

  it('@ は操作中のファイルの宣言の行へ', () => {
    expect(buildItems('@retry', source).map((i) => i.action)).toEqual([
      { kind: 'open', path: 'src/core/Ky.ts', line: 8 },
    ]);
  });

  it(': は行番号へ。行数を超えたら末尾に丸める', () => {
    expect(buildItems(':42', source)[0]?.action).toEqual({
      kind: 'open',
      path: 'src/core/Ky.ts',
      line: 42,
    });
    expect(buildItems(':999', source)[0]?.action).toMatchObject({ line: 100 });
  });

  it.each([':', ':0', ':abc'])('%s は候補を出さない', (query) => {
    expect(buildItems(query, source)).toEqual([]);
  });

  it('# はリポジトリ内検索へ', () => {
    expect(buildItems('#fetch', source)[0]?.action).toEqual({ kind: 'search', text: 'fetch' });
    expect(buildItems('#', source)).toEqual([]);
  });

  it('ファイルを開いていなければ @ と : は候補を出さない', () => {
    const none = { ...source, activePath: null };
    expect(buildItems('@retry', none)).toEqual([]);
    expect(buildItems(':3', none)).toEqual([]);
  });
});

describe('emptyMessage', () => {
  it('何も入力していなければ案内を出さない', () => {
    expect(emptyMessage('', 'a.ts')).toBeNull();
  });

  it('ファイル未選択の @ は先に開くよう案内する', () => {
    expect(emptyMessage('@x', null)).toBe('先にファイルを開いてください');
  });
});
