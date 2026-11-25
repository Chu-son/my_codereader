import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { blobPaths } from '@/shared/lib/fileUtils';
import {
  findDefinitionTarget,
  findLocalTarget,
  locateDefinition,
  type DefinitionLocation,
  type DefinitionTarget,
  type Word,
} from '../lib/definition/resolveDefinition';

/** 取得済みの本文を返す。取得に失敗した・別の取得の途中なら null */
export async function loadContent(path: string): Promise<string | null> {
  await useAppStore.getState().ensureFile(path);
  const file = useAppStore.getState().files[path];
  return file && !file.loading && !file.error ? file.content : null;
}

/**
 * 定義の引き当て。単語メニューと Peek の両方がこれを使い、たどり方を 1 か所にまとめる。
 * find は場所の手がかりまで（API を使わない）、locate は行の確定（別ファイルなら取得する）。
 */
export function useDefinitionResolver() {
  const find = useCallback(async (path: string, content: string, word: Word) => {
    const { symbols, treeData } = useAppStore.getState();
    return findDefinitionTarget(path, content, symbols[path] ?? [], word, blobPaths(treeData));
  }, []);

  const locate = useCallback(
    (fromPath: string, target: DefinitionTarget): Promise<DefinitionLocation | null> =>
      locateDefinition(fromPath, target, {
        paths: blobPaths(useAppStore.getState().treeData),
        load: loadContent,
      }),
    [],
  );

  return { find, locate };
}

/**
 * メニューに出す定義の手がかり。同じファイルで決まるものはすぐ返し、import を見るときだけ
 * 非同期に調べる。調べている間は null
 */
export function useDefinitionTarget(
  path: string,
  content: string,
  word: Word,
): DefinitionTarget | null {
  const { symbols, treeData } = useAppStore(
    useShallow((s) => ({ symbols: s.symbols[path], treeData: s.treeData })),
  );
  const local = useMemo(() => findLocalTarget(path, symbols ?? [], word), [path, symbols, word]);
  const [found, setFound] = useState<{ word: Word; target: DefinitionTarget } | null>(null);

  useEffect(() => {
    if (local) return;
    let cancelled = false;
    void findDefinitionTarget(path, content, symbols ?? [], word, blobPaths(treeData))
      .catch((): DefinitionTarget => ({ kind: 'none' }))
      .then((target) => {
        if (!cancelled) setFound({ word, target });
      });
    return () => {
      cancelled = true;
    };
  }, [local, path, content, symbols, word, treeData]);

  return local ?? (found?.word === word ? found.target : null);
}
