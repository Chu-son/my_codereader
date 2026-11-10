import { useCallback, useEffect, useRef } from 'react';
import type { EditorView } from '@codemirror/view';
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import { useAppStore } from '@/stores/useAppStore';
import { extractSymbols } from '../lib/symbols';

/** 構文木の更新が続く間（解析の進行・言語パックの読込直後）はまとめて 1 回にする */
const DEBOUNCE_MS = 300;
/** 最後まで解析させる時間の上限。超えたら途中までの木で作り、続きは次の更新で拾う */
const PARSE_BUDGET_MS = 200;

/**
 * エディタの構文木から宣言の一覧を作り、ストアの symbols に入れる。
 * 返す関数は構文木が変わったときに呼ぶ。CodeMirror は見えている範囲から遅延して解析するため、
 * そのままの木では長いファイルの後半が抜ける。ensureSyntaxTree で末尾まで解析させてから取り出す。
 */
export function useSymbolExtraction(
  view: EditorView | null,
  filePath: string,
  language: string | null,
): () => void {
  const setSymbols = useAppStore((s) => s.setSymbols);
  const timer = useRef(0);

  const refresh = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (!view) return;
      const { state } = view;
      const tree = ensureSyntaxTree(state, state.doc.length, PARSE_BUDGET_MS) ?? syntaxTree(state);
      setSymbols(filePath, extractSymbols(tree, state.doc, language));
    }, DEBOUNCE_MS);
  }, [view, filePath, language, setSymbols]);

  useEffect(() => {
    refresh();
    return () => window.clearTimeout(timer.current);
  }, [refresh]);

  return refresh;
}
