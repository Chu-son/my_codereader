import { useEffect, type RefObject } from 'react';
import type { EditorView } from '@codemirror/view';

/** スクロール位置を保存し、ファイル切替時に復元する */
export function useScrollPosition(
  editorRef: RefObject<EditorView | null>,
  filePath: string,
  scrollPos: number | undefined,
  updateScrollPos: (path: string, pos: number) => void,
) {
  useEffect(() => {
    if (editorRef.current && scrollPos && scrollPos > 0) {
      requestAnimationFrame(() => {
        editorRef.current?.scrollDOM.scrollTo({ top: scrollPos });
      });
    }
  }, [editorRef, filePath, scrollPos]);

  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;
    const scrollDom = view.scrollDOM;
    const handleScroll = () => updateScrollPos(filePath, scrollDom.scrollTop);
    scrollDom.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollDom.removeEventListener('scroll', handleScroll);
  }, [editorRef, filePath, updateScrollPos]);
}
