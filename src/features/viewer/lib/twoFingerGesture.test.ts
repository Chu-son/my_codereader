import { describe, expect, it } from 'vitest';
import { pinchedFontSize, swipeDirection, trackTwoFingers } from './twoFingerGesture';

const p = (x: number, y = 0) => ({ x, y });

describe('trackTwoFingers', () => {
  it('動きが小さいうちは判別しない', () => {
    expect(trackTwoFingers(p(0), p(100))(p(5), p(105))).toEqual({ kind: 'none' });
  });

  it('指の間隔が変われば、間隔の比を返すピンチ', () => {
    expect(trackTwoFingers(p(0), p(100))(p(-25), p(125))).toEqual({ kind: 'pinch', scale: 1.5 });
  });

  it('間隔を保って横に動けばスワイプ', () => {
    expect(trackTwoFingers(p(0), p(100))(p(40), p(140))).toEqual({ kind: 'swipe', dx: 40 });
  });

  it('縦の動きは何もしない', () => {
    expect(trackTwoFingers(p(0), p(100))(p(0, 40), p(100, 40))).toEqual({ kind: 'none' });
  });

  it('一度決まった種類は途中で変わらない', () => {
    const update = trackTwoFingers(p(0), p(100));
    update(p(-20), p(120));
    expect(update(p(180), p(320)).kind).toBe('pinch');
  });
});

describe('swipeDirection', () => {
  it.each([
    [80, 'back'],
    [-80, 'forward'],
    [79, null],
    [-79, null],
  ])('dx=%i は %s', (dx, expected) => {
    expect(swipeDirection(dx)).toBe(expected);
  });
});

describe('pinchedFontSize', () => {
  it.each([
    [14, 1.5, 21],
    [14, 10, 24],
    [14, 0.1, 6],
    [14, 1.03, 14],
  ])('%i × %f は %i', (start, scale, expected) => {
    expect(pinchedFontSize(start, scale, 6, 24)).toBe(expected);
  });
});
