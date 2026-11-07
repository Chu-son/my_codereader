import { describe, expect, it } from 'vitest';
import { Text } from '@codemirror/state';
import { typescriptLanguage } from '@codemirror/lang-javascript';
import type { DocSymbol } from '@/shared/types';
import { extractSymbols } from '../symbols';
import { extractModuleLinks } from './moduleLinks';
import { resolveImportPath } from './resolvePath';
import { findDefinitionTarget, locateDefinition } from './resolveDefinition';

const parse = (src: string) => {
  const doc = Text.of(src.split('\n'));
  return { tree: typescriptLanguage.parser.parse(src), doc };
};
const links = (src: string) => {
  const { tree, doc } = parse(src);
  return extractModuleLinks(tree, doc);
};
const symbolsOf = (src: string): DocSymbol[] => {
  const { tree, doc } = parse(src);
  return extractSymbols(tree, doc, 'typescript');
};

describe('extractModuleLinks', () => {
  it('import の既定・名前付き・別名・名前空間・type を取り出す', () => {
    const result = links(
      [
        "import a, { b as c, type D, e } from './x';",
        'import * as ns from "../y";',
        "import type { T } from './t';",
      ].join('\n'),
    );
    expect(result.imports).toEqual([
      { local: 'a', imported: 'default', source: './x' },
      { local: 'c', imported: 'b', source: './x' },
      { local: 'D', imported: 'D', source: './x' },
      { local: 'e', imported: 'e', source: './x' },
      { local: 'ns', imported: '*', source: '../y' },
      { local: 'T', imported: 'T', source: './t' },
    ]);
  });

  it('再 export・export の別名・default を取り出す', () => {
    const result = links(
      [
        "export { f, g as h } from './z';",
        "export * from './w';",
        "export * as nn from './v';",
        'const q = 1;',
        'export { q as qq };',
        'export default function foo() {}',
      ].join('\n'),
    );
    expect(result.reexports).toEqual([
      { exported: 'f', imported: 'f', source: './z' },
      { exported: 'h', imported: 'g', source: './z' },
      { exported: '*', imported: '*', source: './w' },
      { exported: 'nn', imported: '*', source: './v' },
    ]);
    expect(result.aliases).toEqual([
      { exported: 'qq', local: 'q' },
      { exported: 'default', local: 'foo' },
    ]);
    expect(result.defaultLine).toBe(6);
  });

  it('名前の無い export default は行だけを持つ', () => {
    const result = links('const x = 1;\nexport default () => x;');
    expect(result.aliases).toEqual([]);
    expect(result.defaultLine).toBe(2);
  });
});

describe('resolveImportPath', () => {
  const paths = new Set([
    'src/a.ts',
    'src/lib/index.ts',
    'src/util.tsx',
    'src/esm.ts',
    'src/data.json',
    'root.js',
  ]);

  it.each([
    ['src/b.ts', './a', 'src/a.ts'],
    ['src/b.ts', './a.ts', 'src/a.ts'],
    ['src/b.ts', './lib', 'src/lib/index.ts'],
    ['src/b.ts', './util', 'src/util.tsx'],
    ['src/b.ts', './esm.js', 'src/esm.ts'],
    ['src/b.ts', './data.json', 'src/data.json'],
    ['src/lib/index.ts', '../a', 'src/a.ts'],
    ['src/lib/index.ts', '../../root', 'root.js'],
    ['src/lib/index.ts', '.', 'src/lib/index.ts'],
  ])('%s から %s は %s', (from, source, expected) => {
    expect(resolveImportPath(from, source, paths)).toBe(expected);
  });

  it.each([
    ['パッケージ', 'react'],
    ['エイリアス', '@/shared/lib'],
    ['ツリーに無いファイル', './missing'],
    ['リポジトリの外', '../../../x'],
  ])('%s は解決しない', (_label, source) => {
    expect(resolveImportPath('src/b.ts', source, paths)).toBeNull();
  });
});

