// ========================================
// CodeViewer Component
// ========================================

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView } from '@codemirror/view';
import { Search } from 'lucide-react';
import { indentGuideExtension } from '@/lib/indentGuide';

// Language imports
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { go } from '@codemirror/lang-go';
import { rust } from '@codemirror/lang-rust';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { markdown } from '@codemirror/lang-markdown';

import { useAppStore } from '@/stores/useAppStore';
import { getLanguageFromPath } from '@/lib/fileUtils';

interface CodeViewerProps {
  filePath: string;
  content: string;
  scrollPos?: number;
}

/** 言語名→CodeMirror拡張のマッピング */
function getLanguageExtension(lang: string | null) {
  if (!lang) return [];
  const langMap: Record<string, () => ReturnType<typeof javascript>> = {
    javascript: () => javascript({ jsx: true, typescript: false }),
    typescript: () => javascript({ jsx: true, typescript: true }),
    python: () => python(),
    java: () => java(),
    cpp: () => cpp(),
    go: () => go(),
    rust: () => rust(),
    html: () => html(),
    css: () => css(),
    json: () => json(),
    yaml: () => yaml(),
    markdown: () => markdown(),
  };

  const factory = langMap[lang];
  return factory ? [factory()] : [];
}

export function CodeViewer({ filePath, content, scrollPos }: CodeViewerProps) {
  const {
    wordWrap,
    showIndentGuides,
    fontSize,
    lineHeight,
    updateScrollPos,
    searchInRepo,
  } = useAppStore();
  const editorRef = useRef<EditorView | null>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

  const language = getLanguageFromPath(filePath);
  const langExtension = useMemo(() => getLanguageExtension(language), [language]);

  // 読み取り専用 + タッチ向けカスタム設定
  const readOnlyExt = useMemo(
    () => {
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
        })
      );

      ext.push(
        EditorView.updateListener.of((update) => {
          if (update.selectionSet) {
            const main = update.state.selection.main;
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
        })
      );
      return ext;
    },
    [wordWrap, showIndentGuides, fontSize, lineHeight, searchInRepo]
  );

  const extensions = useMemo(
    () => [...langExtension, ...readOnlyExt],
    [langExtension, readOnlyExt]
  );

  // スクロール位置の保存
  const handleScroll = useCallback(() => {
    if (editorRef.current) {
      const scrollTop = editorRef.current.scrollDOM.scrollTop;
      updateScrollPos(filePath, scrollTop);
    }
  }, [filePath, updateScrollPos]);

  // スクロール位置の復元
  useEffect(() => {
    if (editorRef.current && scrollPos && scrollPos > 0) {
      requestAnimationFrame(() => {
        editorRef.current?.scrollDOM.scrollTo({ top: scrollPos });
      });
    }
  }, [filePath, scrollPos]);

  // スクロールイベントのリスナー
  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;
    const scrollDom = view.scrollDOM;
    scrollDom.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollDom.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div 
      className="h-full overflow-hidden relative"
      style={{ 
        '--font-size-code': `${fontSize}px`, 
        '--line-height-code': lineHeight 
      } as React.CSSProperties}
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

      {/* 選択テキスト検索ボタン */}
      {selection && (
        <button
          onClick={() => {
            searchInRepo(selection.text);
            setSelection(null);
          }}
          className="fixed z-[100] flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg animate-fade-in text-white"
          style={{
            left: `${selection.x}px`,
            top: `${selection.y - 45}px`,
            backgroundColor: 'var(--accent-blue)',
            transform: 'translateX(-50%)',
          }}
        >
          <Search size={14} />
          <span className="text-xs font-medium">検索</span>
        </button>
      )}
    </div>
  );
}
