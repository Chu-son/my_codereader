import type { EditorView } from '@codemirror/view';

/**
 * エディタに高さが付いてから一度だけ実行する。戻り値は取り消し。
 * 分割を始めた直後のペインは、Allotment が大きさを測るまで高さ 0 で作られる。
 * その間にスクロールやジャンプをすると、CodeMirror が測り直しを繰り返す
 * （"Measure loop restarted" の警告が出る）ため、高さが付くまで待つ。
 */
export function whenSized(view: EditorView, run: () => void): () => void {
  const scroller = view.scrollDOM;
  let frame = 0;
  const schedule = () => {
    frame = requestAnimationFrame(run);
  };
  if (scroller.clientHeight > 0) {
    schedule();
    return () => cancelAnimationFrame(frame);
  }
  const observer = new ResizeObserver(() => {
    if (scroller.clientHeight === 0) return;
    observer.disconnect();
    schedule();
  });
  observer.observe(scroller);
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
  };
}
