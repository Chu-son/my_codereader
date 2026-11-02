import { createElement, useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import type { TreeNode } from '@/shared/types';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';
import { flattenTree } from '../lib/flattenTree';
import { getFileIcon, isBinaryFile } from '@/shared/lib/fileUtils';

interface FileTreeProps {
  nodes: TreeNode[];
  /** ツリーがスクロールされる親要素（仮想化に使う） */
  scrollElement: HTMLElement | null;
}

const ROW_HEIGHT = 40;

export function FileTree({ nodes, scrollElement }: FileTreeProps) {
  const { expandedDirs, activePane1FilePath, toggleDir, openFile } = useAppStore(
    useShallow((s) => ({
      expandedDirs: s.expandedDirs,
      activePane1FilePath: s.activePane1FilePath,
      toggleDir: s.toggleDir,
      openFile: s.openFile,
    })),
  );
  const listRef = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => flattenTree(nodes, new Set(expandedDirs)), [nodes, expandedDirs]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual の既知の警告。戻り値を memo 化していない
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  return (
    <div
      ref={listRef}
      className="select-none relative"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((item) => {
        const row = rows[item.index];
        if (!row) return null;
        return (
          <div
            key={row.node.path}
            className="absolute left-0 right-0"
            style={{
              height: ROW_HEIGHT,
              transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)`,
            }}
          >
            <FileTreeNode
              node={row.node}
              depth={row.depth}
              isExpanded={expandedDirs.includes(row.node.path)}
              isActive={activePane1FilePath === row.node.path}
              onToggle={toggleDir}
              onFileClick={openFile}
            />
          </div>
        );
      })}
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
  const showIndentGuides = useAppStore((s) => s.showIndentGuides);

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
  const fileIcon = isDir ? (isExpanded ? FolderOpen : Folder) : getFileIcon(node.path);

  const isBinary = !isDir && isBinaryFile(node.path);

  return (
    <button
      className={`relative flex items-center w-full h-full text-left py-2 pr-2 transition-colors min-h-[40px] ${
        isActive ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'
      } ${isBinary ? 'opacity-40' : ''}`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={handleClick}
      title={node.path}
    >
      {/* インデントガイド */}
      {showIndentGuides &&
        depth > 0 &&
        Array.from({ length: depth }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 border-l"
            style={{
              left: `${i * 16 + 18}px`,
              borderColor: 'var(--border-primary)',
              opacity: 0.3,
            }}
          />
        ))}

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
      {createElement(fileIcon, {
        size: 16,
        className: `shrink-0 ml-1 ${
          isDir ? 'text-[var(--accent-yellow)]' : 'text-[var(--text-secondary)]'
        }`,
      })}

      {/* アイコンとテキストの間の余白 */}
      <div className="w-2.5 shrink-0" />

      {/* ファイル名 */}
      <span
        className={`text-[13px] truncate-text ${
          isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
        }`}
      >
        {node.name}
      </span>
    </button>
  );
}
