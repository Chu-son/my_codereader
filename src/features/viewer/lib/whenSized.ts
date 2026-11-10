import type { EditorView } from '@codemirror/view';

/** 幅が落ち着くのを待つ上限。これを過ぎたら変わり続けていても実行する */
const MAX_SETTLE_FRAMES = 10;

/**
 * エディタの大きさが決まってから一度だけ実行する。戻り値は取り消し。
 * 分割を始めた直後のペインは、Allotment が大きさを測るまで高さ 0 で作られ、
 * 高さが付いた次のフレームでさらに幅が半分になる。決まる前にスクロールやジャンプをすると、
 * 折り返しの組み直しで位置がずれ、CodeMirror が測り直しを繰り返す
 * （"Measure loop restarted" の警告が出る）。そこで高さが付き、幅が 2 フレーム続けて
 * 同じになるまで待つ。
 */
export function whenSized(view: EditorView, run: () => void): () => void {
  const scroller = view.scrollDOM;
  let frame = 0;
  let observer: ResizeObserver | null = null;

  const settle = () => {
    let lastWidth = -1;
    let frames = 0;
    const tick = () => {
      const width = scroller.clientWidth;
      if (width === lastWidth || frames >= MAX_SETTLE_FRAMES) {
        run();
        return;
      }
      lastWidth = width;
      frames++;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };

  if (scroller.clientHeight > 0) settle();
  else {
    observer = new ResizeObserver(() => {
      if (scroller.clientHeight === 0) return;
      observer?.disconnect();
      settle();
    });
    observer.observe(scroller);
  }
  return () => {
    observer?.disconnect();
    cancelAnimationFrame(frame);
  };
}
