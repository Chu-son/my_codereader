// ========================================
// Client-side Search Utilities
// ========================================

import type { SearchResult, OpenedFile, TreeNode } from '@/types';

/**
 * ツリー構造からファイル名で検索を行う
 */
export function searchInTree(
  query: string,
  nodes: TreeNode[]
): SearchResult[] {
  if (!query.trim()) return [];
  
  const results: SearchResult[] = [];
  const escapedQuery = escapeRegExp(query);
  const regex = new RegExp(escapedQuery, 'gi');

  const traverse = (items: TreeNode[]) => {
    for (const node of items) {
      if (node.type === 'blob') {
        const name = node.name;
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;
        
        if ((match = regex.exec(name)) !== null) {
          results.push({
            path: node.path,
            lineNumber: 0, // ファイル名マッチの場合は0とする
            lineContent: node.path,
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
        }
      }
      
      if (node.children.length > 0) {
        traverse(node.children);
      }
      
      if (results.length >= 100) break;
    }
  };

  traverse(nodes);
  return results;
}

/**
 * キャッシュ済みのファイルコンテンツ内で文字列検索を行う。
 * PAT未設定時のフォールバック検索として使用。
 */
export function searchInCachedFiles(
  query: string,
  openedFiles: OpenedFile[]
): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];
  const escapedQuery = escapeRegExp(query);
  const regex = new RegExp(escapedQuery, 'gi');

  for (const file of openedFiles) {
    if (!file.content || file.loading) continue;

    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match: RegExpExecArray | null;

      // 各行内の全マッチを検出
      regex.lastIndex = 0;
      while ((match = regex.exec(line)) !== null) {
        results.push({
          path: file.path,
          lineNumber: i + 1,
          lineContent: line.trimStart(),
          matchStart: match.index,
          matchEnd: match.index + match[0].length,
        });

        // 1ファイルから最大50件に制限
        if (results.length >= 200) return results;
      }
    }
  }

  return results;
}

/** 正規表現の特殊文字をエスケープ */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GitHub Search Code APIの結果をSearchResult形式に変換
 */
export function convertGitHubSearchResults(
  items: {
    path: string;
    text_matches?: {
      fragment: string;
      matches: { text: string; indices: [number, number] }[];
    }[];
  }[]
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const item of items) {
    if (!item.text_matches) {
      // text_matchが無い場合はファイル名のみ表示
      results.push({
        path: item.path,
        lineNumber: 0,
        lineContent: item.path,
        matchStart: 0,
        matchEnd: 0,
      });
      continue;
    }

    for (const textMatch of item.text_matches) {
      const lines = textMatch.fragment.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const match of textMatch.matches) {
          if (line.includes(match.text)) {
            const matchStart = line.indexOf(match.text);
            results.push({
              path: item.path,
              lineNumber: i + 1, // fragment内の行番号
              lineContent: line.trimStart(),
              matchStart,
              matchEnd: matchStart + match.text.length,
            });
          }
        }
      }
    }
  }

  return results;
}
