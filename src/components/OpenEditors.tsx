// ========================================
// OpenEditors Component
// ========================================

import { X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { getFileIcon, getFileName } from '@/lib/fileUtils';

export function OpenEditors() {
  const { openedFiles, activePane1FilePath, setActiveFile, closeFile } =
    useAppStore();

  if (openedFiles.length === 0) return null;

  return (
    <div className="select-none">
      {/* セクションヘッダー */}
      <div
        className="flex items-center px-3 h-8 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        開いているエディタ
      </div>

      {/* ファイルリスト */}
      <div className="pb-1">
        {openedFiles.map((file) => {
          const isActive = file.path === activePane1FilePath;
          const FileIcon = getFileIcon(file.path);
          const fileName = getFileName(file.path);

          return (
            <div
              key={file.path}
              className={`group flex items-center min-h-[40px] px-2 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[var(--bg-active)]'
                  : 'hover:bg-[var(--bg-hover)]'
              }`}
              onClick={() => setActiveFile(1, file.path)}
              title={file.path}
            >
              {/* 閉じるボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.path);
                }}
                className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-active)] transition-opacity shrink-0"
              >
                <X size={14} className="text-[var(--text-muted)]" />
              </button>

              {/* アイコン */}
              <FileIcon
                size={14}
                className="shrink-0 mx-1.5 text-[var(--text-secondary)]"
              />

              {/* ファイル名 */}
              <span
                className={`text-[13px] truncate-text ${
                  isActive
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {fileName}
              </span>

              {/* ローディングインジケーター */}
              {file.loading && (
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
