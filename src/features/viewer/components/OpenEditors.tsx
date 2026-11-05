import { X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { getFileIcon, getFileName } from '@/shared/lib/fileUtils';
import { STRINGS } from '@/shared/constants/strings';

/** 操作中のペインで開いているファイルの一覧 */
export function OpenEditors() {
  const { pane, tabs, activePath, files, setActiveFile, closeFile } = useAppStore(
    useShallow((s) => {
      const current = s.panes[s.focusedPane];
      return {
        pane: s.focusedPane,
        tabs: current.tabs,
        activePath: current.active,
        files: s.files,
        setActiveFile: s.setActiveFile,
        closeFile: s.closeFile,
      };
    }),
  );

  if (tabs.length === 0) return null;

  return (
    <div className="select-none">
      {/* セクションヘッダー */}
      <div
        className="flex items-center px-3 h-8 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {STRINGS.viewer.openEditors}
      </div>

      {/* ファイルリスト */}
      <div className="pb-1">
        {tabs.map((path) => {
          const isActive = path === activePath;
          const FileIcon = getFileIcon(path);
          const fileName = getFileName(path);

          return (
            <div
              key={path}
              className={`group flex items-center min-h-[40px] px-2 cursor-pointer transition-colors ${
                isActive ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'
              }`}
              onClick={() => setActiveFile(pane, path)}
              title={path}
            >
              {/* 閉じるボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(pane, path);
                }}
                aria-label={STRINGS.viewer.closeFile(path)}
                className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-active)] transition-opacity shrink-0"
              >
                <X size={14} className="text-[var(--text-muted)]" />
              </button>

              {/* アイコン */}
              <FileIcon size={14} className="shrink-0 mx-1.5 text-[var(--text-secondary)]" />

              {/* ファイル名 */}
              <span
                className={`text-[13px] truncate-text ${
                  isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                {fileName}
              </span>

              {/* ローディングインジケーター */}
              {files[path]?.loading && (
                <span className="ml-auto">
                  <span className="block w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
