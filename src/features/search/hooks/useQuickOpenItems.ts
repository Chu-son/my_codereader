import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, selectFocusedPath } from '@/stores/useAppStore';
import { blobPaths, isBinaryFile } from '@/shared/lib/fileUtils';
import { buildItems, emptyMessage } from '../lib/quickOpen';

/** ストアの状態から、入力に応じた候補を作る */
export function useQuickOpenItems(query: string) {
  const { treeData, tabs1, tabs2, activePath, symbols, content } = useAppStore(
    useShallow((s) => {
      const focused = selectFocusedPath(s);
      return {
        treeData: s.treeData,
        tabs1: s.panes[1].tabs,
        tabs2: s.panes[2].tabs,
        activePath: focused,
        symbols: focused ? s.symbols[focused] : undefined,
        content: focused ? s.files[focused]?.content : undefined,
      };
    }),
  );

  // 開けないファイルを候補に出さない（選んでも何も起きないため）
  const paths = useMemo(
    () => [...blobPaths(treeData)].filter((path) => !isBinaryFile(path)),
    [treeData],
  );
  const openTabs = useMemo(() => [...new Set([...tabs1, ...tabs2])], [tabs1, tabs2]);
  const lineCount = useMemo(() => (content ? content.split('\n').length : null), [content]);

  const items = useMemo(
    () => buildItems(query, { paths, openTabs, activePath, symbols: symbols ?? [], lineCount }),
    [query, paths, openTabs, activePath, symbols, lineCount],
  );

  return { items, empty: items.length === 0 ? emptyMessage(query, activePath) : null };
}
