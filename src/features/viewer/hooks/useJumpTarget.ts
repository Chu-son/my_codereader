import { useEffect } from 'react';
import { EditorView } from '@codemirror/view';
import type { JumpTarget, PaneId } from '@/shared/types';
import { whenSized } from '../lib/whenSized';

const FLASH_DURATION_MS = 600;

/** 自分のペイン宛ての行ジャンプを処理し、対象行を一瞬点滅させる */
export function useJumpTarget(
  view: EditorView | null,
  pane: PaneId,
  filePath: string,
  jumpTarget: JumpTarget | null,
  clearJumpTarget: () => void,
) {
  // view は state で受ける（作られた後に再実行し、マウント直後に届いた依頼も処理するため）
  useEffect(() => {
    if (!jumpTarget || jumpTarget.pane !== pane || jumpTarget.path !== filePath || !view) return;

    const line = Math.min(jumpTarget.line, view.state.doc.lines);
    const pos = view.state.doc.line(line).from;
    // 依頼は先に消す（待っている間に同じ依頼で二重に動かないため）。移動は高さが付いてから
    clearJumpTarget();
    whenSized(view, () => {
      if (!view.dom.isConnected) return;
      view.dispatch({
        effects: EditorView.scrollIntoView(pos, { y: 'center' }),
        selection: { anchor: pos },
      });
      flashLine(view, pos);
    });
  }, [view, pane, jumpTarget, filePath, clearJumpTarget]);
}

/**
 * 移動先の行を一瞬だけ強調する。CodeMirror は見えている範囲の行だけを描くため、
 * 行の DOM は行番号の順番（nth-child）ではなく、文書上の位置から引く
 */
function flashLine(view: EditorView, pos: number) {
  requestAnimationFrame(() => {
    const { node } = view.domAtPos(pos);
    const lineDom = (node instanceof HTMLElement ? node : node.parentElement)?.closest<HTMLElement>(
      '.cm-line',
    );
    if (!lineDom) return;
    lineDom.style.transition = 'background-color 0.2s';
    lineDom.style.backgroundColor = 'var(--accent-blue)';
    lineDom.style.opacity = '0.5';
    setTimeout(() => {
      lineDom.style.backgroundColor = '';
      lineDom.style.opacity = '';
    }, FLASH_DURATION_MS);
  });
}
