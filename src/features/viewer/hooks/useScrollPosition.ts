import { useEffect, type RefObject } from 'react';
import type { EditorView } from '@codemirror/view';
import type { PaneId } from '@/shared/types';
import { useAppStore, viewKey } from '@/stores/useAppStore';

/**
 * ペイン・ファイル単位でスクロール位置を保存し、表示したときに一度だけ復元する。
 * 保存値は購読しない（購読すると、自分のスクロールで復元が走り、同じファイルを開く別ペインも動くため）。
 */
export function useScrollPosition(
  editorRef: RefObject<EditorView | null>,
  pane: PaneId,
  filePath: string,
) {
  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;
    const state = useAppStore.getState();
    const saved = state.viewState[viewKey(pane, filePath)]?.scrollTop ?? 0;
    // 行ジャンプが控えているなら、そちらを優先する（復元で上書きしない）
    const jump = state.jumpTarget;
    const jumpPending = jump?.pane === pane && jump.path === filePath;
    if (saved > 0 && !jumpPending) {
      requestAnimationFrame(() => view.scrollDOM.scrollTo({ top: saved }));
    }

    const scrollDom = view.scrollDOM;
    const handleScroll = () =>
      useAppStore.getState().updateScrollTop(pane, filePath, scrollDom.scrollTop);
    scrollDom.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollDom.removeEventListener('scroll', handleScroll);
  }, [editorRef, pane, filePath]);
}
