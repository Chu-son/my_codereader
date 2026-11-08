import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { blobPaths } from '@/shared/lib/fileUtils';
import { isAbortError, toErrorMessage } from '@/shared/lib/githubError';
import { STRINGS } from '@/shared/constants/strings';
import { toCodeCandidates, type CodeCandidate } from '../lib/codeCandidates';

export type CodeCandidatesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; candidates: CodeCandidate[] };

/** コード検索で単語の候補を集める。閉じたら（または単語が変わったら）進行中の検索を中断する */
export function useCodeCandidates(word: string): CodeCandidatesState {
  const search = useAppStore((s) => s.searchWordInRepo);
  const [result, setResult] = useState<{ word: string; state: CodeCandidatesState } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    search(word, controller.signal)
      .then((items) => {
        const paths = blobPaths(useAppStore.getState().treeData);
        const candidates = toCodeCandidates(items, word, paths);
        setResult({ word, state: { status: 'done', candidates } });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        const message = toErrorMessage(error, STRINGS.viewer.candidatesFailed);
        setResult({ word, state: { status: 'error', message } });
      });
    return () => controller.abort();
  }, [search, word]);

  return result?.word === word ? result.state : { status: 'loading' };
}
