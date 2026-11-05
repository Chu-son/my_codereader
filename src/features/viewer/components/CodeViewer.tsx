import { useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView } from '@codemirror/view';
import { useShallow } from 'zustand/react/shallow';
import type { PaneId } from '@/shared/types';
import { useAppStore } from '@/stores/useAppStore';
import { getLanguageFromPath } from '@/shared/lib/fileUtils';
import { indentGuideExtension } from '../lib/indentGuide';
import { useLanguageExtension } from '../hooks/useLanguageExtension';
import { useJumpTarget } from '../hooks/useJumpTarget';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { SelectionSearchButton } from './SelectionSearchButton';

interface CodeViewerProps {
  pane: PaneId;
  filePath: string;
  content: string;
}

/** 1 ペイン・1 ファイル分の読み取り専用エディタ。ファイルを替えるときは key で作り直す */
export function CodeViewer({ pane, filePath, content }: CodeViewerProps) {
  const {
    wordWrap,
    showIndentGuides,
    fontSize,
    lineHeight,
    searchInRepo,
    setCursorLine,
    jumpTarget,
    clearJumpTarget,
  } = useAppStore(
    useShallow((s) => ({
      wordWrap: s.wordWrap,
      showIndentGuides: s.showIndentGuides,
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      searchInRepo: s.searchInRepo,
      setCursorLine: s.setCursorLine,
      jumpTarget: s.jumpTarget,
      clearJumpTarget: s.clearJumpTarget,
    })),
  );
  const editorRef = useRef<EditorView | null>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

  const language = getLanguageFromPath(filePath);
  const langExtension = useLanguageExtension(language);

  // 読み取り専用 + タッチ向けカスタム設定
  const readOnlyExt = useMemo(() => {
    const ext = [EditorView.editable.of(false)];
    if (wordWrap) ext.push(EditorView.lineWrapping);
    if (showIndentGuides) ext.push(indentGuideExtension());

    // フォントサイズの設定
    ext.push(
      EditorView.theme({
        '&': {
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight.toString(),
        },
        '.cm-scroller': {
          fontFamily: 'var(--font-mono)',
          lineHeight: lineHeight.toString(),
        },
      }),
    );

    ext.push(
      EditorView.updateListener.of((update) => {
        if (update.selectionSet) {
          const main = update.state.selection.main;
          const line = update.state.doc.lineAt(main.head).number;
          // setTimeoutを用いてCodeMirrorの更新サイクル外でReactのStateを更新する
          setTimeout(() => setCursorLine(pane, filePath, line), 0);

          if (!main.empty) {
            const text = update.state.sliceDoc(main.from, main.to).trim();
            if (text && text.length < 100) {
              const coords = update.view.coordsAtPos(main.to);
              if (coords) {
                setSelection({ text, x: coords.left, y: coords.top });
              }
            } else {
              setSelection(null);
            }
          } else {
            setSelection(null);
          }
        }
      }),
    );
    return ext;
  }, [wordWrap, showIndentGuides, fontSize, lineHeight, pane, filePath, setCursorLine]);

  const extensions = useMemo(
    () => [...langExtension, ...readOnlyExt],
    [langExtension, readOnlyExt],
  );

  useScrollPosition(editorRef, pane, filePath);
  useJumpTarget(editorRef, pane, filePath, jumpTarget, clearJumpTarget);

  return (
    <div
      className="h-full overflow-hidden relative"
      style={
        {
          '--font-size-code': `${fontSize}px`,
          '--line-height-code': lineHeight,
        } as React.CSSProperties
      }
    >
      <CodeMirror
        value={content}
        theme={vscodeDark}
        extensions={extensions}
        height="100%"
        style={{ height: '100%' }}
        onCreateEditor={(view) => {
          editorRef.current = view;
        }}
      />

      {selection && (
        <SelectionSearchButton
          x={selection.x}
          y={selection.y}
          onClick={() => {
            searchInRepo(selection.text);
            setSelection(null);
          }}
        />
      )}
    </div>
  );
}
