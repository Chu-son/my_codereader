import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { PaneId } from '@/shared/types';
import { useAppStore } from '@/stores/useAppStore';
import { STRINGS } from '@/shared/constants/strings';
import { getFileName } from '@/shared/lib/fileUtils';
import { findCandidateLine, type CodeCandidate } from '../lib/codeCandidates';
import { loadContent } from '../hooks/useDefinition';
import { useCodeCandidates } from '../hooks/useCodeCandidates';

interface RepoReferencesProps {
  pane: PaneId;
  word: string;
  onClose: () => void;
}

const Notice = ({ children }: { children: React.ReactNode }) => (
  <p className="px-4 py-6 text-sm text-center text-[var(--text-muted)]">{children}</p>
);

function CandidateList({ pane, word, onClose }: RepoReferencesProps) {
  const navigateTo = useAppStore((s) => s.navigateTo);
  const state = useCodeCandidates(word);
  const [opening, setOpening] = useState<string | null>(null);
  // シートを閉じたあとに本文が届いても、読んでいる場所を動かさない
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  if (state.status === 'loading') return <Notice>{STRINGS.viewer.candidatesLoading}</Notice>;
  if (state.status === 'error') return <Notice>{state.message}</Notice>;
  if (state.candidates.length === 0) return <Notice>{STRINGS.viewer.candidatesEmpty}</Notice>;

  // 行は本文を見ないと決まらない（検索は行番号を返さない）ので、取得してから移動する
  const open = async (candidate: CodeCandidate) => {
    setOpening(candidate.path);
    const content = await loadContent(candidate.path).catch(() => null);
    if (!mounted.current) return;
    const line = content === null ? 1 : findCandidateLine(content, word);
    void navigateTo(candidate.path, { line, pane });
    onClose();
  };

  return (
    <ul>
      {state.candidates.map((candidate) => (
        <li key={candidate.path}>
          <button
            onClick={() => void open(candidate)}
            disabled={opening !== null}
            className="w-full px-4 py-2 min-h-[44px] text-left transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-60"
          >
            <span className="flex items-baseline gap-2 text-sm text-[var(--text-primary)]">
              <span className="truncate-text">{getFileName(candidate.path)}</span>
              {candidate.isDefinition && (
                <span className="shrink-0 text-xs text-[var(--accent-blue)]">
                  {STRINGS.viewer.candidateDefinition}
                </span>
              )}
              <span className="ml-auto min-w-0 truncate-text text-xs text-[var(--text-muted)]">
                {opening === candidate.path ? STRINGS.viewer.candidateOpening : candidate.path}
              </span>
            </span>
            {candidate.text && (
              <span className="block font-mono text-xs truncate-text text-[var(--text-secondary)]">
                {candidate.text}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** リポジトリ全体の候補。コード検索は PAT 必須なので、無ければリクエストせず案内だけ出す */
export function RepoReferences(props: RepoReferencesProps) {
  const { hasPat, currentBranch, defaultBranch, setSettingsOpen } = useAppStore(
    useShallow((s) => ({
      hasPat: Boolean(s.pat),
      currentBranch: s.currentBranch,
      defaultBranch: s.defaultBranch,
      setSettingsOpen: s.setSettingsOpen,
    })),
  );

  if (!hasPat) {
    return (
      <div className="px-4 py-6 flex flex-col items-center gap-3">
        <p className="text-sm text-center text-[var(--text-muted)]">
          {STRINGS.viewer.candidatesNeedPat}
        </p>
        <button
          onClick={() => {
            props.onClose();
            setSettingsOpen(true);
          }}
          className="px-4 min-h-[44px] rounded-lg text-sm text-[var(--accent-blue)] hover:bg-[var(--bg-hover)]"
        >
          {STRINGS.viewer.candidatesOpenSettings}
        </button>
      </div>
    );
  }

  return (
    <>
      {defaultBranch && currentBranch !== defaultBranch && (
        <p className="px-4 py-2 text-xs text-[var(--text-muted)]">
          {STRINGS.viewer.candidatesDefaultBranch(defaultBranch)}
        </p>
      )}
      <CandidateList {...props} />
    </>
  );
}