describe('findDefinitionTarget / locateDefinition', () => {
  const files: Record<string, string> = {
    'src/main.ts': [
      "import ky, { HTTPError as Err, retry } from './index';",
      "import { useState } from 'react';",
      "import * as utils from './utils';",
      'function run() {',
      '  return ky(Err, retry, useState, utils);',
      '}',
    ].join('\n'),
    'src/index.ts': [
      "import { createInstance } from './core/instance';",
      "export { HTTPError } from './errors';",
      "export * from './retry';",
      'const ky = createInstance();',
      'export default ky;',
    ].join('\n'),
    'src/core/instance.ts': 'export const createInstance = () => ({});',
    'src/errors.ts': '// errors\n\nexport class HTTPError extends Error {}',
    'src/retry.ts': 'export type Options = {};\nexport function retry() {}',
    'src/utils.ts': 'export const a = 1;',
  };
  const paths = new Set(Object.keys(files));
  const loaded: string[] = [];
  const ctx = {
    paths,
    load: async (path: string) => {
      loaded.push(path);
      return files[path] ?? null;
    },
  };
  const main = files['src/main.ts'] ?? '';
  const wordAt = (text: string, nth = 1) => {
    let from = -1;
    for (let i = 0; i < nth; i++) from = main.indexOf(text, from + 1);
    return { text, from };
  };
  const find = (text: string, nth = 2) =>
    findDefinitionTarget('src/main.ts', main, symbolsOf(main), wordAt(text, nth), paths);
  const resolve = async (text: string, nth = 2) =>
    locateDefinition('src/main.ts', await find(text, nth), ctx);

  it('同じファイルの宣言は取得せずに答える', async () => {
    loaded.length = 0;
    expect(await resolve('run', 1)).toEqual({ path: 'src/main.ts', line: 4 });
    expect(loaded).toEqual([]);
  });

  it('別ファイルの定義は、パスが分かった時点ではまだ取得しない', async () => {
    loaded.length = 0;
    expect(await find('Err')).toEqual({
      kind: 'import',
      path: 'src/index.ts',
      imported: 'HTTPError',
    });
    expect(loaded).toEqual([]);
  });

  it('再 export を順にたどって、定義のある行まで進む', async () => {
    expect(await resolve('Err')).toEqual({ path: 'src/errors.ts', line: 3 });
  });

  it('export * の先も探す', async () => {
    expect(await resolve('retry')).toEqual({ path: 'src/retry.ts', line: 2 });
  });

  it('export default の名前から、その宣言へ進む', async () => {
    expect(await resolve('ky')).toEqual({ path: 'src/index.ts', line: 4 });
  });

  it('名前空間の import はファイルの先頭へ', async () => {
    expect(await resolve('utils')).toEqual({ path: 'src/utils.ts', line: 1 });
  });

  it('パッケージからの import は外部として扱い、たどらない', async () => {
    expect(await find('useState')).toEqual({ kind: 'external', source: 'react' });
    expect(await resolve('useState')).toBeNull();
  });

  it('import はあるが定義が見つからなければ、そのファイルの先頭へ', async () => {
    const src = "import { nothing } from './utils';\nnothing;";
    const target = await findDefinitionTarget(
      'src/main.ts',
      src,
      symbolsOf(src),
      { text: 'nothing', from: src.lastIndexOf('nothing') },
      paths,
    );
    expect(await locateDefinition('src/main.ts', target, ctx)).toEqual({
      path: 'src/utils.ts',
      line: 1,
    });
  });

  it('JS/TS 以外は同じファイルの宣言だけを見る', async () => {
    const target = await findDefinitionTarget('a.py', 'x', [], { text: 'x', from: 0 }, paths);
    expect(target).toEqual({ kind: 'none' });
  });

  it('export * が多いバレルでも、取得するのは 6 ファイルまで', async () => {
    const barrel: Record<string, string> = {
      'b/index.ts': Array.from({ length: 10 }, (_, i) => `export * from './m${i}';`).join('\n'),
    };
    for (let i = 0; i < 10; i++) barrel[`b/m${i}.ts`] = `export const x${i} = ${i};`;
    const fetched: string[] = [];
    const location = await locateDefinition(
      'main.ts',
      { kind: 'import', path: 'b/index.ts', imported: 'x9' },
      {
        paths: new Set(Object.keys(barrel)),
        load: async (path) => {
          fetched.push(path);
          return barrel[path] ?? null;
        },
      },
    );
    expect(fetched).toHaveLength(6);
    expect(location).toEqual({ path: 'b/index.ts', line: 1 });
  });
});
