export type ScrollMarkerKind = 'bookmark' | 'search';

export interface ScrollMarker {
  line: number;
  kind: ScrollMarkerKind;
}

/**
 * スクロールストリップに描くマーカーを作る。同じ行に複数あればブックマークを優先して 1 つにする。
 * 範囲外の行（本文が変わった後の古いブックマーク等）は捨てる。
 */
export function buildScrollMarkers(
  lineCount: number,
  bookmarkLines: number[],
  searchLines: number[],
): ScrollMarker[] {
  const byLine = new Map<number, ScrollMarkerKind>();
  for (const line of searchLines) byLine.set(line, 'search');
  for (const line of bookmarkLines) byLine.set(line, 'bookmark');
  return [...byLine]
    .filter(([line]) => line >= 1 && line <= lineCount)
    .sort(([a], [b]) => a - b)
    .map(([line, kind]) => ({ line, kind }));
}

/**
 * 行の縦位置（0〜1）。行数の比で近似する。
 * 折り返しが有効だと実際の位置とずれるが、目印としては十分で、レイアウト計測を避けられる。
 */
export const lineRatio = (line: number, lineCount: number) =>
  lineCount <= 1 ? 0 : (line - 1) / (lineCount - 1);
