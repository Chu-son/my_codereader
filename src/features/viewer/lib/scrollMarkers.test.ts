import { describe, expect, it } from 'vitest';
import { buildScrollMarkers, lineRatio } from './scrollMarkers';

describe('buildScrollMarkers', () => {
  it('行順に並べ、同じ行はブックマークを優先する', () => {
    expect(buildScrollMarkers(100, [10], [30, 10])).toEqual([
      { line: 10, kind: 'bookmark' },
      { line: 30, kind: 'search' },
    ]);
  });

  it('範囲外の行は捨てる', () => {
    expect(buildScrollMarkers(5, [6], [0])).toEqual([]);
  });
});

describe('lineRatio', () => {
  it('先頭は 0、末尾は 1', () => {
    expect(lineRatio(1, 11)).toBe(0);
    expect(lineRatio(11, 11)).toBe(1);
    expect(lineRatio(6, 11)).toBe(0.5);
  });

  it('1 行のファイルは 0', () => {
    expect(lineRatio(1, 1)).toBe(0);
  });
});
