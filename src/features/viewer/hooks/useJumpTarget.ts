import { useEffect, type RefObject } from 'react';
import { EditorView } from '@codemirror/view';
import type { JumpTarget } from '@/shared/types';

const FLASH_DURATION_MS = 600;

/** ブックマークや検索結果からの行ジャンプを処理し、対象行を一瞬点滅させる */
export function useJumpTarget(
  editorRef: RefObject<EditorView | null>,
  filePath: string,
  jumpTarget: JumpTarget | null,
  setJumpTarget: (target: JumpTarget | null) => void,
) {
  useEffect(() => {
    const view = editorRef.current;
    if (!jumpTarget || jumpTarget.path !== filePath || !view) return;

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

    setJumpTarget(null);
  }, [editorRef, jumpTarget, filePath, setJumpTarget]);
}
