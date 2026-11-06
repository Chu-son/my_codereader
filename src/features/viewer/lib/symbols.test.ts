import { describe, expect, it } from 'vitest';
import { Text } from '@codemirror/state';
import type { Parser } from '@lezer/common';
import { javascriptLanguage, typescriptLanguage } from '@codemirror/lang-javascript';
import { pythonLanguage } from '@codemirror/lang-python';
import { goLanguage } from '@codemirror/lang-go';
import { cppLanguage } from '@codemirror/lang-cpp';

const jsParser = javascriptLanguage.parser;
const tsParser = typescriptLanguage.parser;
const pyParser = pythonLanguage.parser;
const goParser = goLanguage.parser;
const cppParser = cppLanguage.parser;
import { extractSymbols, findDefinition, findEnclosingSymbol, findReferences } from './symbols';

const extract = (parser: Parser, src: string, lang: string | null) =>
  extractSymbols(parser.parse(src), Text.of(src.split('\n')), lang);
const brief = (symbols: ReturnType<typeof extract>) =>
  symbols.map((s) => `${'  '.repeat(s.depth)}${s.kind}:${s.name}@${s.line}`);

describe('extractSymbols', () => {
  it('TypeScript の宣言をネストの深さつきで文書順に取り出す', () => {
    const src = [
      'export function foo(a: number) {',
      '  const local = 1;',
      '  function inner() {}',
      '}',
      'export const bar = () => 1;',
      'let count = 0;',
      'class Box extends Base {',
      '  size = 1;',
      '  open() {}',
      '}',
      'interface Shape { a: string }',
      'type Id = string;',
      'enum Color { Red }',
    ].join('\n');

    expect(brief(extract(tsParser, src, 'typescript'))).toEqual([
      'function:foo@1',
      '  function:inner@3',
      'function:bar@5',
      'variable:count@6',
      'class:Box@7',
      '  property:size@8',
      '  method:open@9',
      'interface:Shape@11',
      'type:Id@12',
      'enum:Color@13',
    ]);
  });

  it('総称型のアロー関数の後ろも取りこぼさない', () => {
    const src = 'const id = <T>(x: T): T => x;\nfunction after() {}';
    expect(brief(extract(tsParser, src, 'typescript'))).toEqual([
      'function:id@1',
      'function:after@2',
    ]);
  });

  it('宣言の最終行を持つ', () => {
    const [foo] = extract(jsParser, 'function foo() {\n  return 1;\n}', 'javascript');
    expect(foo).toMatchObject({ line: 1, endLine: 3, from: 9 });
  });

  it('Python のクラス内の関数はメソッドになる', () => {
    const src = 'def f(a):\n  pass\nclass K:\n  def m(self):\n    pass\nx = 1';
    expect(brief(extract(pyParser, src, 'python'))).toEqual([
      'function:f@1',
      'class:K@3',
      '  method:m@4',
      'variable:x@6',
    ]);
  });

  it('Go のメソッドは受け取り側の引数名ではなくメソッド名を拾う', () => {
    const src = 'package m\nfunc F() {}\nfunc (r *R) M() {}\ntype R struct {}';
    expect(brief(extract(goParser, src, 'go'))).toEqual(['function:F@2', 'method:M@3', 'type:R@4']);
  });

  it('C++ の構造体は本体のあるものだけを宣言とみなす', () => {
    const src = 'struct S { int a; };\nstruct S *p;\nint f(int a) { return 0; }';
    expect(brief(extract(cppParser, src, 'cpp'))).toEqual(['class:S@1', 'function:f@3']);
  });

  it('未対応の言語では空配列', () => {
    expect(extract(tsParser, 'function foo() {}', 'markdown')).toEqual([]);
    expect(extract(tsParser, 'function foo() {}', null)).toEqual([]);
  });
});

describe('findDefinition', () => {
  const src = 'function a() {}\nfunction b() { function a() {} }\nfunction c() {}';
  const symbols = extract(tsParser, src, 'javascript');

  it('同名が複数あれば、指定位置より前で最も近いものを選ぶ', () => {
    expect(findDefinition(symbols, 'a', src.indexOf('function c'))?.line).toBe(2);
    expect(findDefinition(symbols, 'a', 5)?.line).toBe(1);
  });

  it('前に無ければ最初の宣言、見つからなければ null', () => {
    expect(findDefinition(symbols, 'c', 0)?.line).toBe(3);
    expect(findDefinition(symbols, 'zzz', 0)).toBeNull();
  });
});

describe('findEnclosingSymbol', () => {
  it('行を囲む最も内側の宣言を返す', () => {
    const src = 'class K {\n  m() {\n    return 1;\n  }\n}\nconst x = 1;';
    const symbols = extract(tsParser, src, 'javascript');
    expect(findEnclosingSymbol(symbols, 3)?.name).toBe('m');
    expect(findEnclosingSymbol(symbols, 5)?.name).toBe('K');
    expect(findEnclosingSymbol(symbols, 6)?.name).toBe('x');
  });
});

describe('findReferences', () => {
  it('単語単位で数え、$ を含む識別子の一部には一致しない', () => {
    const refs = findReferences('foo(foo);\nfoobar $foo foo$\n  foo', 'foo');
    expect(refs.map((r) => [r.line, r.start])).toEqual([
      [1, 0],
      [1, 4],
      [3, 2],
    ]);
  });

  it('上限で打ち切り、正規表現の記号はそのまま扱う', () => {
    expect(findReferences('a a a a', 'a', 2)).toHaveLength(2);
    expect(findReferences('$el.x $el', '$el')).toHaveLength(2);
  });
});
