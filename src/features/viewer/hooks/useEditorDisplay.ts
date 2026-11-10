import { useMemo } from 'react';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { indentGuideExtension } from '../lib/indentGuide';

/** 読み取り専用・折り返し・インデントガイド・文字サイズなど、設定から決まる表示の拡張（本文と Peek で共用） */
export function useEditorDisplay(): Extension[] {
  const { wordWrap, showIndentGuides, fontSize, lineHeight } = useAppStore(
    useShallow((s) => ({
      wordWrap: s.wordWrap,
      showIndentGuides: s.showIndentGuides,
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
    })),
  );
  return useMemo(() => {
    const ext: Extension[] = [EditorView.editable.of(false)];
    if (wordWrap) ext.push(EditorView.lineWrapping);
    if (showIndentGuides) ext.push(indentGuideExtension());
    ext.push(
      EditorView.theme({
        '&': { fontSize: `${fontSize}px`, lineHeight: lineHeight.toString() },
        '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: lineHeight.toString() },
      }),
    );
    return ext;
  }, [wordWrap, showIndentGuides, fontSize, lineHeight]);
}
