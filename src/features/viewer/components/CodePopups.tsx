import { lazy, Suspense } from 'react';
import type { PaneId } from '@/shared/types';
import { useAppStore } from '@/stores/useAppStore';
import type { CodePopup } from '../lib/codeInteractions';
import { LineMenu } from './LineMenu';
import { WordMenu } from './WordMenu';
import { SelectionSearchButton } from './SelectionSearchButton';

// vaul を初期バンドルに含めないよう、参照シートは開くときだけ読み込む
const ReferencesSheet = lazy(() =>
  import('./ReferencesSheet').then((m) => ({ default: m.ReferencesSheet })),
);

interface CodePopupsProps {
  popup: CodePopup | null;
  onChange: (popup: CodePopup | null) => void;
  pane: PaneId;
  path: string;
  content: string;
}

/** 本文の上に出すメニュー・ボタン・シートの切り替え */
export function CodePopups({ popup, onChange, pane, path, content }: CodePopupsProps) {
  const searchInRepo = useAppStore((s) => s.searchInRepo);
  if (!popup) return null;
  const close = () => onChange(null);

  switch (popup.kind) {
    case 'line':
      return <LineMenu path={path} line={popup.line} anchor={popup.anchor} onClose={close} />;
    case 'word':
      return (
        <WordMenu
          pane={pane}
          path={path}
          content={content}
          word={popup.word}
          anchor={popup.anchor}
          onClose={close}
          onShowReferences={() =>
            onChange({
              kind: 'references',
              word: popup.word.text,
              line: content.slice(0, popup.word.from).split('\n').length,
            })
          }
        />
      );
    case 'selection':
      return (
        <SelectionSearchButton
          x={popup.x}
          y={popup.y}
          onClick={() => {
            void searchInRepo(popup.text);
            close();
          }}
        />
      );
    case 'references':
      return (
        <Suspense fallback={null}>
          <ReferencesSheet
            pane={pane}
            path={path}
            content={content}
            word={popup.word}
            currentLine={popup.line}
            onClose={close}
          />
        </Suspense>
      );
  }
}
