import type { TreeNode } from '@/shared/types';

export interface TreeRow {
  node: TreeNode;
  depth: number;
}

/** 展開中のディレクトリだけをたどり、表示順の平らな行リストにする */
export function flattenTree(
  nodes: TreeNode[],
  expanded: ReadonlySet<string>,
  depth = 0,
): TreeRow[] {
  const rows: TreeRow[] = [];
  for (const node of nodes) {
    rows.push({ node, depth });
    if (node.type === 'tree' && expanded.has(node.path)) {
      rows.push(...flattenTree(node.children, expanded, depth + 1));
    }
  }
  return rows;
}
