import { describe, expect, it } from 'vitest';
import type { TreeNode } from '@/shared/types';
import { flattenTree } from './flattenTree';

const file = (path: string): TreeNode => ({
  path,
  name: path.split('/').pop() ?? path,
  type: 'blob',
  sha: 's',
  children: [],
});
const tree: TreeNode[] = [
  { path: 'src', name: 'src', type: 'tree', sha: 's', children: [file('src/a.ts')] },
  file('README.md'),
];

describe('flattenTree', () => {
  it('閉じたディレクトリの子は含めない', () => {
    expect(flattenTree(tree, new Set()).map((r) => r.node.path)).toEqual(['src', 'README.md']);
  });

  it('展開したディレクトリの子を深さ付きで直後に並べる', () => {
    const rows = flattenTree(tree, new Set(['src']));
    expect(rows.map((r) => [r.node.path, r.depth])).toEqual([
      ['src', 0],
      ['src/a.ts', 1],
      ['README.md', 0],
    ]);
  });
});
