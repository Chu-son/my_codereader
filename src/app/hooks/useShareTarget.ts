import { useEffect } from 'react';
import { parseRepoInput } from '@/shared/lib/urlParser';

const GITHUB_URL = /https?:\/\/github\.com\/[^\s]+/;

/**
 * 共有シート（Web Share Target）から渡された GitHub の URL を、起動時に一度だけ読み込む。
 * 共有テキストには URL 以外の文字が混ざることがあるため、URL 部分だけを取り出して解析する。
 */
export function useShareTarget(loadRepository: (repo: string) => Promise<void>): void {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('url') || params.get('text');
    if (!shared) return;

    const parsed = parseRepoInput(shared.match(GITHUB_URL)?.[0] ?? shared);
    if (!parsed) return;

    void loadRepository(`${parsed.owner}/${parsed.repo}`);
    // 再読み込みで二重に読み込まないよう、共有パラメータを URL から消す
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [loadRepository]);
}
