import { useMemo } from 'react';
import { Crosshair, ListTree, PanelRight, PictureInPicture2, Search } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { PaneId } from '@/shared/types';
import { useAppStore } from '@/stores/useAppStore';
import { usePreferredSplitDirection } from '@/shared/hooks/useOrientation';
import { STRINGS } from '@/shared/constants/strings';
import type { Anchor, TappedWord } from '../lib/codeInteractions';
import { REFERENCE_LIMIT, findDefinition, findReferences } from '../lib/symbols';
import { FloatingMenu, MenuItem } from './FloatingMenu';

interface WordMenuProps {
  pane: PaneId;
  path: string;
  content: string;
  word: TappedWord;
  anchor: Anchor;
  onClose: () => void;
  onShowReferences: () => void;
}

/**
 * 単語をタップしたときのメニュー。定義は同じファイルの宣言から名前で引く
 * （import 先の解決と、リポジトリ全体のコード検索は後の段で足す）。
 * 「定義へ」は読んでいる場所を移し、Peek は移さずに浮かぶ枠で見せる。
 */
export function WordMenu({
  pane,
  path,
  content,
  word,
  anchor,
  onClose,
  onShowReferences,
}: WordMenuProps) {
  const direction = usePreferredSplitDirection();
  const { symbols, navigateTo, openPeek, openInOtherPane, searchInRepo } = useAppStore(
    useShallow((s) => ({
      symbols: s.symbols[path],
      navigateTo: s.navigateTo,
      openPeek: s.openPeek,
      openInOtherPane: s.openInOtherPane,
      searchInRepo: s.searchInRepo,
    })),
  );
  const definition = useMemo(
    () => findDefinition(symbols ?? [], word.text, word.from),
    [symbols, word],
  );
  const referenceCount = useMemo(() => findReferences(content, word.text).length, [content, word]);
  const isDefinition = definition?.from === word.from;

  const run = (action: () => void) => () => {
    action();
    onClose();
  };

  return (
    <FloatingMenu
      anchor={anchor}
      label={STRINGS.viewer.wordMenu(word.text)}
      title={<span className="font-mono text-[var(--text-secondary)]">{word.text}</span>}
      onClose={onClose}
    >
      <MenuItem
        Icon={Crosshair}
        label={STRINGS.viewer.goToDefinition}
        detail={
          !definition
            ? STRINGS.viewer.noDefinition
            : isDefinition
              ? STRINGS.viewer.isDefinition
              : STRINGS.viewer.definitionLine(definition.line)
        }
        disabled={!definition || isDefinition}
        onSelect={run(() => {
          if (definition) void navigateTo(path, { line: definition.line, pane });
        })}
      />
      <MenuItem
        Icon={PictureInPicture2}
        label={STRINGS.viewer.peekDefinition}
        disabled={!definition || isDefinition}
        onSelect={run(() => {
          if (definition) openPeek(pane, { path, line: definition.line, name: word.text });
        })}
      />
      <MenuItem
        Icon={PanelRight}
        label={STRINGS.viewer.openDefinitionInOtherPane}
        disabled={!definition}
        onSelect={run(() => {
          if (definition) void openInOtherPane(path, { line: definition.line, direction });
        })}
      />
      <MenuItem
        Icon={ListTree}
        label={STRINGS.viewer.references(referenceCount, REFERENCE_LIMIT)}
        // シートへ切り替えるので、ここでは閉じない（閉じると開いたシートまで消える）
        onSelect={onShowReferences}
      />
      <MenuItem
        Icon={Search}
        label={STRINGS.viewer.searchInRepo}
        onSelect={run(() => void searchInRepo(word.text))}
      />
    </FloatingMenu>
  );
}
