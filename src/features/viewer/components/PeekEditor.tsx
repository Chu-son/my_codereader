import { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { Decoration, EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { useAppStore } from '@/stores/useAppStore';
import { getLanguageFromPath } from '@/shared/lib/fileUtils';
import { languageKey } from '../lib/languageExtension';
import { createCodeInteractions } from '../lib/codeInteractions';
import { whenSized } from '../lib/whenSized';
import { useLanguageExtension } from '../hooks/useLanguageExtension';
import { useEditorDisplay } from '../hooks/useEditorDisplay';
import { useSymbolExtraction } from '../hooks/useSymbolExtraction';
import { useDefinitionResolver } from '../hooks/useDefinition';

const BASIC_SETUP = { lineNumbers: false, highlightActiveLine: false } as const;
const NOOP = () => {};
/** 定義の行の上に、どこから読み始める宣言かが分かるだけの行数を残す */
const TOP_MARGIN_PX = 24;

const TARGET_LINE = Decoration.line({ class: 'cm-peek-target' });
const TARGET_THEME = EditorView.theme({
  '.cm-peek-target': { backgroundColor: 'var(--accent-blue-soft)' },
});

/** 定義の行に目印を付ける。行は枠を作り直すまで変わらないので、固定の装飾で足りる */
function targetLine(line: number): Extension {
  return [
    EditorView.decorations.of((view) => {
      const { doc } = view.state;
      return Decoration.set([TARGET_LINE.range(doc.line(Math.min(line, doc.lines)).from)]);
    }),
    TARGET_THEME,
  ];
}

interface PeekEditorProps {
  path: string;
  line: number;
  content: string;
}

/** Peek の中身。本文と同じ表示設定で、定義の行を枠の上端に出す */
export function PeekEditor({ path, line, content }: PeekEditorProps) {
  const [view, setView] = useState<EditorView | null>(null);
  const pushPeek = useAppStore((s) => s.pushPeek);
  const { find, locate } = useDefinitionResolver();
  const language = getLanguageFromPath(path);
  const langExtension = useLanguageExtension(languageKey(language, path));
  const displayExt = useEditorDisplay();
  // 開いていないファイルの定義も枠の中でたどれるよう、Peek 側でも宣言の一覧を作る
  const refreshSymbols = useSymbolExtraction(view, path, language);

  const [interactions] = useState(createCodeInteractions);
  useEffect(() => {
    interactions.setHandlers({
      onCursorLine: NOOP,
      onSelection: NOOP,
      onLineMenu: NOOP,
      // 枠の中ではメニューを出さず、定義が分かる識別子ならそのままたどる（枠の上にメニューを重ねないため）
      onWordTap: (word) => {
        void (async () => {
          const target = await find(path, content, word);
          if (target.kind === 'local' && target.isSelf) return;
          const location = await locate(path, target);
          if (location) pushPeek({ ...location, name: word.text });
        })().catch(() => {});
      },
      onTreeChange: refreshSymbols,
    });
  }, [interactions, path, content, find, locate, pushPeek, refreshSymbols]);

  useEffect(() => {
    if (!view) return;
    const { doc } = view.state;
    const pos = doc.line(Math.min(line, doc.lines)).from;
    return whenSized(view, () => {
      if (!view.dom.isConnected) return;
      view.dispatch({
        effects: EditorView.scrollIntoView(pos, { y: 'start', yMargin: TOP_MARGIN_PX }),
      });
    });
  }, [view, line]);

  const extensions = useMemo(
    () => [...langExtension, interactions.extension, ...displayExt, targetLine(line)],
    [langExtension, interactions, displayExt, line],
  );

  return (
    <CodeMirror
      value={content}
      theme={vscodeDark}
      basicSetup={BASIC_SETUP}
      extensions={extensions}
      height="100%"
      style={{ height: '100%' }}
      onCreateEditor={setView}
    />
  );
}
