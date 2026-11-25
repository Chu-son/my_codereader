import { describe, expect, it } from 'vitest';
import { findCandidateLine, toCodeCandidates } from './codeCandidates';

const item = (path: string, ...fragments: string[]) => ({
  path,
  text_matches: fragments.map((fragment) => ({ fragment, matches: [] })),
});

describe('toCodeCandidates', () => {
  const paths = new Set(['use.ts', 'def.py', 'go.go', 'bare.ts']);

  it('宣言らしい候補を先頭へ寄せ、単語のある行を抜粋にする', () => {
    const result = toCodeCandidates(
      [item('use.ts', 'a\n  foo(1);\nb'), item('def.py', 'x\ndef foo(a):\n  pass')],
      'foo',
      paths,
    );
    expect(result).toEqual([
      { path: 'def.py', text: 'def foo(a):', isDefinition: true },
      { path: 'use.ts', text: 'foo(1);', isDefinition: false },
    ]);
  });

  it('Go のメソッドも宣言とみなす', () => {
    const [first] = toCodeCandidates([item('go.go', 'func (s *S) Foo() {}')], 'Foo', paths);
    expect(first?.isDefinition).toBe(true);
  });

  it('いまのブランチのツリーに無いファイルは除く', () => {
    expect(toCodeCandidates([item('gone.ts', 'foo')], 'foo', paths)).toEqual([]);
  });

  it('抜粋が無くても候補として残す', () => {
    expect(toCodeCandidates([{ path: 'bare.ts' }], 'foo', paths)).toEqual([
      { path: 'bare.ts', text: '', isDefinition: false },
    ]);
  });

  it('単語の一部だけの一致は宣言にしない', () => {
    const [first] = toCodeCandidates([item('use.ts', 'function fooBar() {}')], 'foo', paths);
    expect(first?.isDefinition).toBe(false);
  });
});

describe('findCandidateLine', () => {
  it('宣言があれば最初の出現より優先する', () => {
    expect(findCandidateLine('foo();\n\nexport function foo() {}', 'foo')).toBe(3);
  });

  it('宣言が無ければ最初の出現', () => {
    expect(findCandidateLine('a\nb(foo)\nfoo', 'foo')).toBe(2);
  });

  it('見つからなければ先頭', () => {
    expect(findCandidateLine('foobar\nxfoo', 'foo')).toBe(1);
  });

  it('$ を含む識別子も文字どおりに探す', () => {
    expect(findCandidateLine('a\nconst $el = 1', '$el')).toBe(2);
  });
});
