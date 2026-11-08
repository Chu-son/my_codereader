import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Crosshair,
  FileSearch,
  ListTree,
  PanelRight,
  PictureInPicture2,
  Search,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { PaneId } from '@/shared/types';
import { useAppStore } from '@/stores/useAppStore';
import { usePreferredSplitDirection } from '@/shared/hooks/useOrientation';
import { STRINGS } from '@/shared/constants/strings';
import type { Anchor, ReferenceScope, TappedWord } from '../lib/codeInteractions';
import { REFERENCE_LIMIT, findReferences } from '../lib/symbols';
import type { DefinitionLocation, DefinitionTarget } from '../lib/definition/resolveDefinition';
import { useDefinitionResolver, useDefinitionTarget } from '../hooks/useDefinition';
import { getFileName } from '@/shared/lib/fileUtils';
import { FloatingMenu, MenuItem } from './FloatingMenu';

interface WordMenuProps {
  pane: PaneId;
  path: string;
  content: string;
  word: TappedWord;
  anchor: Anchor;
  onClose: () => void;
  onShowReferences: (scope: ReferenceScope) => void;
}

/** メニューの「定義へ」の補足。別ファイルの行は取得するまで分からないので、ファイル名を出す */
function definitionDetail(target: DefinitionTarget | null): string {
  if (!target) return STRINGS.common.checking;
  switch (target.kind) {
    case 'local':
      return target.isSelf
        ? STRINGS.viewer.isDefinition
        : STRINGS.viewer.definitionLine(target.symbol.line);
    case 'import':
      return getFileName(target.path);
    case 'external':
      return STRINGS.viewer.definitionExternal(target.source);
    case 'none':
      return STRINGS.viewer.noDefinition;
  }
}

/**
 * 単語をタップしたときのメニュー。定義は同じファイルの宣言と、相対 import の先から引く。
 * たどれないときだけ、リポジトリ全体のコード検索で候補を探す入口を出す。
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
  const { navigateTo, openPeek, openInOtherPane, searchInRepo } = useAppStore(
    useShallow((s) => ({
      navigateTo: s.navigateTo,
      openPeek: s.openPeek,
      openInOtherPane: s.openInOtherPane,
      searchInRepo: s.searchInRepo,
    })),
  );
  const target = useDefinitionTarget(path, content, word);
  const { locate } = useDefinitionResolver();
  const referenceCount = useMemo(() => findReferences(content, word.text).length, [content, word]);
  const reachable = target?.kind === 'local' || target?.kind === 'import';
  const isDefinition = target?.kind === 'local' && target.isSelf;

  const run = (action: () => void) => () => {
    action();
    onClose();
  };
  // 別ファイルの定義は行を確定するのに取得が要る。その間はメニューを残して探していることを示し、
  // 先にメニューが閉じられたら（別の場所を触ったら）遅れて届いた結果では移動しない
  const [locating, setLocating] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const withDefinition = (open: (location: DefinitionLocation) => void) => () => {
    if (!target || locating) return;
    setLocating(true);
    void locate(path, target)
      .catch(() => null)
      .then((location) => {
        if (!mounted.current) return;
        if (location) open(location);
        onClose();
      });
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
        detail={locating ? STRINGS.viewer.locatingDefinition : definitionDetail(target)}
        disabled={!reachable || isDefinition || locating}
        onSelect={withDefinition((d) => void navigateTo(d.path, { line: d.line, pane }))}
      />
      <MenuItem
        Icon={PictureInPicture2}
        label={STRINGS.viewer.peekDefinition}
        disabled={!reachable || isDefinition || locating}
        onSelect={withDefinition((d) => openPeek(pane, { ...d, name: word.text }))}
      />
      <MenuItem
        Icon={PanelRight}
        label={STRINGS.viewer.openDefinitionInOtherPane}
        disabled={!reachable || locating}
        onSelect={withDefinition((d) => void openInOtherPane(d.path, { line: d.line, direction }))}
      />
      {target && !reachable && (
        <MenuItem
          Icon={FileSearch}
          label={STRINGS.viewer.findDefinitionCandidates}
          // シートへ切り替えるので、ここでは閉じない
          onSelect={() => onShowReferences('repo')}
        />
      )}
      <MenuItem
        Icon={ListTree}
        label={STRINGS.viewer.references(referenceCount, REFERENCE_LIMIT)}
        // シートへ切り替えるので、ここでは閉じない（閉じると開いたシートまで消える）
        onSelect={() => onShowReferences('file')}
      />
      <MenuItem
        Icon={Search}
        label={STRINGS.viewer.searchInRepo}
        onSelect={run(() => void searchInRepo(word.text))}
      />
    </FloatingMenu>
  );
}
