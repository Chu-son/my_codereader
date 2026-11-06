import { ArrowRightLeft, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { getFileIcon, getFileName } from '@/shared/lib/fileUtils';
import { usePreferredSplitDirection } from '@/shared/hooks/useOrientation';
import { STRINGS } from '@/shared/constants/strings';
import type { PaneId } from '@/shared/types';

const SECTION_HEADER =
  'flex items-center px-3 h-8 text-[11px] font-semibold uppercase tracking-wider';

/**
 * 開いているファイルの一覧。分割中はペインごとに分けて並べ、各行から隣のペインへ移せる
 * （どのファイルをどちらで読むかを、タブバーを行き来せずに振り分けるため）。
 */
export function OpenEditors() {
  const { isSplitView, splitDirection, hasTabs } = useAppStore(
    useShallow((s) => ({
      isSplitView: s.isSplitView,
      splitDirection: s.splitDirection,
      hasTabs: s.panes[1].tabs.length + s.panes[2].tabs.length > 0,
    })),
  );

  if (!hasTabs) return null;

  return (
    <div className="select-none">
      <div className={SECTION_HEADER} style={{ color: 'var(--text-muted)' }}>
        {STRINGS.viewer.openEditors}
      </div>
      {isSplitView ? (
        ([1, 2] as const).map((pane) => (
          <PaneGroup
            key={pane}
            pane={pane}
            label={STRINGS.viewer.paneLabel(pane, splitDirection)}
          />
        ))
      ) : (
        <PaneGroup pane={1} />
      )}
    </div>
  );
}

function PaneGroup({ pane, label }: { pane: PaneId; label?: string }) {
  const direction = usePreferredSplitDirection();
  const { tabs, activePath, isFocused, files, setActiveFile, closeFile, moveToOtherPane } =
    useAppStore(
      useShallow((s) => ({
        tabs: s.panes[pane].tabs,
        activePath: s.panes[pane].active,
        isFocused: s.isSplitView && s.focusedPane === pane,
        files: s.files,
        setActiveFile: s.setActiveFile,
        closeFile: s.closeFile,
        moveToOtherPane: s.moveToOtherPane,
      })),
    );

  return (
    <div className="pb-1" id={`open-editors-pane-${pane}`}>
      {label && (
        <div
          className="flex items-center gap-1.5 px-3 h-7 text-[11px]"
          style={{ color: isFocused ? 'var(--accent-blue)' : 'var(--text-muted)' }}
        >
          {label}
        </div>
      )}
      {tabs.map((path) => {
        const isActive = path === activePath;
        const FileIcon = getFileIcon(path);

        return (
          <div
            key={path}
            className={`flex items-center min-h-[44px] pr-1 cursor-pointer transition-colors ${
              isActive ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'
            }`}
            onClick={() => setActiveFile(pane, path)}
            title={path}
          >
            {/* 閉じるボタン。タッチ端末にはホバーが無いため常に表示する */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(pane, path);
              }}
              aria-label={STRINGS.viewer.closeFile(path)}
              className="touch-target shrink-0 rounded opacity-60 hover:opacity-100 hover:bg-[var(--bg-active)]"
            >
              <X size={14} className="text-[var(--text-muted)]" />
            </button>

            <FileIcon size={14} className="shrink-0 mr-1.5 text-[var(--text-secondary)]" />

            <span
              className={`flex-1 min-w-0 text-[13px] truncate-text ${
                isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              {getFileName(path)}
            </span>

            {files[path]?.loading && (
              <span className="block shrink-0 w-2 h-2 mx-1 rounded-full bg-[var(--accent-blue)] animate-pulse" />
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                moveToOtherPane(pane, path, direction);
              }}
              aria-label={STRINGS.viewer.moveToOtherPane(path)}
              title={STRINGS.viewer.moveToOtherPane(path)}
              className="touch-target shrink-0 rounded opacity-60 hover:opacity-100 hover:bg-[var(--bg-active)]"
            >
              <ArrowRightLeft size={14} className="text-[var(--text-muted)]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
