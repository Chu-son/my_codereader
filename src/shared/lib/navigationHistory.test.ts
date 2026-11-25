import { describe, expect, it } from 'vitest';
import type { HistoryEntry } from '@/shared/types';
import { MAX_HISTORY, pushEntry, pushJump, recordLocation } from './navigationHistory';

const at = (path: string, line = 1, pane: 1 | 2 = 1): HistoryEntry => ({ path, line, pane });
const empty = { history: [], index: -1 };

describe('pushEntry', () => {
  it('進む側の履歴を切り捨てて積む', () => {
    const cursor = { history: [at('a'), at('b'), at('c')], index: 0 };
    expect(pushEntry(cursor, at('d'))).toEqual({ history: [at('a'), at('d')], index: 1 });
  });

  it('上限を超えたら古いものから捨てる', () => {
    let cursor: { history: HistoryEntry[]; index: number } = empty;
    for (let i = 0; i < MAX_HISTORY + 5; i++) cursor = pushEntry(cursor, at(`f${i}`));
    expect(cursor.history).toHaveLength(MAX_HISTORY);
    expect(cursor.index).toBe(MAX_HISTORY - 1);
    expect(cursor.history[0]?.path).toBe('f5');
  });
});

describe('recordLocation', () => {
  it('先頭と同じファイル・ペインなら行だけ更新する', () => {
    const cursor = { history: [at('a', 1)], index: 0 };
    expect(recordLocation(cursor, at('a', 20))).toEqual({ history: [at('a', 20)], index: 0 });
  });

  it('履歴外の場所（タブ切替後など）なら積む', () => {
    const cursor = { history: [at('a')], index: 0 };
    expect(recordLocation(cursor, at('b')).history).toEqual([at('a'), at('b')]);
  });

  it('ペインが違えば別の場所として扱う', () => {
    const cursor = { history: [at('a', 1, 1)], index: 0 };
    expect(recordLocation(cursor, at('a', 1, 2)).index).toBe(1);
  });

  it('現在地が無ければ何もしない', () => {
    expect(recordLocation(empty, null)).toBe(empty);
  });
});

describe('pushJump', () => {
  it('同じファイル内でも行を指定したジャンプは積む', () => {
    const cursor = { history: [at('a', 5)], index: 0 };
    expect(pushJump(cursor, at('a', 40), true).history).toEqual([at('a', 5), at('a', 40)]);
  });

  it('行の指定が無く同じ場所なら積まない', () => {
    const cursor = { history: [at('a', 5)], index: 0 };
    expect(pushJump(cursor, at('a', 1), false)).toBe(cursor);
  });
});
