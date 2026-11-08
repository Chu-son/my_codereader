import { useEffect, type RefObject } from 'react';
import { EditorView } from '@codemirror/view';
import { useAppStore } from '@/stores/useAppStore';
import { MAX_FONT_SIZE, MIN_FONT_SIZE } from '@/stores/persistence';
import { pinchedFontSize, swipeDirection, trackTwoFingers } from '../lib/twoFingerGesture';

const pointOf = (t: Touch) => ({ x: t.clientX, y: t.clientY });

/**
 * 集中モードのエディタ上で、ピンチで文字サイズ、2 本指の横スワイプで戻る・進む。
 * Pointer Events では iOS が 2 本指をパン・ズームとして pointercancel してしまうため、
 * touchmove を preventDefault できる Touch Events を使う。
 * 1 本指は触らないので、スクロールと Safari の端からの「戻る」はそのまま効く。
 */
export function useTwoFingerGestures(
  view: EditorView | null,
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!view || !enabled) return;
    const dom = view.dom;
    let update: ReturnType<typeof trackTwoFingers> | null = null;
    let startSize = 0;
    let size = 0;
    let swipeDx = 0;
    let anchor = 0;
    let frame = 0;

    // 確定するまでは永続化する store を書かず、CSS 変数だけを変える（毎フレームの書き込みを避ける）
    const preview = (next: number) => {
      size = next;
      rootRef.current?.style.setProperty('--font-size-code', `${next}px`);
      cancelAnimationFrame(frame);
      // 文字サイズで行の高さが変わっても、読んでいた行を画面の上端に保つ
      frame = requestAnimationFrame(() => {
        view.dispatch({ effects: EditorView.scrollIntoView(anchor, { y: 'start', yMargin: 0 }) });
      });
    };

    const end = (cancelled: boolean) => {
      if (!update) return;
      update = null;
      if (size !== startSize) {
        if (cancelled) preview(startSize);
        else useAppStore.getState().setFontSize(size);
      }
      const direction = cancelled ? null : swipeDirection(swipeDx);
      if (direction === 'back') useAppStore.getState().navigateBack();
      if (direction === 'forward') useAppStore.getState().navigateForward();
    };

    const onStart = (e: TouchEvent) => {
      const [a, b] = [e.touches[0], e.touches[1]];
      if (e.touches.length !== 2 || !a || !b) {
        end(true);
        return;
      }
      update = trackTwoFingers(pointOf(a), pointOf(b));
      startSize = useAppStore.getState().fontSize;
      size = startSize;
      swipeDx = 0;
      anchor = view.lineBlockAtHeight(view.scrollDOM.scrollTop).from;
    };

    const onMove = (e: TouchEvent) => {
      const [a, b] = [e.touches[0], e.touches[1]];
      if (!update || !a || !b) return;
      // すでに 1 本指のスクロールが始まっていると止められないので、そのスクロールに任せる
      if (!e.cancelable) {
        end(true);
        return;
      }
      e.preventDefault();
      const gesture = update(pointOf(a), pointOf(b));
      if (gesture.kind === 'swipe') swipeDx = gesture.dx;
      if (gesture.kind === 'pinch') {
        const next = pinchedFontSize(startSize, gesture.scale, MIN_FONT_SIZE, MAX_FONT_SIZE);
        if (next !== size) preview(next);
      }
    };

    const onEnd = () => end(false);
    const onCancel = () => end(true);
    // Safari は touchmove を止めてもページのズームを始めることがあるので、エディタの上だけ抑える
    const onGestureStart = (e: Event) => e.preventDefault();

    dom.addEventListener('touchstart', onStart, { passive: true });
    dom.addEventListener('touchmove', onMove, { passive: false });
    dom.addEventListener('touchend', onEnd);
    dom.addEventListener('touchcancel', onCancel);
    dom.addEventListener('gesturestart', onGestureStart);
    return () => {
      cancelAnimationFrame(frame);
      dom.removeEventListener('touchstart', onStart);
      dom.removeEventListener('touchmove', onMove);
      dom.removeEventListener('touchend', onEnd);
      dom.removeEventListener('touchcancel', onCancel);
      dom.removeEventListener('gesturestart', onGestureStart);
    };
  }, [view, rootRef, enabled]);
}
