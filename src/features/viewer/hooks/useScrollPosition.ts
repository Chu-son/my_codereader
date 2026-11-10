import { useEffect } from 'react';
import { EditorView } from '@codemirror/view';
import type { PaneId } from '@/shared/types';
import { useAppStore, viewKey } from '@/stores/useAppStore';
import { whenSized } from '../lib/whenSized';

/** 画面の上端にかかっている行 */
const topLineOf = (view: EditorView) =>
  view.state.doc.lineAt(view.lineBlockAtHeight(view.scrollDOM.scrollTop).from).number;

/**
 * ペイン・ファイル単位でスクロール位置（先頭に見えている行）を保存し、表示したときに一度だけ復元する。
 * 分割の開始・解除ではエディタが作り直され、幅も変わるので、ピクセルでなく行で戻す。
 * 保存値は購読しない（購読すると、自分のスクロールで復元が走り、同じファイルを開く別ペインも動くため）。
 */
export function useScrollPosition(view: EditorView | null, pane: PaneId, filePath: string) {
  // view は state で受ける。@uiw/react-codemirror はエディタを初回描画の後で作るため、
  // ref だとマウント時のエフェクトでは null のままで、作られた後に再実行されない
  useEffect(() => {
    if (!view) return;
    const state = useAppStore.getState();
    const saved = state.viewState[viewKey(pane, filePath)]?.topLine ?? 1;
    // 行ジャンプが控えているなら、そちらを優先する（復元で上書きしない）
    const jump = state.jumpTarget;
    const jumpPending = jump?.pane === pane && jump.path === filePath;
    const cancelRestore =
      saved > 1 && !jumpPending
        ? whenSized(view, () => {
            const line = view.state.doc.line(Math.min(saved, view.state.doc.lines));
            view.dispatch({ effects: EditorView.scrollIntoView(line.from, { y: 'start' }) });
          })
        : () => {};

    const scrollDom = view.scrollDOM;
    const handleScroll = () =>
      useAppStore.getState().updateTopLine(pane, filePath, topLineOf(view));
    scrollDom.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      cancelRestore();
      scrollDom.removeEventListener('scroll', handleScroll);
    };
  }, [view, pane, filePath]);
}
