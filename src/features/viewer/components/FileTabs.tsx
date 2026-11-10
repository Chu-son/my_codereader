import { useRef, useEffect } from 'react';
import { STRINGS } from '@/shared/constants/strings';
import { X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { getFileIcon, getFileName } from '@/shared/lib/fileUtils';
import type { PaneId } from '@/shared/types';

interface FileTabsProps {
  pane: PaneId;
}

export function FileTabs({ pane }: FileTabsProps) {
  const { tabs, activeFilePath, setActiveFile, closeFile } = useAppStore(
    useShallow((s) => ({
      tabs: s.panes[pane].tabs,
      activeFilePath: s.panes[pane].active,
      setActiveFile: s.setActiveFile,
      closeFile: s.closeFile,
    })),
  );

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // アクティブタブが見えるようにスクロール
  useEffect(() => {
    if (!tabsContainerRef.current || !activeFilePath) return;
    const activeTab = tabsContainerRef.current.querySelector(
      `[data-tab-path="${CSS.escape(activeFilePath)}"]`,
    );
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeFilePath]);

  if (tabs.length === 0) return null;

  return (
    <div
      id={`file-tabs-pane-${pane}`}
      // 縦向きは幅が狭く、区切り線つきのタブだと 1 画面に収まる数が少ないため、余白の少ないチップにする
      className="flex items-center border-b overflow-x-auto shrink-0 portrait:gap-1.5 portrait:px-2"
      style={{
        height: 'var(--tabbar-height)',
        backgroundColor: 'var(--tab-inactive-bg)',
        borderColor: 'var(--tab-border)',
      }}
      ref={tabsContainerRef}
    >
      {tabs.map((path) => {
        const isActive = path === activeFilePath;
        const FileIcon = getFileIcon(path);
        const fileName = getFileName(path);

        return (
          <div
            key={path}
            data-tab-path={path}
            className={`flex items-center gap-1.5 pl-3 pr-1 h-full border-r border-r-[var(--tab-border)] cursor-pointer transition-colors shrink-0 portrait:h-9 portrait:pl-2.5 portrait:rounded-full portrait:border portrait:border-t ${
              isActive
                ? 'border-t-2 border-t-[var(--accent-blue)] portrait:border-[var(--accent-blue)]'
                : 'border-t-2 border-t-transparent hover:bg-[var(--bg-hover)] portrait:border-[var(--tab-border)]'
            }`}
            style={{ backgroundColor: isActive ? 'var(--tab-active-bg)' : undefined }}
            onClick={() => setActiveFile(pane, path)}
          >
            <FileIcon size={14} className="shrink-0 text-[var(--text-secondary)]" />
            <span
              className={`text-[13px] whitespace-nowrap ${
                isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {fileName}
            </span>

            {/* 閉じるボタン */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(pane, path);
              }}
              aria-label={STRINGS.viewer.closeFile(path)}
              // タッチ端末にはホバーが無いため、非アクティブなタブでも閉じるボタンを薄く表示する
              className={`w-8 h-8 flex items-center justify-center rounded transition-opacity ${
                isActive ? 'opacity-60' : 'opacity-30'
              } hover:opacity-100 hover:bg-[var(--bg-active)]`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
