/** 長押しとみなすまでの時間 */
export const LONG_PRESS_MS = 500;
/** これ以上指が動いたら、タップ・長押しではなくスクロールとみなす */
export const MOVE_TOLERANCE_PX = 8;

interface PressHandlers {
  /** 動かさずに LONG_PRESS_MS 押し続けたとき */
  onLongPress?: () => void;
  /** 動かさずに LONG_PRESS_MS より前に離したとき */
  onTap?: (up: PointerEvent) => void;
}

/**
 * pointerdown から 1 回分の押下を追い、タップか長押しかを判定する（ライブラリを足さずに済ませるため自前）。
 * 指が動いた・pointercancel が来た（iOS ではスクロールが始まると来る）ときは何もしない。
 * 指はエディタの外へ出ることがあるため、追跡は window で行う。
 */
export function trackPress(down: PointerEvent, { onLongPress, onTap }: PressHandlers): void {
  if (!down.isPrimary || down.button !== 0) return;

  let finished = false;
  const finish = () => {
    finished = true;
    window.clearTimeout(timer);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', finish);
  };
  const timer = onLongPress
    ? window.setTimeout(() => {
        finish();
        onLongPress();
      }, LONG_PRESS_MS)
    : 0;

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== down.pointerId) return;
    if (Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) > MOVE_TOLERANCE_PX) {
      finish();
    }
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== down.pointerId || finished) return;
    finish();
    onTap?.(e);
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', finish);
}
