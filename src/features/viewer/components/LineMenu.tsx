import { useState } from 'react';
import { Bookmark, BookmarkMinus, Link, PanelRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore, findBookmark } from '@/stores/useAppStore';
import { usePreferredSplitDirection } from '@/shared/hooks/useOrientation';
import { copyText } from '@/shared/lib/clipboard';
import { toGitHubLineUrl } from '@/shared/lib/urlParser';
import { STRINGS } from '@/shared/constants/strings';
import type { Anchor } from '../lib/codeInteractions';
import { FloatingMenu, MenuItem } from './FloatingMenu';

/** コピーの結果を見せてから閉じるまでの時間 */
const FEEDBACK_MS = 1200;

interface LineMenuProps {
  path: string;
  line: number;
  anchor: Anchor;
  onClose: () => void;
}

/** 行番号を長押ししたときのメニュー（ブックマーク・行へのリンク・隣のペインで開く） */
export function LineMenu({ path, line, anchor, onClose }: LineMenuProps) {
  const direction = usePreferredSplitDirection();
  const { repo, branch, isBookmarked, toggleBookmark, openInOtherPane } = useAppStore(
    useShallow((s) => ({
      repo: s.currentRepo,
      branch: s.currentBranch,
      isBookmarked: Boolean(findBookmark(s.bookmarks, s.currentRepo, path, line)),
      toggleBookmark: s.toggleBookmark,
      openInOtherPane: s.openInOtherPane,
    })),
  );
  const [copied, setCopied] = useState<boolean | null>(null);

  const copyLink = async () => {
    if (!repo || !branch) return;
    setCopied(await copyText(toGitHubLineUrl(repo, branch, path, line)));
    window.setTimeout(onClose, FEEDBACK_MS);
  };

  return (
    <FloatingMenu
      anchor={anchor}
      label={STRINGS.viewer.lineMenu(line)}
      title={STRINGS.viewer.lineMenu(line)}
      onClose={onClose}
    >
      <MenuItem
        Icon={isBookmarked ? BookmarkMinus : Bookmark}
        label={isBookmarked ? STRINGS.bookmarks.remove : STRINGS.bookmarks.add}
        onSelect={() => {
          toggleBookmark(path, line);
          onClose();
        }}
      />
      <MenuItem
        Icon={Link}
        label={
          copied === null
            ? STRINGS.viewer.copyLineLink
            : copied
              ? STRINGS.viewer.linkCopied
              : STRINGS.viewer.copyFailed
        }
        disabled={!repo || !branch || copied !== null}
        onSelect={() => void copyLink()}
      />
      <MenuItem
        Icon={PanelRight}
        label={STRINGS.viewer.openLineInOtherPane}
        onSelect={() => {
          void openInOtherPane(path, { line, direction });
          onClose();
        }}
      />
    </FloatingMenu>
  );
}
