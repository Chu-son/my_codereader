// ========================================
// FileTree Component
// ========================================

import { useCallback } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import type { TreeNode } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { getFileIcon, isBinaryFile } from '@/lib/fileUtils';

interface FileTreeProps {
  nodes: TreeNode[];
  depth?: number;
}

export function FileTree({ nodes, depth = 0 }: FileTreeProps) {
  const { expandedDirs, activePane1FilePath, toggleDir, openFile } =
    useAppStore();

  return (
    <div className="select-none">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={depth}
          isExpanded={expandedDirs.includes(node.path)}
          isActive={activePane1FilePath === node.path}
          onToggle={toggleDir}
          onFileClick={openFile}
        />
      ))}
    </div>
  );
}

interface FileTreeNodeProps {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: (path: string) => void;
  onFileClick: (path: string) => Promise<void>;
}

function FileTreeNode({
  node,
  depth,
  isExpanded,
  isActive,
  onToggle,
  onFileClick,
}: FileTreeNodeProps) {
  const expandedDirs = useAppStore((s) => s.expandedDirs);
  const activePane1FilePath = useAppStore((s) => s.activePane1FilePath);

  const handleClick = useCallback(() => {
    if (node.type === 'tree') {
      onToggle(node.path);
    } else {
      if (!isBinaryFile(node.path)) {
        onFileClick(node.path);
      }
    }
  }, [node, onToggle, onFileClick]);

  const isDir = node.type === 'tree';
  const FileIcon = isDir
    ? isExpanded
      ? FolderOpen
      : Folder
    : getFileIcon(node.path);

  const isBinary = !isDir && isBinaryFile(node.path);

  return (
    <>
      <button
        className={`flex items-center w-full text-left py-2 pr-2 transition-colors min-h-[40px] ${
          isActive
            ? 'bg-[var(--bg-active)]'
            : 'hover:bg-[var(--bg-hover)]'
        } ${isBinary ? 'opacity-40' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        title={node.path}
      >
        {/* 展開アイコン（ディレクトリのみ） */}
        <span className="w-5 h-5 flex items-center justify-center shrink-0">
          {isDir ? (
            isExpanded ? (
              <ChevronDown size={16} className="text-[var(--text-muted)]" />
            ) : (
              <ChevronRight size={16} className="text-[var(--text-muted)]" />
            )
          ) : null}
        </span>

        {/* ファイル/フォルダアイコン */}
        <FileIcon
          size={16}
          className={`shrink-0 mx-1.5 ${
            isDir
              ? 'text-[var(--accent-yellow)]'
              : 'text-[var(--text-secondary)]'
          }`}
        />

        {/* ファイル名 */}
        <span
          className={`text-[13px] truncate-text ${
            isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
          }`}
        >
          {node.name}
        </span>
      </button>

      {/* 子ノード */}
      {isDir && isExpanded && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              isExpanded={expandedDirs.includes(child.path)}
              isActive={activePane1FilePath === child.path}
              onToggle={onToggle}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </>
  );
}
