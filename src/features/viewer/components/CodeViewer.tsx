import { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView } from '@codemirror/view';
import { useShallow } from 'zustand/react/shallow';
import type { PaneId } from '@/shared/types';
import { useAppStore } from '@/stores/useAppStore';
import { getLanguageFromPath } from '@/shared/lib/fileUtils';
import { languageKey } from '../lib/languageExtension';
import { createCodeInteractions, type CodePopup } from '../lib/codeInteractions';
import { useLanguageExtension } from '../hooks/useLanguageExtension';
import { useJumpTarget } from '../hooks/useJumpTarget';
import { useScrollPosition } from '../hooks/useScrollPosition';
import { useSymbolExtraction } from '../hooks/useSymbolExtraction';
import { useEditorDisplay } from '../hooks/useEditorDisplay';
import { useTwoFingerGestures } from '../hooks/useTwoFingerGestures';
import { ScopeHeader } from './ScopeHeader';
import { ScrollStrip } from './ScrollStrip';
import { CodePopups } from './CodePopups';

interface CodeViewerProps {
  pane: PaneId;
  filePath: string;
  content: string;
}

// 行番号は長押しを受けるため codeInteractions 側で入れ直す
const BASIC_SETUP = { lineNumbers: false } as const;

// 最終行が親指ツールバーに隠れないよう、本文の下に余白を空ける
const TOOLBAR_CLEARANCE = EditorView.theme({
  '.cm-content': { paddingBottom: 'var(--toolbar-clearance)' },
});

/** 1 ペイン・1 ファイル分の読み取り専用エディタ。ファイルを替えるときは key で作り直す */
export function CodeViewer({ pane, filePath, content }: CodeViewerProps) {
  const { fontSize, lineHeight, focusMode, setCursorLine, jumpTarget, clearJumpTarget } =
    useAppStore(
      useShallow((s) => ({
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        focusMode: s.focusMode,
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

  const displayExt = useEditorDisplay();

  const extensions = useMemo(
    () => [...langExtension, interactions.extension, ...displayExt, TOOLBAR_CLEARANCE],
    [langExtension, interactions, displayExt],
  );

  useScrollPosition(view, pane, filePath);
  useJumpTarget(view, pane, filePath, jumpTarget, clearJumpTarget);
  const rootRef = useRef<HTMLDivElement>(null);
  useTwoFingerGestures(view, rootRef, focusMode);

  return (
    <div
      ref={rootRef}
      className="h-full overflow-hidden flex flex-col"
      style={
        {
          '--font-size-code': `${fontSize}px`,
          '--line-height-code': lineHeight,
        } as React.CSSProperties
      }
    >
      {focusMode && <ScopeHeader view={view} filePath={filePath} />}
      <div className="relative flex-1 min-h-0">
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
      </div>
      <CodePopups popup={popup} onChange={setPopup} pane={pane} path={filePath} content={content} />
    </div>
  );
}
