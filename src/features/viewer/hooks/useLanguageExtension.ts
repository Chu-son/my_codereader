import { useEffect, useState } from 'react';
import type { Extension } from '@codemirror/state';
import { loadLanguageExtension } from '../lib/languageExtension';

/** 言語拡張を非同期で読み込む。読み込み完了までは空（ハイライトなし）で表示する */
export function useLanguageExtension(key: string | null): Extension[] {
  const [loaded, setLoaded] = useState<{ key: string | null; ext: Extension[] }>({
    key: null,
    ext: [],
  });

  useEffect(() => {
    let cancelled = false;
    loadLanguageExtension(key)
      .then((ext) => {
        if (!cancelled) setLoaded({ key, ext });
      })
      .catch(() => {
        // 言語パックの読み込み失敗時はハイライトなしで表示を続ける
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return loaded.key === key ? loaded.ext : [];
}
