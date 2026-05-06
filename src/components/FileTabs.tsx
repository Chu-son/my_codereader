// ========================================
// FileTabs Component
// ========================================

import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { getFileIcon, getFileName } from '@/lib/fileUtils';

interface FileTabsProps {
  pane: 1 | 2;
}

export function FileTabs({ pane }: FileTabsProps) {
  const { openedFiles, activePane1FilePath, activePane2FilePath, setActiveFile, closeFile } =
    useAppStore();

  const activeFilePath =
    pane === 1 ? activePane1FilePath : activePane2FilePath;

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // アクティブタブが見えるようにスクロール
  useEffect(() => {
    if (!tabsContainerRef.current || !activeFilePath) return;
    const activeTab = tabsContainerRef.current.querySelector(
      `[data-tab-path="${CSS.escape(activeFilePath)}"]`
    );
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeFilePath]);

  if (openedFiles.length === 0) return null;

  return (
    <div
      id={`file-tabs-pane-${pane}`}
      className="flex items-center border-b overflow-x-auto shrink-0"
      style={{
        height: 'var(--tabbar-height)',
        backgroundColor: 'var(--tab-inactive-bg)',
        borderColor: 'var(--tab-border)',
      }}
      ref={tabsContainerRef}
    >
      {openedFiles.map((file) => {
        const isActive = file.path === activeFilePath;
        const FileIcon = getFileIcon(file.path);
        const fileName = getFileName(file.path);

        return (
          <div
            key={file.path}
            data-tab-path={file.path}
            className={`group flex items-center gap-1.5 px-3 h-full border-r cursor-pointer transition-colors shrink-0 ${
              isActive
                ? 'border-t-2 border-t-[var(--accent-blue)]'
                : 'border-t-2 border-t-transparent hover:bg-[var(--bg-hover)]'
            }`}
            style={{
              backgroundColor: isActive
                ? 'var(--tab-active-bg)'
                : undefined,
              borderRightColor: 'var(--tab-border)',
            }}
            onClick={() => setActiveFile(pane, file.path)}
          >
            <FileIcon
              size={14}
              className="shrink-0 text-[var(--text-secondary)]"
            />
            <span
              className={`text-[13px] whitespace-nowrap ${
                isActive
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {fileName}
            </span>

            {/* 閉じるボタン */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className={`w-7 h-7 flex items-center justify-center rounded transition-opacity ${
                isActive
                  ? 'opacity-60 hover:opacity-100'
                  : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'
              } hover:bg-[var(--bg-active)]`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
