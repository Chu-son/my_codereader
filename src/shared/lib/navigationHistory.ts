import type { HistoryEntry } from '@/shared/types';

/** 履歴の上限。古いものから捨てる */
export const MAX_HISTORY = 50;

export interface HistoryCursor {
  history: HistoryEntry[];
  index: number;
}

const samePlace = (a: HistoryEntry, b: HistoryEntry) => a.path === b.path && a.pane === b.pane;

/** index より先（進む側）を切り捨てて entry を積む */
export function pushEntry({ history, index }: HistoryCursor, entry: HistoryEntry): HistoryCursor {
  const next = [...history.slice(0, index + 1), entry];
  const overflow = Math.max(0, next.length - MAX_HISTORY);
  return { history: next.slice(overflow), index: next.length - 1 - overflow };
}

/**
 * 移動する直前の現在地を履歴に反映する。
 * 現在地が履歴の先頭と同じファイル・ペインなら行だけ更新し、
 * タブ切替などで履歴外の場所にいるなら新しく積む（戻ったときにそこへ帰れるように）。
 */
export function recordLocation(cursor: HistoryCursor, current: HistoryEntry | null): HistoryCursor {
  if (!current) return cursor;
  const head = cursor.history[cursor.index];
  if (head && samePlace(head, current)) {
    if (head.line === current.line) return cursor;
    const history = [...cursor.history];
    history[cursor.index] = current;
    return { history, index: cursor.index };
  }
  return pushEntry(cursor, current);
}

/**
 * ジャンプ先を履歴に積む。行の指定が無い（ツリーから開いた等）ときに同じ場所なら積まない。
 * 同じファイル内でも行が違えば積む（ファイル内の定義ジャンプから戻れるように）。
 */
export function pushJump(
  cursor: HistoryCursor,
  entry: HistoryEntry,
  hasExplicitLine: boolean,
): HistoryCursor {
  const head = cursor.history[cursor.index];
  if (head && samePlace(head, entry) && (!hasExplicitLine || head.line === entry.line)) {
    return cursor;
  }
  return pushEntry(cursor, entry);
}
