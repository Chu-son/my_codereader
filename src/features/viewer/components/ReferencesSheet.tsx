import { useMemo, useState } from 'react';
import { Drawer } from 'vaul';
import { useAppStore } from '@/stores/useAppStore';
import type { PaneId } from '@/shared/types';
import { STRINGS } from '@/shared/constants/strings';
import { REFERENCE_LIMIT, findReferences } from '../lib/symbols';
import type { ReferenceScope } from '../lib/codeInteractions';
import { RepoReferences } from './RepoReferences';

interface ReferencesSheetProps {
  pane: PaneId;
  path: string;
  content: string;
  word: string;
  /** タップした行。一覧の中で目印を付ける */
  currentLine: number;
  initialScope: ReferenceScope;
  onClose: () => void;
}

/**
 * 単語の参照を並べるボトムシート。このファイルの出現箇所と、コード検索によるリポジトリ全体の候補を
 * 切り替える。コード検索は上限が厳しいので、全体の範囲を選んだときだけ呼ぶ。vaul を使うため、開くときだけ読み込む。
 * 行を選ぶと navigateTo で移動するので、「戻る」でタップした場所へ帰れる。
 */
export function ReferencesSheet({
  pane,
  path,
  content,
  word,
  currentLine,
  initialScope,
  onClose,
}: ReferencesSheetProps) {
  const navigateTo = useAppStore((s) => s.navigateTo);
  const refs = useMemo(() => findReferences(content, word), [content, word]);
  const [scope, setScope] = useState(initialScope);

  return (
    <Drawer.Root open onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0" style={{ zIndex: 'var(--z-drawer)' }} />
        <Drawer.Content
          id="references-sheet"
          className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-2xl outline-none"
          style={{
            zIndex: 'var(--z-drawer)',
            maxHeight: '60dvh',
            paddingBottom: 'env(safe-area-inset-bottom)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: 'var(--border-secondary)' }}
            />
          </div>
          <div className="px-4 pb-2">
            <Drawer.Title className="text-sm font-semibold text-[var(--text-primary)]">
              {STRINGS.viewer.referencesTitle(word)}
            </Drawer.Title>
            <Drawer.Description className="text-xs text-[var(--text-muted)]">
              {scope === 'file' ? STRINGS.viewer.referencesHint : STRINGS.viewer.candidatesHint}
            </Drawer.Description>
            <div
              className="mt-1 flex gap-1"
              role="group"
              aria-label={STRINGS.viewer.referenceScope}
            >
              {(
                [
                  ['file', STRINGS.viewer.references(refs.length, REFERENCE_LIMIT)],
                  ['repo', STRINGS.viewer.referencesInRepo],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setScope(value)}
                  aria-pressed={scope === value}
                  className={`px-3 min-h-[44px] rounded-lg text-sm transition-colors hover:bg-[var(--bg-hover)] ${
                    scope === value
                      ? 'bg-[var(--bg-active)] text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto border-t"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            {scope === 'repo' ? (
              <RepoReferences pane={pane} word={word} onClose={onClose} />
            ) : (
              <ul>
                {refs.map((ref) => {
                  const isCurrent = ref.line === currentLine;
                  // 行頭の字下げは読みにくいだけなので落とし、一致位置もその分ずらす
                  const indent = ref.text.length - ref.text.trimStart().length;
                  const text = ref.text.slice(indent);
                  const start = ref.start - indent;
                  const end = ref.end - indent;
                  return (
                    <li key={`${ref.line}:${ref.start}`}>
                      <button
                        onClick={() => {
                          void navigateTo(path, { line: ref.line, pane });
                          onClose();
                        }}
                        aria-current={isCurrent ? 'location' : undefined}
                        className={`w-full flex items-center gap-3 px-4 min-h-[44px] text-left transition-colors hover:bg-[var(--bg-hover)] ${
                          isCurrent ? 'bg-[var(--bg-active)]' : ''
                        }`}
                      >
                        <span className="shrink-0 w-12 text-right font-mono text-xs text-[var(--text-muted)]">
                          {ref.line}
                        </span>
                        <span className="flex-1 min-w-0 font-mono text-xs truncate-text text-[var(--text-secondary)]">
                          {text.slice(0, start)}
                          <mark
                            className="rounded-sm px-0.5"
                            style={{
                              backgroundColor: 'var(--accent-blue-soft)',
                              color: 'var(--accent-blue)',
                            }}
                          >
                            {text.slice(start, end)}
                          </mark>
                          {text.slice(end)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
