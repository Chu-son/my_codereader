import { useEffect, type RefObject } from 'react';
import { EditorView } from '@codemirror/view';
import type { JumpTarget, PaneId } from '@/shared/types';

const FLASH_DURATION_MS = 600;

/** 自分のペイン宛ての行ジャンプを処理し、対象行を一瞬点滅させる */
export function useJumpTarget(
  editorRef: RefObject<EditorView | null>,
  pane: PaneId,
  filePath: string,
  jumpTarget: JumpTarget | null,
  clearJumpTarget: () => void,
) {
  useEffect(() => {
    const view = editorRef.current;
    if (!jumpTarget || jumpTarget.pane !== pane || jumpTarget.path !== filePath || !view) return;

    const line = Math.min(jumpTarget.line, view.state.doc.lines);
    const pos = view.state.doc.line(line).from;
    view.dispatch({
      effects: EditorView.scrollIntoView(pos, { y: 'center' }),
      selection: { anchor: pos },
    });

    requestAnimationFrame(() => {
      const lineDom = view.dom.querySelector<HTMLElement>(`.cm-line:nth-child(${line})`);
      if (!lineDom) return;
      lineDom.style.transition = 'background-color 0.2s';
      lineDom.style.backgroundColor = 'var(--accent-blue)';
      lineDom.style.opacity = '0.5';
      setTimeout(() => {
        lineDom.style.backgroundColor = '';
        lineDom.style.opacity = '';
      }, FLASH_DURATION_MS);
    });

    clearJumpTarget();
  }, [editorRef, pane, jumpTarget, filePath, clearJumpTarget]);
}
