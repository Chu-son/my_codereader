export interface Point {
  x: number;
  y: number;
}

export type TwoFingerGesture =
  /** まだ判別できない、または縦方向の動き（どちらも何もしない） */
  | { kind: 'none' }
  /** scale は指を置いたときの間隔に対する比 */
  | { kind: 'pinch'; scale: number }
  /** dx は 2 本の中点の横移動量（右が正） */
  | { kind: 'swipe'; dx: number };

/** ピンチかスワイプかを決めるのに要る動き。手ぶれで誤判定しないよう、タップの許容量より大きくする */
const DECIDE_PX = 24;
/** 指を離したときにこれ以上動いていれば、戻る・進むを実行する */
const SWIPE_COMMIT_PX = 80;

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const center = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * 2 本指の動きを、最初に決まった種類に固定して追う。
 * 途中で切り替えないのは、ピンチの最中に中点がずれて履歴を移動してしまうのを防ぐため。
 */
export function trackTwoFingers(startA: Point, startB: Point) {
  const startDistance = distance(startA, startB);
  const startCenter = center(startA, startB);
  let locked: TwoFingerGesture['kind'] | 'vertical' | null = null;

  return (a: Point, b: Point): TwoFingerGesture => {
    const now = distance(a, b);
    const c = center(a, b);
    const dx = c.x - startCenter.x;
    const dy = c.y - startCenter.y;
    if (locked === null) {
      if (Math.abs(now - startDistance) >= DECIDE_PX) locked = 'pinch';
      else if (Math.abs(dx) >= DECIDE_PX && Math.abs(dx) > Math.abs(dy)) locked = 'swipe';
      else if (Math.abs(dy) >= DECIDE_PX) locked = 'vertical';
    }
    if (locked === 'pinch' && startDistance > 0)
      return { kind: 'pinch', scale: now / startDistance };
    if (locked === 'swipe') return { kind: 'swipe', dx };
    return { kind: 'none' };
  };
}

/** 指を離したときの履歴の移動。ブラウザの「戻る」と同じく、右へのスワイプが戻る */
export function swipeDirection(dx: number): 'back' | 'forward' | null {
  if (Math.abs(dx) < SWIPE_COMMIT_PX) return null;
  return dx > 0 ? 'back' : 'forward';
}

/** ピンチの比から文字サイズを求める。設定画面と同じく整数の範囲に収める */
export function pinchedFontSize(start: number, scale: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(start * scale)));
}
