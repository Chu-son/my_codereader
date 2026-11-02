import { useEffect, useState } from 'react';
import type { Extension } from '@codemirror/state';
import { loadLanguageExtension } from '../lib/languageExtension';

/** 言語拡張を非同期で読み込む。読み込み完了までは空（ハイライトなし）で表示する */
export function useLanguageExtension(lang: string | null): Extension[] {
  const [loaded, setLoaded] = useState<{ lang: string | null; ext: Extension[] }>({
    lang: null,
    ext: [],
  });

  useEffect(() => {
    let cancelled = false;
    loadLanguageExtension(lang)
      .then((ext) => {
        if (!cancelled) setLoaded({ lang, ext });
      })
      .catch(() => {
        // 言語パックの読み込み失敗時はハイライトなしで表示を続ける
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return loaded.lang === lang ? loaded.ext : [];
}
