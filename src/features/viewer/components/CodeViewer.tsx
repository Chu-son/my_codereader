import { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView } from '@codemirror/view';
import { useShallow } from 'zustand/react/shallow';
import type { PaneId } from '@/shared/types';
import { useAppStore } from '@/stores/useAppStore';
import { getLanguageFromPath } from '@/shared/lib/fileUtils';
import { indentGuideExtension } from '../lib/indentGuide';
import { languageKey } from '../lib/languageExtension';
import { createCodeInteractions, type CodePopup } from '../lib/codeInteractions';
import { useLanguageExtension } from '../hooks/useLanguageExtension';
import { useJumpTarget } from '../hooks/useJumpTarget';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useSymbolExtraction } from '../hooks/useSymbolExtraction';
import { ScrollStrip } from './ScrollStrip';
import { CodePopups } from './CodePopups';

interface CodeViewerProps {
  pane: PaneId;
  filePath: string;
  content: string;
}

// 行番号は長押しを受けるため codeInteractions 側で入れ直す
const BASIC_SETUP = { lineNumbers: false } as const;

/** 1 ペイン・1 ファイル分の読み取り専用エディタ。ファイルを替えるときは key で作り直す */
export function CodeViewer({ pane, filePath, content }: CodeViewerProps) {
  const {
    wordWrap,
    showIndentGuides,
    fontSize,
    lineHeight,
    setCursorLine,
    jumpTarget,
    clearJumpTarget,
  } = useAppStore(
    useShallow((s) => ({
      wordWrap: s.wordWrap,
      showIndentGuides: s.showIndentGuides,
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      setCursorLine: s.setCursorLine,
      jumpTarget: s.jumpTarget,
      clearJumpTarget: s.clearJumpTarget,
    })),
  );
  // エディタは初回描画の後で作られるため state で持つ（作られたときにフックを再実行させる）
  const [view, setView] = useState<EditorView | null>(null);
  const lineCount = useMemo(() => content.split('\n').length, [content]);
  const [popup, setPopup] = useState<CodePopup | null>(null);

  const language = getLanguageFromPath(filePath);
  const langExtension = useLanguageExtension(languageKey(language, filePath));
  const refreshSymbols = useSymbolExtraction(view, filePath, language);

  // 拡張は一度だけ作り、ハンドラだけを最新に差し替える（作り直すとエディタが再構成されるため）
  const [interactions] = useState(createCodeInteractions);
  useEffect(() => {
    interactions.setHandlers({
      onCursorLine: (line) => setCursorLine(pane, filePath, line),
      // 選択のボタンは、選択が消えたら消す。ほかのメニューは選択と関係なく残す
      onSelection: (sel) =>
        setPopup((prev) =>
          sel ? { kind: 'selection', ...sel } : prev?.kind === 'selection' ? null : prev,
        ),
      onLineMenu: (line, anchor) => setPopup({ kind: 'line', line, anchor }),
      onWordTap: (word, anchor) => setPopup({ kind: 'word', word, anchor }),
      onTreeChange: refreshSymbols,
    });
  }, [interactions, pane, filePath, setCursorLine, refreshSymbols]);

  // メニューは画面座標に固定して出すため、本文がスクロールしたら閉じる（参照シートは残す）
  useEffect(() => {
    const scroller = view?.scrollDOM;
    if (!scroller) return;
    const onScroll = () => setPopup((prev) => (prev?.kind === 'references' ? prev : null));
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [view]);

  const displayExt = useMemo(() => {
    const ext = [EditorView.editable.of(false)];
    if (wordWrap) ext.push(EditorView.lineWrapping);
    if (showIndentGuides) ext.push(indentGuideExtension());
    ext.push(
      EditorView.theme({
        '&': { fontSize: `${fontSize}px`, lineHeight: lineHeight.toString() },
        '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: lineHeight.toString() },
        // 最終行が親指ツールバーに隠れないよう、本文の下に余白を空ける
        '.cm-content': { paddingBottom: 'var(--toolbar-clearance)' },
      }),
    );
    return ext;
  }, [wordWrap, showIndentGuides, fontSize, lineHeight]);

  const extensions = useMemo(
    () => [...langExtension, interactions.extension, ...displayExt],
    [langExtension, interactions, displayExt],
  );

  useScrollPosition(view, pane, filePath);
  useJumpTarget(view, pane, filePath, jumpTarget, clearJumpTarget);

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
        basicSetup={BASIC_SETUP}
        extensions={extensions}
        height="100%"
        style={{ height: '100%' }}
        onCreateEditor={setView}
      />
      <ScrollStrip view={view} filePath={filePath} lineCount={lineCount} />
      <CodePopups popup={popup} onChange={setPopup} pane={pane} path={filePath} content={content} />
    </div>
  );
}
